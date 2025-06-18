import OpenAI from 'openai'

// Skip validation during build time
if (!process.env.OPENAI_API_KEY) {
  if (process.env.NODE_ENV === 'production' && !process.env.CI) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  console.warn('OpenAI API key not set - using dummy value for build')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-openai-api-key',
})

export async function generateVideoScript(prompt: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative AI assistant that generates engaging video scripts for social media content. Create scripts that are concise, attention-grabbing, and suitable for short-form video content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || null
  } catch (error) {
    console.error('Error generating video script:', error)
    throw error
  }
}

export async function generateVideoTitle(content: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate catchy, engaging titles for social media videos. Keep them concise and attention-grabbing."
        },
        {
          role: "user",
          content: `Generate a title for this video content: ${content}`
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
    })

    return completion.choices[0]?.message?.content || null
  } catch (error) {
    console.error('Error generating video title:', error)
    throw error
  }
}