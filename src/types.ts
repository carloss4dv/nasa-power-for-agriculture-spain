/**
 * Tipos para la API de NASA POWER
 */

/**
 * Coordenadas geográficas
 */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Comunidades autónomas de España con sus coordenadas aproximadas
 */
export enum SpanishRegion {
  ANDALUCIA = 'Andalucía',
  ARAGON = 'Aragón',
  ASTURIAS = 'Asturias',
  BALEARES = 'Islas Baleares',
  CANARIAS = 'Islas Canarias',
  CANTABRIA = 'Cantabria',
  CASTILLA_LA_MANCHA = 'Castilla-La Mancha',
  CASTILLA_Y_LEON = 'Castilla y León',
  CATALUNNA = 'Catalunna',
  EXTREMADURA = 'Extremadura',
  GALICIA = 'Galicia',
  MADRID = 'Madrid',
  MURCIA = 'Murcia',
  NAVARRA = 'Navarra',
  PAIS_VASCO = 'País Vasco',
  LA_RIOJA = 'La Rioja',
  COMUNIDAD_VALENCIANA = 'Comunidad Valenciana',
  CEUTA = 'Ceuta',
  MELILLA = 'Melilla'
}

/**
 * Mapa de coordenadas por región española
 */
export const SPANISH_REGION_COORDINATES: Record<SpanishRegion, GeoCoordinates> = {
  [SpanishRegion.ANDALUCIA]: { latitude: 37.5, longitude: -4.5 },
  [SpanishRegion.ARAGON]: { latitude: 41.5, longitude: -0.5 },
  [SpanishRegion.ASTURIAS]: { latitude: 43.3, longitude: -6.0 },
  [SpanishRegion.BALEARES]: { latitude: 39.5, longitude: 3.0 },
  [SpanishRegion.CANARIAS]: { latitude: 28.3, longitude: -16.5 },
  [SpanishRegion.CANTABRIA]: { latitude: 43.2, longitude: -4.0 },
  [SpanishRegion.CASTILLA_LA_MANCHA]: { latitude: 39.5, longitude: -3.0 },
  [SpanishRegion.CASTILLA_Y_LEON]: { latitude: 41.8, longitude: -4.5 },
  [SpanishRegion.CATALUNNA]: { latitude: 41.8, longitude: 1.5 },
  [SpanishRegion.EXTREMADURA]: { latitude: 39.0, longitude: -6.0 },
  [SpanishRegion.GALICIA]: { latitude: 42.5, longitude: -8.0 },
  [SpanishRegion.MADRID]: { latitude: 40.4, longitude: -3.7 },
  [SpanishRegion.MURCIA]: { latitude: 38.0, longitude: -1.5 },
  [SpanishRegion.NAVARRA]: { latitude: 42.8, longitude: -1.6 },
  [SpanishRegion.PAIS_VASCO]: { latitude: 43.0, longitude: -2.5 },
  [SpanishRegion.LA_RIOJA]: { latitude: 42.3, longitude: -2.5 },
  [SpanishRegion.COMUNIDAD_VALENCIANA]: { latitude: 39.5, longitude: -0.5 },
  [SpanishRegion.CEUTA]: { latitude: 35.9, longitude: -5.3 },
  [SpanishRegion.MELILLA]: { latitude: 35.3, longitude: -2.9 }
};

/**
 * Parámetros meteorológicos disponibles en la API de NASA POWER
 */
export enum MeteoParam {
  // Parámetros de temperatura
  T2M = 'T2M',                    // Temperatura media a 2m
  T2M_MAX = 'T2M_MAX',            // Temperatura máxima a 2m
  T2M_MIN = 'T2M_MIN',            // Temperatura mínima a 2m
  T2MDEW = 'T2MDEW',              // Temperatura de punto de rocío a 2m
  T2MWET = 'T2MWET',              // Temperatura de bulbo húmedo a 2m
  
  // Parámetros de humedad
  RH2M = 'RH2M',                  // Humedad relativa a 2m
  RH2M_HR = 'RH2M_HR',            // Humedad relativa máxima a 2m 
  
  // Parámetros de precipitación
  PRECTOTCORR = 'PRECTOTCORR',    // Precipitación total corregida
  
  // Parámetros de viento
  WS10M = 'WS10M',                // Velocidad del viento a 10m
  WD10M = 'WD10M',                // Dirección del viento a 10m
  
  // Parámetros de presión
  PS = 'PS',                      // Presión superficial
  
  // Parámetros de nubosidad
  CLOUD_AMT = 'CLOUD_AMT',        // Cantidad de nubes
  
  // Parámetros de radiación
  ALLSKY_SFC_SW_DWN = 'ALLSKY_SFC_SW_DWN',  // Radiación solar descendente
  ALLSKY_SFC_PAR_TOT = 'ALLSKY_SFC_PAR_TOT', // Radiación fotosintéticamente activa total
  
  // Parámetros de suelo - temperatura
  TSOIL1 = 'TSOIL1',              // Temperatura del suelo en primera capa
  TSOIL2 = 'TSOIL2',              // Temperatura del suelo en segunda capa
  
  // Parámetros de humedad del suelo (mantener compatibilidad)
  GWETROOT = 'GWETROOT',          // Humedad de la zona de raíces
  GWETTOP = 'GWETTOP',            // Humedad de la capa superior
  GWETPROF = 'GWETPROF',          // Humedad del perfil del suelo
  
  // Parámetros de evaporación
  EVLAND = 'EVLAND'               // Evaporación sobre tierra
}

/**
 * Formato de respuesta de la API
 */
export enum ResponseFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  ASCII = 'ASCII'
}

/**
 * Opciones para las peticiones a la API
 */
export interface ApiRequestOptions {
  coordinates: GeoCoordinates;
  startDate: string; // Formato YYYYMMDD
  endDate: string; // Formato YYYYMMDD
  parameters: MeteoParam[];
  format?: ResponseFormat;
  community?: string; // Por defecto 'SB' (Science/Research & Education)
}

/**
 * Datos meteorológicos diarios
 */
export interface DailyWeatherData {
  date: string;
  temperature?: number;
  maxTemperature?: number;
  minTemperature?: number;
  precipitation?: number;
  humidity?: number;
  maxHumidity?: number;
  minHumidity?: number;
  windSpeed?: number;
  windDirection?: number;
  pressure?: number;
  cloudCover?: number;
  solarRadiation?: number;
  soilTemperature?: number;
  deepSoilTemperature?: number;
  soilMoisture?: number;
  rootZoneMoisture?: number;
  topSoilMoisture?: number;
  evapotranspiration?: number;
  parRadiation?: number;
  growingDegreeDays?: number;
  frostDays?: number;
  wetDays?: number;
  soilMoistureProfile?: number;
  dewPoint?: number;
  wetBulbTemperature?: number;
}

/**
 * Índices agroclimáticos
 */
export interface AgroClimateIndices {
  droughtIndex?: number | 'no definido';
  heatStressIndex?: number | 'no definido';
  freezeRisk?: number | 'no definido';
  diseaseRisk?: number | 'no definido';
  irrigationNeed?: number | 'no definido';
  optimalPlantingConditions?: boolean | 'no definido';
  harvestConditions?: 'Buenas' | 'Regulares' | 'Malas' | 'no definido';
}

/**
 * Recomendaciones agrícolas basadas en datos meteorológicos
 */
export interface AgriculturalRecommendations {
  irrigation: {
    recommended: boolean;
    amount: number;
    message: string;
  };
  pestControl: {
    recommended: boolean;
    riskLevel: 'bajo' | 'medio' | 'alto' | 'no definido';
    message: string;
  };
  fertilization: {
    recommended: boolean;
    message: string;
  };
  fieldOperations: {
    canWork: boolean; // Indica si se puede trabajar en el campo
    message: string;
  };
  planting: {
    recommended: boolean | 'no definido';
    message: string;
  };
  harvesting: {
    recommended: boolean;
    message: string;
  };
}

/**
 * Respuesta de la API NASA POWER
 */
export interface NasaPowerResponse {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    parameter: {
      [paramName: string]: {
        [date: string]: number;
      };
    };
  };
  header: {
    title: string;
    api: {
      version: string;
      name: string;
    };
    sources: string[];
    fill_value: number;
    time_standard: string;
    start: string;
    end: string;
  };
  messages: string[];
  parameters: {
    [paramName: string]: {
      units: string;
      longname: string;
    };
  };
  times: {
    data: number;
    process: number;
  };
} 