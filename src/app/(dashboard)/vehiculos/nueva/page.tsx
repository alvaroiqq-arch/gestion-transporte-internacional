import { db } from '@/lib/db'
import { empresas_cliente } from '@/lib/db/schema'
import { FormularioVehiculo } from '@/components/vehiculos/formulario-vehiculo'
import { crearVehiculo } from '@/actions/vehiculos'

export default async function PaginaNuevoVehiculo() {
  const empresas = await db
    .select({ id: empresas_cliente.id, razon_social: empresas_cliente.razon_social })
    .from(empresas_cliente)

  return (
    <div style={{ padding: 32 }}>
      <h1>Nuevo vehículo</h1>
      <FormularioVehiculo accion={crearVehiculo} empresas={empresas} textoBoton="Crear vehículo" />
    </div>
  )
}
