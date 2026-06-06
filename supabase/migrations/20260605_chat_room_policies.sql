CREATE POLICY "Participantes podem ver salas de chat"
  ON chat_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = chat_rooms.course_id
      AND (
        courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR courses.coordinator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'diretor'
        )
        OR EXISTS (
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = chat_rooms.course_id
          AND course_enrollments.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Professores e coordenadores podem criar salas"
  ON chat_rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = chat_rooms.course_id
      AND (
        courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR courses.coordinator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'diretor'
        )
      )
    )
  );
