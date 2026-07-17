'use client'

import { useActionState, useMemo, useState } from 'react'
import Decimal from 'decimal.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EstadoFormularioRemesa } from '@/actions/remesas'

type PagoPendiente = {
  id: string
  monto: string
  moneda: 'CLP' | 'BOB' | 'USD'
  fecha_pago: string
  tramiteNumero: number
  empresa: string
}

type Accion = (estadoPrevio: EstadoFormularioRemesa, formData: FormData) => Promise<EstadoFormularioRemesa>

const hoy = () => new Date().toISOString().slice(0, 10)

export function FormularioRemesa({
  accion,
  pagosPorMoneda,
}: {
  accion: Accion
  pagosPorMoneda: Record<string, PagoPendiente[]>
}) {
  const [estado, ejecutarAccion, pendiente] = useActionState(accion, { error: null })
  const errores = estado.errores ?? {}

  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  const monedaSeleccionada = useMemo(() => {
    for (const [moneda, pagos] of Object.entries(pagosPorMoneda)) {
      if (pagos.some((p) => seleccionados.has(p.id))) return moneda
    }
    return null
  }, [seleccionados, pagosPorMoneda])

  const total = useMemo(() => {
    let acumulado = new Decimal(0)
    for (const pagos of Object.values(pagosPorMoneda)) {
      for (const p of pagos) {
        if (seleccionados.has(p.id)) acumulado = acumulado.plus(p.monto)
      }
    }
    return acumulado.toString()
  }, [seleccionados, pagosPorMoneda])

  function alternar(id: string) {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })
  }

  return (
    <form action={ejecutarAccion} className="flex flex-col gap-4">
      {Object.entries(pagosPorMoneda).map(([moneda, pagos]) => {
        const deshabilitadoPorMoneda = monedaSeleccionada !== null && monedaSeleccionada !== moneda
        return (
          <div key={moneda}>
            <p className="mb-2 text-sm font-medium">
              {moneda}
              {deshabilitadoPorMoneda && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (una remesa es de una sola moneda)
                </span>
              )}
            </p>
            <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {pagos.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm"
                  style={{ opacity: deshabilitadoPorMoneda ? 0.5 : 1 }}
                >
                  <input
                    type="checkbox"
                    name="pago_ids"
                    value={p.id}
                    checked={seleccionados.has(p.id)}
                    onChange={() => alternar(p.id)}
                    disabled={deshabilitadoPorMoneda}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    Trámite N° {p.tramiteNumero} · {p.empresa} · {p.fecha_pago}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{p.monto} {p.moneda}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
      {errores.pago_ids && <p className="text-sm text-destructive">{errores.pago_ids[0]}</p>}

      <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm font-medium">
        Total seleccionado: {total} {monedaSeleccionada ?? ''}
      </div>

      <div>
        <Label htmlFor="fecha_envio">Fecha de envío</Label>
        <Input id="fecha_envio" name="fecha_envio" type="date" defaultValue={hoy()} required />
        {errores.fecha_envio && <p className="mt-1 text-sm text-destructive">{errores.fecha_envio[0]}</p>}
      </div>

      <div>
        <Label htmlFor="notas">Notas</Label>
        <Input id="notas" name="notas" placeholder="Ej: transferencia, quién la lleva, referencia" />
      </div>

      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}

      <Button type="submit" disabled={pendiente || seleccionados.size === 0}>
        {pendiente ? 'Creando...' : 'Registrar envío'}
      </Button>
    </form>
  )
}
