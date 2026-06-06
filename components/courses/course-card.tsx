'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Clock } from 'lucide-react'
import type { Course } from '@/types'

interface CourseCardProps {
  course: Course
  onEnroll?: (courseId: string) => void
  onAccess?: (courseId: string) => void
  isEnrolled?: boolean
  showEnrollButton?: boolean
}

export function CourseCard({ 
  course, 
  onEnroll, 
  onAccess, 
  isEnrolled = false,
  showEnrollButton = true 
}: CourseCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {course.cover_image && (
        <div className="h-48 w-full bg-gradient-to-br from-blue-100 to-indigo-100 rounded-t-lg" />
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          <Badge variant={course.is_published ? 'default' : 'secondary'}>
            {course.is_published ? 'Publicado' : 'Rascunho'}
          </Badge>
        </div>
        <CardDescription className="line-clamp-3">{course.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>{course.department}</span>
          </div>
          {course.professor && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Professor: {course.professor.full_name}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {isEnrolled ? (
          <Button 
            className="flex-1" 
            onClick={() => onAccess?.(course.id)}
          >
            Acessar Curso
          </Button>
        ) : (
          showEnrollButton && (
            <Button 
              className="flex-1" 
              onClick={() => onEnroll?.(course.id)}
            >
              Matricular-se
            </Button>
          )
        )}
        <Button variant="outline" size="icon">
          <Clock className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
