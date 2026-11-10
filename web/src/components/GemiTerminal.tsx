import { GoogleGenerativeAI } from '@google/generative-ai'
import ReactMarkdown from 'react-markdown'
import { useMemo, useState } from 'react'
import type { ActiveAspect } from '../engines/planetaryVectors'
import type { EvolutionLayer } from '../types'

export interface GemiSystemState {
  layer: EvolutionLayer
  sign: string
  activeAspects: ActiveAspect[]
  rhythmForecast: string
  ambientFrequencyHz: number
  acousticCountermeasure: string
}

interface GemiTerminalProps {
  state: GemiSystemState
}

interface GemiMessage {
  id: string
  role: 'gemi' | 'user'
  text: string
}

function toPlainEnglishAspect(aspect: ActiveAspect): string {
  if (aspect.type === 'Opposition' || aspect.type === 'Square') {
    return `${aspect.bodyA} and ${aspect.bodyB}: Relational Tension`
  }

  if (aspect.type === 'Trine' || aspect.type === 'Sextile') {
    return `${aspect.bodyA} and ${aspect.bodyB}: Cooperative Flow`
  }

  return `${aspect.bodyA} and ${aspect.bodyB}: Concentrated Focus`
}

export function generateSystemPrompt(state: GemiSystemState): string {
  const aspectsLine =
    state.activeAspects.length > 0
      ? state.activeAspects.map(toPlainEnglishAspect).join('; ')
      : 'No high-signal active aspects right now.'

  return [
    'You are Gemi, a tactical systems advisor. Your job is to translate Hermetic celestial mechanics into practical, layman-friendly daily strategy.',
    'CRITICAL FORMATTING: You must chunk your responses into short, scannable paragraphs or bullet points. Never output a wall of text.',
    'NO JARGON: Never output mathematical orb degrees (e.g., orb 0.79°). Translate aspects into plain English (e.g., instead of Sol Opposition Venus, say Relational Tension).',
    'Tone: Direct, casual, highly competent, and actionable.',
    '',
    'ORERRY SYSTEM CONTEXT',
    `Layer: ${state.layer}`,
    `Current Sign: ${state.sign}`,
    `Active Aspects: ${aspectsLine}`,
    `Kybalion Rhythm Forecast: ${state.rhythmForecast}`,
    `Systemic Resonance: Ambient ${state.ambientFrequencyHz.toFixed(2)} Hz | Acoustic Countermeasure: ${state.acousticCountermeasure}`,
  ].join('\n')
}

export function GemiTerminal({ state }: GemiTerminalProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<GemiMessage[]>([
    {
      id: 'gemi-welcome',
      role: 'gemi',
      text: 'Terminal online. Telemetry synced. Awaiting operational parameters.',
    },
  ])

  const compiledPrompt = useMemo(() => generateSystemPrompt(state), [state])
  const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  const apiKey = rawApiKey?.trim()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const command = inputValue.trim()
    if (!command || isLoading) {
      return
    }

    const userMessage: GemiMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: command,
    }

    setMessages((previous) => [...previous, userMessage])
    setInputValue('')

    if (!apiKey || apiKey === 'your_api_key_here') {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-gemi-error`,
          role: 'gemi',
          text: 'ERR: API Key missing or invalid. Check .env.local',
        },
      ])
      return
    }

    setIsLoading(true)

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: compiledPrompt,
      })

      const result = await model.generateContent(command)
      const responseText = result.response.text().trim() || 'No response payload from model.'

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-gemi`,
          role: 'gemi',
          text: responseText,
        },
      ])
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message
          ? `ERR: Gemini request failed. ${error.message}`
          : 'ERR: Gemini request failed. Check API key, API enablement, and browser restrictions.'

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-gemi-error`,
          role: 'gemi',
          text: errorMessage,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={`gemi-terminal glass${collapsed ? ' collapsed' : ''}`}>
      <div className="gemi-terminal-header">
        <h3>Gemi Terminal</h3>
        <button className="hud-toggle" type="button" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="gemi-history" role="log" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`gemi-message ${message.role}`}>
                <span className="gemi-role">{message.role === 'gemi' ? 'GEMI' : 'USER'}</span>
                <div className="gemi-markdown">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading ? (
              <div className="gemi-message gemi gemi-typing">
                <span className="gemi-role">GEMI</span>
                <p className="gemi-markdown">Gemi is typing...</p>
              </div>
            ) : null}
          </div>

          <form className="gemi-input-row" onSubmit={handleSubmit}>
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Enter command for Gemi..."
              aria-label="Gemi command input"
              disabled={isLoading}
            />
            <button className="ghost-btn" type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>

          <p className="gemi-context-status">Context synced ({compiledPrompt.length} chars)</p>
        </>
      )}
    </section>
  )
}
