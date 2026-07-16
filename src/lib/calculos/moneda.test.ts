import { describe, it, expect } from 'vitest'
import { redondearMonto } from './moneda'

describe('redondearMonto', () => {
  it('redondea CLP a entero con ROUND_HALF_UP', () => {
    expect(redondearMonto('1500.5', 'CLP')).toBe('1501')
    expect(redondearMonto('1500.4', 'CLP')).toBe('1500')
  })

  it('deja BOB con máximo 2 decimales', () => {
    expect(redondearMonto('120.456', 'BOB')).toBe('120.46')
    expect(redondearMonto('120', 'BOB')).toBe('120.00')
  })

  it('deja USD con máximo 2 decimales', () => {
    expect(redondearMonto('99.995', 'USD')).toBe('100.00')
  })
})
