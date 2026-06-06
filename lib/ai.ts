import OpenAI from 'openai'
import type { Material } from '@/types'

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não está configurada')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function generateChatResponse(
  message: string,
  context?: string
) {
  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: context || 'Você é um assistente de aprendizado útil e amigável para estudantes universitários.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Erro ao gerar resposta da IA:', error)
    throw error
  }
}

export async function generateStudySummary(content: string) {
  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em criar resumos educacionais claros e concisos.',
        },
        {
          role: 'user',
          content: `Crie um resumo estruturado do seguinte conteúdo:\n\n${content}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Erro ao gerar resumo:', error)
    throw error
  }
}

export async function generateFlashcards(content: string) {
  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em criar flashcards para estudo. Retorne no formato JSON com array de objetos contendo "pergunta" e "resposta".',
        },
        {
          role: 'user',
          content: `Crie 10 flashcards baseados no seguinte conteúdo:\n\n${content}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0].message.content
    return JSON.parse(response || '{}')
  } catch (error) {
    console.error('Erro ao gerar flashcards:', error)
    throw error
  }
}

export async function generateQuizQuestions(topic: string, count: number = 5) {
  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em criar questões de múltipla escolha. Retorne no formato JSON com array de objetos contendo "pergunta", "opcoes" (array de 4 strings), e "resposta_correta" (índice da opção correta, 0-3).',
        },
        {
          role: 'user',
          content: `Crie ${count} questões de múltipla escolha sobre o tema: ${topic}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0].message.content
    return JSON.parse(response || '{}')
  } catch (error) {
    console.error('Erro ao gerar questões:', error)
    throw error
  }
}

export async function gradeEssayAnswer(question: string, answer: string, rubric?: string) {
  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: rubric || 'Você é um assistente especializado em corrigir respostas dissertativas. Forneça uma nota de 0 a 10 e feedback construtivo.',
        },
        {
          role: 'user',
          content: `Pergunta: ${question}\n\nResposta do aluno: ${answer}\n\nForneça uma nota de 0 a 10 e feedback detalhado.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Erro ao corrigir resposta:', error)
    throw error
  }
}

export async function generatePersonalizedRecommendations(
  userProgress: Record<string, unknown>,
  availableMaterials: Material[]
) {
  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em recomendações personalizadas de aprendizado. Baseie-se no progresso do aluno para sugerir materiais relevantes.',
        },
        {
          role: 'user',
          content: `Progresso do aluno: ${JSON.stringify(userProgress)}\n\nMateriais disponíveis: ${JSON.stringify(availableMaterials)}\n\nSugira 3-5 materiais mais relevantes para o aluno.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 1500,
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error)
    throw error
  }
}
