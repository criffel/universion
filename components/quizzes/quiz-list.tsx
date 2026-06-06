'use client'

import { QuizCard } from './quiz-card'
import type { Quiz } from '@/types'

interface QuizListProps {
  quizzes: Quiz[]
  onStart?: (quizId: string) => void
  onViewResults?: (quizId: string) => void
  attempts?: Record<string, number>
  emptyMessage?: string
}

export function QuizList({
  quizzes,
  onStart,
  onViewResults,
  attempts = {},
  emptyMessage = 'Nenhum quiz encontrado'
}: QuizListProps) {
  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📝</span>
        </div>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quizzes.map((quiz) => (
        <QuizCard
          key={quiz.id}
          quiz={quiz}
          onStart={onStart}
          onViewResults={onViewResults}
          attempts={attempts[quiz.id] || 0}
          maxAttempts={quiz.max_attempts}
        />
      ))}
    </div>
  )
}
