'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TODAS = '__todas__'

export function FiltroEmpresa({ empresas }: { empresas: { id: string; razon_social: string }[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const empresaId = searchParams.get('empresa_id') ?? TODAS

  function alCambiar(valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (valor === TODAS) {
      params.delete('empresa_id')
    } else {
      params.set('empresa_id', valor)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <Select value={empresaId} onValueChange={alCambiar}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Filtrar por empresa" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODAS}>Todas las empresas</SelectItem>
        {empresas.map((e) => (
          <SelectItem key={e.id} value={e.id}>{e.razon_social}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
