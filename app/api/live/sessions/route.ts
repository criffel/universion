import { NextResponse } from 'next/server'
import {
  ensureLessonBelongsToCourse,
  ensureProfessorOwnsCourse,
  requireAuthenticatedProfile,
} from '@/lib/route-helpers'
import { liveSessionCreateSchema, liveSessionQuerySchema } from '@/lib/route-schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile()
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const { searchParams } = new URL(request.url)
    const parsedQuery = liveSessionQuerySchema.safeParse({
      course_id: searchParams.get('course_id') ?? undefined,
      lesson_id: searchParams.get('lesson_id') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    })

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Parametros de busca invalidos' }, { status: 400 })
    }

    let query = auth.supabase
      .from('live_sessions')
      .select(`
        *,
        course:courses(id, title),
        lesson:lessons(id, title)
      `)
      .order('scheduled_at', { ascending: true })

    if (parsedQuery.data.course_id) {
      query = query.eq('course_id', parsedQuery.data.course_id)
    }

    if (parsedQuery.data.lesson_id) {
      query = query.eq('lesson_id', parsedQuery.data.lesson_id)
    }

    if (parsedQuery.data.status) {
      query = query.eq('status', parsedQuery.data.status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar sessoes ao vivo' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile(['professor'])
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const body = await request.json()
    const parsedBody = liveSessionCreateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Payload invalido', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const ownership = await ensureProfessorOwnsCourse(parsedBody.data.course_id, auth.profile.id)
    if ('errorResponse' in ownership) {
      return ownership.errorResponse
    }

    if (parsedBody.data.lesson_id) {
      const lessonCheck = await ensureLessonBelongsToCourse(
        parsedBody.data.lesson_id,
        parsedBody.data.course_id
      )
      if ('errorResponse' in lessonCheck) {
        return lessonCheck.errorResponse
      }
    }

    const { data, error } = await auth.supabase
      .from('live_sessions')
      .insert({
        ...parsedBody.data,
        status: parsedBody.data.status ?? 'scheduled',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar sessao ao vivo' }, { status: 500 })
  }
}
