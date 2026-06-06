-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuários
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('aluno', 'professor', 'coordenador', 'diretor')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de cursos
CREATE TABLE courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL,
  professor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coordinator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cover_image TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de matrículas em cursos
CREATE TABLE course_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(course_id, user_id)
);

-- Tabela de materiais de apoio
CREATE TABLE materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'link', 'interactive')),
  file_url TEXT,
  file_size BIGINT,
  duration INTEGER,
  module TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de aulas
CREATE TABLE lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  is_live BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de quizzes
CREATE TABLE quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit INTEGER,
  max_attempts INTEGER DEFAULT 1,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de perguntas de quiz
CREATE TABLE quiz_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'essay')),
  options JSONB,
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0
);

-- Tabela de tentativas de quiz
CREATE TABLE quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  answers JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  feedback TEXT
);

-- Tabela de salas de chat
CREATE TABLE chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de mensagens de chat
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de notificações
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('course', 'material', 'quiz', 'live', 'chat', 'system')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de sessões ao vivo
CREATE TABLE live_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  stream_url TEXT,
  recording_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de conversas com IA
CREATE TABLE ai_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhorar performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_courses_professor_id ON courses(professor_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX idx_materials_course_id ON materials(course_id);
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_live_sessions_course_id ON live_sessions(course_id);
CREATE INDEX idx_live_sessions_scheduled_at ON live_sessions(scheduled_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_sessions_updated_at BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

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

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Professores podem ver perfis de seus alunos"
  ON profiles FOR SELECT
  USING (public.can_current_professor_view_profile(id));

CREATE POLICY "Coordenadores podem ver perfis do departamento"
  ON profiles FOR SELECT
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'coordenador'
    AND auth.jwt() -> 'user_metadata' ->> 'department' IS NOT NULL
    AND department = auth.jwt() -> 'user_metadata' ->> 'department'
  );

CREATE POLICY "Diretores podem ver todos os perfis"
  ON profiles FOR SELECT
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'diretor');

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
-- Políticas RLS para courses
CREATE POLICY "Todos podem ver cursos publicados"
  ON courses FOR SELECT
  USING (is_published = true);

CREATE POLICY "Professores podem ver seus cursos"
  ON courses FOR SELECT
  USING (
    professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Alunos podem ver cursos matriculados"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = courses.id
      AND course_enrollments.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Professores podem criar cursos"
  ON courses FOR INSERT
  WITH CHECK (
    professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'professor'
  );

CREATE POLICY "Professores podem atualizar seus cursos"
  ON courses FOR UPDATE
  USING (
    professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

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

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
-- Políticas RLS para courses
      WHERE courses.id = materials.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Professores podem criar materiais"
  ON materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = materials.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Professores podem atualizar materiais"
  ON materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = materials.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

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

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
-- Políticas RLS para courses
        WHERE courses.id = quizzes.course_id
        AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Alunos podem criar tentativas"
  ON quiz_attempts FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'aluno'
  );

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

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

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
-- Políticas RLS para courses
      WHERE courses.id = live_sessions.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Professores podem criar sessões ao vivo"
  ON live_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = live_sessions.course_id
      AND courses.professor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Políticas RLS para ai_conversations
CREATE POLICY "Usuários podem ver suas conversas"
  ON ai_conversations FOR SELECT
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Usuários podem criar conversas"
  ON ai_conversations FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Usuários podem atualizar suas conversas"
  ON ai_conversations FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


