// Validación de patente — solo largo mínimo, el formato varía por país/época
// (Chile: 4 letras + 2 números o formatos antiguos; Bolivia: varía por departamento)

export function validarPatente(patente: string): boolean {
  const limpia = patente.trim()
  return limpia.length >= 4
}

export function normalizarPatente(patente: string): string {
  return patente.trim().toUpperCase()
}
