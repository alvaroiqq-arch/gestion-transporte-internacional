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
import type { EstadoFormularioVehiculo } from '@/actions/vehiculos'

type Accion = (estadoPrevio: EstadoFormularioVehiculo, formData: FormData) => Promise<EstadoFormularioVehiculo>

type Empresa = { id: string; razon_social: string }

type ValoresIniciales = {
  empresa_id: string
  patente: string
  pais_matricula: 'chile' | 'bolivia'
  tipo_vehiculo: string
  marca: string | null
  modelo: string | null
  anio: number | null
  fecha_habilitacion: string | null
  fecha_vencimiento_habilitacion: string | null
  notas: string | null
}

export function FormularioVehiculo({
  accion,
  empresas,
  valoresIniciales,
  textoBoton,
}: {
  accion: Accion
  empresas: Empresa[]
  valoresIniciales?: ValoresIniciales
  textoBoton: string
}) {
  const [estado, ejecutarAccion, pendiente] = useActionState(accion, { error: null })
  const errores = estado.errores ?? {}

  return (
    <form action={ejecutarAccion} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="empresa_id">Empresa cliente</Label>
        <Select name="empresa_id" defaultValue={valoresIniciales?.empresa_id}>
          <SelectTrigger id="empresa_id">
            <SelectValue placeholder="Selecciona una empresa" />
          </SelectTrigger>
          <SelectContent>
            {empresas.map((empresa) => (
              <SelectItem key={empresa.id} value={empresa.id}>
                {empresa.razon_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errores.empresa_id && <p className="mt-1 text-sm text-destructive">{errores.empresa_id[0]}</p>}
      </div>

      <div>
        <Label htmlFor="patente">Patente</Label>
        <Input id="patente" name="patente" defaultValue={valoresIniciales?.patente} required />
        {errores.patente && <p className="mt-1 text-sm text-destructive">{errores.patente[0]}</p>}
      </div>

      <div>
        <Label htmlFor="pais_matricula">País de matrícula</Label>
        <Select name="pais_matricula" defaultValue={valoresIniciales?.pais_matricula ?? 'chile'}>
          <SelectTrigger id="pais_matricula">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chile">Chile</SelectItem>
            <SelectItem value="bolivia">Bolivia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="tipo_vehiculo">Clase de vehículo</Label>
        <Input
          id="tipo_vehiculo"
          name="tipo_vehiculo"
          list="clases-vehiculo"
          placeholder="CAMION, REMOLQUE, TRACTOCAMION…"
          defaultValue={valoresIniciales?.tipo_vehiculo ?? ''}
          required
        />
        <datalist id="clases-vehiculo">
          {['CAMION', 'CAMIONETA', 'TRACTOCAMION', 'REMOLQUE', 'SEMIREMOLQUE', 'FURGON', 'BUS', 'MINIBUS', 'TAXIBUS', 'AUTOMOVIL', 'STATION WAGON'].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {errores.tipo_vehiculo && <p className="mt-1 text-sm text-destructive">{errores.tipo_vehiculo[0]}</p>}
      </div>

      <div>
        <Label htmlFor="marca">Marca</Label>
        <Input id="marca" name="marca" defaultValue={valoresIniciales?.marca ?? ''} />
      </div>

      <div>
        <Label htmlFor="modelo">Modelo</Label>
        <Input id="modelo" name="modelo" defaultValue={valoresIniciales?.modelo ?? ''} />
      </div>

      <div>
        <Label htmlFor="anio">Año</Label>
        <Input id="anio" name="anio" type="number" defaultValue={valoresIniciales?.anio ?? ''} />
        {errores.anio && <p className="mt-1 text-sm text-destructive">{errores.anio[0]}</p>}
      </div>

      <div>
        <Label htmlFor="fecha_habilitacion">Fecha de habilitación</Label>
        <Input
          id="fecha_habilitacion"
          name="fecha_habilitacion"
          type="date"
          defaultValue={valoresIniciales?.fecha_habilitacion ?? ''}
        />
      </div>

      <div>
        <Label htmlFor="fecha_vencimiento_habilitacion">Vencimiento de la habilitación</Label>
        <Input
          id="fecha_vencimiento_habilitacion"
          name="fecha_vencimiento_habilitacion"
          type="date"
          defaultValue={valoresIniciales?.fecha_vencimiento_habilitacion ?? ''}
        />
      </div>

      <div>
        <Label htmlFor="notas">Notas</Label>
        <Input id="notas" name="notas" defaultValue={valoresIniciales?.notas ?? ''} />
      </div>

      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? 'Guardando...' : textoBoton}
      </Button>
    </form>
  )
}
