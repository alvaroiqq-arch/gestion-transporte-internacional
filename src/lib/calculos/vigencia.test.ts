import { describe, it, expect } from 'vitest'
import { calcularFechaVigenciaHasta } from './vigencia'

describe('calcularFechaVigenciaHasta', () => {
  it('suma meses dentro del mismo año', () => {
    expect(calcularFechaVigenciaHasta('2026-01-15', 6)).toBe('2026-07-15')
  })

  it('cruza el año al sumar 12 meses', () => {
    expect(calcularFechaVigenciaHasta('2026-01-15', 12)).toBe('2027-01-15')
  })

  it('ajusta al último día del mes cuando este tiene menos días (año no bisiesto)', () => {
    expect(calcularFechaVigenciaHasta('2026-01-31', 1)).toBe('2026-02-28')
  })

  it('ajusta al último día de febrero en año bisiesto', () => {
    expect(calcularFechaVigenciaHasta('2024-01-31', 1)).toBe('2024-02-29')
  })

  it('con 0 meses devuelve la misma fecha', () => {
    expect(calcularFechaVigenciaHasta('2026-03-10', 0)).toBe('2026-03-10')
  })
})
