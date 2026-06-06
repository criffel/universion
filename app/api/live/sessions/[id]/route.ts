import { NextResponse } from 'next/server'
import {
  createRouteSupabaseClient,
  ensureLessonBelongsToCourse,
  ensureProfessorOwnsCourse,
  requireAuthenticatedProfile,
} from '@/lib/route-helpers'
import { liveSessionUpdateSchema } from '@/lib/route-schemas'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createRouteSupabaseClient()

    const { data, error } = await supabase
      .from('live_sessions')
      .select(`
        *,
        course:courses(id, title),
        lesson:lessons(id, title)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar sessao ao vivo' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireAuthenticatedProfile(['professor'])
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const supabase = await createRouteSupabaseClient()
    const { data: liveSession, error: liveSessionError } = await supabase
      .from('live_sessions')
      .select('id, course_id')
      .eq('id', id)
      .single<{ id: string; course_id: string }>()

    if (liveSessionError || !liveSession) {
      return NextResponse.json({ error: 'Sessao ao vivo nao encontrada' }, { status: 404 })
    }

    const ownership = await ensureProfessorOwnsCourse(liveSession.course_id, auth.profile.id)
    if ('errorResponse' in ownership) {
      return ownership.errorResponse
    }

    const body = await request.json()
    const parsedBody = liveSessionUpdateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Payload invalido', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const nextCourseId = parsedBody.data.course_id ?? liveSession.course_id

    if (parsedBody.data.course_id && parsedBody.data.course_id !== liveSession.course_id) {
      const nextOwnership = await ensureProfessorOwnsCourse(parsedBody.data.course_id, auth.profile.id)
      if ('errorResponse' in nextOwnership) {
        return nextOwnership.errorResponse
      }
    }

    if (parsedBody.data.lesson_id) {
      const lessonCheck = await ensureLessonBelongsToCourse(parsedBody.data.lesson_id, nextCourseId)
      if ('errorResponse' in lessonCheck) {
        return lessonCheck.errorResponse
      }
    }

    const { data, error } = await auth.supabase
      .from('live_sessions')
      .update({
        ...parsedBody.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('course_id', liveSession.course_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar sessao ao vivo' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireAuthenticatedProfile(['professor'])
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const supabase = await createRouteSupabaseClient()
    const { data: liveSession, error: liveSessionError } = await supabase
      .from('live_sessions')
      .select('id, course_id')
      .eq('id', id)
      .single<{ id: string; course_id: string }>()

    if (liveSessionError || !liveSession) {
      return NextResponse.json({ error: 'Sessao ao vivo nao encontrada' }, { status: 404 })
    }

    const ownership = await ensureProfessorOwnsCourse(liveSession.course_id, auth.profile.id)
    if ('errorResponse' in ownership) {
      return ownership.errorResponse
    }

    const { error } = await auth.supabase
      .from('live_sessions')
      .delete()
      .eq('id', id)
      .eq('course_id', liveSession.course_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar sessao ao vivo' }, { status: 500 })
  }
}
