import { NextResponse } from 'next/server'
import { ensureProfessorOwnsCourse, requireAuthenticatedProfile } from '@/lib/route-helpers'
import { lessonCreateSchema, lessonQuerySchema } from '@/lib/route-schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile()
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const { searchParams } = new URL(request.url)
    const parsedQuery = lessonQuerySchema.safeParse({
      course_id: searchParams.get('course_id') ?? undefined,
      is_live: searchParams.get('is_live') ?? undefined,
    })

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Parametros de busca invalidos' }, { status: 400 })
    }

    let query = auth.supabase
      .from('lessons')
      .select(`
        *,
        course:courses(id, title)
      `)
      .order('scheduled_at', { ascending: true })

    if (parsedQuery.data.course_id) {
      query = query.eq('course_id', parsedQuery.data.course_id)
    }

    if (parsedQuery.data.is_live) {
      query = query.eq('is_live', parsedQuery.data.is_live === 'true')
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar aulas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile(['professor'])
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const body = await request.json()
    const parsedBody = lessonCreateSchema.safeParse(body)

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

    const { data, error } = await auth.supabase
      .from('lessons')
      .insert({
        ...parsedBody.data,
        is_live: parsedBody.data.is_live ?? false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar aula' }, { status: 500 })
  }
}
