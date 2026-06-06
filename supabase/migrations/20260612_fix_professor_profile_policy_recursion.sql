CREATE OR REPLACE FUNCTION public.can_current_professor_view_profile(target_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM courses
    JOIN course_enrollments
      ON course_enrollments.course_id = courses.id
    WHERE courses.professor_id::text = auth.jwt() -> 'user_metadata' ->> 'profile_id'
      AND course_enrollments.user_id = target_profile_id
  );
END;
$$;

DROP POLICY IF EXISTS "Professores podem ver perfis de seus alunos" ON profiles;
CREATE POLICY "Professores podem ver perfis de seus alunos"
  ON profiles FOR SELECT
  USING (public.can_current_professor_view_profile(id));
