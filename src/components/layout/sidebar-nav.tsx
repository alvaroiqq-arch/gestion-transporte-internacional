'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Truck,
  Tags,
  FileText,
  Banknote,
  Landmark,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { cerrarSesion } from '@/actions/auth'

type Usuario = {
  nombre: string
  rol: string
  pais_gestion: string | null
}

const enlaces = [
  { href: '/', etiqueta: 'Inicio', icono: LayoutDashboard, exacto: true },
  { href: '/tramites', etiqueta: 'Trámites', icono: FileText },
  { href: '/remesas', etiqueta: 'Remesas', icono: Banknote },
  { href: '/cuentas-bolivia', etiqueta: 'Cuentas Bolivia', icono: Landmark },
  { href: '/empresas', etiqueta: 'Empresas', icono: Building2 },
  { href: '/vehiculos', etiqueta: 'Vehículos', icono: Truck },
  { href: '/tipos-tramite', etiqueta: 'Tipos de trámite', icono: Tags },
]

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export function SidebarNav({ usuario }: { usuario: Usuario | null }) {
  const [abierto, setAbierto] = useState(false)
  const pathname = usePathname()

  const estaActivo = (href: string, exacto?: boolean) =>
    exacto ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const contenido = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <p className="text-sm font-semibold leading-tight">Gestión de trámites</p>
        <p className="text-xs text-muted-foreground">Transporte internacional</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {enlaces.map(({ href, etiqueta, icono: Icono, exacto }) => {
          const activo = estaActivo(href, exacto)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setAbierto(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activo
                  ? 'bg-primary text-primary-foreground'
                  : 'text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icono className="size-4 shrink-0" />
              {etiqueta}
            </Link>
          )
        })}
      </nav>

      {usuario && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {iniciales(usuario.nombre)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{usuario.nombre}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {usuario.rol}
                {usuario.pais_gestion ? ` · ${usuario.pais_gestion}` : ''}
              </p>
            </div>
          </div>
          <form action={cerrarSesion} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Barra superior móvil */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <p className="text-sm font-semibold">Gestión de trámites</p>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-1.5 hover:bg-accent"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Drawer móvil */}
      {abierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAbierto(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-card shadow-xl">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 rounded-lg p-1.5 hover:bg-accent"
            >
              <X className="size-5" />
            </button>
            {contenido}
          </div>
        </div>
      )}

      {/* Sidebar escritorio */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
        <div className="sticky top-0 h-screen">{contenido}</div>
      </aside>
    </>
  )
}
