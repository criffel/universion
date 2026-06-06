'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import type { Quiz } from '@/types'

interface QuizCardProps {
  quiz: Quiz
  onStart?: (quizId: string) => void
  onViewResults?: (quizId: string) => void
  attempts?: number
  maxAttempts?: number
}

export function QuizCard({ quiz, onStart, onViewResults, attempts = 0, maxAttempts = 1 }: QuizCardProps) {
  const canAttempt = attempts < maxAttempts
  const hasAttempts = attempts > 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant={canAttempt ? 'default' : 'secondary'}>
            {canAttempt ? 'Disponível' : 'Concluído'}
          </Badge>
          {quiz.time_limit && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{quiz.time_limit} min</span>
            </div>
          )}
        </div>
        <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
        {quiz.description && (
          <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Nota mínima:</span>
            <span className="font-medium">{quiz.passing_score}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tentativas:</span>
            <span className="font-medium">{attempts}/{maxAttempts}</span>
          </div>
          {hasAttempts && !canAttempt && (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span>Todas as tentativas utilizadas</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        {canAttempt ? (
          <Button 
            className="w-full" 
            onClick={() => onStart?.(quiz.id)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Iniciar Quiz
          </Button>
        ) : hasAttempts ? (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onViewResults?.(quiz.id)}
          >
            Ver Resultados
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
