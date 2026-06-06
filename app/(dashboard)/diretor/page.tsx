'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Building2, TrendingUp, Activity, Settings, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function DiretorDashboard() {
  const [totalCourses, setTotalCourses] = useState(0)
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalProfessors, setTotalProfessors] = useState(0)
  const [totalCoordinators, setTotalCoordinators] = useState(0)
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true })
      setTotalCourses(coursesCount || 0)

      const { count: studentsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'aluno')
      setTotalStudents(studentsCount || 0)

      const { count: professorsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professor')
      setTotalProfessors(professorsCount || 0)

      const { count: coordinatorsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coordenador')
      setTotalCoordinators(coordinatorsCount || 0)

      setDepartments(['Engenharia', 'Ciências', 'Artes', 'Negócios', 'Saúde'])
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
        <h1 className="text-3xl font-bold">Dashboard do Diretor</h1>
        <p className="mt-2 text-gray-600">Visao geral da instituicao</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><BookOpen className="h-4 w-4" />Total de Cursos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalCourses}</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4" />Total de Alunos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalStudents}</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Building2 className="h-4 w-4" />Professores</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalProfessors}</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4" />Coordenadores</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalCoordinators}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departamentos
          </CardTitle>
          <CardDescription>Visao geral por departamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {departments.map((dept) => (
              <div key={dept} className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                <h3 className="mb-2 font-semibold">{dept}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Cursos:</span><span className="font-medium">0</span></div>
                  <div className="flex justify-between"><span>Alunos:</span><span className="font-medium">0</span></div>
                  <div className="flex justify-between"><span>Professores:</span><span className="font-medium">0</span></div>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full">Ver Detalhes</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Metricas de Desempenho</CardTitle>
            <CardDescription>Analise de desempenho institucional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div><div className="mb-1 flex justify-between text-sm"><span>Taxa de Conclusao</span><span className="font-medium">85%</span></div><div className="h-2 w-full rounded-full bg-gray-200"><div className="h-2 rounded-full bg-green-600" style={{ width: '85%' }}></div></div></div>
              <div><div className="mb-1 flex justify-between text-sm"><span>Satisfacao dos Alunos</span><span className="font-medium">92%</span></div><div className="h-2 w-full rounded-full bg-gray-200"><div className="h-2 rounded-full bg-blue-600" style={{ width: '92%' }}></div></div></div>
              <div><div className="mb-1 flex justify-between text-sm"><span>Engajamento</span><span className="font-medium">78%</span></div><div className="h-2 w-full rounded-full bg-gray-200"><div className="h-2 rounded-full bg-purple-600" style={{ width: '78%' }}></div></div></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Acoes Administrativas</CardTitle>
            <CardDescription>Gerencie a instituicao</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" />Gerenciar Usuarios</Button>
              <Button variant="outline" className="w-full justify-start"><Building2 className="mr-2 h-4 w-4" />Gerenciar Departamentos</Button>
              <Button variant="outline" className="w-full justify-start"><BookOpen className="mr-2 h-4 w-4" />Relatorios de Cursos</Button>
              <Button variant="outline" className="w-full justify-start"><Settings className="mr-2 h-4 w-4" />Configuracoes do Sistema</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
