CREATE OR REPLACE FUNCTION public.is_current_profile_id(target_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'profile_id') = target_profile_id::text;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'role';
$$;

CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'department';
$$;

CREATE OR REPLACE FUNCTION public.current_user_teaches_course(target_course_id UUID)
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
    WHERE id = target_course_id
      AND professor_id::text = auth.jwt() -> 'user_metadata' ->> 'profile_id'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_enrolled_in_course(target_course_id UUID)
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
    FROM course_enrollments
    WHERE course_id = target_course_id
      AND user_id::text = auth.jwt() -> 'user_metadata' ->> 'profile_id'
  );
END;
$$;

DROP POLICY IF EXISTS "Professores podem ver seus cursos" ON courses;
CREATE POLICY "Professores podem ver seus cursos"
  ON courses FOR SELECT
  USING (public.is_current_profile_id(professor_id));

DROP POLICY IF EXISTS "Alunos podem ver cursos matriculados" ON courses;
CREATE POLICY "Alunos podem ver cursos matriculados"
  ON courses FOR SELECT
  USING (public.current_user_enrolled_in_course(id));

DROP POLICY IF EXISTS "Coordenadores podem ver cursos do departamento" ON courses;
CREATE POLICY "Coordenadores podem ver cursos do departamento"
  ON courses FOR SELECT
  USING (
    public.current_user_role() = 'coordenador'
    AND public.current_user_department() IS NOT NULL
    AND department = public.current_user_department()
  );

DROP POLICY IF EXISTS "Diretores podem ver todos os cursos" ON courses;
CREATE POLICY "Diretores podem ver todos os cursos"
  ON courses FOR SELECT
  USING (public.current_user_role() = 'diretor');

DROP POLICY IF EXISTS "Professores podem criar cursos" ON courses;
CREATE POLICY "Professores podem criar cursos"
  ON courses FOR INSERT
  WITH CHECK (
    public.is_current_profile_id(professor_id)
    AND public.current_user_role() = 'professor'
  );

DROP POLICY IF EXISTS "Professores podem atualizar seus cursos" ON courses;
CREATE POLICY "Professores podem atualizar seus cursos"
  ON courses FOR UPDATE
  USING (public.is_current_profile_id(professor_id));

DROP POLICY IF EXISTS "Alunos podem ver suas matrículas" ON course_enrollments;
CREATE POLICY "Alunos podem ver suas matrículas"
  ON course_enrollments FOR SELECT
  USING (public.is_current_profile_id(user_id));

DROP POLICY IF EXISTS "Alunos podem se matricular" ON course_enrollments;
CREATE POLICY "Alunos podem se matricular"
  ON course_enrollments FOR INSERT
  WITH CHECK (
    public.is_current_profile_id(user_id)
    AND public.current_user_role() = 'aluno'
  );

DROP POLICY IF EXISTS "Professores podem ver matrículas de seus cursos" ON course_enrollments;
CREATE POLICY "Professores podem ver matrículas de seus cursos"
  ON course_enrollments FOR SELECT
  USING (public.current_user_teaches_course(course_id));

DROP POLICY IF EXISTS "Coordenadores podem ver matrículas do departamento" ON course_enrollments;
CREATE POLICY "Coordenadores podem ver matrículas do departamento"
  ON course_enrollments FOR SELECT
  USING (
    public.current_user_role() = 'coordenador'
    AND EXISTS (
      SELECT 1
      FROM courses
      WHERE courses.id = course_enrollments.course_id
        AND courses.department = public.current_user_department()
    )
  );

DROP POLICY IF EXISTS "Diretores podem ver todas as matrículas" ON course_enrollments;
CREATE POLICY "Diretores podem ver todas as matrículas"
  ON course_enrollments FOR SELECT
  USING (public.current_user_role() = 'diretor');
