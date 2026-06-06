CREATE POLICY "Participantes podem ver aulas"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND (
        courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = lessons.course_id
          AND course_enrollments.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Professores podem criar aulas"
  ON lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Professores podem atualizar aulas"
  ON lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Professores podem deletar aulas"
  ON lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Professores podem atualizar sessoes ao vivo"
  ON live_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = live_sessions.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Professores podem deletar sessoes ao vivo"
  ON live_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = live_sessions.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );
