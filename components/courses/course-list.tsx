'use client'

import { CourseCard } from './course-card'
import type { Course } from '@/types'

interface CourseListProps {
  courses: Course[]
  onEnroll?: (courseId: string) => void
  onAccess?: (courseId: string) => void
  enrolledCourseIds?: string[]
  showEnrollButton?: boolean
  emptyMessage?: string
}

export function CourseList({
  courses,
  onEnroll,
  onAccess,
  enrolledCourseIds = [],
  showEnrollButton = true,
  emptyMessage = 'Nenhum curso encontrado'
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📚</span>
        </div>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onEnroll={onEnroll}
          onAccess={onAccess}
          isEnrolled={enrolledCourseIds.includes(course.id)}
          showEnrollButton={showEnrollButton}
        />
      ))}
    </div>
  )
}
