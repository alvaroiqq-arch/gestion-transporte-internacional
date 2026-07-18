// Respaldo con IA para Certificados de Inscripción del R.V.M. que son
// escaneos/fotos (sin texto embebido) — el extractor de texto (extraer-texto.ts
// + certificado-rvm.ts) no puede leer imágenes, solo texto ya digital.
// Usa el soporte nativo de PDF de Claude (lee tanto texto como imagen).

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { VehiculoExtraido } from './certificado-rvm'

const client = new Anthropic()

const esquemaVehiculoIA = z.object({
  patente: z.string().nullable().describe(
    'Número de Inscripción / patente del vehículo, sin el dígito verificador final (ej: "JFZW.52" a partir de "JFZW.52-4")'
  ),
  clase: z.string().nullable().describe(
    'Tipo de vehículo tal cual aparece en el certificado (ej: CAMION, REMOLQUE, TRACTOCAMION, SEMIREMOLQUE), en mayúsculas'
  ),
  marca: z.string().nullable(),
  modelo: z.string().nullable(),
  anio: z.number().int().nullable(),
  folio: z.string().nullable().describe('Número de folio del Servicio de Registro Civil e Identificación'),
  propietarioNombre: z.string().nullable().describe(
    'Nombre del propietario ACTUAL del vehículo — no de propietarios anteriores'
  ),
  propietarioRut: z.string().nullable().describe('RUT del propietario actual, formato "76.543.615-K"'),
  motor: z.string().nullable(),
  chasis: z.string().nullable(),
  color: z.string().nullable(),
})

export async function extraerVehiculoConIA(datosPdf: Uint8Array): Promise<VehiculoExtraido> {
  const base64 = Buffer.from(datosPdf).toString('base64')

  const respuesta = await client.messages.parse({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          {
            type: 'text',
            text: 'Este es un Certificado de Inscripción y Anotaciones Vigentes en el R.V.M. del Registro Civil de Chile (puede ser un escaneo o foto). Extraé los datos del vehículo y de su propietario ACTUAL (no de propietarios anteriores). Si algún dato no aparece en el documento, dejalo en null.',
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(esquemaVehiculoIA) },
  })

  const d = respuesta.parsed_output
  if (!d) {
    return {
      patente: null,
      clase: null,
      marca: null,
      modelo: null,
      anio: null,
      folio: null,
      propietarioNombre: null,
      propietarioRut: null,
      notas: '',
      error: 'No se pudo interpretar el documento (posible escaneo de baja calidad).',
    }
  }

  const respaldo: string[] = []
  if (d.motor) respaldo.push(`Motor: ${d.motor}`)
  if (d.chasis) respaldo.push(`Chasis: ${d.chasis}`)
  if (d.color) respaldo.push(`Color: ${d.color}`)
  if (d.folio) respaldo.push(`Folio SRCeI: ${d.folio}`)

  return {
    patente: d.patente ? d.patente.toUpperCase() : null,
    clase: d.clase ? d.clase.toUpperCase() : null,
    marca: d.marca,
    modelo: d.modelo,
    anio: d.anio,
    folio: d.folio,
    propietarioNombre: d.propietarioNombre,
    propietarioRut: d.propietarioRut ? d.propietarioRut.toUpperCase() : null,
    notas: respaldo.join(' · '),
    error: d.patente ? null : 'No se encontró la patente (Inscripción) en el documento (leído con IA)',
  }
}
