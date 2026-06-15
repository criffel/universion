'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Play, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = () => {
    setSeconds(0)
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    // Check mic permission
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setHasPermission(true)
        // Stop immediately
        stream.getTracks().forEach((track) => track.stop())
      })
      .catch(() => {
        setHasPermission(false)
      })

    return () => {
      stopTimer()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      chunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        onRecordingComplete(blob)
      }

      mediaRecorder.start(250) // slice every 250ms
      setIsRecording(true)
      startTimer()
    } catch (err) {
      console.error('Falha ao iniciar gravador:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      stopTimer()

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }

  if (hasPermission === false) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">Acesso ao microfone negado. Habilite nas configurações do navegador.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-card">
      <div className="flex items-center gap-4">
        {isRecording ? (
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-3.5 rounded-full bg-red-500 animate-ping" />
            <Badge variant="destructive" className="font-mono text-sm px-2.5 py-1">
              {formatTime(seconds)}
            </Badge>
            <Button variant="outline" size="sm" onClick={stopRecording} className="gap-2">
              <Square className="h-4 w-4 fill-slate-800" />
              Parar Leitura
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button onClick={startRecording} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-md">
              <Mic className="h-4 w-4" />
              Gravar Leitura em Voz Alta
            </Button>
            {audioUrl && (
              <Button variant="ghost" size="sm" onClick={() => {
                const audio = new Audio(audioUrl)
                audio.play()
              }} className="gap-1.5 text-slate-600">
                <Play className="h-4 w-4 fill-slate-600" />
                Ouvir Gravação
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2.5 text-center">
        {isRecording 
          ? 'Gravando... Leia o conteúdo em voz alta para que a IA analise sua fluência e pronúncia.' 
          : 'Grave sua voz enquanto lê para receber feedback de fluência, WPM e precisão.'}
      </p>
    </div>
  )
}
