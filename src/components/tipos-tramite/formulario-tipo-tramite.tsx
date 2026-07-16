'use client'

import { useActionState } from 'react'
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
import type { EstadoFormularioTipoTramite } from '@/actions/tipos-tramite'

type Accion = (
  estadoPrevio: EstadoFormularioTipoTramite,
  formData: FormData
) => Promise<EstadoFormularioTipoTramite>

type ValoresIniciales = {
  nombre: string
  pais: 'chile' | 'bolivia'
  descripcion: string | null
  precio: string
  moneda: 'CLP' | 'BOB' | 'USD'
  vigencia_meses: number | null
  requiere_vehiculo: boolean
}

export function FormularioTipoTramite({
  accion,
  valoresIniciales,
  textoBoton,
}: {
  accion: Accion
  valoresIniciales?: ValoresIniciales
  textoBoton: string
}) {
  const [estado, ejecutarAccion, pendiente] = useActionState(accion, { error: null })
  const errores = estado.errores ?? {}

  return (
    <form action={ejecutarAccion} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="nombre">Nombre del trámite</Label>
        <Input id="nombre" name="nombre" defaultValue={valoresIniciales?.nombre} required />
        {errores.nombre && <p className="mt-1 text-sm text-destructive">{errores.nombre[0]}</p>}
      </div>

      <div>
        <Label htmlFor="pais">País</Label>
        <Select name="pais" defaultValue={valoresIniciales?.pais ?? 'chile'}>
          <SelectTrigger id="pais">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chile">Chile</SelectItem>
            <SelectItem value="bolivia">Bolivia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Input id="descripcion" name="descripcion" defaultValue={valoresIniciales?.descripcion ?? ''} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Label htmlFor="precio">Precio</Label>
          <Input
            id="precio"
            name="precio"
            type="number"
            step="0.01"
            defaultValue={valoresIniciales?.precio}
            required
          />
          {errores.precio && <p className="mt-1 text-sm text-destructive">{errores.precio[0]}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <Label htmlFor="moneda">Moneda</Label>
          <Select name="moneda" defaultValue={valoresIniciales?.moneda ?? 'CLP'}>
            <SelectTrigger id="moneda">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLP">CLP</SelectItem>
              <SelectItem value="BOB">BOB</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="vigencia_meses">Vigencia del permiso (meses)</Label>
        <Input
          id="vigencia_meses"
          name="vigencia_meses"
          type="number"
          defaultValue={valoresIniciales?.vigencia_meses ?? ''}
          placeholder="Deja vacío si no aplica"
        />
        {errores.vigencia_meses && <p className="mt-1 text-sm text-destructive">{errores.vigencia_meses[0]}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          id="requiere_vehiculo"
          name="requiere_vehiculo"
          type="checkbox"
          defaultChecked={valoresIniciales?.requiere_vehiculo ?? true}
        />
        <Label htmlFor="requiere_vehiculo">Requiere seleccionar un vehículo</Label>
      </div>

      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? 'Guardando...' : textoBoton}
      </Button>
    </form>
  )
}
