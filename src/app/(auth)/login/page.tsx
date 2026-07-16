'use client'

import { useActionState } from 'react'
import { iniciarSesion } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaginaLogin() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, { error: null })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Gestión de trámites</CardTitle>
          <p className="text-sm text-muted-foreground">Transporte internacional Chile–Bolivia</p>
        </CardHeader>
        <CardContent>
          <form action={accion} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>

            {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}

            <Button type="submit" disabled={pendiente} className="mt-1 w-full">
              {pendiente ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
