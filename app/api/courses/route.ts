import { NextResponse } from 'next/server'
import { requireAuthenticatedProfile, createRouteSupabaseClient } from '@/lib/route-helpers'
import { courseCreateSchema, courseQuerySchema } from '@/lib/route-schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createRouteSupabaseClient()
    const { searchParams } = new URL(request.url)
    const parsedQuery = courseQuerySchema.safeParse({
      department: searchParams.get('department') ?? undefined,
      professor_id: searchParams.get('professor_id') ?? undefined,
    })

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Parametros de busca invalidos' }, { status: 400 })
    }

    let query = supabase
      .from('courses')
      .select(`
        *,
        professor:profiles!courses_professor_id_fkey(full_name, email),
        coordinator:profiles!courses_coordinator_id_fkey(full_name, email)
      `)
      .eq('is_published', true)

    if (parsedQuery.data.department) {
      query = query.eq('department', parsedQuery.data.department)
    }

    if (parsedQuery.data.professor_id) {
      query = query.eq('professor_id', parsedQuery.data.professor_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar cursos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile(['professor'])
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const body = await request.json()
    const parsedBody = courseCreateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Payload invalido', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase
      .from('courses')
      .insert({
        ...parsedBody.data,
        professor_id: auth.profile.id,
        is_published: parsedBody.data.is_published ?? false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar curso' }, { status: 500 })
  }
}
