import { addMonths, format } from 'date-fns'

// Calcula fecha_vigencia_hasta a partir de fecha_vigencia_desde + vigencia_meses
// del tipo de trámite. Si el mes resultante tiene menos días que el de origen
// (ej. 31 de enero + 1 mes), date-fns ajusta al último día de ese mes.
export function calcularFechaVigenciaHasta(fechaDesde: string, vigenciaMeses: number): string {
  const [anio, mes, dia] = fechaDesde.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return format(addMonths(fecha, vigenciaMeses), 'yyyy-MM-dd')
}
