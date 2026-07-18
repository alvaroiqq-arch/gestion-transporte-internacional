'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vehiculos, empresas_cliente } from '@/lib/db/schema'
import { crearClienteServidor } from '@/lib/supabase/server'
import { extraerTextoPdf } from '@/lib/pdf/extraer-texto'
import { parsearCertificadoRvm } from '@/lib/pdf/certificado-rvm'
import { extraerVehiculoConIA } from '@/lib/pdf/ocr-certificado-rvm'
import { normalizarPatente } from '@/lib/validaciones/patente'
import { normalizarRut } from '@/lib/validaciones/rut'

const MAX_ARCHIVOS = 100

export type FilaImportacion = {
  archivo: string
  patente: string | null
  clase: string | null // clase del certificado (ej. CAMION, REMOLQUE)
  marca: string | null
  modelo: string | null
  anio: number | null
  notas: string
  propietarioNombre: string | null
  propietarioRut: string | null
  empresaId: string | null // empresa vinculada por coincidencia de RUT del propietario
  empresaNombre: string | null
  yaExiste: boolean
  error: string | null
}

async function obtenerUsuarioActualId(): Promise<string | null> {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const usuario = await db.query.usuarios.findFirst({
    where: (usuarios, { eq }) => eq(usuarios.supabase_auth_id, user.id),
  })
  return usuario?.id ?? null
}

// Fase 1: lee los PDF, extrae y parsea cada uno. No escribe en la base.
export async function analizarPdfsVehiculos(
  formData: FormData
): Promise<{ filas: FilaImportacion[]; error: string | null }> {
  const archivos = formData
    .getAll('archivos')
    .filter((a): a is File => a instanceof File && a.size > 0)

  if (archivos.length === 0) {
    return { filas: [], error: 'Selecciona al menos un PDF.' }
  }
  if (archivos.length > MAX_ARCHIVOS) {
    return { filas: [], error: `Máximo ${MAX_ARCHIVOS} archivos por importación.` }
  }

  const filas: FilaImportacion[] = []

  for (const archivo of archivos) {
    try {
      const datos = new Uint8Array(await archivo.arrayBuffer())
      const texto = await extraerTextoPdf(datos)
      let v = parsearCertificadoRvm(texto)
      // Si no se pudo interpretar por texto (ej. certificado escaneado o
      // fotografiado, sin texto embebido), probar leyendo el PDF con IA
      if (v.error) {
        v = await extraerVehiculoConIA(datos).catch(() => v)
      }
      filas.push({
        archivo: archivo.name,
        patente: v.patente,
        clase: v.clase,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        notas: v.notas,
        propietarioNombre: v.propietarioNombre,
        propietarioRut: v.propietarioRut,
        empresaId: null,
        empresaNombre: null,
        yaExiste: false,
        error: v.error,
      })
    } catch {
      filas.push({
        archivo: archivo.name,
        patente: null,
        clase: null,
        marca: null,
        modelo: null,
        anio: null,
        notas: '',
        propietarioNombre: null,
        propietarioRut: null,
        empresaId: null,
        empresaNombre: null,
        yaExiste: false,
        error: 'No se pudo leer el PDF (¿está dañado o es una imagen?)',
      })
    }
  }

  // Vincula cada vehículo a la empresa cuyo identificador fiscal coincide con
  // el RUT del propietario del certificado.
  const rutsNormalizados = Array.from(
    new Set(filas.filter((f) => f.propietarioRut).map((f) => normalizarRut(f.propietarioRut!)))
  )
  if (rutsNormalizados.length > 0) {
    const empresas = await db
      .select({ id: empresas_cliente.id, razon_social: empresas_cliente.razon_social, rut: empresas_cliente.identificador_fiscal })
      .from(empresas_cliente)
      .where(inArray(empresas_cliente.identificador_fiscal, rutsNormalizados))
    const porRut = new Map(empresas.map((e) => [e.rut, e]))
    for (const f of filas) {
      if (!f.propietarioRut) continue
      const emp = porRut.get(normalizarRut(f.propietarioRut))
      if (emp) {
        f.empresaId = emp.id
        f.empresaNombre = emp.razon_social
      }
    }
  }

  // Marca las patentes que ya existen en el sistema (matrícula Chile)
  const patentes = filas
    .filter((f) => f.patente)
    .map((f) => normalizarPatente(f.patente!))
  if (patentes.length > 0) {
    const existentes = await db
      .select({ patente: vehiculos.patente })
      .from(vehiculos)
      .where(and(eq(vehiculos.pais_matricula, 'chile'), inArray(vehiculos.patente, patentes)))
    const setExistentes = new Set(existentes.map((e) => e.patente))
    for (const f of filas) {
      if (f.patente && setExistentes.has(normalizarPatente(f.patente))) f.yaExiste = true
    }
  }

  return { filas, error: null }
}

const esquemaFila = z.object({
  patente: z.string().trim().min(4, 'Patente inválida'),
  empresaId: z.string().uuid('Cada vehículo debe quedar vinculado a una empresa'),
  clase: z.string().trim().min(1, 'Indicá la clase del vehículo'),
  marca: z.string().trim().optional().nullable(),
  modelo: z.string().trim().optional().nullable(),
  anio: z.number().int().min(1950).max(2100).nullable(),
  notas: z.string().optional().nullable(),
})

const esquemaImportar = z.object({
  filas: z.array(esquemaFila).min(1, 'No hay vehículos para cargar'),
})

// Fase 2: inserta los vehículos confirmados, cada uno a su empresa vinculada.
export async function importarVehiculos(input: {
  filas: Array<{
    patente: string
    empresaId: string
    clase: string
    marca: string | null
    modelo: string | null
    anio: number | null
    notas: string | null
  }>
}): Promise<{ error: string | null; creados: number; omitidos: number }> {
  const parsed = esquemaImportar.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los datos: ' + parsed.error.issues[0]?.message, creados: 0, omitidos: 0 }
  }
  const { filas } = parsed.data

  // Valida que las empresas referenciadas existan
  const empresaIds = Array.from(new Set(filas.map((f) => f.empresaId)))
  const empresasOk = await db
    .select({ id: empresas_cliente.id })
    .from(empresas_cliente)
    .where(inArray(empresas_cliente.id, empresaIds))
  const setEmpresas = new Set(empresasOk.map((e) => e.id))

  const creadoPorId = await obtenerUsuarioActualId()

  // Normaliza patente, descarta empresas inexistentes y duplicados del lote
  const vistas = new Set<string>()
  const unicas = filas
    .map((f) => ({ ...f, patente: normalizarPatente(f.patente) }))
    .filter((f) => setEmpresas.has(f.empresaId))
    .filter((f) => {
      if (vistas.has(f.patente)) return false
      vistas.add(f.patente)
      return true
    })

  // Descarta las que ya existen en el sistema (matrícula Chile)
  let setExistentes = new Set<string>()
  if (unicas.length > 0) {
    const existentes = await db
      .select({ patente: vehiculos.patente })
      .from(vehiculos)
      .where(
        and(
          eq(vehiculos.pais_matricula, 'chile'),
          inArray(vehiculos.patente, unicas.map((f) => f.patente))
        )
      )
    setExistentes = new Set(existentes.map((e) => e.patente))
  }
  const aInsertar = unicas.filter((f) => !setExistentes.has(f.patente))

  if (aInsertar.length > 0) {
    await db.insert(vehiculos).values(
      aInsertar.map((f) => ({
        empresa_id: f.empresaId,
        patente: f.patente,
        pais_matricula: 'chile' as const,
        tipo_vehiculo: f.clase,
        marca: f.marca || null,
        modelo: f.modelo || null,
        anio: f.anio ?? null,
        notas: f.notas || null,
        created_by: creadoPorId,
      }))
    )
  }

  revalidatePath('/vehiculos')
  return {
    error: null,
    creados: aInsertar.length,
    omitidos: filas.length - aInsertar.length,
  }
}
