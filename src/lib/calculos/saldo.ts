import Decimal from 'decimal.js'
import { redondearMonto } from './moneda'

type Moneda = 'CLP' | 'BOB' | 'USD'
type EstadoPago = 'pendiente' | 'pagado' | 'anulado'

type PagoParaCalculo = {
  monto: Decimal.Value
  moneda: Moneda
  estado: EstadoPago
}

export type SaldoTramite = {
  totalPagado: string // suma de pagos 'pagado' en la moneda del trámite
  saldo: string // monto_total - totalPagado, en la moneda del trámite
  pagosOtrasMonedas: Partial<Record<Moneda, string>> // recibido en otras monedas — informativo, no reduce el saldo
}

// El saldo se calcula por moneda (ver CLAUDE.md): solo los pagos 'pagado' en la
// misma moneda del trámite reducen su saldo. Pagos en otra moneda no se
// convierten (no hay tabla de tipo de cambio en este proyecto) — se informan aparte.
export function calcularSaldoTramite(
  montoTotal: Decimal.Value,
  monedaTramite: Moneda,
  pagos: PagoParaCalculo[]
): SaldoTramite {
  const pagosValidos = pagos.filter((p) => p.estado === 'pagado')

  const totalPagado = pagosValidos
    .filter((p) => p.moneda === monedaTramite)
    .reduce((acumulado, p) => acumulado.plus(p.monto), new Decimal(0))

  const saldo = new Decimal(montoTotal).minus(totalPagado)

  const pagosOtrasMonedas: Partial<Record<Moneda, string>> = {}
  for (const p of pagosValidos) {
    if (p.moneda === monedaTramite) continue
    const acumulado = new Decimal(pagosOtrasMonedas[p.moneda] ?? 0).plus(p.monto)
    pagosOtrasMonedas[p.moneda] = redondearMonto(acumulado, p.moneda)
  }

  return {
    totalPagado: redondearMonto(totalPagado, monedaTramite),
    saldo: redondearMonto(saldo, monedaTramite),
    pagosOtrasMonedas,
  }
}
