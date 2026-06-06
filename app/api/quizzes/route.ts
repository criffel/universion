import { NextResponse } from 'next/server'
import { createRouteSupabaseClient, ensureProfessorOwnsCourse, requireAuthenticatedProfile } from '@/lib/route-helpers'
import { quizCreateSchema, quizQuerySchema } from '@/lib/route-schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createRouteSupabaseClient()
    const { searchParams } = new URL(request.url)
    const parsedQuery = quizQuerySchema.safeParse({
      course_id: searchParams.get('course_id') ?? undefined,
    })

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Parametros de busca invalidos' }, { status: 400 })
    }

    let query = supabase
      .from('quizzes')
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
    return NextResponse.json({ error: 'Erro ao buscar quizzes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile(['professor'])
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const body = await request.json()
    const parsedBody = quizCreateSchema.safeParse(body)

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
      .from('quizzes')
      .insert({
        ...parsedBody.data,
        max_attempts: parsedBody.data.max_attempts ?? 1,
        passing_score: parsedBody.data.passing_score ?? 70,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar quiz' }, { status: 500 })
  }
}
