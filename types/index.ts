export type UserRole = 'aluno' | 'professor' | 'coordenador' | 'diretor' | 'responsavel' | 'empresa'

export interface Profile {
  id: string
  user_id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  phone?: string
  department?: string
  organization_id?: string
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

export interface Organization {
  id: string
  name: string
  cnpj?: string
  created_at: string
}

export interface LearningPath {
  id: string
  organization_id?: string
  title: string
  description?: string
  reward_points: number
  created_by?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface LearningPathCourse {
  id: string
  path_id: string
  course_id: string
  order: number
}

export interface TrailProgress {
  id: string
  user_id: string
  path_id: string
  current_course_index: number
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface UserPoints {
  id: string
  user_id: string
  total_points: number
  level: number
  current_streak: number
  longest_streak: number
  last_activity: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  total_earned: number
  total_spent: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  wallet_id: string
  type: 'earn' | 'spend' | 'refund'
  amount: number
  description?: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface Achievement {
  id: string
  code: string
  name: string
  description?: string
  icon?: string
  points_required: number
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  achievement?: Achievement
}

export interface Voucher {
  id: string
  organization_id?: string
  title: string
  description?: string
  cost_coins: number
  code: string
  is_active: boolean
  created_at: string
}

export interface VoucherRedemption {
  id: string
  user_id: string
  voucher_id: string
  redeemed_at: string
  voucher?: Voucher
}

export interface ReadingSession {
  id: string
  user_id: string
  course_id: string
  started_at: string
  ended_at?: string
  current_position: number
  completed: boolean
  words_read: number
  created_at: string
  updated_at: string
}

export interface ReadingBehavior {
  id: string
  session_id: string
  user_id: string
  avg_speed_wpm: number
  reread_count: number
  pause_count: number
  created_at: string
}

export interface ReadingVocabulary {
  id: string
  user_id: string
  session_id?: string
  word: string
  times_seen: number
  created_at: string
}

export interface MoodEntry {
  id: string
  user_id: string
  mood_score: number
  feelings: string[]
  notes?: string
  created_at: string
}

export interface BookCheckpoint {
  id: string
  course_id: string
  position: number
  question: string
  correct_answer: string
  created_at: string
}

export interface CheckpointResponse {
  id: string
  session_id: string
  checkpoint_id: string
  user_id: string
  answer: string
  score?: number
  passed: boolean
  created_at: string
}

export interface ParentChildRelationship {
  id: string
  parent_id: string
  child_id: string
  relationship: string
  created_at: string
}

export interface ParentalAlert {
  id: string
  parent_id: string
  child_id: string
  title: string
  description?: string
  severity: 'low' | 'medium' | 'high'
  is_read: boolean
  created_at: string
}

export interface CorporateDocument {
  id: string
  organization_id: string
  title: string
  content: string
  required_comprehension: number
  created_at: string
  updated_at: string
}

export interface CorporateDocumentAssignment {
  id: string
  user_id: string
  document_id: string
  completed: boolean
  compliance_verified: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Certificate {
  id: string
  user_id: string
  course_id?: string
  document_id?: string
  type: 'course' | 'document' | 'trail'
  title: string
  certificate_url?: string
  issued_at: string
}

