import { describe, it, expect } from 'vitest'
import { parsearCertificadoRvm } from './certificado-rvm'

// Fixtures: texto real extraído con unpdf de dos certificados del R.V.M.
const CAMION =
  'SERVICIO DE REGISTRO CIVIL E IDENTIFICACIÓN REPUBLICA DE CHILE FOLIO : 500705317607 ' +
  'Código Verificación: d6a96ed4a2fb500705317607 CERTIFICADO DE INSCRIPCION Y ANOTACIONES VIGENTES EN EL R. V. M. ' +
  'Inscripción : JFZW.52-4 DATOS DEL VEHICULO Tipo Vehículo : CAMION Año : 2005 Marca : VOLVO Modelo : FH 12 ' +
  'Nro. Motor : D12-479737-D1-A Nro. Chasis : YV2AP40C55A599101 Color : BLANCO Combustible : DIESEL ' +
  'PBV : 21,00 TONELADAS Instit. aseg. : BCI SEGUROS GENERALES S.A. Numero poliza : 5.264.109 ' +
  'Fec. ven. pol. : 30-09-2026 DATOS DEL PROPIETARIO Nombre : SOCIEDAD DE TRANSPORTES NELLY ESTER LIMITADA ' +
  'R.U.T. : 76.543.615-K Fec. adquisición: 29-01-2020 Repertorio : IQUIQUE'

const REMOLQUE =
  'FOLIO : 500705322181 CERTIFICADO DE INSCRIPCION Y ANOTACIONES VIGENTES EN EL R. V. M. ' +
  'Inscripción : JE.3332-5 DATOS DEL VEHICULO Tipo Vehículo : REMOLQUE Año : 1991 Marca : PROGRESO Modelo : PLANO ' +
  'Nro. Chasis : S/N Color : AZUL Combustible : (NO INFORMADO) PBV : (NO INFORMADO) ' +
  'NO REGISTRA SEGURO OBLIGATORIO VIGENTE DATOS DEL PROPIETARIO Nombre : SOCIEDAD DE TRANSPORTES NELLY ESTER LIMITADA ' +
  'R.U.T. : 76.543.615-K Fec. adquisición: 15-07-2019 Repertorio : ALTO HOSPICIO'

describe('parsearCertificadoRvm', () => {
  it('extrae los datos de un camión (formato nuevo)', () => {
    const v = parsearCertificadoRvm(CAMION)
    expect(v.patente).toBe('JFZW.52')
    expect(v.tipoDetectado).toBe('CAMION')
    expect(v.tipoVehiculo).toBe('carga')
    expect(v.tipoIncierto).toBe(false)
    expect(v.marca).toBe('VOLVO')
    expect(v.modelo).toBe('FH 12')
    expect(v.anio).toBe(2005)
    expect(v.folio).toBe('500705317607')
    expect(v.propietarioNombre).toBe('SOCIEDAD DE TRANSPORTES NELLY ESTER LIMITADA')
    expect(v.propietarioRut).toBe('76.543.615-K')
    expect(v.error).toBeNull()
  })

  it('incluye motor, chasis, color, combustible y PBV en las notas de respaldo', () => {
    const v = parsearCertificadoRvm(CAMION)
    expect(v.notas).toContain('Motor: D12-479737-D1-A')
    expect(v.notas).toContain('Chasis: YV2AP40C55A599101')
    expect(v.notas).toContain('Color: BLANCO')
    expect(v.notas).toContain('Combustible: DIESEL')
    expect(v.notas).toContain('PBV: 21,00 TONELADAS')
  })

  it('extrae un remolque sin número de motor (formato antiguo)', () => {
    const v = parsearCertificadoRvm(REMOLQUE)
    expect(v.patente).toBe('JE.3332')
    expect(v.tipoDetectado).toBe('REMOLQUE')
    expect(v.tipoVehiculo).toBe('carga')
    expect(v.marca).toBe('PROGRESO')
    expect(v.modelo).toBe('PLANO')
    expect(v.anio).toBe(1991)
    expect(v.error).toBeNull()
  })

  it('omite los campos "(NO INFORMADO)" en las notas', () => {
    const v = parsearCertificadoRvm(REMOLQUE)
    expect(v.notas).toContain('Color: AZUL')
    expect(v.notas).not.toContain('NO INFORMADO')
    expect(v.notas).not.toContain('Combustible:')
    expect(v.notas).not.toContain('PBV:')
  })

  it('mapea BUS a pasajeros', () => {
    const texto =
      'Inscripción : BXYZ.10-3 DATOS DEL VEHICULO Tipo Vehículo : BUS Año : 2018 Marca : MERCEDES Modelo : O500 ' +
      'Nro. Motor : ABC Nro. Chasis : XYZ Color : ROJO Combustible : DIESEL PBV : 15 DATOS DEL PROPIETARIO'
    const v = parsearCertificadoRvm(texto)
    expect(v.tipoVehiculo).toBe('pasajeros')
    expect(v.tipoIncierto).toBe(false)
  })

  it('marca el tipo como incierto y usa "carga" por defecto cuando no reconoce el tipo', () => {
    const texto =
      'Inscripción : ABCD.11-2 DATOS DEL VEHICULO Tipo Vehículo : CASA RODANTE Año : 2010 Marca : X Modelo : Y ' +
      'Nro. Chasis : Z Color : GRIS Combustible : DIESEL PBV : 3 DATOS DEL PROPIETARIO'
    const v = parsearCertificadoRvm(texto)
    expect(v.tipoDetectado).toBe('CASA RODANTE')
    expect(v.tipoVehiculo).toBe('carga')
    expect(v.tipoIncierto).toBe(true)
  })

  it('devuelve error cuando el documento no trae patente', () => {
    const v = parsearCertificadoRvm('DOCUMENTO SIN DATOS DE INSCRIPCION')
    expect(v.patente).toBeNull()
    expect(v.error).not.toBeNull()
  })
})
