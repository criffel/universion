import { NextResponse } from 'next/server'
import { requireAuthenticatedProfile } from '@/lib/route-helpers'
import { aiChatSchema } from '@/lib/route-schemas'
import { generateChatResponse } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile()
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }

    const body = await request.json()
    const parsedBody = aiChatSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Payload invalido', details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const response = await generateChatResponse(parsedBody.data.message, parsedBody.data.context)

    return NextResponse.json({
      response,
      userId: auth.user.id,
      role: auth.profile.role,
    })
  } catch (error) {
    console.error('Erro ao gerar resposta da IA:', error)
    return NextResponse.json({ error: 'Erro ao processar solicitacao' }, { status: 500 })
  }
}
