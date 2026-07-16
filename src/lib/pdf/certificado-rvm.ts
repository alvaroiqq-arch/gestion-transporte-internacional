// Parser del "Certificado de Inscripción y Anotaciones Vigentes en el R.V.M."
// del Servicio de Registro Civil e Identificación (Chile).
// Recibe el texto plano ya extraído del PDF y devuelve los datos del vehículo.
// Es una función pura (texto → datos) para poder testearla sin depender del PDF.

export type VehiculoExtraido = {
  patente: string | null
  clase: string | null // clase tal cual el certificado (ej. "CAMION", "REMOLQUE", "TRACTOCAMION")
  marca: string | null
  modelo: string | null
  anio: number | null
  folio: string | null
  propietarioNombre: string | null // nombre del propietario actual del vehículo
  propietarioRut: string | null // RUT del propietario (ej. "76.543.615-K"), para vincular a la empresa
  notas: string // respaldo: motor, chasis, color, combustible, PBV
  error: string | null // motivo si no se pudo interpretar (ej. sin patente)
}

function buscar(texto: string, patron: RegExp): string | null {
  const m = texto.match(patron)
  return m ? m[1].replace(/\s+/g, ' ').trim() : null
}

export function parsearCertificadoRvm(textoCrudo: string): VehiculoExtraido {
  const texto = textoCrudo.replace(/\s+/g, ' ').trim()

  // Inscripción: "JFZW.52-4" o "JE.3332-5" → patente sin dígito verificador final
  const mInscripcion = texto.match(/Inscripci[óo]n\s*:\s*([A-ZÑ]+\.?\d+)\s*-\s*[0-9K]/i)
  const patente = mInscripcion ? mInscripcion[1].toUpperCase() : null

  // Clase + Año van en la misma línea: "Tipo Vehículo : CAMION Año : 2005"
  const mTipoAnio = texto.match(/Tipo\s+Veh[ií]culo\s*:\s*(.+?)\s+A[ñn]o\s*:\s*(\d{4})/i)
  const clase = mTipoAnio ? mTipoAnio[1].replace(/\s+/g, ' ').trim().toUpperCase() : null
  const anio = mTipoAnio ? Number(mTipoAnio[2]) : null

  const marca = buscar(texto, /Marca\s*:\s*(.+?)\s+Modelo\s*:/i)
  const modelo = buscar(texto, /Modelo\s*:\s*(.+?)\s+Nro\.\s*(?:Motor|Chasis)\s*:/i)

  // Campos de respaldo (opcionales) para guardar en notas
  const motor = buscar(texto, /Nro\.\s*Motor\s*:\s*(.+?)\s+Nro\.\s*Chasis\s*:/i)
  const chasis = buscar(texto, /Nro\.\s*Chasis\s*:\s*(.+?)\s+Color\s*:/i)
  const color = buscar(texto, /Color\s*:\s*(.+?)\s+Combustible\s*:/i)
  const combustible = buscar(texto, /Combustible\s*:\s*(.+?)\s+PBV\s*:/i)
  const pbv = buscar(texto, /PBV\s*:\s*(.+?)\s+(?:Instit\.|DATOS DEL PROPIETARIO|NO REGISTRA)/i)
  const folio = buscar(texto, /FOLIO\s*:\s*(\d+)/i)

  // Propietario actual: anclado a "DATOS DEL PROPIETARIO" para no tomar
  // los "DATOS DE PROPIETARIOS ANTERIORES" (que traen R.U.N. de personas).
  // El RUT (ej. "76.543.615-K") se usa para vincular el vehículo a su empresa.
  const mProp = texto.match(
    /DATOS DEL PROPIETARIO\s+Nombre\s*:\s*(.+?)\s+R\.U\.[TN]\.\s*:\s*([0-9.\-Kk]+)\s+Fec/i
  )
  const propietarioNombre = mProp ? mProp[1].replace(/\s+/g, ' ').trim() : null
  const propietarioRut = mProp ? mProp[2].toUpperCase() : null

  const respaldo: string[] = []
  if (motor) respaldo.push(`Motor: ${motor}`)
  if (chasis) respaldo.push(`Chasis: ${chasis}`)
  if (color) respaldo.push(`Color: ${color}`)
  if (combustible && combustible !== '(NO INFORMADO)') respaldo.push(`Combustible: ${combustible}`)
  if (pbv && pbv !== '(NO INFORMADO)') respaldo.push(`PBV: ${pbv}`)
  if (folio) respaldo.push(`Folio SRCeI: ${folio}`)

  const error = !patente
    ? 'No se encontró la patente (Inscripción) en el documento'
    : null

  return {
    patente,
    clase,
    marca,
    modelo,
    anio,
    folio,
    propietarioNombre,
    propietarioRut,
    notas: respaldo.join(' · '),
    error,
  }
}
