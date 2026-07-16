import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { empresas_cliente } from '@/lib/db/schema'
import { formatearRut } from '@/lib/validaciones/rut'
import { FormularioEmpresa } from '@/components/empresas/formulario-empresa'
import { actualizarEmpresa } from '@/actions/empresas'

export default async function PaginaEditarEmpresa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const empresa = await db.query.empresas_cliente.findFirst({
    where: eq(empresas_cliente.id, id),
  })

  if (!empresa) notFound()

  return (
    <div style={{ padding: 32 }}>
      <h1>Editar empresa cliente</h1>
      <FormularioEmpresa
        accion={actualizarEmpresa.bind(null, empresa.id)}
        textoBoton="Guardar cambios"
        valoresIniciales={{
          razon_social: empresa.razon_social,
          pais_domicilio: empresa.pais_domicilio,
          identificador_fiscal:
            empresa.pais_domicilio === 'chile'
              ? formatearRut(empresa.identificador_fiscal)
              : empresa.identificador_fiscal,
          direccion: empresa.direccion,
          ciudad: empresa.ciudad,
          contacto_nombre: empresa.contacto_nombre,
          telefono: empresa.telefono,
          email: empresa.email,
        }}
      />
    </div>
  )
}
