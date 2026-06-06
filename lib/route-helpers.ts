import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types'

type AuthenticatedProfile = {
  id: string
  role: UserRole
  user_id: string
  department: string | null
}

type AccessibleCourse = {
  id: string
  professor_id: string
  coordinator_id: string | null
  department: string
  is_published: boolean
}

export async function createRouteSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )
}

export async function requireAuthenticatedProfile(allowedRoles?: UserRole[]) {
  const supabase = await createRouteSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      errorResponse: NextResponse.json({ error: 'Nao autenticado' }, { status: 401 }),
    }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, user_id, department')
    .eq('user_id', user.id)
    .single<AuthenticatedProfile>()

  if (error || !profile) {
    return {
      errorResponse: NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 }),
    }
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return {
      errorResponse: NextResponse.json({ error: 'Sem permissao para esta acao' }, { status: 403 }),
    }
  }

  return { supabase, user, profile }
}

export async function ensureProfessorOwnsCourse(courseId: string, professorProfileId: string) {
  const supabase = await createRouteSupabaseClient()
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, professor_id, coordinator_id, department, is_published')
    .eq('id', courseId)
    .single<AccessibleCourse>()

  if (error || !course) {
    return {
      errorResponse: NextResponse.json({ error: 'Curso nao encontrado' }, { status: 404 }),
    }
  }

  if (course.professor_id !== professorProfileId) {
    return {
      errorResponse: NextResponse.json({ error: 'Sem permissao para acessar este curso' }, { status: 403 }),
    }
  }

  return { course, supabase }
}

export async function ensureProfileCanAccessCourse(
  courseId: string,
  profile: AuthenticatedProfile
) {
  const supabase = await createRouteSupabaseClient()
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, professor_id, coordinator_id, department, is_published')
    .eq('id', courseId)
    .single<AccessibleCourse>()

  if (error || !course) {
    return {
      errorResponse: NextResponse.json({ error: 'Curso nao encontrado' }, { status: 404 }),
    }
  }

  if (profile.role === 'diretor') {
    return { course, supabase }
  }

  if (profile.role === 'professor' && course.professor_id === profile.id) {
    return { course, supabase }
  }

  if (profile.role === 'coordenador') {
    const isCourseCoordinator = course.coordinator_id === profile.id
    const sameDepartment = profile.department && profile.department === course.department

    if (isCourseCoordinator || sameDepartment) {
      return { course, supabase }
    }
  }

  if (profile.role === 'aluno') {
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (!enrollmentError && enrollment) {
      return { course, supabase }
    }
  }

  return {
    errorResponse: NextResponse.json({ error: 'Sem permissao para acessar este curso' }, { status: 403 }),
  }
}

export async function ensureLessonBelongsToCourse(lessonId: string, courseId: string) {
  const supabase = await createRouteSupabaseClient()
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('id, course_id')
    .eq('id', lessonId)
    .single<{ id: string; course_id: string }>()

  if (error || !lesson) {
    return {
      errorResponse: NextResponse.json({ error: 'Aula nao encontrada' }, { status: 404 }),
    }
  }

  if (lesson.course_id !== courseId) {
    return {
      errorResponse: NextResponse.json({ error: 'A aula nao pertence ao curso informado' }, { status: 400 }),
    }
  }

  return { lesson, supabase }
}
