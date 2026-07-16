import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tipos_tramite } from '@/lib/db/schema'
import { FormularioTipoTramite } from '@/components/tipos-tramite/formulario-tipo-tramite'
import { FormShell } from '@/components/layout/form-shell'
import { actualizarTipoTramite } from '@/actions/tipos-tramite'

export default async function PaginaEditarTipoTramite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const tipo = await db.query.tipos_tramite.findFirst({ where: eq(tipos_tramite.id, id) })

  if (!tipo) notFound()

  return (
    <FormShell titulo="Editar tipo de trámite" volverHref="/tipos-tramite" volverTexto="Volver a tipos de trámite">
      <FormularioTipoTramite
        accion={actualizarTipoTramite.bind(null, tipo.id)}
        textoBoton="Guardar cambios"
        valoresIniciales={{
          nombre: tipo.nombre,
          pais: tipo.pais,
          descripcion: tipo.descripcion,
          precio: tipo.precio,
          moneda: tipo.moneda,
          vigencia_meses: tipo.vigencia_meses,
          requiere_vehiculo: tipo.requiere_vehiculo,
        }}
      />
    </FormShell>
  )
}
