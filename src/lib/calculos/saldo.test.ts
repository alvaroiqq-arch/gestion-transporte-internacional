import { describe, it, expect } from 'vitest'
import { calcularSaldoTramite } from './saldo'

describe('calcularSaldoTramite', () => {
  it('sin pagos, el saldo es igual al monto total', () => {
    const resultado = calcularSaldoTramite('50000', 'CLP', [])
    expect(resultado.totalPagado).toBe('0')
    expect(resultado.saldo).toBe('50000')
    expect(resultado.pagosOtrasMonedas).toEqual({})
  })

  it('un pago parcial en la misma moneda reduce el saldo', () => {
    const resultado = calcularSaldoTramite('50000', 'CLP', [
      { monto: '20000', moneda: 'CLP', estado: 'pagado' },
    ])
    expect(resultado.totalPagado).toBe('20000')
    expect(resultado.saldo).toBe('30000')
  })

  it('varios pagos parciales se suman', () => {
    const resultado = calcularSaldoTramite('50000', 'CLP', [
      { monto: '20000', moneda: 'CLP', estado: 'pagado' },
      { monto: '15000', moneda: 'CLP', estado: 'pagado' },
    ])
    expect(resultado.saldo).toBe('15000')
  })

  it('un pago que cubre el total deja saldo en cero', () => {
    const resultado = calcularSaldoTramite('50000', 'CLP', [
      { monto: '50000', moneda: 'CLP', estado: 'pagado' },
    ])
    expect(resultado.saldo).toBe('0')
  })

  it('un pago anulado no reduce el saldo', () => {
    const resultado = calcularSaldoTramite('50000', 'CLP', [
      { monto: '20000', moneda: 'CLP', estado: 'anulado' },
    ])
    expect(resultado.saldo).toBe('50000')
  })

  it('un pago pendiente no reduce el saldo', () => {
    const resultado = calcularSaldoTramite('50000', 'CLP', [
      { monto: '20000', moneda: 'CLP', estado: 'pendiente' },
    ])
    expect(resultado.saldo).toBe('50000')
  })

  it('un pago en otra moneda no reduce el saldo del trámite, pero se informa aparte', () => {
    const resultado = calcularSaldoTramite('50000', 'CLP', [
      { monto: '100', moneda: 'USD', estado: 'pagado' },
    ])
    expect(resultado.saldo).toBe('50000')
    expect(resultado.pagosOtrasMonedas).toEqual({ USD: '100.00' })
  })

  it('redondea el saldo en CLP al peso entero', () => {
    const resultado = calcularSaldoTramite('50000.6', 'CLP', [
      { monto: '20000.4', moneda: 'CLP', estado: 'pagado' },
    ])
    expect(resultado.saldo).toBe('30000')
  })

  it('mantiene 2 decimales en USD', () => {
    const resultado = calcularSaldoTramite('500', 'USD', [
      { monto: '100.5', moneda: 'USD', estado: 'pagado' },
    ])
    expect(resultado.saldo).toBe('399.50')
  })
})
