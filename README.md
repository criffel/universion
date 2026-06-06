# UniVersion - Sistema de Gestão Universitária Inteligente

Sistema completo de gestão universitária com suporte a cursos, materiais de apoio, múltiplos perfis de usuário (aluno, professor, coordenador, diretor) e agentes de IA para aprendizado.

## 🚀 Tecnologias

- **Frontend**: Next.js 16 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Node.js com API Routes do Next.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth + SSO
- **Email**: Resend
- **IA**: OpenAI API (GPT-4)
- **Real-time**: Supabase Realtime + WebSockets
- **Deploy**: Vercel

## 📋 Funcionalidades

### Autenticação e Perfis
- Login/registro com email e senha
- Integração SSO (OAuth2/SAML)
- 4 perfis de usuário: aluno, professor, coordenador, diretor
- Permissões diferenciadas por perfil

### Gestão de Cursos
- CRUD de cursos
- Categorização por departamento
- Busca e filtros
- Sistema de matrículas

### Materiais de Apoio
- Upload de PDFs, vídeos, imagens
- Organização por módulo/aula
- Visualização inline de PDFs
- Player de vídeo integrado

### Sistema de Quizzes
- Múltipla escolha, verdadeiro/falso, dissertativa
- Correção automática e manual
- Notas e feedback

### Aulas ao Vivo
- Integração WebRTC para vídeo
- Chat em tempo real
- Compartilhamento de tela
- Gravação das sessões

### Chat por Curso
- Chat em tempo real (Supabase Realtime)
- Canais por curso
- Notificações de novas mensagens

### Agentes de IA
- Chatbot de dúvidas
- Assistente de estudo (resumos, flashcards)
- Recomendações personalizadas
- Correção automática com feedback
- Análise de desempenho

## 🛠️ Configuração

### 1. Clone o repositório
```bash
git clone <repositório>
cd universion
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `env.example` para `.env.local` e preencha com suas credenciais:

```bash
cp env.example .env.local
```

Variáveis necessárias:
- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço do Supabase
- `OPENAI_API_KEY` - Chave da API OpenAI
- `RESEND_API_KEY` - Chave da API Resend
- `RESEND_FROM_EMAIL` - Email de origem para envio
- `NEXTAUTH_URL` - URL da aplicação
- `NEXTAUTH_SECRET` - Segredo do NextAuth

### 4. Configure o banco de dados

Execute o SQL do arquivo `supabase/schema.sql` no editor SQL do Supabase:

```bash
# Abra o painel do Supabase
# Vá em SQL Editor
# Cole o conteúdo de supabase/schema.sql
# Execute
```

### 5. Execute o servidor de desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
universion/
├── app/
│   ├── (auth)/          # Rotas de autenticação
│   ├── (dashboard)/     # Rotas do dashboard
│   │   ├── aluno/
│   │   ├── professor/
│   │   ├── coordenador/
│   │   └── diretor/
│   ├── (public)/        # Rotas públicas
│   ├── api/             # API Routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── auth/
│   ├── dashboard/
│   ├── courses/
│   ├── materials/
│   ├── quizzes/
│   ├── chat/
│   └── ai/
├── lib/
│   ├── supabase.ts
│   ├── ai.ts
│   └── utils.ts
├── types/
│   └── index.ts
├── hooks/
│   └── useAuth.ts
└── supabase/
    └── schema.sql
```

## 🔐 Segurança

- Row Level Security (RLS) no Supabase
- Proteção de rotas por middleware
- Validação de dados com Zod
- Sanitização de inputs
- Rate limiting na API
- HTTPS obrigatório

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop
- Tablet
- Mobile
- App mobile (React Native - em desenvolvimento)

## 🚀 Deploy

### Vercel

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Supabase

1. Crie um projeto no Supabase
2. Execute o schema SQL
3. Configure as variáveis de ambiente

## 📝 Licença

Este projeto está sob licença MIT.

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.
