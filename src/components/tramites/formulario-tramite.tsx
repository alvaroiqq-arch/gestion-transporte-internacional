'use client'

import { useActionState, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { crearTramite } from '@/actions/tramites'

type Empresa = { id: string; razon_social: string }
type TipoTramite = { id: string; nombre: string; pais: 'chile' | 'bolivia'; precio: string; moneda: string; requiere_vehiculo: boolean }
type Vehiculo = { id: string; patente: string; empresa_id: string }

export function FormularioTramite({
  empresas,
  tipos,
  vehiculos,
}: {
  empresas: Empresa[]
  tipos: TipoTramite[]
  vehiculos: Vehiculo[]
}) {
  const [estado, ejecutarAccion, pendiente] = useActionState(crearTramite, { error: null })
  const errores = estado.errores ?? {}

  const [empresaId, setEmpresaId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [montoTotal, setMontoTotal] = useState('')

  const vehiculosDeLaEmpresa = useMemo(
    () => vehiculos.filter((v) => v.empresa_id === empresaId),
    [vehiculos, empresaId]
  )
  const tipoSeleccionado = tipos.find((t) => t.id === tipoId)

  const handleTipoChange = (nuevoTipoId: string) => {
    setTipoId(nuevoTipoId)
    const tipo = tipos.find((t) => t.id === nuevoTipoId)
    if (tipo) {
      setMontoTotal(tipo.precio)
    }
  }

  return (
    <form action={ejecutarAccion} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="empresa_id">Empresa cliente</Label>
        <Select name="empresa_id" value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger id="empresa_id">
            <SelectValue placeholder="Selecciona una empresa" />
          </SelectTrigger>
          <SelectContent>
            {empresas.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.razon_social}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errores.empresa_id && <p className="mt-1 text-sm text-destructive">{errores.empresa_id[0]}</p>}
      </div>

      <div>
        <Label htmlFor="tipo_tramite_id">Tipo de trámite</Label>
        <Select name="tipo_tramite_id" value={tipoId} onValueChange={handleTipoChange}>
          <SelectTrigger id="tipo_tramite_id">
            <SelectValue placeholder="Selecciona un tipo de trámite" />
          </SelectTrigger>
          <SelectContent>
            {tipos.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nombre} ({t.pais}, {t.precio} {t.moneda})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errores.tipo_tramite_id && <p className="mt-1 text-sm text-destructive">{errores.tipo_tramite_id[0]}</p>}
      </div>

      <div>
        <Label htmlFor="fecha_solicitud">Fecha de solicitud</Label>
        <Input id="fecha_solicitud" name="fecha_solicitud" type="date" required />
        {errores.fecha_solicitud && <p className="mt-1 text-sm text-destructive">{errores.fecha_solicitud[0]}</p>}
      </div>

      <div>
        <Label htmlFor="monto_total">
          Monto total {tipoSeleccionado && `(estándar: ${tipoSeleccionado.precio} ${tipoSeleccionado.moneda})`}
        </Label>
        <Input
          id="monto_total"
          name="monto_total"
          inputMode="decimal"
          placeholder="0"
          value={montoTotal}
          onChange={(e) => setMontoTotal(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Ajustá el monto si el cliente negoció un precio distinto.
        </p>
        {errores.monto_total && <p className="mt-1 text-sm text-destructive">{errores.monto_total[0]}</p>}
      </div>

      {empresaId && (
        <div>
          <Label>
            Vehículos {tipoSeleccionado?.requiere_vehiculo ? '(obligatorio al menos uno)' : '(opcional)'}
          </Label>
          {vehiculosDeLaEmpresa.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Esta empresa no tiene vehículos registrados.
            </p>
          )}
          {vehiculosDeLaEmpresa.map((v) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id={`vehiculo-${v.id}`} name="vehiculo_ids" value={v.id} />
              <Label htmlFor={`vehiculo-${v.id}`}>{v.patente}</Label>
            </div>
          ))}
          {errores.vehiculo_ids && <p className="mt-1 text-sm text-destructive">{errores.vehiculo_ids[0]}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="notas">Notas</Label>
        <Input id="notas" name="notas" />
      </div>

      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? 'Creando...' : 'Crear trámite'}
      </Button>
    </form>
  )
}
