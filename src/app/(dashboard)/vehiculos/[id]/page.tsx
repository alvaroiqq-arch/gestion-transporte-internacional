import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vehiculos, empresas_cliente } from '@/lib/db/schema'
import { FormularioVehiculo } from '@/components/vehiculos/formulario-vehiculo'
import { FormShell } from '@/components/layout/form-shell'
import { actualizarVehiculo } from '@/actions/vehiculos'

export default async function PaginaEditarVehiculo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [vehiculo, empresas] = await Promise.all([
    db.query.vehiculos.findFirst({ where: (vehiculos, { eq }) => eq(vehiculos.id, id) }),
    db.select({ id: empresas_cliente.id, razon_social: empresas_cliente.razon_social }).from(empresas_cliente),
  ])

  if (!vehiculo) notFound()

  return (
    <FormShell titulo="Editar vehículo" volverHref="/vehiculos" volverTexto="Volver a vehículos">
      <FormularioVehiculo
        accion={actualizarVehiculo.bind(null, vehiculo.id)}
        empresas={empresas}
        textoBoton="Guardar cambios"
        valoresIniciales={{
          empresa_id: vehiculo.empresa_id,
          patente: vehiculo.patente,
          pais_matricula: vehiculo.pais_matricula,
          tipo_vehiculo: vehiculo.tipo_vehiculo,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          anio: vehiculo.anio,
          fecha_habilitacion: vehiculo.fecha_habilitacion,
          fecha_vencimiento_habilitacion: vehiculo.fecha_vencimiento_habilitacion,
          notas: vehiculo.notas,
        }}
      />
    </FormShell>
  )
}
