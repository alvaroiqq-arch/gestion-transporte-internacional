'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  analizarPdfsVehiculos,
  importarVehiculos,
  type FilaImportacion,
} from '@/actions/importacion-vehiculos'

type Empresa = { id: string; razon_social: string }
type Fila = FilaImportacion & { incluir: boolean }

export function ImportadorVehiculos({ empresas }: { empresas: Empresa[] }) {
  const [filas, setFilas] = useState<Fila[]>([])
  const [fase, setFase] = useState<'seleccion' | 'previsualizacion' | 'listo'>('seleccion')
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ creados: number; omitidos: number } | null>(null)
  const [pendiente, startTransition] = useTransition()

  function actualizarFila(indice: number, cambios: Partial<Fila>) {
    setFilas((prev) => prev.map((f, i) => (i === indice ? { ...f, ...cambios } : f)))
  }

  function analizar(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await analizarPdfsVehiculos(formData)
      if (res.error) {
        setError(res.error)
        return
      }
      setFilas(res.filas.map((f) => ({ ...f, incluir: !f.error && !f.yaExiste && !!f.empresaId })))
      setFase('previsualizacion')
    })
  }

  function cargar() {
    setError(null)
    const seleccionadas = filas.filter((f) => f.incluir && !f.error && f.patente && f.empresaId)
    if (seleccionadas.length === 0) {
      setError('No hay vehículos seleccionados (revisá que cada uno tenga empresa vinculada).')
      return
    }
    startTransition(async () => {
      const res = await importarVehiculos({
        filas: seleccionadas.map((f) => ({
          patente: f.patente!,
          empresaId: f.empresaId!,
          tipoVehiculo: f.tipoVehiculo,
          marca: f.marca,
          modelo: f.modelo,
          anio: f.anio,
          notas: f.notas,
        })),
      })
      if (res.error) {
        setError(res.error)
        return
      }
      setResultado({ creados: res.creados, omitidos: res.omitidos })
      setFase('listo')
    })
  }

  const seleccionadas = filas.filter((f) => f.incluir && !f.error && f.patente && f.empresaId).length

  // ── Fase 3: resultado ──────────────────────────────────────────────
  if (fase === 'listo' && resultado) {
    return (
      <div className="flex max-w-md flex-col gap-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-lg font-semibold">Importación completada</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Se cargaron <span className="font-medium text-foreground">{resultado.creados}</span>{' '}
            vehículo{resultado.creados === 1 ? '' : 's'}.
            {resultado.omitidos > 0 && (
              <> {resultado.omitidos} se omitieron (ya existían, duplicados o sin empresa).</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/vehiculos">Ver vehículos</Link>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFase('seleccion')
              setFilas([])
              setResultado(null)
            }}
          >
            Importar otro lote
          </Button>
        </div>
      </div>
    )
  }

  // ── Fase 2: previsualización editable ──────────────────────────────
  if (fase === 'previsualizacion') {
    const sinEmpresa = filas.filter((f) => !f.error && f.patente && !f.empresaId).length
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {filas.length} documento{filas.length === 1 ? '' : 's'} leído{filas.length === 1 ? '' : 's'} ·{' '}
          {seleccionadas} a cargar
          {sinEmpresa > 0 && (
            <> · <span className="text-[#8a3626] dark:text-[#e0a99c]">{sinEmpresa} sin empresa vinculada</span></>
          )}
        </p>

        {sinEmpresa > 0 && (
          <div className="rounded-lg border border-[#e6c9b0] bg-[#f6e2b8]/40 p-3 text-sm dark:border-[#4a3a2a] dark:bg-[#453619]/40">
            Algunos vehículos no coinciden con ninguna empresa registrada por su RUT de propietario.
            Elegí la empresa en cada fila, o{' '}
            <Link href="/empresas/nueva" className="font-medium underline">
              creá la empresa
            </Link>{' '}
            y volvé a analizar.
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-10" />
                <TableHead>Patente</TableHead>
                <TableHead>Empresa (propietario)</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f, i) => (
                <TableRow key={i} className={f.error ? 'opacity-60' : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={f.incluir}
                      disabled={!!f.error || !f.patente || !f.empresaId}
                      onChange={(e) => actualizarFila(i, { incluir: e.target.checked })}
                      aria-label={`Incluir ${f.patente ?? f.archivo}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={f.patente ?? ''}
                      onChange={(e) => actualizarFila(i, { patente: e.target.value })}
                      className="h-8 w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={f.empresaId ?? ''}
                      onValueChange={(v) =>
                        actualizarFila(i, {
                          empresaId: v,
                          empresaNombre: empresas.find((e) => e.id === v)?.razon_social ?? null,
                          incluir: !f.error && !!f.patente,
                        })
                      }
                    >
                      <SelectTrigger className={'h-8 w-56 ' + (f.empresaId ? '' : 'border-[#8a3626]')}>
                        <SelectValue placeholder="Sin empresa — elegí una" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.razon_social}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {f.propietarioRut && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Propietario: {f.propietarioNombre ?? '—'} ({f.propietarioRut})
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={f.tipoVehiculo}
                      onValueChange={(v) => actualizarFila(i, { tipoVehiculo: v as 'carga' | 'pasajeros', tipoIncierto: false })}
                    >
                      <SelectTrigger className={'h-8 w-32 ' + (f.tipoIncierto ? 'border-[#7a5a1c]' : '')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carga">Carga</SelectItem>
                        <SelectItem value="pasajeros">Pasajeros</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={f.marca ?? ''}
                      onChange={(e) => actualizarFila(i, { marca: e.target.value })}
                      className="h-8 w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={f.modelo ?? ''}
                      onChange={(e) => actualizarFila(i, { modelo: e.target.value })}
                      className="h-8 w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={f.anio ?? ''}
                      inputMode="numeric"
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10)
                        actualizarFila(i, { anio: Number.isNaN(n) ? null : n })
                      }}
                      className="h-8 w-20"
                    />
                  </TableCell>
                  <TableCell>
                    {f.error ? (
                      <Badge tono="peligro" title={f.error}>Error</Badge>
                    ) : f.yaExiste ? (
                      <Badge tono="advertencia">Ya existe</Badge>
                    ) : !f.empresaId ? (
                      <Badge tono="peligro">Sin empresa</Badge>
                    ) : f.tipoIncierto ? (
                      <Badge tono="advertencia">Revisar tipo</Badge>
                    ) : (
                      <Badge tono="exito">Listo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button onClick={cargar} disabled={pendiente || seleccionadas === 0}>
            {pendiente ? 'Cargando...' : `Cargar ${seleccionadas} vehículo${seleccionadas === 1 ? '' : 's'}`}
          </Button>
          <Button variant="secondary" onClick={() => setFase('seleccion')} disabled={pendiente}>
            Volver
          </Button>
        </div>
      </div>
    )
  }

  // ── Fase 1: selección de archivos ──────────────────────────────────
  return (
    <form action={analizar} className="flex max-w-md flex-col gap-4">
      {empresas.length === 0 && (
        <div className="rounded-lg border border-[#e6c9b0] bg-[#f6e2b8]/40 p-3 text-sm dark:border-[#4a3a2a] dark:bg-[#453619]/40">
          No hay empresas registradas todavía. Para vincular los vehículos por RUT del propietario,{' '}
          <Link href="/empresas/nueva" className="font-medium underline">
            creá primero la empresa
          </Link>
          .
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="archivos">Certificados PDF (uno por vehículo)</Label>
        <Input id="archivos" name="archivos" type="file" accept="application/pdf" multiple required />
        <p className="text-xs text-muted-foreground">
          Certificados de Inscripción del R.V.M. (Registro Civil). Podés seleccionar varios a la vez.
          Cada vehículo se vincula automáticamente a la empresa cuyo RUT coincide con el propietario.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Leyendo PDF...' : 'Analizar PDF'}
        </Button>
      </div>
    </form>
  )
}
