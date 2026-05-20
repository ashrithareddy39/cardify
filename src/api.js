import axios from 'axios'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const client = axios.create({
  baseURL: 'https://api.groq.com/openai/v1',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  }
})

const prompt = `You are a study assistant. Generate exactly 20 flashcards from the content provided.
Return ONLY a valid JSON array, no explanation, no markdown, just raw JSON like this:
[
  { "question": "...", "answer": "..." }
]`

export async function generateFlashcards(text) {
  const response = await client.post('/chat/completions', {
    model: 'llama-3.3-70b-versatile',
    max_tokens: 3000,
    messages: [
      { 
        role: 'system',
        content: prompt
      },
      {
        role: 'user',
        content: `Notes:\n${text}`
      }
    ]
  })

  const raw = response.data.choices[0].message.content
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

export async function extractTextFromPDF(base64PDF) {
  const binaryString = atob(base64PDF)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }

  return fullText
}

export async function generateFlashcardsFromPDF(base64PDF) {
  const pdfText = await extractTextFromPDF(base64PDF)

  const trimmedText = pdfText.slice(0, 5000)

  const response = await client.post('/chat/completions', {
    model: 'llama-3.3-70b-versatile',
    max_tokens: 3000,
    messages: [
      {
        role: 'system',
        content: prompt
      },
      {
        role: 'user',
        content: `PDF Content:\n${trimmedText}`
      }
    ]
  })

  const raw = response.data.choices[0].message.content
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}