import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'

export default function PaginaCuentasBolivia() {
  return (
    <div>
      <PageHeader titulo="Cuentas Bolivia" descripcion="Saldo y movimientos de caja Bolivia" />

      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Próximamente.
        </CardContent>
      </Card>
    </div>
  )
}
