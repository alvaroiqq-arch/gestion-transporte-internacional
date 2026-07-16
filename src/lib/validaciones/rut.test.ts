import { describe, it, expect } from 'vitest'
import { validarRut, normalizarRut, formatearRut } from './rut'

describe('validarRut', () => {
  it('acepta un RUT válido con guion', () => {
    expect(validarRut('12345678-5')).toBe(true)
  })

  it('acepta un RUT válido con puntos y guion', () => {
    expect(validarRut('12.345.678-5')).toBe(true)
  })

  it('acepta un RUT válido con dígito verificador K', () => {
    expect(validarRut('10000013-K')).toBe(true)
  })

  it('rechaza un RUT con dígito verificador incorrecto', () => {
    expect(validarRut('12345678-9')).toBe(false)
  })

  it('rechaza un RUT sin cuerpo numérico', () => {
    expect(validarRut('-9')).toBe(false)
  })

  it('rechaza texto sin formato de RUT', () => {
    expect(validarRut('no-es-un-rut')).toBe(false)
  })
})

describe('normalizarRut', () => {
  it('quita puntos y guion, deja mayúsculas', () => {
    expect(normalizarRut('12.345.678-5')).toBe('123456785')
  })
})

describe('formatearRut', () => {
  it('agrega puntos y guion', () => {
    expect(formatearRut('123456785')).toBe('12.345.678-5')
  })
})
