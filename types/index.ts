export type UserRole = 'aluno' | 'professor' | 'coordenador' | 'diretor'

export interface Profile {
  id: string
  user_id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  phone?: string
  department?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  department: string
  professor_id: string
  coordinator_id?: string
  cover_image?: string
  is_published: boolean
  created_at: string
  updated_at: string
  professor?: Profile
  coordinator?: Profile
}

export interface CourseEnrollment {
  id: string
  course_id: string
  user_id: string
  enrolled_at: string
  progress: number
  course?: Course
  user?: Profile
}

export interface Material {
  id: string
  course_id: string
  title: string
  description?: string
  type: 'pdf' | 'video' | 'link' | 'interactive'
  file_url?: string
  file_size?: number
  duration?: number
  module?: string
  order: number
  created_at: string
  updated_at: string
  course?: Course
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description?: string
  scheduled_at?: string
  duration?: number
  is_live: boolean
  recording_url?: string
  created_at: string
  updated_at: string
  course?: Course
}

export interface Quiz {
  id: string
  course_id: string
  title: string
  description?: string
  time_limit?: number
  max_attempts: number
  passing_score: number
  created_at: string
  updated_at: string
  course?: Course
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  type: 'multiple_choice' | 'true_false' | 'essay'
  options?: string[]
  correct_answer?: string | number
  points: number
  order: number
  quiz?: Quiz
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  attempt_number: number
  score: number
  answers: Record<string, unknown>
  started_at: string
  completed_at?: string
  feedback?: string
  quiz?: Quiz
  user?: Profile
}

export interface ChatRoom {
  id: string
  course_id: string
  name: string
  created_at: string
  course?: Course
}

export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  message: string
  created_at: string
  user?: Profile
  room?: ChatRoom
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'course' | 'material' | 'quiz' | 'live' | 'chat' | 'system'
  read: boolean
  created_at: string
  user?: Profile
}

export interface LiveSession {
  id: string
  course_id: string
  lesson_id?: string
  title: string
  description?: string
  scheduled_at: string
  duration: number
  stream_url?: string
  recording_url?: string
  status: 'scheduled' | 'live' | 'ended'
  created_at: string
  updated_at: string
  course?: Course
  lesson?: Lesson
}

export interface AIConversation {
  id: string
  user_id: string
  course_id?: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  created_at: string
  updated_at: string
}
