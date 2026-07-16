import { FormularioTipoTramite } from '@/components/tipos-tramite/formulario-tipo-tramite'
import { crearTipoTramite } from '@/actions/tipos-tramite'

export default function PaginaNuevoTipoTramite() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Nuevo tipo de trámite</h1>
      <FormularioTipoTramite accion={crearTipoTramite} textoBoton="Crear tipo de trámite" />
    </div>
  )
}
