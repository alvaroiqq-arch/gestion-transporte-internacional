import Link from 'next/link'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { empresas_cliente } from '@/lib/db/schema'
import { formatearRut } from '@/lib/validaciones/rut'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { desactivarEmpresa } from '@/actions/empresas'

export default async function PaginaEmpresas() {
  const empresas = await db
    .select()
    .from(empresas_cliente)
    .orderBy(desc(empresas_cliente.created_at))

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Empresas cliente</h1>
        <Button asChild>
          <Link href="/empresas/nueva">Nueva empresa</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Razón social</TableHead>
            <TableHead>País</TableHead>
            <TableHead>Identificador fiscal</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {empresas.map((empresa) => (
            <TableRow key={empresa.id}>
              <TableCell>{empresa.razon_social}</TableCell>
              <TableCell>{empresa.pais_domicilio}</TableCell>
              <TableCell>
                {empresa.pais_domicilio === 'chile'
                  ? formatearRut(empresa.identificador_fiscal)
                  : empresa.identificador_fiscal}
              </TableCell>
              <TableCell>{empresa.ciudad}</TableCell>
              <TableCell>{empresa.activo ? 'Activa' : 'Inactiva'}</TableCell>
              <TableCell style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="secondary" asChild>
                  <Link href={`/empresas/${empresa.id}`}>Editar</Link>
                </Button>
                {empresa.activo && (
                  <form action={desactivarEmpresa.bind(null, empresa.id)}>
                    <Button variant="secondary" type="submit">Desactivar</Button>
                  </form>
                )}
              </TableCell>
            </TableRow>
          ))}
          {empresas.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                Aún no hay empresas registradas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
