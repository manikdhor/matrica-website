import { db } from '@/lib/db'

/**
 * Unified AI provider layer. Admin picks a provider + model + API key in
 * Settings → AI Configuration (stored in the Setting table as ai_* keys).
 * Every provider except Anthropic speaks the OpenAI chat-completions dialect;
 * Anthropic gets a small adapter. 'zai-sdk' is the legacy default that keeps
 * the previous z-ai-web-dev-sdk behavior until an admin configures a real key.
 */

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiConfig {
  provider: string
  model: string
  apiKey: string
  baseUrl: string
  temperature: number
  maxTokens: number
}

export interface AiProviderPreset {
  label: string
  baseUrl: string
  /** Suggested model ids shown in the admin UI (free-text input still allowed). */
  models: string[]
  /** 'openai' = Bearer + /chat/completions; 'anthropic' = x-api-key + /messages */
  dialect: 'openai' | 'anthropic'
}

export const AI_PROVIDERS: Record<string, AiProviderPreset> = {
  openai: {
    label: 'OpenAI (ChatGPT)',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o4-mini'],
    dialect: 'openai',
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-5', 'claude-haiku-4-5-20251001', 'claude-opus-4-8'],
    dialect: 'anthropic',
  },
  gemini: {
    label: 'Google (Gemini)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'],
    dialect: 'openai',
  },
  deepseek: {
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    dialect: 'openai',
  },
  xai: {
    label: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    models: ['grok-3-mini', 'grok-3', 'grok-4'],
    dialect: 'openai',
  },
  zai: {
    label: 'Z.AI (GLM)',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    models: ['glm-4.5-air', 'glm-4.5', 'glm-4.6'],
    dialect: 'openai',
  },
  perplexity: {
    label: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai',
    models: ['sonar', 'sonar-pro'],
    dialect: 'openai',
  },
  openrouter: {
    label: 'OpenRouter (any model)',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-5', 'google/gemini-2.5-flash', 'deepseek/deepseek-chat'],
    dialect: 'openai',
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    models: [],
    dialect: 'openai',
  },
  'zai-sdk': {
    label: 'Legacy built-in (z-ai-web-dev-sdk)',
    baseUrl: '',
    models: ['gpt-4o-mini'],
    dialect: 'openai',
  },
}

const AI_SETTING_KEYS = ['ai_provider', 'ai_model', 'ai_api_key', 'ai_base_url', 'ai_temperature', 'ai_max_tokens'] as const

let cachedConfig: { value: AiConfig; at: number } | null = null
const CONFIG_TTL = 30_000

export function invalidateAiConfigCache() {
  cachedConfig = null
}

export async function getAiConfig(): Promise<AiConfig> {
  if (cachedConfig && Date.now() - cachedConfig.at < CONFIG_TTL) return cachedConfig.value
  let map: Record<string, string> = {}
  try {
    const rows = await db.setting.findMany({ where: { key: { in: [...AI_SETTING_KEYS] } } })
    map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? '']))
  } catch {
    // DB unreachable — fall through to env/defaults
  }
  const provider = map.ai_provider || process.env.AI_PROVIDER || 'zai-sdk'
  const preset = AI_PROVIDERS[provider] ?? AI_PROVIDERS.custom
  const value: AiConfig = {
    provider,
    model: map.ai_model || process.env.AI_MODEL || preset.models[0] || '',
    apiKey: map.ai_api_key || process.env.AI_API_KEY || '',
    baseUrl: map.ai_base_url || process.env.AI_BASE_URL || preset.baseUrl,
    temperature: Number(map.ai_temperature) || 0.7,
    maxTokens: Number(map.ai_max_tokens) || 1024,
  }
  cachedConfig = { value, at: Date.now() }
  return value
}

interface AiChatOptions {
  maxTokens?: number
  temperature?: number
  model?: string
  config?: AiConfig
}

/** Send a chat completion to the configured provider. Throws on failure — callers keep their own fallbacks. */
export async function aiChat(messages: AiMessage[], opts: AiChatOptions = {}): Promise<string> {
  const cfg = opts.config ?? (await getAiConfig())
  const model = opts.model || cfg.model
  const maxTokens = opts.maxTokens ?? cfg.maxTokens
  const temperature = opts.temperature ?? cfg.temperature

  if (cfg.provider === 'zai-sdk') {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const sdk = await ZAI.create()
    const completion = await sdk.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature,
    })
    const content = completion.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response from legacy AI SDK')
    return content
  }

  if (!cfg.apiKey) throw new Error('AI is not configured: missing API key (Settings → AI Configuration)')
  const preset = AI_PROVIDERS[cfg.provider] ?? AI_PROVIDERS.custom
  const baseUrl = (cfg.baseUrl || preset.baseUrl).replace(/\/+$/, '')
  if (!baseUrl) throw new Error('AI is not configured: missing base URL')

  if (preset.dialect === 'anthropic') {
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
    const rest = messages.filter((m) => m.role !== 'system')
    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        ...(system ? { system } : {}),
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
    if (!res.ok) throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
    const data = await res.json()
    const content = Array.isArray(data.content)
      ? data.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
      : ''
    if (!content) throw new Error('Empty response from AI provider')
    return content
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${cfg.apiKey}`,
      ...(cfg.provider === 'openrouter' ? { 'x-title': 'Matrica Admin' } : {}),
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  })
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from AI provider')
  return content
}

/** One-shot connectivity test used by the admin "Test" button. */
export async function testAiConnection(config?: AiConfig): Promise<{ ok: boolean; reply?: string; error?: string }> {
  try {
    const reply = await aiChat(
      [
        { role: 'system', content: 'Reply with exactly: OK' },
        { role: 'user', content: 'Connection test' },
      ],
      { maxTokens: 20, temperature: 0, config }
    )
    return { ok: true, reply: reply.slice(0, 100) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
