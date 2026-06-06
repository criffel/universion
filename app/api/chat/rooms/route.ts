import { NextResponse } from 'next/server'
import { createRouteSupabaseClient, ensureProfileCanAccessCourse, requireAuthenticatedProfile } from '@/lib/route-helpers'
import { chatRoomCreateSchema, chatRoomQuerySchema } from '@/lib/route-schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile()
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const { searchParams } = new URL(request.url)
    const parsedQuery = chatRoomQuerySchema.safeParse({
      course_id: searchParams.get('course_id') ?? undefined,
    })

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Parametros de busca invalidos' }, { status: 400 })
    }

    if (parsedQuery.data.course_id) {
      const access = await ensureProfileCanAccessCourse(parsedQuery.data.course_id, auth.profile)
      if ('errorResponse' in access) {
        return access.errorResponse
      }
    }

    const supabase = await createRouteSupabaseClient()
    let query = supabase
      .from('chat_rooms')
      .select(`
        *,
        course:courses(id, title)
      `)

    if (parsedQuery.data.course_id) {
      query = query.eq('course_id', parsedQuery.data.course_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar salas de chat' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile(['professor', 'coordenador', 'diretor'])
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const body = await request.json()
    const parsedBody = chatRoomCreateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Payload invalido', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const access = await ensureProfileCanAccessCourse(parsedBody.data.course_id, auth.profile)
    if ('errorResponse' in access) {
      return access.errorResponse
    }

    const { data, error } = await auth.supabase
      .from('chat_rooms')
      .insert(parsedBody.data)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar sala de chat' }, { status: 500 })
  }
}
