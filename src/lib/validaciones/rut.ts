// Validación y formato de RUT chileno (algoritmo módulo 11)

function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

export function validarRut(rut: string): boolean {
  const limpio = limpiarRut(rut)
  if (limpio.length < 2) return false

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)

  if (!/^\d+$/.test(cuerpo)) return false

  return calcularDigitoVerificador(cuerpo) === dv
}

// Guarda en BD sin puntos ni guion: '123456789'
export function normalizarRut(rut: string): string {
  return limpiarRut(rut)
}

// Muestra en UI con formato: '12.345.678-9'
export function formatearRut(rut: string): string {
  const limpio = limpiarRut(rut)
  if (limpio.length < 2) return limpio

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${cuerpoConPuntos}-${dv}`
}
