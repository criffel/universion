CREATE OR REPLACE FUNCTION public.sync_profile_metadata_to_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'full_name', NEW.full_name,
    'role', NEW.role,
    'department', NEW.department,
    'profile_id', NEW.id
  )
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_metadata_to_auth_user_trigger ON profiles;
CREATE TRIGGER sync_profile_metadata_to_auth_user_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_metadata_to_auth_user();

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'full_name', profiles.full_name,
  'role', profiles.role,
  'department', profiles.department,
  'profile_id', profiles.id
)
FROM public.profiles
WHERE profiles.user_id = auth.users.id;

DROP POLICY IF EXISTS "Professores podem ver perfis de seus alunos" ON profiles;
CREATE POLICY "Professores podem ver perfis de seus alunos"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.professor_id::text = auth.jwt() -> 'user_metadata' ->> 'profile_id'
      AND EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE course_enrollments.course_id = courses.id
        AND course_enrollments.user_id = profiles.id
      )
    )
  );

DROP POLICY IF EXISTS "Coordenadores podem ver perfis do departamento" ON profiles;
CREATE POLICY "Coordenadores podem ver perfis do departamento"
  ON profiles FOR SELECT
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'coordenador'
    AND auth.jwt() -> 'user_metadata' ->> 'department' IS NOT NULL
    AND department = auth.jwt() -> 'user_metadata' ->> 'department'
  );

DROP POLICY IF EXISTS "Diretores podem ver todos os perfis" ON profiles;
CREATE POLICY "Diretores podem ver todos os perfis"
  ON profiles FOR SELECT
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'diretor');
