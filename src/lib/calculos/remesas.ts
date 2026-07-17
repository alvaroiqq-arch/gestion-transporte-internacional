import Decimal from 'decimal.js'
import { redondearMonto } from './moneda'

type Moneda = 'CLP' | 'BOB' | 'USD'

type PagoParaRemesa = {
  monto: Decimal.Value
  moneda: Moneda
}

// Agrupa y suma montos por moneda — se usa tanto para el total de fondos
// pendientes de enviar a Bolivia como para el total de una remesa ya armada.
export function sumarPorMoneda(pagos: PagoParaRemesa[]): Partial<Record<Moneda, string>> {
  const totales: Partial<Record<Moneda, Decimal>> = {}
  for (const p of pagos) {
    totales[p.moneda] = (totales[p.moneda] ?? new Decimal(0)).plus(p.monto)
  }

  const resultado: Partial<Record<Moneda, string>> = {}
  for (const [moneda, total] of Object.entries(totales) as [Moneda, Decimal][]) {
    resultado[moneda] = redondearMonto(total, moneda)
  }
  return resultado
}

// Una remesa es un envío físico/bancario de una sola moneda — no tiene
// sentido mezclar CLP y USD en un mismo envío a Bolivia.
export function tienenMonedaUnica(pagos: { moneda: Moneda }[]): boolean {
  if (pagos.length === 0) return true
  return pagos.every((p) => p.moneda === pagos[0].moneda)
}

// El medio de transferencia cobra una comisión que se descuenta del monto
// recaudado en Chile — lo que Bolivia recibe es siempre <= lo cobrado.
export function calcularMontoNeto(totalRecaudado: Decimal.Value, comision: Decimal.Value, moneda: Moneda): string {
  return redondearMonto(new Decimal(totalRecaudado).minus(comision), moneda)
}
