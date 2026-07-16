import { FormularioEmpresa } from '@/components/empresas/formulario-empresa'
import { crearEmpresa } from '@/actions/empresas'

export default function PaginaNuevaEmpresa() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Nueva empresa cliente</h1>
      <FormularioEmpresa accion={crearEmpresa} textoBoton="Crear empresa" />
    </div>
  )
}
