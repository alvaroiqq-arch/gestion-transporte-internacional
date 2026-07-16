import Decimal from 'decimal.js'

// CLP: sin decimales, ROUND_HALF_UP al peso entero. BOB/USD: máximo 2 decimales.
export function redondearMonto(monto: Decimal.Value, moneda: 'CLP' | 'BOB' | 'USD'): string {
  const decimales = moneda === 'CLP' ? 0 : 2
  return new Decimal(monto).toDecimalPlaces(decimales, Decimal.ROUND_HALF_UP).toFixed(decimales)
}
