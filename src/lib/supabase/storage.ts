import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'tramites-archivos'

// Sube un archivo al bucket privado y devuelve la ruta guardada en BD
// (no la URL pública — el bucket es privado, la URL firmada se genera al leer)
export async function subirArchivoTramite(
  supabase: SupabaseClient,
  carpeta: string,
  archivo: File
): Promise<string> {
  const extension = archivo.name.includes('.') ? archivo.name.split('.').pop() : undefined
  const nombreArchivo = `${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
  const ruta = `${carpeta}/${nombreArchivo}`

  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
    contentType: archivo.type || undefined,
  })

  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`)

  return ruta
}

export async function obtenerUrlFirmada(
  supabase: SupabaseClient,
  ruta: string,
  segundosExpiracion = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(ruta, segundosExpiracion)

  if (error) return null
  return data.signedUrl
}
