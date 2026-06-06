import { NextResponse } from 'next/server'
import { createRouteSupabaseClient, ensureProfessorOwnsCourse, requireAuthenticatedProfile } from '@/lib/route-helpers'
import { courseUpdateSchema } from '@/lib/route-schemas'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createRouteSupabaseClient()

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        professor:profiles!courses_professor_id_fkey(full_name, email, avatar_url),
        coordinator:profiles!courses_coordinator_id_fkey(full_name, email, avatar_url),
        materials(*),
        lessons(*),
        quizzes(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar curso' }, { status: 500 })
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

    const ownership = await ensureProfessorOwnsCourse(id, auth.profile.id)
    if ('errorResponse' in ownership) {
      return ownership.errorResponse
    }

    const body = await request.json()
    const parsedBody = courseUpdateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Payload invalido', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase
      .from('courses')
      .update({
        ...parsedBody.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('professor_id', auth.profile.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar curso' }, { status: 500 })
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

    const ownership = await ensureProfessorOwnsCourse(id, auth.profile.id)
    if ('errorResponse' in ownership) {
      return ownership.errorResponse
    }

    const { error } = await auth.supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('professor_id', auth.profile.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar curso' }, { status: 500 })
  }
}
