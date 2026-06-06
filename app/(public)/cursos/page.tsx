'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, BookOpen, Users, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Course } from '@/types'

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set())

  async function loadCourses() {
    try {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (data) {
        setCourses(data)
      }

      setEnrolledCourses(new Set())
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      await loadCourses()
    })()
  }, [])

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrolledCourses((prev) => new Set([...prev, courseId]))
      alert('Matricula realizada com sucesso!')
    } catch (error) {
      console.error('Erro ao realizar matricula:', error)
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === 'all' || course.department === departmentFilter

    return matchesSearch && matchesDepartment
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Cursos Disponiveis</h1>
          <p className="text-lg text-gray-600">Explore e matricule-se nos cursos da universidade</p>
        </div>

        <div className="mb-8 rounded-xl bg-white p-6 shadow-lg">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input placeholder="Buscar cursos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por departamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                <SelectItem value="engenharia">Engenharia</SelectItem>
                <SelectItem value="ciencias">Ciencias</SelectItem>
                <SelectItem value="artes">Artes</SelectItem>
                <SelectItem value="negocios">Negocios</SelectItem>
                <SelectItem value="saude">Saude</SelectItem>
                <SelectItem value="humanas">Humanas</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-end text-sm text-gray-600">
              {filteredCourses.length} curso(s) encontrado(s)
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourses.has(course.id)
            return (
              <Card key={course.id} className="transition-shadow hover:shadow-xl">
                <CardHeader>
                  <div className="mb-2 flex items-start justify-between">
                    <Badge variant="outline">{course.department || 'Geral'}</Badge>
                    <Badge variant={isEnrolled ? 'default' : 'secondary'}>
                      {isEnrolled ? 'Matriculado' : 'Disponivel'}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>0 alunos</span></div>
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>0h</span></div>
                    </div>
                    <Button className="w-full" disabled={isEnrolled} onClick={() => handleEnroll(course.id)}>
                      {isEnrolled ? 'Matriculado' : 'Matricular-se'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredCourses.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">Nenhum curso encontrado com os filtros atuais</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
