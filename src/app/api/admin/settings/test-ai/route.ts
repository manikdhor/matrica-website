import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { AI_PROVIDERS, testAiConnection, type AiConfig } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission('settings', true)
    if (auth instanceof Response) return auth

    const body = await request.json().catch(() => ({}))
    const provider = typeof body.provider === 'string' && body.provider ? body.provider : 'zai-sdk'
    const preset = AI_PROVIDERS[provider] ?? AI_PROVIDERS.custom

    const config: AiConfig = {
      provider,
      model: (typeof body.model === 'string' && body.model) || preset.models[0] || '',
      apiKey: typeof body.apiKey === 'string' ? body.apiKey : '',
      baseUrl: (typeof body.baseUrl === 'string' && body.baseUrl) || preset.baseUrl,
      temperature: Number(body.temperature) || 0.7,
      maxTokens: Number(body.maxTokens) || 1024,
    }

    const result = await testAiConnection(config)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
