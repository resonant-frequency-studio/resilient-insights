import 'server-only'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID
const ELEVENLABS_MODEL_ID =
  process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'

if (!ELEVENLABS_API_KEY) {
  throw new Error('ELEVENLABS_API_KEY environment variable is required')
}

if (!ELEVENLABS_VOICE_ID) {
  throw new Error('ELEVENLABS_VOICE_ID environment variable is required')
}

/**
 * Fetches a streaming audio response from ElevenLabs TTS API
 * Returns the raw Response object for streaming
 */
export async function fetchSpeechStream(text: string): Promise<Response> {
  const charCount = text.length

  // Safe logging - only character count, never full text or API keys
  console.log(`[TTS] Requesting speech for ${charCount} characters`)

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    console.error(
      `[TTS] ElevenLabs API error (${response.status}): ${errorText.substring(0, 100)}`
    )
    throw new Error(
      `ElevenLabs API error: ${response.status} ${response.statusText}`
    )
  }

  return response
}
