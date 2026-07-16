import { Badge, type Tono } from '@/components/ui/badge'

// Traduce cada estado del dominio a etiqueta legible + tono de color.
// Se usa en los listados y en la ficha del trámite para mantener coherencia.

const tramite: Record<string, { texto: string; tono: Tono }> = {
  en_curso: { texto: 'En curso', tono: 'info' },
  pendiente_observado: { texto: 'Pendiente / observado', tono: 'advertencia' },
  concluido: { texto: 'Concluido', tono: 'exito' },
  anulado: { texto: 'Anulado', tono: 'peligro' },
}

const pago: Record<string, { texto: string; tono: Tono }> = {
  pendiente: { texto: 'Pendiente', tono: 'advertencia' },
  pagado: { texto: 'Pagado', tono: 'exito' },
  anulado: { texto: 'Anulado', tono: 'peligro' },
}

const vehiculo: Record<string, { texto: string; tono: Tono }> = {
  habilitado: { texto: 'Habilitado', tono: 'exito' },
  inhabilitado: { texto: 'Inhabilitado', tono: 'neutral' },
  suspendido: { texto: 'Suspendido', tono: 'advertencia' },
}

export function EstadoTramiteBadge({ estado }: { estado: string }) {
  const e = tramite[estado] ?? { texto: estado, tono: 'neutral' as const }
  return <Badge tono={e.tono}>{e.texto}</Badge>
}

export function EstadoPagoBadge({ estado }: { estado: string }) {
  const e = pago[estado] ?? { texto: estado, tono: 'neutral' as const }
  return <Badge tono={e.tono}>{e.texto}</Badge>
}

export function EstadoVehiculoBadge({ estado }: { estado: string }) {
  const e = vehiculo[estado] ?? { texto: estado, tono: 'neutral' as const }
  return <Badge tono={e.tono}>{e.texto}</Badge>
}

export function PaisBadge({ pais }: { pais: string }) {
  const texto = pais === 'chile' ? 'Chile' : pais === 'bolivia' ? 'Bolivia' : pais
  return <Badge tono="neutral">{texto}</Badge>
}

export function ActivoBadge({ activo, textoActivo = 'Activo', textoInactivo = 'Inactivo' }: {
  activo: boolean
  textoActivo?: string
  textoInactivo?: string
}) {
  return <Badge tono={activo ? 'exito' : 'neutral'}>{activo ? textoActivo : textoInactivo}</Badge>
}
