'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EstadoFormularioSeguimiento } from '@/actions/tramites'

type Accion = (
  estadoPrevio: EstadoFormularioSeguimiento,
  formData: FormData
) => Promise<EstadoFormularioSeguimiento>

type ValoresIniciales = {
  referencia_doc_inicial: string | null
  fecha_plazo: string | null
  referencia_doc_respaldo: string | null
  fecha_aprobacion: string | null
  fecha_vigencia_desde: string | null
  fecha_vigencia_hasta: string | null
}

export function FormularioSeguimiento({
  accion,
  valoresIniciales,
  tieneVigenciaAutomatica,
}: {
  accion: Accion
  valoresIniciales: ValoresIniciales
  tieneVigenciaAutomatica: boolean
}) {
  const [estado, ejecutarAccion, pendiente] = useActionState(accion, { error: null })
  const errores = estado.errores ?? {}

  return (
    <form action={ejecutarAccion} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="referencia_doc_inicial">Referencia documento inicial (FAX/REX)</Label>
        <Input
          id="referencia_doc_inicial"
          name="referencia_doc_inicial"
          defaultValue={valoresIniciales.referencia_doc_inicial ?? ''}
          placeholder="FAX 465/2026"
        />
      </div>

      <div>
        <Label htmlFor="fecha_plazo">Plazo de respuesta</Label>
        <Input
          id="fecha_plazo"
          name="fecha_plazo"
          type="date"
          defaultValue={valoresIniciales.fecha_plazo ?? ''}
        />
        {errores.fecha_plazo && <p className="mt-1 text-sm text-destructive">{errores.fecha_plazo[0]}</p>}
      </div>

      <div>
        <Label htmlFor="fecha_aprobacion">Fecha de aprobación</Label>
        <Input
          id="fecha_aprobacion"
          name="fecha_aprobacion"
          type="date"
          defaultValue={valoresIniciales.fecha_aprobacion ?? ''}
        />
        {errores.fecha_aprobacion && <p className="mt-1 text-sm text-destructive">{errores.fecha_aprobacion[0]}</p>}
      </div>

      <div>
        <Label htmlFor="referencia_doc_respaldo">Referencia documento de respaldo (RA/Reporte)</Label>
        <Input
          id="referencia_doc_respaldo"
          name="referencia_doc_respaldo"
          defaultValue={valoresIniciales.referencia_doc_respaldo ?? ''}
          placeholder="RA 0589"
        />
      </div>

      <div>
        <Label htmlFor="fecha_vigencia_desde">Vigencia desde</Label>
        <Input
          id="fecha_vigencia_desde"
          name="fecha_vigencia_desde"
          type="date"
          defaultValue={valoresIniciales.fecha_vigencia_desde ?? ''}
        />
      </div>

      <div>
        <Label htmlFor="fecha_vigencia_hasta">Vigencia hasta</Label>
        <Input
          id="fecha_vigencia_hasta"
          name="fecha_vigencia_hasta"
          type="date"
          defaultValue={valoresIniciales.fecha_vigencia_hasta ?? ''}
        />
        {tieneVigenciaAutomatica && (
          <p className="text-sm text-muted-foreground">
            Si la dejas vacía, se calcula sola a partir de la vigencia del tipo de trámite.
          </p>
        )}
        {errores.fecha_vigencia_hasta && (
          <p className="mt-1 text-sm text-destructive">{errores.fecha_vigencia_hasta[0]}</p>
        )}
      </div>

      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? 'Guardando...' : 'Guardar datos de seguimiento'}
      </Button>
    </form>
  )
}
