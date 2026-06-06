CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN (
    SELECT id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_profile_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_profile_department()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN (
    SELECT department
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

CREATE POLICY "Professores podem ver perfis de seus alunos"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.professor_id = public.get_current_profile_id()
      AND EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE course_enrollments.course_id = courses.id
        AND course_enrollments.user_id = profiles.id
      )
    )
  );

CREATE POLICY "Coordenadores podem ver perfis do departamento"
  ON profiles FOR SELECT
  USING (
    public.get_current_profile_role() = 'coordenador'
    AND public.get_current_profile_department() IS NOT NULL
    AND department = public.get_current_profile_department()
  );

CREATE POLICY "Diretores podem ver todos os perfis"
  ON profiles FOR SELECT
  USING (public.get_current_profile_role() = 'diretor');
