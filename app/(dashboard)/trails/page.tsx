'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Compass, Map, Award, BookOpen, 
  CheckCircle2, ArrowRight, PlayCircle 
} from 'lucide-react'
import { toast } from 'sonner'

import type { TrailProgress, Course } from '@/types'

interface LearningPath {
  id: string
  title: string
  description: string
  reward_points: number
  is_public: boolean
}

export default function TrailsPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [myProgress, setMyProgress] = useState<Record<string, TrailProgress>>({})
  const [pathCourses, setPathCourses] = useState<Record<string, Course[]>>({})

  useEffect(() => {
    async function loadTrails() {
      if (!profile) return
      try {
        // 1. Fetch paths
        const { data: pathsData } = await supabase
          .from('learning_paths')
          .select('*')

        if (pathsData && pathsData.length > 0) {
          setPaths(pathsData)
        } else {
          // Mock learning paths database initialization
          const demoPaths = [
            { title: 'Trilha Inicial de Programação', description: 'Conceitos base de lógica de programação, sintaxe, controle de fluxo e algoritmos.', reward_points: 300, is_public: true },
            { title: 'Introdução à IA e Aprendizado de Máquina', description: 'Trilha intermediária abrangendo redes neurais, heurísticas e processamento de linguagem natural.', reward_points: 500, is_public: true }
          ]
          const { data: inserted } = await supabase.from('learning_paths').insert(demoPaths).select()
          if (inserted) setPaths(inserted)
        }

        // 2. Fetch courses per path
        const { data: pathCoursesData } = await supabase
          .from('learning_path_courses')
          .select('*, courses(*)')

        // Group courses by path_id
        const grouped: Record<string, Course[]> = {}
        
        interface PathCourseLink {
          path_id: string
          courses: Course | null
        }

        // If none, we link existing courses to the paths for demo
        if (!pathCoursesData || pathCoursesData.length === 0) {
          const { data: courses } = await supabase.from('courses').select('*').limit(3)
          const currentPaths = pathsData || []
          
          if (courses && courses.length > 0 && currentPaths.length > 0) {
            const links = courses.map((c, idx) => ({
              path_id: currentPaths[0].id,
              course_id: c.id,
              order: idx + 1
            }))
            
            await supabase.from('learning_path_courses').insert(links)
            
            const { data: reloadedLinks } = await supabase
              .from('learning_path_courses')
              .select('*, courses(*)')
            
            if (reloadedLinks) {
              (reloadedLinks as unknown as PathCourseLink[]).forEach((link) => {
                if (link.courses) {
                  if (!grouped[link.path_id]) grouped[link.path_id] = []
                  grouped[link.path_id].push(link.courses)
                }
              })
            }
          }
        } else {
          (pathCoursesData as unknown as PathCourseLink[]).forEach((link) => {
            if (link.courses) {
              if (!grouped[link.path_id]) grouped[link.path_id] = []
              grouped[link.path_id].push(link.courses)
            }
          })
        }
        setPathCourses(grouped)

        // 3. Fetch progress
        const { data: progressData } = await supabase
          .from('trail_progress')
          .select('*')
          .eq('user_id', profile.id)

        const progMap: Record<string, TrailProgress> = {}
        if (progressData) {
          (progressData as unknown as TrailProgress[]).forEach((p) => {
            progMap[p.path_id] = p
          })
        }
        setMyProgress(progMap)

      } catch (err) {
        console.error('Erro ao carregar trilhas:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTrails()
  }, [profile])

  const handleStartTrail = async (pathId: string) => {
    if (!profile) return
    try {
      const { data: newProg } = await supabase
        .from('trail_progress')
        .insert({
          user_id: profile.id,
          path_id: pathId,
          current_course_index: 0,
          completed: false
        })
        .select()
        .single()

      if (newProg) {
        setMyProgress((prev) => ({
          ...prev,
          [pathId]: newProg
        }))
        toast.success('Você se inscreveu na trilha! Bons estudos.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao iniciar trilha.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Trilhas de Aprendizagem
        </h1>
        <p className="text-muted-foreground mt-2">
          Siga rotas curadas de estudos, complete as etapas na ordem e ganhe prêmios em Unacoins!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {paths.map((path) => {
          const courses = pathCourses[path.id] || []
          const progress = myProgress[path.id]
          const isEnrolled = !!progress
          
          // Calculate percentage progress
          const totalCourses = courses.length
          const currentIdx = progress ? progress.current_course_index : 0
          const percent = totalCourses > 0 ? (currentIdx / totalCourses) * 100 : 0
          const isCompleted = progress?.completed

          return (
            <Card key={path.id} className="border border-slate-100 shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant={path.is_public ? 'secondary' : 'default'} className="text-[10px] font-semibold tracking-wider uppercase">
                    {path.is_public ? 'Pública' : 'Institucional'}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none text-[10px] font-bold gap-1 px-2.5 py-0.5">
                    <Award className="h-3 w-3 text-emerald-600" /> {path.reward_points} XP
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-slate-800 mt-2.5 flex items-center gap-2">
                  <Map className="h-5 w-5 text-indigo-600" /> {path.title}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-slate-600 pt-1">
                  {path.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-1">
                {/* Steps courses rendering */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Etapas da Trilha:</span>
                  {courses.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum curso associado a essa trilha no momento.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {courses.map((course, idx) => {
                        const isDone = isEnrolled && idx < currentIdx
                        const isActive = isEnrolled && idx === currentIdx
                        return (
                          <div 
                            key={course.id} 
                            onClick={() => {
                              if (isEnrolled && (isActive || isDone)) {
                                router.push(`/dashboard/reading/${course.id}`)
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isDone ? 'bg-slate-50 text-slate-500 border-slate-200 opacity-80' :
                              isActive ? 'bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold' :
                              'bg-white text-slate-700 border-slate-100'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                              Etapa {idx + 1}: {course.title}
                            </span>
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-50" />
                            ) : isActive ? (
                              <PlayCircle className="h-4 w-4 text-indigo-600 fill-indigo-100" />
                            ) : (
                              <ArrowRight className="h-4 w-4 text-slate-300" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {isEnrolled && (
                  <div className="space-y-1.5 pt-2 border-t">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Progresso da Trilha</span>
                      <span>{percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-indigo-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="bg-slate-50/50 p-4 border-t flex justify-end">
                {isCompleted ? (
                  <Button disabled variant="outline" className="w-full text-emerald-600 border-emerald-200 gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-50" /> Trilha Concluída!
                  </Button>
                ) : isEnrolled ? (
                  <Button 
                    onClick={() => {
                      const currentCourse = courses[currentIdx]
                      if (currentCourse) {
                        router.push(`/dashboard/reading/${currentCourse.id}`)
                      }
                    }} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-bold gap-1"
                  >
                    Continuar Próxima Etapa <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleStartTrail(path.id)} 
                    className="w-full text-xs font-bold gap-1"
                  >
                    Inscrever-se na Trilha <Compass className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
