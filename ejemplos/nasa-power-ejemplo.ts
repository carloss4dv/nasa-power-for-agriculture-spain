import { NasaPowerClient } from '../src/nasa-power-client';
import { 
  SpanishRegion, 
  MeteoParam, 
  DailyWeatherData 
} from '../src/types';
import {
  formatDateToYYYYMMDD,
  parseYYYYMMDDToDate,
  checkWeatherAlert,
  calculateWaterStressIndex,
  estimateCropPotential,
  generateAgriculturalCalendar
} from '../src/index';

/**
 * Verifica si un valor es válido (no es un "fill value" de la API)
 * @param valor Valor a verificar
 * @returns true si el valor es válido, false si es un "fill value"
 */
function esValorValido(valor: number | 'no definido' | undefined): boolean {
  return valor !== undefined && valor !== -999 && valor !== 'no definido';
}

/**
 * Formatea un valor numérico para su visualización
 * @param valor Valor a formatear
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
 * Genera un resumen de condiciones meteorológicas para un día específico
 * @param dia Datos meteorológicos del día
 * @returns Resumen formateado de las condiciones meteorológicas
 */
function generarResumenMeteorologico(dia: DailyWeatherData): string {
  const partes = [];
  
  if (dia.temperature !== undefined) {
    partes.push(`Temperatura: ${formatearValor(dia.temperature, '°C')}`);
  }
  
  if (dia.maxTemperature !== undefined) {
    partes.push(`Máx: ${formatearValor(dia.maxTemperature, '°C')}`);
  }
  
  if (dia.minTemperature !== undefined) {
    partes.push(`Mín: ${formatearValor(dia.minTemperature, '°C')}`);
  }
  
  if (dia.precipitation !== undefined) {
    partes.push(`Precipitación: ${formatearValor(dia.precipitation, 'mm')}`);
  }
  
  if (dia.humidity !== undefined) {
    partes.push(`Humedad: ${formatearValor(dia.humidity, '%', 0)}`);
  }
  
  if (dia.windSpeed !== undefined) {
    partes.push(`Viento: ${formatearValor(dia.windSpeed, 'm/s')}`);
  }
  
  return partes.join(' | ');
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
    
    const fechaInicioStr = formatDateToYYYYMMDD(fechaInicio);
    const fechaFinStr = formatDateToYYYYMMDD(fechaFin);
    
    console.log(`Periodo de análisis: ${fechaInicioStr} a ${fechaFinStr}`);
    console.log(`(${fechaInicio.toLocaleDateString()} a ${fechaFin.toLocaleDateString()})`);
    
    // 1. Obtener datos meteorológicos básicos para Madrid
    console.log('\n1. Datos meteorológicos básicos para Madrid:');
    try {
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
        
        // Mostrar alertas para el último día
        const ultimoDia = datosMadrid[datosMadrid.length - 1];
        const alertas = checkWeatherAlert(ultimoDia);
        
        if (alertas.hasAlert) {
          console.log('\n⚠️ Se han detectado las siguientes alertas:');
          alertas.alerts.forEach(alerta => console.log(`  - ${alerta}`));
        } else {
          console.log('\n✅ No se han detectado alertas meteorológicas');
        }
      } else {
        console.log('- No se obtuvieron datos para Madrid');
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al obtener datos para Madrid:', errorMsg);
    }
    
    // 2. Comprobar si está lloviendo en Galicia
    console.log('\n2. Comprobando si estaba lloviendo en Galicia:');
    try {
      const estaLloviendo = await cliente.isRaining(SpanishRegion.GALICIA);
      console.log(`- ¿Estaba lloviendo en Galicia? ${estaLloviendo ? '🌧️ SÍ' : '☀️ NO'}`);
      
      // Obtener datos para hoy en Galicia
      const hoy = formatDateToYYYYMMDD(new Date());
      const datosGalicia = await cliente.getWeatherDataForSpanishRegion(
        SpanishRegion.GALICIA,
        hoy,
        hoy
      );
      
      if (datosGalicia.length > 0) {
        console.log(`- Condiciones actuales: ${generarResumenMeteorologico(datosGalicia[0])}`);
      }
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
      
      console.log(`- ¿Se debe regar? ${infoRiego.shouldIrrigate ? '💧 SÍ' : '❌ NO'}`);
      console.log(`- Razón: ${infoRiego.reason}`);
      
      if (infoRiego.recommendedAmount && esValorValido(infoRiego.recommendedAmount)) {
        console.log(`- Cantidad recomendada: ${infoRiego.recommendedAmount} mm`);
      }
      
      // Obtener datos para hoy en Valencia
      const hoy = formatDateToYYYYMMDD(new Date());
      const datosValencia = await cliente.getWeatherDataForSpanishRegion(
        SpanishRegion.COMUNIDAD_VALENCIANA,
        hoy,
        hoy
      );
      
      if (datosValencia.length > 0) {
        console.log('\n- Contexto meteorológico:');
        console.log(`  * Temperatura: ${formatearValor(datosValencia[0].temperature, '°C')}`);
        console.log(`  * Precipitación: ${formatearValor(datosValencia[0].precipitation, 'mm')}`);
        console.log(`  * Humedad del suelo: ${formatearValor(datosValencia[0].soilMoisture, '%')}`);
        console.log(`  * Evapotranspiración: ${formatearValor(datosValencia[0].evapotranspiration, 'mm')}`);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al comprobar necesidad de riego:', errorMsg);
    }
    
    // 5. Comprobar riesgo de heladas en Castilla y León
    console.log('\n5. Riesgo de heladas en Castilla y León:');
    try {
      const riesgoHeladas = await cliente.checkFrostRisk(SpanishRegion.CASTILLA_Y_LEON);
      
      // Determinar emoji según nivel de riesgo
      let emojiRiesgo = '❓';
      if (riesgoHeladas.riskLevel === 'alto') emojiRiesgo = '❄️';
      else if (riesgoHeladas.riskLevel === 'medio') emojiRiesgo = '🥶';
      else if (riesgoHeladas.riskLevel === 'bajo') emojiRiesgo = '✅';
      
      console.log(`- Nivel de riesgo: ${emojiRiesgo} ${riesgoHeladas.riskLevel.toUpperCase()}`);
      console.log(`- Mensaje: ${riesgoHeladas.message}`);
      
      // Obtener datos para hoy en Castilla y León
      const hoy = formatDateToYYYYMMDD(new Date());
      const datosCastillaLeon = await cliente.getWeatherDataForSpanishRegion(
        SpanishRegion.CASTILLA_Y_LEON,
        hoy,
        hoy
      );
      
      if (datosCastillaLeon.length > 0) {
        console.log('\n- Contexto meteorológico:');
        console.log(`  * Temperatura actual: ${formatearValor(datosCastillaLeon[0].temperature, '°C')}`);
        console.log(`  * Temperatura mínima: ${formatearValor(datosCastillaLeon[0].minTemperature, '°C')}`);
        console.log(`  * Temperatura del suelo: ${formatearValor(datosCastillaLeon[0].soilTemperature, '°C')}`);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al comprobar riesgo de heladas:', errorMsg);
    }
    
    // 6. Evaluar condiciones para siembra en Cataluña
    console.log('\n6. Condiciones para siembra en Cataluña:');
    try {
      const condicionesSiembra = await cliente.checkPlantingConditions(SpanishRegion.CATALUNNA);
      
      console.log(`- ¿Condiciones óptimas? ${condicionesSiembra.isOptimal ? '✅ SÍ' : '❌ NO'}`);
      console.log(`- Mensaje: ${condicionesSiembra.message}`);
      
      console.log('\n- Detalles:');
      console.log(`  * Humedad del suelo: ${formatearValor(condicionesSiembra.details.soilMoisture, '%', 0)}`);
      console.log(`  * Temperatura del suelo: ${formatearValor(condicionesSiembra.details.soilTemperature, '°C')}`);
      console.log(`  * Precipitación reciente: ${formatearValor(condicionesSiembra.details.rain, 'mm')}`);
      console.log(`  * ¿Lluvia prevista? ${condicionesSiembra.details.forecastRain ? '🌧️ SÍ' : '☀️ NO'}`);
      
      // Recomendaciones específicas según condiciones
      console.log('\n- Recomendaciones para siembra:');
      
      if (condicionesSiembra.isOptimal) {
        console.log('  * ✅ Condiciones favorables para siembra. Proceder con la operación.');
      } else {
        console.log('  * ❌ No se recomienda sembrar en las condiciones actuales.');
        
        // Sugerir cuándo podrían mejorar las condiciones
        if (condicionesSiembra.details.soilMoisture && condicionesSiembra.details.soilMoisture < 30) {
          console.log('  * 💡 Considerar regar antes de sembrar para aumentar la humedad del suelo.');
        }
        
        if (condicionesSiembra.details.soilTemperature && condicionesSiembra.details.soilTemperature < 10) {
          console.log('  * 💡 Esperar a que aumente la temperatura del suelo para mejor germinación.');
        }
        
        if (condicionesSiembra.details.forecastRain) {
          console.log('  * 💡 Esperar a que pase el periodo de lluvia previsto.');
        }
      }
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
        
        // Análisis adicional: estadísticas básicas
        // Calcular promedios
        const tempPromedio = datosSierraNevada.reduce((sum, dia) => 
          sum + (dia.temperature || 0), 0) / datosSierraNevada.length;
        
        const precipTotal = datosSierraNevada.reduce((sum, dia) => 
          sum + (dia.precipitation || 0), 0);
        
        const tempMax = Math.max(...datosSierraNevada
          .map(dia => dia.maxTemperature || -Infinity));
        
        const tempMin = Math.min(...datosSierraNevada
          .filter(dia => dia.minTemperature !== undefined)
          .map(dia => dia.minTemperature || Infinity));
        
        console.log('\n- Estadísticas del periodo:');
        console.log(`  * Temperatura promedio: ${tempPromedio.toFixed(1)}°C`);
        console.log(`  * Temperatura máxima: ${tempMax.toFixed(1)}°C`);
        console.log(`  * Temperatura mínima: ${tempMin.toFixed(1)}°C`);
        console.log(`  * Precipitación total: ${precipTotal.toFixed(1)}mm`);
      } else {
        console.log('- No se obtuvieron datos para Sierra Nevada');
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al obtener datos personalizados:', errorMsg);
    }
    
    // 8. Ejemplo de cálculo de estrés hídrico
    console.log('\n8. Cálculo de estrés hídrico para viñedos:');
    try {
      // Simulamos datos para un viñedo en La Rioja
      const precipitacion = 2.5; // mm/día
      const evapotranspiracion = 4.8; // mm/día
      const humedadSuelo = 35; // %
      
      // Calcular el índice de estrés hídrico
      const estresHidrico = calculateWaterStressIndex(
        precipitacion,
        evapotranspiracion,
        humedadSuelo
      );
      
      // Determinar emoji según nivel de estrés
      let emojiEstres = '❓';
      if (estresHidrico.status === 'óptimo') emojiEstres = '✅';
      else if (estresHidrico.status === 'leve') emojiEstres = '🟡';
      else if (estresHidrico.status === 'moderado') emojiEstres = '🟠';
      else if (estresHidrico.status === 'severo') emojiEstres = '🔴';
      
      console.log(`- Índice de estrés: ${estresHidrico.stressIndex.toFixed(2)} / 10`);
      console.log(`- Estado: ${emojiEstres} ${estresHidrico.status.toUpperCase()}`);
      console.log(`- Recomendación: ${estresHidrico.recommendation}`);
      
      // Datos meteorológicos relevantes
      console.log('\n- Datos relevantes:');
      console.log(`  * Precipitación: ${precipitacion.toFixed(1)} mm`);
      console.log(`  * Evapotranspiración: ${evapotranspiracion.toFixed(1)} mm`);
      console.log(`  * Humedad del suelo: ${humedadSuelo.toFixed(1)}%`);
      console.log(`  * Balance hídrico: ${(precipitacion - evapotranspiracion).toFixed(1)} mm`);
      
      // Recomendaciones específicas para viñedo
      console.log('\n- Recomendaciones específicas para viñedo:');
      if (estresHidrico.status === 'severo') {
        console.log('  * Aplicar riego de emergencia para evitar daños permanentes');
      } else if (estresHidrico.status === 'moderado') {
        console.log('  * Considerar riego deficitario controlado para mejorar calidad');
      } else {
        console.log('  * Mantener monitoreo de humedad en zona de raíces');
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al calcular estrés hídrico:', errorMsg);
    }
    
    // 9. Ejemplo de estimación de potencial de cultivo
    console.log('\n9. Estimación de potencial para cultivo de cereales:');
    try {
      // Simulamos datos meteorológicos para una semana
      const datosSimulados: DailyWeatherData[] = [
        {
          date: '20230101',
          temperature: 12,
          maxTemperature: 18,
          minTemperature: 5,
          precipitation: 0,
          humidity: 65,
          soilMoisture: 45,
          soilTemperature: 10
        },
        {
          date: '20230102',
          temperature: 13,
          maxTemperature: 19,
          minTemperature: 6,
          precipitation: 0,
          humidity: 60,
          soilMoisture: 42,
          soilTemperature: 11
        },
        {
          date: '20230103',
          temperature: 14,
          maxTemperature: 20,
          minTemperature: 7,
          precipitation: 5,
          humidity: 75,
          soilMoisture: 50,
          soilTemperature: 12
        },
        {
          date: '20230104',
          temperature: 12,
          maxTemperature: 17,
          minTemperature: 6,
          precipitation: 10,
          humidity: 85,
          soilMoisture: 60,
          soilTemperature: 11
        },
        {
          date: '20230105',
          temperature: 10,
          maxTemperature: 15,
          minTemperature: 4,
          precipitation: 2,
          humidity: 70,
          soilMoisture: 55,
          soilTemperature: 10
        }
      ];
      
      // Estimar potencial para cultivo de cereales
      const potencialCereales = estimateCropPotential(datosSimulados, 'cereal');
      
      // Determinar emoji según potencial
      let emojiPotencial = '❓';
      if (potencialCereales.potentialYield === 'alto') emojiPotencial = '🟢';
      else if (potencialCereales.potentialYield === 'medio') emojiPotencial = '🟡';
      else if (potencialCereales.potentialYield === 'bajo') emojiPotencial = '🔴';
      
      console.log(`- Rendimiento potencial: ${emojiPotencial} ${potencialCereales.potentialYield.toUpperCase()}`);
      
      // Mostrar factores limitantes
      if (potencialCereales.limitingFactors.length > 0) {
        console.log('\n- Factores limitantes:');
        potencialCereales.limitingFactors.forEach(factor => 
          console.log(`  * ❌ ${factor}`)
        );
      } else {
        console.log('\n- ✅ No se identificaron factores limitantes significativos');
      }
      
      // Mostrar recomendaciones
      console.log('\n- Recomendaciones:');
      potencialCereales.recommendations.forEach(recomendacion => 
        console.log(`  * 💡 ${recomendacion}`)
      );
      
      // Estadísticas relevantes
      const tempPromedio = datosSimulados.reduce((sum, dia) => 
        sum + (dia.temperature || 0), 0) / datosSimulados.length;
      
      const precipTotal = datosSimulados.reduce((sum, dia) => 
        sum + (dia.precipitation || 0), 0);
      
      console.log('\n- Estadísticas relevantes:');
      console.log(`  * Temperatura promedio: ${tempPromedio.toFixed(1)}°C (óptimo: 8-22°C)`);
      console.log(`  * Precipitación total: ${precipTotal.toFixed(1)}mm (óptimo: >200mm)`);
      
      // Decisión basada en el potencial
      console.log('\n- CONCLUSIÓN:');
      if (potencialCereales.potentialYield === 'alto') {
        console.log('  * Condiciones favorables para la siembra de cereales.');
      } else if (potencialCereales.potentialYield === 'medio') {
        console.log('  * Considerar la implementación de las recomendaciones antes de sembrar.');
      } else {
        console.log('  * Evaluar cultivos alternativos más adaptados a las condiciones actuales.');
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al estimar potencial de cultivo:', errorMsg);
    }
    
    // 10. Ejemplo de generación de calendario agrícola
    console.log('\n10. Calendario de actividades para olivar:');
    try {
      // Simulamos datos de pronóstico para 5 días
      const pronosticoSimulado: DailyWeatherData[] = [
        {
          date: '20230201',
          temperature: 14,
          maxTemperature: 19,
          minTemperature: 8,
          precipitation: 0,
          humidity: 55,
          soilMoisture: 40,
          soilTemperature: 12,
          windSpeed: 5
        },
        {
          date: '20230202',
          temperature: 15,
          maxTemperature: 20,
          minTemperature: 9,
          precipitation: 0,
          humidity: 50,
          soilMoisture: 38,
          soilTemperature: 13,
          windSpeed: 8
        },
        {
          date: '20230203',
          temperature: 16,
          maxTemperature: 22,
          minTemperature: 10,
          precipitation: 0,
          humidity: 45,
          soilMoisture: 35,
          soilTemperature: 14,
          windSpeed: 12
        },
        {
          date: '20230204',
          temperature: 14,
          maxTemperature: 18,
          minTemperature: 9,
          precipitation: 15,
          humidity: 80,
          soilMoisture: 60,
          soilTemperature: 12,
          windSpeed: 15
        },
        {
          date: '20230205',
          temperature: 12,
          maxTemperature: 16,
          minTemperature: 7,
          precipitation: 5,
          humidity: 75,
          soilMoisture: 55,
          soilTemperature: 11,
          windSpeed: 10
        }
      ];
      
      // Generar calendario de actividades para olivar
      const calendario = generateAgriculturalCalendar(
        'Andalucía',
        pronosticoSimulado,
        'olivo'
      );
      
      console.log('- CALENDARIO DE ACTIVIDADES PARA OLIVAR EN ANDALUCÍA:');
      console.log('  ================================================');
      
      calendario.nextDays.forEach(dia => {
        const fechaLegible = parseYYYYMMDDToDate(dia.date).toLocaleDateString();
        console.log(`\n  📅 ${fechaLegible}:`);
        console.log(`  🌤️ Condiciones: ${dia.weatherSummary}`);
        
        console.log('\n  ✅ Actividades recomendadas:');
        if (dia.recommendedActivities.length > 0) {
          dia.recommendedActivities.forEach(actividad => console.log(`    - ${actividad}`));
        } else {
          console.log('    - Ninguna actividad recomendada para este día');
        }
        
        console.log('\n  ❌ Actividades NO recomendadas:');
        dia.notRecommendedActivities.forEach(actividad => console.log(`    - ${actividad}`));
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.log('- Error al generar calendario de actividades:', errorMsg);
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

/*
Para ejecutar este ejemplo:
1. Asegúrate de tener todas las dependencias instaladas:
   npm install

2. Ejecuta el ejemplo con ts-node:
   npx ts-node ejemplos/nasa-power-ejemplo-corregido.ts
*/
