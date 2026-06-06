import { NextResponse } from 'next/server'
import { createRouteSupabaseClient, ensureProfessorOwnsCourse, requireAuthenticatedProfile } from '@/lib/route-helpers'
import { materialCreateSchema, materialQuerySchema } from '@/lib/route-schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createRouteSupabaseClient()
    const { searchParams } = new URL(request.url)
    const parsedQuery = materialQuerySchema.safeParse({
      course_id: searchParams.get('course_id') ?? undefined,
      type: searchParams.get('type') ?? undefined,
    })

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Parametros de busca invalidos' }, { status: 400 })
    }

    let query = supabase
      .from('materials')
      .select(`
        *,
        course:courses(id, title)
      `)
      .order('order', { ascending: true })

    if (parsedQuery.data.course_id) {
      query = query.eq('course_id', parsedQuery.data.course_id)
    }

    if (parsedQuery.data.type) {
      query = query.eq('type', parsedQuery.data.type)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar materiais' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile(['professor'])
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const body = await request.json()
    const parsedBody = materialCreateSchema.safeParse(body)

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
      .from('materials')
      .insert({
        ...parsedBody.data,
        order: parsedBody.data.order ?? 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar material' }, { status: 500 })
  }
}
