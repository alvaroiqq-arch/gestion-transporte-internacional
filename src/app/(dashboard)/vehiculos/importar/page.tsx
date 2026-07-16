import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { empresas_cliente } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { ImportadorVehiculos } from '@/components/vehiculos/importador-vehiculos'

export default async function PaginaImportarVehiculos() {
  const empresas = await db
    .select({ id: empresas_cliente.id, razon_social: empresas_cliente.razon_social })
    .from(empresas_cliente)
    .where(eq(empresas_cliente.activo, true))
    .orderBy(asc(empresas_cliente.razon_social))

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
        <Link href="/vehiculos">
          <ArrowLeft className="size-4" />
          Volver a vehículos
        </Link>
      </Button>
      <h1 className="mb-1">Importar vehículos desde PDF</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Subí los Certificados de Inscripción del R.V.M. y revisá los datos detectados antes de cargarlos.
      </p>
      <ImportadorVehiculos empresas={empresas} />
    </div>
  )
}
