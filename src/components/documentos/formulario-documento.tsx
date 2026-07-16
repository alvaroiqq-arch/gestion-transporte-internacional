'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EstadoFormularioDocumento } from '@/actions/documentos'

type Accion = (estadoPrevio: EstadoFormularioDocumento, formData: FormData) => Promise<EstadoFormularioDocumento>

const hoy = () => new Date().toISOString().slice(0, 10)

const sugerenciasTipoDocumento = ['Permiso', 'Comprobante de pago', 'Formulario de solicitud', 'Resolución', 'Oficio']

export function FormularioDocumento({ accion }: { accion: Accion }) {
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
    <form ref={formRef} action={ejecutarAccion} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
      <div>
        <Label htmlFor="tipo_documento">Tipo de documento</Label>
        <Input id="tipo_documento" name="tipo_documento" list="sugerencias-tipo-documento" required />
        <datalist id="sugerencias-tipo-documento">
          {sugerenciasTipoDocumento.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        {errores.tipo_documento && <p style={{ color: 'red', fontSize: 13 }}>{errores.tipo_documento[0]}</p>}
      </div>

      <div>
        <Label htmlFor="fecha_emision">Fecha de emisión</Label>
        <Input id="fecha_emision" name="fecha_emision" type="date" defaultValue={hoy()} required />
        {errores.fecha_emision && <p style={{ color: 'red', fontSize: 13 }}>{errores.fecha_emision[0]}</p>}
      </div>

      <div>
        <Label htmlFor="archivo">Archivo</Label>
        <Input id="archivo" name="archivo" type="file" required />
        {errores.archivo && <p style={{ color: 'red', fontSize: 13 }}>{errores.archivo[0]}</p>}
      </div>

      <div>
        <Label htmlFor="notas">Notas</Label>
        <Input id="notas" name="notas" />
      </div>

      {estado.error && <p style={{ color: 'red' }}>{estado.error}</p>}

      <Button type="submit" disabled={pendiente}>
        {pendiente ? 'Subiendo...' : 'Agregar documento'}
      </Button>
    </form>
  )
}
