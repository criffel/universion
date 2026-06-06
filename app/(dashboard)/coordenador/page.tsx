'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Course, Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default function CoordenadorDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [professors, setProfessors] = useState<Profile[]>([])
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [activeStudents, setActiveStudents] = useState(0)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const { data: coursesData } = await supabase.from('courses').select('*').limit(10)
      if (coursesData) {
        setCourses(coursesData)
      }

      const { data: professorsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'professor')
        .limit(10)

      if (professorsData) {
        setProfessors(professorsData)
      }

      setPendingApprovals(0)
      setActiveStudents(0)
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
        <h1 className="text-3xl font-bold">Dashboard do Coordenador</h1>
        <p className="mt-2 text-gray-600">Visao geral do departamento</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><BookOpen className="h-4 w-4" />Cursos do Departamento</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{courses.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4" />Professores</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{professors.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><AlertCircle className="h-4 w-4" />Aprovacoes Pendentes</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{pendingApprovals}</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4" />Alunos Ativos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{activeStudents}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cursos do Departamento</CardTitle>
          <CardDescription>Gerencie e aprove cursos</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="py-4 text-center text-gray-500">Nenhum curso encontrado</p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-sm text-gray-600">{course.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={course.is_published ? 'default' : 'secondary'}>
                      {course.is_published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                    <Button size="sm" variant="outline">Detalhes</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professores do Departamento</CardTitle>
          <CardDescription>Gerencie os professores</CardDescription>
        </CardHeader>
        <CardContent>
          {professors.length === 0 ? (
            <p className="py-4 text-center text-gray-500">Nenhum professor encontrado</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {professors.map((professor) => (
                <div key={professor.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{professor.full_name}</h3>
                    <p className="text-sm text-gray-600">{professor.email}</p>
                    {professor.department ? <Badge variant="outline" className="mt-1">{professor.department}</Badge> : null}
                  </div>
                  <Button size="sm" variant="outline">Ver Detalhes</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingApprovals > 0 ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Aprovacoes Pendentes
            </CardTitle>
            <CardDescription>Cursos aguardando sua aprovacao</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Revisar Aprovacoes ({pendingApprovals})
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
