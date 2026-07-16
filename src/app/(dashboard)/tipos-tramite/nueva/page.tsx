import { FormularioTipoTramite } from '@/components/tipos-tramite/formulario-tipo-tramite'
import { FormShell } from '@/components/layout/form-shell'
import { crearTipoTramite } from '@/actions/tipos-tramite'

export default function PaginaNuevoTipoTramite() {
  return (
    <FormShell titulo="Nuevo tipo de trámite" volverHref="/tipos-tramite" volverTexto="Volver a tipos de trámite">
      <FormularioTipoTramite accion={crearTipoTramite} textoBoton="Crear tipo de trámite" />
    </FormShell>
  )
}
