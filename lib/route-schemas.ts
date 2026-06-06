import { z } from 'zod'

const uuidSchema = z.uuid()

export const courseQuerySchema = z.object({
  department: z.string().trim().min(1).optional(),
  professor_id: uuidSchema.optional(),
})

export const courseCreateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  department: z.string().trim().min(2).max(120),
  coordinator_id: uuidSchema.optional().nullable(),
  cover_image: z.url().optional().nullable(),
  is_published: z.boolean().optional(),
})

export const courseUpdateSchema = courseCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: 'Nenhum campo informado para atualizacao' }
)

export const materialQuerySchema = z.object({
  course_id: uuidSchema.optional(),
  type: z.enum(['pdf', 'video', 'link', 'interactive']).optional(),
})

export const materialCreateSchema = z.object({
  course_id: uuidSchema,
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  type: z.enum(['pdf', 'video', 'link', 'interactive']),
  file_url: z.url().optional().nullable(),
  file_size: z.number().int().nonnegative().optional().nullable(),
  duration: z.number().int().nonnegative().optional().nullable(),
  module: z.string().trim().max(160).optional().nullable(),
  order: z.number().int().nonnegative().optional(),
})

export const quizQuerySchema = z.object({
  course_id: uuidSchema.optional(),
})

export const quizCreateSchema = z.object({
  course_id: uuidSchema,
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  time_limit: z.number().int().positive().optional().nullable(),
  max_attempts: z.number().int().positive().optional(),
  passing_score: z.number().int().min(0).max(100).optional(),
})

export const chatRoomQuerySchema = z.object({
  course_id: uuidSchema.optional(),
})

export const chatRoomCreateSchema = z.object({
  course_id: uuidSchema,
  name: z.string().trim().min(3).max(120),
})

export const aiChatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  context: z.string().trim().max(4000).optional(),
})

export const lessonQuerySchema = z.object({
  course_id: uuidSchema.optional(),
  is_live: z.enum(['true', 'false']).optional(),
})

export const lessonCreateSchema = z.object({
  course_id: uuidSchema,
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  scheduled_at: z.iso.datetime().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  is_live: z.boolean().optional(),
  recording_url: z.url().optional().nullable(),
})

export const lessonUpdateSchema = lessonCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: 'Nenhum campo informado para atualizacao' }
)

export const liveSessionQuerySchema = z.object({
  course_id: uuidSchema.optional(),
  lesson_id: uuidSchema.optional(),
  status: z.enum(['scheduled', 'live', 'ended']).optional(),
})

export const liveSessionCreateSchema = z.object({
  course_id: uuidSchema,
  lesson_id: uuidSchema.optional().nullable(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  scheduled_at: z.iso.datetime(),
  duration: z.number().int().positive(),
  stream_url: z.url().optional().nullable(),
  recording_url: z.url().optional().nullable(),
  status: z.enum(['scheduled', 'live', 'ended']).optional(),
})

export const liveSessionUpdateSchema = liveSessionCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: 'Nenhum campo informado para atualizacao' }
)
