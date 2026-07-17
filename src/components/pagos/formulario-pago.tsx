'use client'

import { useActionState, useEffect, useRef } from 'react'
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
import type { EstadoFormularioPago } from '@/actions/pagos'

type Accion = (estadoPrevio: EstadoFormularioPago, formData: FormData) => Promise<EstadoFormularioPago>
type Usuario = { id: string; nombre: string }

const hoy = () => new Date().toISOString().slice(0, 10)

export function FormularioPago({
  accion,
  usuarios,
  paisTramite,
}: {
  accion: Accion
  usuarios: Usuario[]
  paisTramite: 'chile' | 'bolivia'
}) {
  const [estado, ejecutarAccion, pendiente] = useActionState(accion, { error: null })
  const errores = estado.errores ?? {}
  const formRef = useRef<HTMLFormElement>(null)
  const primerRenderRef = useRef(true)

  useEffect(() => {
    if (primerRenderRef.current) {
      primerRenderRef.current = false
      return
    }
    if (!pendiente && estado.error === null) {
      formRef.current?.reset()
    }
  }, [estado, pendiente])

  return (
    <form ref={formRef} action={ejecutarAccion} className="flex flex-col gap-3">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8 }}>
        <div>
          <Label htmlFor="monto">Monto</Label>
          <Input id="monto" name="monto" inputMode="decimal" placeholder="0" required />
          {errores.monto && <p className="mt-1 text-sm text-destructive">{errores.monto[0]}</p>}
        </div>
        <div>
          <Label htmlFor="moneda">Moneda</Label>
          <Select name="moneda" defaultValue="CLP">
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
        <Label htmlFor="pais_recepcion">País donde se recibió el pago</Label>
        <Select name="pais_recepcion" defaultValue={paisTramite}>
          <SelectTrigger id="pais_recepcion">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chile">Chile</SelectItem>
            <SelectItem value="bolivia">Bolivia</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          Normalmente coincide con el país del trámite. Cambialo si el cliente pagó en el otro país.
        </p>
        {errores.pais_recepcion && (
          <p className="mt-1 text-sm text-destructive">{errores.pais_recepcion[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="metodo_pago">Método de pago</Label>
        <Select name="metodo_pago" defaultValue="efectivo">
          <SelectTrigger id="metodo_pago">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
            <SelectItem value="deposito">Depósito</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="responsable_cobro_id">Responsable de cobro</Label>
        <Select name="responsable_cobro_id">
          <SelectTrigger id="responsable_cobro_id">
            <SelectValue placeholder="¿Quién cobró?" />
          </SelectTrigger>
          <SelectContent>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errores.responsable_cobro_id && (
          <p className="mt-1 text-sm text-destructive">{errores.responsable_cobro_id[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="fecha_pago">Fecha de pago</Label>
        <Input id="fecha_pago" name="fecha_pago" type="date" defaultValue={hoy()} required />
        {errores.fecha_pago && <p className="mt-1 text-sm text-destructive">{errores.fecha_pago[0]}</p>}
      </div>

      <div>
        <Label htmlFor="comprobante">Comprobante (opcional)</Label>
        <Input id="comprobante" name="comprobante" type="file" />
      </div>

      <div>
        <Label htmlFor="notas">Notas</Label>
        <Input id="notas" name="notas" />
      </div>

      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? 'Registrando...' : 'Registrar pago'}
      </Button>
    </form>
  )
}
