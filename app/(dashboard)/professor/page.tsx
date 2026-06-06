'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Video, FileText, CheckCircle, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Course } from '@/types'

export const dynamic = 'force-dynamic'

export default function ProfessorDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [pendingGrading, setPendingGrading] = useState(0)
  const [scheduledLive, setScheduledLive] = useState(0)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .limit(10)

      if (coursesData) {
        setCourses(coursesData)
      }

      setTotalStudents(0)
      setPendingGrading(0)
      setScheduledLive(0)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Professor</h1>
          <p className="mt-2 text-gray-600">Gerencie seus cursos e alunos</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Curso
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><BookOpen className="h-4 w-4" />Meus Cursos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{courses.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4" />Total de Alunos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalStudents}</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" />Correcoes Pendentes</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{pendingGrading}</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Video className="h-4 w-4" />Aulas Agendadas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{scheduledLive}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Cursos</CardTitle>
          <CardDescription>Cursos que voce esta lecionando</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Voce ainda nao criou nenhum curso</p>
              <Button className="mt-4">Criar Primeiro Curso</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <div key={course.id} className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-semibold">{course.title}</h3>
                    <Badge variant={course.is_published ? 'default' : 'secondary'}>
                      {course.is_published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </div>
                  <p className="mb-3 text-sm text-gray-600">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{course.department}</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Editar</Button>
                      <Button size="sm">Gerenciar</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acoes Rapidas</CardTitle>
          <CardDescription>Acesse funcionalidades frequentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="flex h-24 flex-col gap-2"><FileText className="h-6 w-6" /><span>Adicionar Material</span></Button>
            <Button variant="outline" className="flex h-24 flex-col gap-2"><CheckCircle className="h-6 w-6" /><span>Criar Quiz</span></Button>
            <Button variant="outline" className="flex h-24 flex-col gap-2"><Video className="h-6 w-6" /><span>Agendar Aula ao Vivo</span></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
