'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Brain, Video } from 'lucide-react'

export default function DashboardPage() {
  const { profile, loading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile) {
      if (hasRole('aluno')) {
        router.push('/dashboard/aluno')
      } else if (hasRole('professor')) {
        router.push('/dashboard/professor')
      } else if (hasRole('coordenador')) {
        router.push('/dashboard/coordenador')
      } else if (hasRole('diretor')) {
        router.push('/dashboard/diretor')
      }
    }
  }, [profile, loading, hasRole, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo ao UniVersion</h1>
        <p className="text-gray-600 mt-2">Redirecionando para seu dashboard...</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Meus Cursos
            </CardTitle>
            <CardDescription>Acesse seus cursos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Assistente IA
            </CardTitle>
            <CardDescription>Tire suas dúvidas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Disponível em breve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Aulas ao Vivo
            </CardTitle>
            <CardDescription>Próximas sessões</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
