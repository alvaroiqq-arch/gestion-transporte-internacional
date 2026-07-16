import { FormularioEmpresa } from '@/components/empresas/formulario-empresa'
import { FormShell } from '@/components/layout/form-shell'
import { crearEmpresa } from '@/actions/empresas'

export default function PaginaNuevaEmpresa() {
  return (
    <FormShell titulo="Nueva empresa cliente" volverHref="/empresas" volverTexto="Volver a empresas">
      <FormularioEmpresa accion={crearEmpresa} textoBoton="Crear empresa" />
    </FormShell>
  )
}
