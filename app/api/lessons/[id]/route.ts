import { NextResponse } from 'next/server'
import { createRouteSupabaseClient, ensureProfessorOwnsCourse, requireAuthenticatedProfile } from '@/lib/route-helpers'
import { lessonUpdateSchema } from '@/lib/route-schemas'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createRouteSupabaseClient()

    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        course:courses(id, title)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar aula' }, { status: 500 })
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
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, course_id')
      .eq('id', id)
      .single<{ id: string; course_id: string }>()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Aula nao encontrada' }, { status: 404 })
    }

    const ownership = await ensureProfessorOwnsCourse(lesson.course_id, auth.profile.id)
    if ('errorResponse' in ownership) {
      return ownership.errorResponse
    }

    const body = await request.json()
    const parsedBody = lessonUpdateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Payload invalido', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase
      .from('lessons')
      .update({
        ...parsedBody.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('course_id', lesson.course_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar aula' }, { status: 500 })
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
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, course_id')
      .eq('id', id)
      .single<{ id: string; course_id: string }>()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Aula nao encontrada' }, { status: 404 })
    }

    const ownership = await ensureProfessorOwnsCourse(lesson.course_id, auth.profile.id)
    if ('errorResponse' in ownership) {
      return ownership.errorResponse
    }

    const { error } = await auth.supabase
      .from('lessons')
      .delete()
      .eq('id', id)
      .eq('course_id', lesson.course_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar aula' }, { status: 500 })
  }
}
