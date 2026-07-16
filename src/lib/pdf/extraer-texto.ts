import { extractText, getDocumentProxy } from 'unpdf'

// Extrae el texto plano de un PDF (todas las páginas concatenadas).
// unpdf usa una build de pdf.js apta para serverless (Vercel), sin binarios nativos.
export async function extraerTextoPdf(datos: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(datos)
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}
