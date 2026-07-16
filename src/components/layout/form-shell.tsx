import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function FormShell({
  titulo,
  volverHref,
  volverTexto,
  children,
}: {
  titulo: string
  volverHref: string
  volverTexto: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-xl">
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
        <Link href={volverHref}>
          <ArrowLeft className="size-4" />
          {volverTexto}
        </Link>
      </Button>
      <h1 className="mb-6">{titulo}</h1>
      <Card>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
