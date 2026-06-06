'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Brain, Video, MessageSquare, Clock, Trophy, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Course, Quiz, LiveSession } from '@/types'

export const dynamic = 'force-dynamic'

export default function AlunoDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [pendingQuizzes, setPendingQuizzes] = useState<Quiz[]>([])
  const [upcomingLive, setUpcomingLive] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          *,
          course_enrollments!inner(progress)
        `)
        .eq('is_published', true)

      if (coursesData) {
        setCourses(coursesData as Course[])
      }

      setPendingQuizzes([])
      setUpcomingLive([])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      await loadData()
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard do Aluno</h1>
        <p className="mt-2 text-gray-600">Bem-vindo ao seu espaco de aprendizado</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Meus Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{courses.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4" />
              Progresso Medio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              Quizzes Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingQuizzes.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Video className="h-4 w-4" />
              Aulas ao Vivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcomingLive.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Cursos</CardTitle>
          <CardDescription>Cursos nos quais voce esta matriculado</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Voce ainda nao esta matriculado em nenhum curso</p>
              <Button className="mt-4">Explorar Cursos</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <div key={course.id} className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                  <h3 className="mb-2 font-semibold">{course.title}</h3>
                  <p className="mb-3 text-sm text-gray-600">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{course.department}</Badge>
                    <Button size="sm">Acessar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Assistente de Aprendizado com IA
          </CardTitle>
          <CardDescription>Tire suas duvidas e receba ajuda personalizada</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <MessageSquare className="mr-2 h-4 w-4" />
            Iniciar Conversa com IA
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Proximas Aulas ao Vivo
          </CardTitle>
          <CardDescription>Sessoes agendadas para seus cursos</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingLive.length === 0 ? (
            <p className="py-4 text-center text-gray-500">Nenhuma aula ao vivo agendada</p>
          ) : (
            <div className="space-y-3">
              {upcomingLive.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(session.scheduled_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={session.status === 'live' ? 'default' : 'secondary'}>
                    {session.status === 'live' ? 'Ao Vivo' : 'Agendada'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
