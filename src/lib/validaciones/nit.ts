// Validación de NIT boliviano — solo formato/largo, sin dígito verificador
// (no existe un algoritmo de checksum público estándar, a diferencia del RUT chileno)

export function validarNit(nit: string): boolean {
  const limpio = nit.replace(/[^0-9]/g, '')
  return limpio.length >= 7 && limpio.length <= 9
}

export function normalizarNit(nit: string): string {
  return nit.replace(/[^0-9]/g, '')
}
