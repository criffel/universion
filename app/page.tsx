import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Brain, Video, MessageSquare } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">Leitura Mais</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button>Criar Conta</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Plataforma Inteligente de Leitura e Aprendizado
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Desenvolvimento de fluência leitora, gamificação, controle parental e compliance corporativo em um único lugar.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Começar Agora
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestão de Cursos</h3>
            <p className="text-gray-600">
              Crie e gerencie cursos completos com materiais de apoio, aulas e avaliações
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Agentes de IA</h3>
            <p className="text-gray-600">
              Assistente inteligente para dúvidas, resumos, flashcards e recomendações personalizadas
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Múltiplos Perfis</h3>
            <p className="text-gray-600">
              Acesso diferenciado para alunos, professores, coordenadores e diretores
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="bg-orange-100 p-3 rounded-lg w-fit mb-4">
              <Video className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aulas ao Vivo</h3>
            <p className="text-gray-600">
              Sessões de vídeo em tempo real com chat integrado e gravação automática
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="bg-pink-100 p-3 rounded-lg w-fit mb-4">
              <MessageSquare className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chat em Tempo Real</h3>
            <p className="text-gray-600">
              Comunicação instantânea entre alunos e professores em cada curso
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="bg-indigo-100 p-3 rounded-lg w-fit mb-4">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Materiais Diversos</h3>
            <p className="text-gray-600">
              Suporte para PDFs, vídeos, conteúdo interativo e quizzes
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>© 2026 Leitura Mais. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
