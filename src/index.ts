// Importamos el tipo DailyWeatherData para usarlo en las funciones
import { 
  AgroClimateIndices, 
  AgriculturalRecommendations, 
  DailyWeatherData 
} from './types';

// Exportamos la clase principal
export { NasaPowerClient } from './nasa-power-client';

// Exportamos los tipos necesarios
export {
  GeoCoordinates,
  SpanishRegion,
  SPANISH_REGION_COORDINATES,
  MeteoParam,
  ResponseFormat,
  ApiRequestOptions,
  DailyWeatherData,
  NasaPowerResponse,
  AgroClimateIndices,
  AgriculturalRecommendations
} from './types';

// Exportamos funciones útiles
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}${month}${day}`;
}

export function parseYYYYMMDDToDate(dateString: string): Date {
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10) - 1;
  const day = parseInt(dateString.substring(6, 8), 10);
  
  return new Date(year, month, day);
}

// Función para comprobar si hay alguna alerta meteorológica
export function checkWeatherAlert(weatherData: DailyWeatherData): {
  hasAlert: boolean;
  alerts: string[];
} {
  const alerts: string[] = [];
  
  // Comprobamos si hay precipitación excesiva (posible inundación)
  if (weatherData.precipitation && weatherData.precipitation > 50) {
    alerts.push('Alerta por precipitación excesiva: posible inundación');
  }
  
  // Comprobamos si hay vientos fuertes
  if (weatherData.windSpeed && weatherData.windSpeed > 15) {
    alerts.push('Alerta por vientos fuertes');
  }
  
  // Comprobamos si hay temperaturas extremas
  if (weatherData.maxTemperature && weatherData.maxTemperature > 40) {
    alerts.push('Alerta por calor extremo');
  }
  
  if (weatherData.minTemperature && weatherData.minTemperature < 0) {
    alerts.push('Alerta por temperaturas bajo cero: riesgo de heladas');
  }
  
  // Nuevas alertas agrícolas
  if (weatherData.soilMoisture && weatherData.soilMoisture < 15) {
    alerts.push('Alerta por sequía en el suelo: cultivos en riesgo');
  }
  
  if (weatherData.soilMoisture && weatherData.soilMoisture > 85) {
    alerts.push('Alerta por exceso de humedad en el suelo: riesgo de enfermedades radiculares');
  }
  
  if (weatherData.humidity && weatherData.temperature) {
    // Alta humedad y temperatura moderada: condiciones para enfermedades fúngicas
    if (weatherData.humidity > 85 && weatherData.temperature > 18 && weatherData.temperature < 30) {
      alerts.push('Alerta por condiciones favorables para enfermedades fúngicas');
    }
  }
  
  return {
    hasAlert: alerts.length > 0,
    alerts
  };
}

// Función para calcular el índice de estrés hídrico
export function calculateWaterStressIndex(
  precipitation: number,
  evapotranspiration: number,
  soilMoisture: number
): {
  stressIndex: number; // 0-10 (0: sin estrés, 10: estrés extremo)
  status: 'óptimo' | 'leve' | 'moderado' | 'severo';
  recommendation: string;
} {
  // Calculamos el balance hídrico
  const waterBalance = precipitation - evapotranspiration;
  
  // Índice basado en balance hídrico y humedad del suelo actual
  let stressIndex = Math.max(0, Math.min(10, 5 - waterBalance - (soilMoisture / 20)));
  
  // Determinamos el estado basado en el índice
  let status: 'óptimo' | 'leve' | 'moderado' | 'severo';
  let recommendation: string;
  
  if (stressIndex < 3) {
    status = 'óptimo';
    recommendation = 'No es necesario regar. Condiciones hídricas adecuadas.';
  } else if (stressIndex < 5) {
    status = 'leve';
    recommendation = 'Monitorear la humedad del suelo. Riego ligero recomendado si no hay previsión de lluvia.';
  } else if (stressIndex < 7.5) {
    status = 'moderado';
    recommendation = 'Estrés hídrico moderado. Se recomienda riego para evitar daños a los cultivos.';
  } else {
    status = 'severo';
    recommendation = 'Estrés hídrico severo. Riego urgente para evitar pérdidas significativas.';
  }
  
  return {
    stressIndex,
    status,
    recommendation
  };
}

// Función para estimar el rendimiento potencial basado en condiciones meteorológicas
export function estimateCropPotential(
  weatherData: DailyWeatherData[],
  cropType: 'cereal' | 'hortícola' | 'frutal' | 'olivo' | 'viñedo'
): {
  potentialYield: 'alto' | 'medio' | 'bajo';
  limitingFactors: string[];
  recommendations: string[];
} {
  if (weatherData.length === 0) {
    return {
      potentialYield: 'medio',
      limitingFactors: ['Datos insuficientes para una estimación precisa'],
      recommendations: ['Recolectar más datos meteorológicos']
    };
  }
  
  const limitingFactors: string[] = [];
  const recommendations: string[] = [];
  
  // Calculamos promedios y valores extremos
  const avgTemp = weatherData.reduce((sum, data) => sum + (data.temperature || 0), 0) / weatherData.length;
  const avgSoilMoisture = weatherData.reduce((sum, data) => sum + (data.soilMoisture || 0), 0) / weatherData.length;
  const totalRain = weatherData.reduce((sum, data) => sum + (data.precipitation || 0), 0);
  const maxTemp = Math.max(...weatherData.map(data => data.maxTemperature || 0));
  const minTemp = Math.min(...weatherData.map(data => data.minTemperature || 0));
  
  // Evaluación basada en el tipo de cultivo
  switch (cropType) {
    case 'cereal':
      if (totalRain < 200) {
        limitingFactors.push('Precipitación insuficiente para cereales');
        recommendations.push('Implementar riego suplementario');
      }
      if (avgTemp < 8 || avgTemp > 22) {
        limitingFactors.push('Temperatura media fuera del rango óptimo para cereales');
        recommendations.push('Considerar variedades adaptadas a las condiciones locales');
      }
      break;
      
    case 'hortícola':
      if (avgSoilMoisture < 40) {
        limitingFactors.push('Humedad de suelo insuficiente para cultivos hortícolas');
        recommendations.push('Aumentar frecuencia de riego');
      }
      if (maxTemp > 35) {
        limitingFactors.push('Temperaturas máximas excesivas para hortícolas');
        recommendations.push('Considerar sombreo o cultivo protegido');
      }
      break;
      
    case 'frutal':
      if (minTemp < -2) {
        limitingFactors.push('Riesgo de daño por heladas en frutales');
        recommendations.push('Implementar sistemas de protección contra heladas');
      }
      // Comprobamos acumulación de horas-frío si hay suficientes datos
      if (weatherData.length > 30) {
        const coldHours = weatherData.filter(data => (data.temperature || 0) < 7).length * 24;
        if (coldHours < 200) {
          limitingFactors.push('Posible insuficiencia de horas-frío para frutales');
        }
      }
      break;
      
    case 'olivo':
      if (totalRain > 600) {
        limitingFactors.push('Precipitación excesiva para olivo');
        recommendations.push('Asegurar buen drenaje en suelo');
      }
      if (minTemp < -10) {
        limitingFactors.push('Temperaturas mínimas peligrosas para olivos');
        recommendations.push('Proteger árboles jóvenes en invierno');
      }
      break;
      
    case 'viñedo':
      if (avgSoilMoisture > 60) {
        limitingFactors.push('Humedad excesiva del suelo para viñedo');
        recommendations.push('Mejorar drenaje');
      }
      // Alta humedad ambiental aumenta riesgo de enfermedades en viñedo
      const highHumidityDays = weatherData.filter(data => (data.humidity || 0) > 75).length;
      if (highHumidityDays > weatherData.length * 0.5) {
        limitingFactors.push('Alta humedad ambiental: mayor riesgo de enfermedades fúngicas');
        recommendations.push('Implementar programa preventivo de control de mildiu y oídio');
      }
      break;
  }
  
  // Determinamos potencial de rendimiento según cantidad de factores limitantes
  let potentialYield: 'alto' | 'medio' | 'bajo';
  
  if (limitingFactors.length === 0) {
    potentialYield = 'alto';
    recommendations.push('Condiciones óptimas, mantener prácticas de manejo estándar');
  } else if (limitingFactors.length <= 2) {
    potentialYield = 'medio';
    recommendations.push('Implementar las recomendaciones para mitigar factores limitantes');
  } else {
    potentialYield = 'bajo';
    recommendations.push('Considerar rotación a cultivos más adaptados a las condiciones locales');
  }
  
  return {
    potentialYield,
    limitingFactors,
    recommendations
  };
}

// Función para generar calendario de actividades agrícolas basado en datos meteorológicos
export function generateAgriculturalCalendar(
  region: string,
  weatherForecast: DailyWeatherData[],
  cropType: string
): {
  nextDays: Array<{
    date: string;
    recommendedActivities: string[];
    notRecommendedActivities: string[];
    weatherSummary: string;
  }>;
} {
  const calendar = {
    nextDays: weatherForecast.map(day => {
      const recommendedActivities: string[] = [];
      const notRecommendedActivities: string[] = [];
      
      // Evaluamos condiciones para diferentes actividades
      
      // Condiciones para siembra
      if (
        (day.soilMoisture && day.soilMoisture >= 30 && day.soilMoisture <= 70) &&
        (day.soilTemperature && day.soilTemperature >= 10) &&
        (day.precipitation === undefined || day.precipitation < 5)
      ) {
        recommendedActivities.push('Siembra/trasplante');
      } else {
        notRecommendedActivities.push('Siembra/trasplante');
      }
      
      // Condiciones para fumigación/tratamientos
      if (
        (day.windSpeed === undefined || day.windSpeed < 10) &&
        (day.precipitation === undefined || day.precipitation < 1)
      ) {
        recommendedActivities.push('Aplicación de tratamientos fitosanitarios');
      } else {
        notRecommendedActivities.push('Aplicación de tratamientos fitosanitarios');
      }
      
      // Condiciones para cosecha
      if (
        (day.precipitation === undefined || day.precipitation < 1) &&
        (day.humidity === undefined || day.humidity < 70)
      ) {
        recommendedActivities.push('Cosecha');
      } else {
        notRecommendedActivities.push('Cosecha');
      }
      
      // Condiciones para riego
      let riegoRecomendacion = '';
      if (day.soilMoisture !== undefined && day.precipitation !== undefined) {
        if (day.soilMoisture < 30 && day.precipitation < 3) {
          recommendedActivities.push('Riego');
          riegoRecomendacion = 'Necesario';
        } else if (day.soilMoisture >= 30 && day.soilMoisture <= 60) {
          riegoRecomendacion = 'Opcional';
        } else {
          notRecommendedActivities.push('Riego');
          riegoRecomendacion = 'No recomendado';
        }
      }
      
      // Generamos resumen de condiciones meteorológicas
      let weatherSummary = `Temperatura: ${day.temperature?.toFixed(1)}°C`;
      if (day.precipitation !== undefined) {
        weatherSummary += `, Precipitación: ${day.precipitation.toFixed(1)} mm`;
      }
      if (day.humidity !== undefined) {
        weatherSummary += `, Humedad: ${day.humidity.toFixed(0)}%`;
      }
      if (day.soilMoisture !== undefined) {
        weatherSummary += `, Humedad suelo: ${day.soilMoisture.toFixed(0)}%`;
      }
      weatherSummary += `, Riego: ${riegoRecomendacion}`;
      
      return {
        date: day.date,
        recommendedActivities,
        notRecommendedActivities,
        weatherSummary
      };
    })
  };
  
  return calendar;
} 