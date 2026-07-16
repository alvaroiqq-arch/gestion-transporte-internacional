import { db } from '@/lib/db'
import { empresas_cliente } from '@/lib/db/schema'
import { FormularioVehiculo } from '@/components/vehiculos/formulario-vehiculo'
import { FormShell } from '@/components/layout/form-shell'
import { crearVehiculo } from '@/actions/vehiculos'

export default async function PaginaNuevoVehiculo() {
  const empresas = await db
    .select({ id: empresas_cliente.id, razon_social: empresas_cliente.razon_social })
    .from(empresas_cliente)

  return (
    <FormShell titulo="Nuevo vehículo" volverHref="/vehiculos" volverTexto="Volver a vehículos">
      <FormularioVehiculo accion={crearVehiculo} empresas={empresas} textoBoton="Crear vehículo" />
    </FormShell>
  )
}
