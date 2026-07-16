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

  const vehiculosDeLaEmpresa = useMemo(
    () => vehiculos.filter((v) => v.empresa_id === empresaId),
    [vehiculos, empresaId]
  )
  const tipoSeleccionado = tipos.find((t) => t.id === tipoId)

  return (
    <form action={ejecutarAccion} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
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
        {errores.empresa_id && <p style={{ color: 'red', fontSize: 13 }}>{errores.empresa_id[0]}</p>}
      </div>

      <div>
        <Label htmlFor="tipo_tramite_id">Tipo de trámite</Label>
        <Select name="tipo_tramite_id" value={tipoId} onValueChange={setTipoId}>
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
        {errores.tipo_tramite_id && <p style={{ color: 'red', fontSize: 13 }}>{errores.tipo_tramite_id[0]}</p>}
      </div>

      <div>
        <Label htmlFor="fecha_solicitud">Fecha de solicitud</Label>
        <Input id="fecha_solicitud" name="fecha_solicitud" type="date" required />
        {errores.fecha_solicitud && <p style={{ color: 'red', fontSize: 13 }}>{errores.fecha_solicitud[0]}</p>}
      </div>

      {empresaId && (
        <div>
          <Label>
            Vehículos {tipoSeleccionado?.requiere_vehiculo ? '(obligatorio al menos uno)' : '(opcional)'}
          </Label>
          {vehiculosDeLaEmpresa.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted, #888)' }}>
              Esta empresa no tiene vehículos registrados.
            </p>
          )}
          {vehiculosDeLaEmpresa.map((v) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id={`vehiculo-${v.id}`} name="vehiculo_ids" value={v.id} />
              <Label htmlFor={`vehiculo-${v.id}`}>{v.patente}</Label>
            </div>
          ))}
          {errores.vehiculo_ids && <p style={{ color: 'red', fontSize: 13 }}>{errores.vehiculo_ids[0]}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="notas">Notas</Label>
        <Input id="notas" name="notas" />
      </div>

      {estado.error && <p style={{ color: 'red' }}>{estado.error}</p>}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? 'Creando...' : 'Crear trámite'}
      </Button>
    </form>
  )
}
