import { NasaPowerClient } from '../src/nasa-power-client';
import { SpanishRegion, MeteoParam } from '../src/types';

/**
 * Verifica si un valor es válido (no es un "fill value" de la API)
 * @param value Valor a verificar
 * @returns true si el valor es válido, false si es un "fill value"
 */
function esValorValido(valor: number | 'no definido' | undefined): boolean {
  return valor !== undefined && valor !== -999 && valor !== 'no definido';
}

/**
 * Formatea un valor numérico para su visualización
 * @param value Valor a formatear
 * @param unidad Unidad a mostrar
 * @param decimales Número de decimales
 * @returns Valor formateado o "No disponible" si es un fill value
 */
function formatearValor(
  valor: number | 'no definido' | undefined, 
  unidad?: string, 
  decimales: number = 2
): string {
  if (esValorValido(valor)) {
    const valorFormateado = (valor as number).toFixed(decimales);
    return unidad ? `${valorFormateado}${unidad}` : valorFormateado;
  }
  return 'No disponible';
}

/**
 * Ejemplo de uso del cliente NASA POWER para aplicaciones agrícolas
 */
async function ejemploNasaPower() {
  try {
    console.log('===== INICIANDO EJEMPLO DE NASA POWER CLIENT =====');
    const cliente = new NasaPowerClient();
    
    // Formatear fechas para el ejemplo - Usamos datos históricos para garantizar respuesta
    // La API a veces no tiene datos muy recientes, así que usamos fechas del mes pasado
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() - 1); // Un mes atrás
    
    const fechaInicio = new Date(fechaFin);
    fechaInicio.setDate(fechaInicio.getDate() - 7); // 7 días antes de la fecha fin
    
    const formatearFecha = (fecha: Date): string => {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${año}${mes}${dia}`;
    };
    
    const fechaInicioStr = formatearFecha(fechaInicio);
    const fechaFinStr = formatearFecha(fechaFin);
    
    console.log(`Periodo de análisis: ${fechaInicioStr} a ${fechaFinStr}`);
    
    // 1. Obtener datos meteorológicos básicos para Madrid
    console.log('\n1. Datos meteorológicos básicos para Madrid:');
    const datosMadrid = await cliente.getWeatherDataForSpanishRegion(
      SpanishRegion.MADRID,
      fechaInicioStr,
      fechaFinStr
    );
    
    console.log(`- Se obtuvieron datos para ${datosMadrid.length} días`);
    if (datosMadrid.length > 0) {
      console.log('- Muestra del primer día:', {
        fecha: datosMadrid[0].date,
        temperatura: formatearValor(datosMadrid[0].temperature, '°C'),
        temperaturaMaxima: formatearValor(datosMadrid[0].maxTemperature, '°C'),
        temperaturaMinima: formatearValor(datosMadrid[0].minTemperature, '°C'),
        precipitacion: formatearValor(datosMadrid[0].precipitation, 'mm'),
        humedad: formatearValor(datosMadrid[0].humidity, '%', 0)
      });
    } else {
      console.log('- No se obtuvieron datos para Madrid');
    }
    
    // 2. Comprobar si está lloviendo en Galicia (usamos la fecha fin para datos históricos)
    console.log('\n2. Comprobando si estaba lloviendo en Galicia:');
    try {
      const estaLloviendo = await cliente.isRaining(SpanishRegion.GALICIA);
      console.log(`- ¿Estaba lloviendo en Galicia? ${estaLloviendo ? 'SÍ' : 'NO'}`);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- No se pudo determinar si estaba lloviendo:', errorMsg);
    }
    
    // 3. Obtener datos agrícolas completos para Andalucía
    console.log('\n3. Datos agrícolas para Andalucía:');
    try {
      const datosAgricolas = await cliente.getAgriculturalData(
        SpanishRegion.ANDALUCIA,
        fechaInicioStr,
        fechaFinStr
      );
      
      console.log(`- Se obtuvieron datos para ${datosAgricolas.weatherData.length} días`);
      
      // Mostrar índices agroclimáticos del día más reciente
      if (datosAgricolas.indices.length > 0) {
        const indicesRecientes = datosAgricolas.indices[datosAgricolas.indices.length - 1];
        console.log(`
Índices Agroclimáticos Recientes:
--------------------------------
Riesgo de sequía: ${formatearValor(indicesRecientes.droughtIndex)}
Riesgo de heladas: ${formatearValor(indicesRecientes.freezeRisk)}
Riesgo de enfermedades: ${formatearValor(indicesRecientes.diseaseRisk)}
Necesidad de riego: ${indicesRecientes.irrigationNeed ? 
  (indicesRecientes.irrigationNeed !== 'no definido' ? 
    `${(indicesRecientes.irrigationNeed as number).toFixed(1)} mm` : 
    'No disponible') : 
  'No disponible'}
`);
      }
      
      // Mostrar recomendaciones del día más reciente
      if (datosAgricolas.recommendations.length > 0) {
        const recomendacionesRecientes = datosAgricolas.recommendations[datosAgricolas.recommendations.length - 1];
        console.log('- Recomendaciones agrícolas recientes:');
        console.log(`  * Riego: ${recomendacionesRecientes.irrigation.message}`);
        console.log(`  * Control de plagas: ${recomendacionesRecientes.pestControl.message}`);
        console.log(`  * Fertilización: ${recomendacionesRecientes.fertilization.message}`);
        console.log(`  * Operaciones de campo: ${recomendacionesRecientes.fieldOperations.message}`);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al obtener datos agrícolas:', errorMsg);
    }
    
    // 4. Comprobar si es necesario regar en Valencia
    console.log('\n4. Comprobar necesidad de riego en Valencia:');
    try {
      const infoRiego = await cliente.shouldIrrigate(SpanishRegion.COMUNIDAD_VALENCIANA);
      console.log(`- ¿Se debe regar? ${infoRiego.shouldIrrigate ? 'SÍ' : 'NO'}`);
      console.log(`- Razón: ${infoRiego.reason}`);
      if (infoRiego.recommendedAmount && esValorValido(infoRiego.recommendedAmount)) {
        console.log(`- Cantidad recomendada: ${infoRiego.recommendedAmount} mm`);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al comprobar necesidad de riego:', errorMsg);
    }
    
    // 5. Comprobar riesgo de heladas en Castilla y León
    console.log('\n5. Riesgo de heladas en Castilla y León:');
    try {
      const riesgoHeladas = await cliente.checkFrostRisk(SpanishRegion.CASTILLA_Y_LEON);
      console.log(`- Nivel de riesgo: ${riesgoHeladas.riskLevel}`);
      console.log(`- Mensaje: ${riesgoHeladas.message}`);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al comprobar riesgo de heladas:', errorMsg);
    }
    
    // 6. Evaluar condiciones para siembra en Cataluña
    console.log('\n6. Condiciones para siembra en Cataluña:');
    try {
      const condicionesSiembra = await cliente.checkPlantingConditions(SpanishRegion.CATALUNNA);
      console.log(`- ¿Condiciones óptimas? ${condicionesSiembra.isOptimal ? 'SÍ' : 'NO'}`);
      console.log(`- Mensaje: ${condicionesSiembra.message}`);
      console.log('- Detalles:');
      console.log(`  * Humedad del suelo: ${formatearValor(condicionesSiembra.details.soilMoisture, '%', 0)}`);
      console.log(`  * Temperatura del suelo: ${formatearValor(condicionesSiembra.details.soilTemperature, '°C')}`);
      console.log(`  * Precipitación reciente: ${formatearValor(condicionesSiembra.details.rain, 'mm')}`);
      console.log(`  * ¿Lluvia prevista? ${condicionesSiembra.details.forecastRain ? 'SÍ' : 'NO'}`);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al evaluar condiciones de siembra:', errorMsg);
    }
    
    // 7. Obtener datos personalizados para coordenadas específicas
    console.log('\n7. Datos personalizados para coordenadas específicas (Sierra Nevada):');
    try {
      const datosSierraNevada = await cliente.getWeatherData({
        coordinates: { latitude: 37.054, longitude: -3.372 }, // Sierra Nevada
        startDate: fechaInicioStr,
        endDate: fechaFinStr,
        parameters: [
          MeteoParam.T2M,
          MeteoParam.T2M_MIN,
          MeteoParam.T2M_MAX,
          MeteoParam.PRECTOTCORR,
          MeteoParam.WS10M,
          MeteoParam.RH2M
        ]
      });
      
      console.log(`- Se obtuvieron datos para ${datosSierraNevada.length} días`);
      
      if (datosSierraNevada.length > 0) {
        const ultimoDia = datosSierraNevada[datosSierraNevada.length - 1];
        console.log('- Muestra del último día:', {
          fecha: ultimoDia.date,
          temperatura: formatearValor(ultimoDia.temperature, '°C'),
          precipitacion: formatearValor(ultimoDia.precipitation, 'mm'),
          velocidadViento: formatearValor(ultimoDia.windSpeed, 'm/s')
        });
      } else {
        console.log('- No se obtuvieron datos para Sierra Nevada');
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al obtener datos personalizados:', errorMsg);
    }
    
    console.log('\n===== EJEMPLO COMPLETADO =====');
    
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('ERROR GENERAL EN EL EJEMPLO:', errorMsg);
  }
}

// Ejecutar el ejemplo
ejemploNasaPower().catch((error: unknown) => {
  const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
  console.error('Error al ejecutar el ejemplo:', errorMsg);
});

// Para ejecutar este ejemplo:
// ts-node ejemplos/nasa-power-ejemplo.ts 