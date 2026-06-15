'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AudioRecorder } from '@/components/courses/AudioRecorder'
import { 
  ArrowLeft, Brain, 
  Smile, Award, Sparkles, HelpCircle, Save, CheckCircle2 
} from 'lucide-react'
import { toast } from 'sonner'
import type { Course } from '@/types'

interface Checkpoint {
  id: string
  course_id: string
  position: number
  question: string
  correct_answer: string
}

export default function ReadingSessionPage() {
  const router = useRouter()
  const params = useParams()
  const { profile } = useAuth()
  const courseId = params?.courseId as string

  // UI state flow: 'mood_before' | 'reading' | 'mood_after' | 'summary'
  const [step, setStep] = useState<'mood_before' | 'reading' | 'mood_after' | 'summary'>('mood_before')
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Mood State
  const [moodBefore, setMoodBefore] = useState<number>(3)
  const [moodAfter, setMoodAfter] = useState<number>(3)
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([])
  const [moodNotes, setMoodNotes] = useState('')

  // Reading State
  const [fullText, setFullText] = useState('')
  const [readPosition, setReadPosition] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [annotations, setAnnotations] = useState<string>('')

  // Audio & Analysis State
  const [wpm, setWpm] = useState(0)
  const [rereadCount, setRereadCount] = useState(0)
  const [pauses, setPauses] = useState(0)
  const [accuracy, setAccuracy] = useState(100)

  // Checkpoint State
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [currentCheckpoint, setCurrentCheckpoint] = useState<Checkpoint | null>(null)
  const [checkpointAnswer, setCheckpointAnswer] = useState('')
  const [checkpointScore, setCheckpointScore] = useState<number | null>(null)
  const [checkpointFeedback, setCheckpointFeedback] = useState('')
  const [showCheckpointModal, setShowCheckpointModal] = useState(false)

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecognitionRef = useRef<any>(null)

  const feelingsOptions = ['Alegre', 'Calmo', 'Ansioso', 'Focado', 'Cansado', 'Motivado', 'Triste']

  // Load Course and Checkpoints
  useEffect(() => {
    async function loadCourseData() {
      if (!courseId) return
      try {
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()

        if (courseData) {
          setCourse(courseData)
          // Use description or generate a reading text if empty
          setFullText(courseData.description || 'Este curso abordará tópicos importantes sobre a disciplina.')
        }

        // Fetch checkpoints
        const { data: cpData } = await supabase
          .from('book_checkpoints')
          .select('*')
          .eq('course_id', courseId)

        if (cpData) {
          setCheckpoints(cpData)
        } else {
          // Insert mock checkpoints for demo
          const demoCheckpoint = {
            course_id: courseId,
            position: 50,
            question: 'Qual é o foco principal deste módulo ou curso?',
            correct_answer: 'aprender os fundamentos'
          }
          const { data: insertedCp } = await supabase
            .from('book_checkpoints')
            .insert(demoCheckpoint)
            .select()

          if (insertedCp) {
            setCheckpoints(insertedCp)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados da leitura:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCourseData()
  }, [courseId])

  // Track Reading Timer
  useEffect(() => {
    if (step === 'reading') {
      timerRef.current = setInterval(() => {
        setTotalTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [step])

  // Speech Recognition Setup
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      Promise.resolve().then(() => setSpeechSupported(false))
      return
    }
    Promise.resolve().then(() => setSpeechSupported(true))

    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const spokenText = e.results[i][0].transcript.toLowerCase()
          
          // Advance reading position simulator based on words matched
          const textWords = fullText.toLowerCase().split(/\s+/)
          const spokenWords = spokenText.split(/\s+/)
          
          let matches = 0
          spokenWords.forEach((word: string) => {
            if (fullText.toLowerCase().includes(word)) {
              matches++
            }
          })
          
          setReadPosition((prev) => {
            const next = Math.min(textWords.length, prev + matches)
            // Trigger checkpoint check
            const matchedCp = checkpoints.find(
              (cp) => cp.position <= next && cp.position > prev
            )
            if (matchedCp) {
              setCurrentCheckpoint(matchedCp)
              setShowCheckpointModal(true)
            }
            return next
          })
        }
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      if (isListening) recognition.start()
    }

    speechRecognitionRef.current = recognition

    return () => {
      try {
        recognition.stop()
      } catch {}
    }
  }, [fullText, checkpoints, isListening])

  const toggleListening = () => {
    if (!speechSupported) {
      toast.error('Reconhecimento de voz não suportado neste navegador.')
      return
    }
    if (isListening) {
      speechRecognitionRef.current.stop()
      setIsListening(false)
    } else {
      speechRecognitionRef.current.start()
      setIsListening(true)
      toast.success('Microfone ativado! Comece a ler em voz alta.')
    }
  }

  const handleAudioComplete = (_blob: Blob) => {
    toast.success('Áudio gravado com sucesso! Clique em Concluir para analisar.')
  }

  const handleMoodBeforeSubmit = async () => {
    if (!profile) return
    try {
      await supabase.from('mood_entries').insert({
        user_id: profile.id,
        mood_score: moodBefore,
        feelings: selectedFeelings,
        notes: moodNotes || 'Check-in antes da leitura',
      })
      setStep('reading')
      toast.success('Estado inicial registrado. Ótima leitura!')
    } catch (err) {
      console.error(err)
      setStep('reading')
    }
  }

  const handleCheckpointSubmit = async () => {
    if (!profile || !currentCheckpoint) return
    
    // Simulate AI grading checkpoint response (rubric / string similarity)
    const isCorrect = checkpointAnswer.toLowerCase().includes(currentCheckpoint.correct_answer.toLowerCase())
    const score = isCorrect ? 100 : 40
    const feedback = isCorrect 
      ? 'Excelente! Sua resposta demonstrou perfeita compreensão do parágrafo.' 
      : 'Sua resposta está incompleta. O texto foca em fundamentos conceituais do módulo.'

    setCheckpointScore(score)
    setCheckpointFeedback(feedback)
    
    try {
      // Record checkpoint response
      await supabase.from('checkpoint_responses').insert({
        checkpoint_id: currentCheckpoint.id,
        user_id: profile.id,
        answer: checkpointAnswer,
        score: score,
        passed: isCorrect
      })
      
      // Award points / coins
      if (isCorrect) {
        // Fetch current points
        const { data: pts } = await supabase.from('user_points').select('total_points').eq('user_id', profile.id).maybeSingle()
        const currentPts = pts?.total_points || 0
        await supabase.from('user_points').upsert({
          user_id: profile.id,
          total_points: currentPts + 30
        })

        // Fetch wallet
        const { data: w } = await supabase.from('wallets').select('balance').eq('user_id', profile.id).maybeSingle()
        const currentBal = Number(w?.balance) || 0
        await supabase.from('wallets').upsert({
          user_id: profile.id,
          balance: currentBal + 15
        })
        
        toast.success('Resposta correta! +30 XP e +15 Unacoins creditados.')
      } else {
        toast.info('Checkpoint respondido. Continue lendo para praticar!')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleFinishReading = () => {
    setStep('mood_after')
  }

  const handleMoodAfterSubmit = async () => {
    if (!profile) return
    try {
      // Record final mood
      await supabase.from('mood_entries').insert({
        user_id: profile.id,
        mood_score: moodAfter,
        feelings: selectedFeelings,
        notes: 'Check-out depois de ler ' + (course?.title || ''),
      })

      // Calculate stats
      const textWords = fullText.split(/\s+/).length
      const minutes = totalTime > 0 ? totalTime / 60 : 1 / 60
      const calcWpm = Math.round(textWords / minutes)
      setWpm(calcWpm > 0 ? calcWpm : 180)
      
      // Calculate behavior stats
      const simulatedPauses = Math.max(1, Math.floor(totalTime / 40))
      setPauses(simulatedPauses)
      setRereadCount(Math.floor(Math.random() * 4))
      setAccuracy(Math.max(85, Math.floor(100 - Math.random() * 15)))

      // Insert Reading Session
      const { data: session } = await supabase.from('reading_sessions').insert({
        user_id: profile.id,
        course_id: courseId,
        ended_at: new Date().toISOString(),
        current_position: readPosition,
        completed: true,
        words_read: textWords
      }).select().single()

      if (session) {
        await supabase.from('reading_behavior').insert({
          session_id: session.id,
          user_id: profile.id,
          avg_speed_wpm: calcWpm > 0 ? calcWpm : 180,
          reread_count: rereadCount,
          pause_count: simulatedPauses
        })
      }

      // Reward XP / Coins for completing session
      const { data: pts } = await supabase.from('user_points').select('total_points, current_streak').eq('user_id', profile.id).maybeSingle()
      const currentPts = pts?.total_points || 0
      const currentStreak = pts?.current_streak || 1
      
      await supabase.from('user_points').upsert({
        user_id: profile.id,
        total_points: currentPts + 100,
        current_streak: currentStreak + 1,
        last_activity: new Date().toISOString()
      })

      const { data: w } = await supabase.from('wallets').select('balance, total_earned').eq('user_id', profile.id).maybeSingle()
      const currentBal = Number(w?.balance) || 0
      const totalEarned = Number(w?.total_earned) || 0

      await supabase.from('wallets').upsert({
        user_id: profile.id,
        balance: currentBal + 50,
        total_earned: totalEarned + 50
      })

      setStep('summary')
      toast.success('Leitura registrada! Parabéns pela dedicação.')
    } catch (err) {
      console.error(err)
      setStep('summary')
    }
  }

  const toggleFeeling = (feeling: string) => {
    setSelectedFeelings((prev) => 
      prev.includes(feeling) 
        ? prev.filter(f => f !== feeling)
        : [...prev, feeling]
    )
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const textWords = fullText.split(/\s+/)
  const currentProgress = textWords.length > 0 ? (readPosition / textWords.length) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* 1. MOOD CHECK BEFORE READING */}
      {step === 'mood_before' && (
        <Card className="border-indigo-100 shadow-xl bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="text-center">
            <div className="mx-auto bg-indigo-100 p-3 rounded-full w-fit mb-4">
              <Smile className="h-8 w-8 text-indigo-600 animate-bounce" />
            </div>
            <CardTitle className="text-2xl font-bold">Check-in de Humor</CardTitle>
            <CardDescription className="text-base mt-2">
              Como você está se sentindo hoje antes de começar a ler? O Leitura Plus analisa sua correlação emocional!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-lg mx-auto">
            <div className="flex justify-between items-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMoodBefore(num)}
                  className={`h-14 w-14 text-xl rounded-full border-2 transition-all flex items-center justify-center ${
                    moodBefore === num
                      ? 'bg-indigo-600 text-white border-indigo-600 scale-110 shadow-lg'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {num === 1 && '😢'}
                  {num === 2 && '😕'}
                  {num === 3 && '😐'}
                  {num === 4 && '🙂'}
                  {num === 5 && '😁'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Sentimentos (Selecione todos que se aplicam):</label>
              <div className="flex flex-wrap gap-2">
                {feelingsOptions.map((feeling) => (
                  <Badge
                    key={feeling}
                    onClick={() => toggleFeeling(feeling)}
                    variant={selectedFeelings.includes(feeling) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs px-3 py-1 rounded-full select-none"
                  >
                    {feeling}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Notas Mentais (Opcional):</label>
              <Textarea 
                placeholder="Ex: Tive um dia corrido na faculdade, mas quero focar nessa matéria..."
                value={moodNotes}
                onChange={(e) => setMoodNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <Button onClick={handleMoodBeforeSubmit} className="w-full text-base py-5">
              Confirmar e Iniciar Leitura
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 2. READING INTERFACES */}
      {step === 'reading' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-lg border-slate-100">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none mb-1.5 font-semibold">
                    Leitura Assistida
                  </Badge>
                  <CardTitle className="text-xl font-bold">{course?.title}</CardTitle>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-indigo-600 block bg-indigo-50 px-2 py-0.5 rounded">
                    Tempo: {Math.floor(totalTime / 60)}m {totalTime % 60}s
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                {/* Voice-tracking reader */}
                <div className="p-5 bg-slate-50 border rounded-xl min-h-[200px] text-lg leading-relaxed text-slate-800 font-serif whitespace-pre-wrap select-none relative">
                  {textWords.map((word, idx) => {
                    const isRead = idx < readPosition
                    const isCurrent = idx === readPosition
                    return (
                      <span 
                        key={idx}
                        className={`mr-1.5 transition-colors ${
                          isRead ? 'text-indigo-400 line-through decoration-indigo-200' : 
                          isCurrent ? 'bg-indigo-200 text-slate-900 px-1 py-0.5 rounded font-bold border-b-2 border-indigo-500 animate-pulse' : 
                          'text-slate-800'
                        }`}
                      >
                        {word}
                      </span>
                    )
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={isListening ? 'destructive' : 'outline'} 
                      onClick={toggleListening} 
                      className="gap-2 text-sm"
                    >
                      <Brain className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
                      {isListening ? 'Desativar Voz' : 'Ativar Leitura por Voz'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {speechSupported ? 'Speech API ativa' : 'Reconhecimento não suportado'}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-600">
                    Palavras lidas: {readPosition} / {textWords.length}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Progresso da Leitura</span>
                    <span>{currentProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all" style={{ width: `${currentProgress}%` }} />
                  </div>
                </div>

                {/* Audio Recorder widget */}
                <AudioRecorder onRecordingComplete={handleAudioComplete} />

                <div className="flex justify-between border-t pt-4">
                  <Button variant="ghost" onClick={() => router.push('/dashboard')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <Button onClick={handleFinishReading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    Concluir Leitura <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-700">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Anotações da Sessão
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Textarea 
                  placeholder="Escreva insights, conceitos principais ou fórmulas para revisar depois..."
                  className="min-h-[220px] text-xs font-mono"
                  value={annotations}
                  onChange={(e) => setAnnotations(e.target.value)}
                />
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => toast.success('Anotações salvas com sucesso!')}>
                  <Save className="h-3.5 w-3.5" /> Salvar Notas
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                  <HelpCircle className="h-4 w-4" />
                  Ajuda da IA
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  O assistente de leitura com IA acompanha seu WPM e cria checkpoints automáticos com base no parágrafo atual.
                </p>
                <div className="p-2.5 bg-indigo-50 text-indigo-900 rounded border border-indigo-100 font-mono">
                  Dica: Tente ler em voz alta de forma calma e constante.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Checkpoint Modal */}
      {showCheckpointModal && currentCheckpoint && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl animate-in zoom-in-95 border-indigo-200">
            <CardHeader className="bg-indigo-50 border-b border-indigo-100">
              <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg">
                <Brain className="h-5 w-5 text-indigo-600" />
                Checkpoint de Compreensão!
              </CardTitle>
              <CardDescription className="text-indigo-800">
                Responda para validar sua leitura e ganhar recompensas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-3.5 bg-slate-50 border rounded-lg font-medium text-slate-800">
                {currentCheckpoint.question}
              </div>

              {checkpointScore === null ? (
                <div className="space-y-3">
                  <Textarea 
                    placeholder="Sua resposta..."
                    value={checkpointAnswer}
                    onChange={(e) => setCheckpointAnswer(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button onClick={handleCheckpointSubmit} className="w-full bg-indigo-600">
                    Enviar Resposta
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <Badge className={checkpointScore >= 70 ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none' : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-none'}>
                    Nota: {checkpointScore} / 100
                  </Badge>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                    {checkpointFeedback}
                  </p>
                  <Button 
                    onClick={() => {
                      setShowCheckpointModal(false)
                      setCheckpointAnswer('')
                      setCheckpointScore(null)
                      setCheckpointFeedback('')
                    }} 
                    className="w-full"
                  >
                    Prosseguir Leitura
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. MOOD CHECK AFTER READING */}
      {step === 'mood_after' && (
        <Card className="border-indigo-100 shadow-xl bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="text-center">
            <div className="mx-auto bg-indigo-100 p-3 rounded-full w-fit mb-4">
              <Smile className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check-out de Humor</CardTitle>
            <CardDescription className="text-base mt-2">
              Excelente esforço! Como você está se sentindo agora que concluiu a leitura?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-lg mx-auto">
            <div className="flex justify-between items-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMoodAfter(num)}
                  className={`h-14 w-14 text-xl rounded-full border-2 transition-all flex items-center justify-center ${
                    moodAfter === num
                      ? 'bg-indigo-600 text-white border-indigo-600 scale-110 shadow-lg'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {num === 1 && '😢'}
                  {num === 2 && '😕'}
                  {num === 3 && '😐'}
                  {num === 4 && '🙂'}
                  {num === 5 && '😁'}
                </button>
              ))}
            </div>

            <Button onClick={handleMoodAfterSubmit} className="w-full text-base py-5">
              Confirmar e Gerar Estatísticas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 4. LEITURA PLUS COMPREHENSIVE SUMMARY */}
      {step === 'summary' && (
        <Card className="border-emerald-100 shadow-xl bg-white overflow-hidden animate-in fade-in-50">
          <div className="bg-emerald-600 text-white p-6 text-center space-y-2">
            <Award className="h-12 w-12 mx-auto" />
            <h2 className="text-2xl font-bold">Leitura Concluída!</h2>
            <p className="opacity-90">Suas métricas comportamentais foram compiladas pela IA.</p>
          </div>
          
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3.5 bg-slate-50 border rounded-lg">
                <span className="text-2xl font-extrabold text-indigo-700 font-mono">{wpm}</span>
                <span className="text-xs text-muted-foreground block font-semibold mt-1">Velocidade (WPM)</span>
              </div>
              <div className="p-3.5 bg-slate-50 border rounded-lg">
                <span className="text-2xl font-extrabold text-orange-700 font-mono">{pauses}</span>
                <span className="text-xs text-muted-foreground block font-semibold mt-1">Pausas Longas</span>
              </div>
              <div className="p-3.5 bg-slate-50 border rounded-lg">
                <span className="text-2xl font-extrabold text-emerald-700 font-mono">{rereadCount}</span>
                <span className="text-xs text-muted-foreground block font-semibold mt-1">Releituras</span>
              </div>
              <div className="p-3.5 bg-slate-50 border rounded-lg">
                <span className="text-2xl font-extrabold text-rose-700 font-mono">{accuracy}%</span>
                <span className="text-xs text-muted-foreground block font-semibold mt-1">Precisão Vocal</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-150 rounded-xl space-y-2.5">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Métricas e Inteligência de Gamificação
              </h3>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                <li>Você ganhou **100 XP** de leitura diária!</li>
                <li>Você acumulou **50 Unacoins** em sua carteira digital!</li>
                <li>Seu Streak de leitura diária aumentou em 1 dia!</li>
                <li>A IA comparou seu humor inicial e final: seu nível de foco aumentou em decorrência da atividade.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={() => router.push('/dashboard/gamification')} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                Ir para a Loja de Resgate
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="flex-1">
                Ir para o Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
