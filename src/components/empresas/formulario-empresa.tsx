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
import type { EstadoFormularioEmpresa } from '@/actions/empresas'

type Accion = (estadoPrevio: EstadoFormularioEmpresa, formData: FormData) => Promise<EstadoFormularioEmpresa>

type ValoresIniciales = {
  razon_social: string
  pais_domicilio: 'chile' | 'bolivia'
  identificador_fiscal: string
  direccion: string | null
  ciudad: string | null
  contacto_nombre: string | null
  telefono: string | null
  email: string | null
}

export function FormularioEmpresa({
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
    <form action={ejecutarAccion} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div>
        <Label htmlFor="razon_social">Razón social</Label>
        <Input id="razon_social" name="razon_social" defaultValue={valoresIniciales?.razon_social} required />
        {errores.razon_social && <p style={{ color: 'red', fontSize: 13 }}>{errores.razon_social[0]}</p>}
      </div>

      <div>
        <Label htmlFor="pais_domicilio">País de domicilio</Label>
        <Select name="pais_domicilio" defaultValue={valoresIniciales?.pais_domicilio ?? 'chile'}>
          <SelectTrigger id="pais_domicilio">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chile">Chile</SelectItem>
            <SelectItem value="bolivia">Bolivia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="identificador_fiscal">RUT (Chile) o NIT (Bolivia)</Label>
        <Input
          id="identificador_fiscal"
          name="identificador_fiscal"
          defaultValue={valoresIniciales?.identificador_fiscal}
          placeholder="12.345.678-9"
          required
        />
        {errores.identificador_fiscal && (
          <p style={{ color: 'red', fontSize: 13 }}>{errores.identificador_fiscal[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" defaultValue={valoresIniciales?.direccion ?? ''} />
      </div>

      <div>
        <Label htmlFor="ciudad">Ciudad</Label>
        <Input id="ciudad" name="ciudad" defaultValue={valoresIniciales?.ciudad ?? ''} />
      </div>

      <div>
        <Label htmlFor="contacto_nombre">Nombre de contacto</Label>
        <Input id="contacto_nombre" name="contacto_nombre" defaultValue={valoresIniciales?.contacto_nombre ?? ''} />
      </div>

      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" name="telefono" defaultValue={valoresIniciales?.telefono ?? ''} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={valoresIniciales?.email ?? ''} />
        {errores.email && <p style={{ color: 'red', fontSize: 13 }}>{errores.email[0]}</p>}
      </div>

      {estado.error && <p style={{ color: 'red' }}>{estado.error}</p>}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? 'Guardando...' : textoBoton}
      </Button>
    </form>
  )
}
