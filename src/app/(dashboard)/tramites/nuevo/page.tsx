import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { empresas_cliente, tipos_tramite, vehiculos } from '@/lib/db/schema'
import { FormularioTramite } from '@/components/tramites/formulario-tramite'
import { FormShell } from '@/components/layout/form-shell'

export default async function PaginaNuevoTramite() {
  const [empresas, tipos, listaVehiculos] = await Promise.all([
    db
      .select({ id: empresas_cliente.id, razon_social: empresas_cliente.razon_social })
      .from(empresas_cliente)
      .where(eq(empresas_cliente.activo, true)),
    db
      .select({
        id: tipos_tramite.id,
        nombre: tipos_tramite.nombre,
        pais: tipos_tramite.pais,
        precio: tipos_tramite.precio,
        moneda: tipos_tramite.moneda,
        requiere_vehiculo: tipos_tramite.requiere_vehiculo,
      })
      .from(tipos_tramite)
      .where(eq(tipos_tramite.activo, true)),
    db
      .select({ id: vehiculos.id, patente: vehiculos.patente, empresa_id: vehiculos.empresa_id })
      .from(vehiculos)
      .where(eq(vehiculos.estado, 'habilitado')),
  ])

  return (
    <FormShell titulo="Nuevo trámite" volverHref="/tramites" volverTexto="Volver a trámites">
      <FormularioTramite empresas={empresas} tipos={tipos} vehiculos={listaVehiculos} />
    </FormShell>
  )
}
