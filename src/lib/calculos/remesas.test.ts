import { describe, it, expect } from 'vitest'
import { sumarPorMoneda, tienenMonedaUnica } from './remesas'

describe('sumarPorMoneda', () => {
  it('sin pagos, devuelve un objeto vacío', () => {
    expect(sumarPorMoneda([])).toEqual({})
  })

  it('suma varios pagos de la misma moneda', () => {
    const resultado = sumarPorMoneda([
      { monto: '50000', moneda: 'CLP' },
      { monto: '30000', moneda: 'CLP' },
    ])
    expect(resultado).toEqual({ CLP: '80000' })
  })

  it('agrupa por moneda cuando hay varias', () => {
    const resultado = sumarPorMoneda([
      { monto: '50000', moneda: 'CLP' },
      { monto: '100', moneda: 'USD' },
      { monto: '25000', moneda: 'CLP' },
    ])
    expect(resultado).toEqual({ CLP: '75000', USD: '100.00' })
  })

  it('redondea CLP al peso entero y BOB/USD a 2 decimales', () => {
    const resultado = sumarPorMoneda([
      { monto: '1000.6', moneda: 'CLP' },
      { monto: '10.005', moneda: 'BOB' },
    ])
    expect(resultado).toEqual({ CLP: '1001', BOB: '10.01' })
  })
})

describe('tienenMonedaUnica', () => {
  it('una lista vacía se considera de moneda única', () => {
    expect(tienenMonedaUnica([])).toBe(true)
  })

  it('todos los pagos en la misma moneda', () => {
    expect(tienenMonedaUnica([{ moneda: 'CLP' }, { moneda: 'CLP' }])).toBe(true)
  })

  it('pagos en monedas distintas', () => {
    expect(tienenMonedaUnica([{ moneda: 'CLP' }, { moneda: 'USD' }])).toBe(false)
  })
})
