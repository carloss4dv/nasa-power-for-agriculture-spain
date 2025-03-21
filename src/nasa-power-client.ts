import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AgroClimateIndices,
  AgriculturalRecommendations,
  ApiRequestOptions,
  DailyWeatherData,
  GeoCoordinates,
  MeteoParam,
  NasaPowerResponse,
  ResponseFormat,
  SPANISH_REGION_COORDINATES,
  SpanishRegion
} from './types';

/**
 * Cliente para la API de NASA POWER
 */
export class NasaPowerClient {
  private readonly apiBaseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point';
  private readonly axiosInstance: AxiosInstance;

  /**
   * Constructor
   */
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Obtiene datos meteorológicos para una ubicación específica
   * @param options Opciones de la petición
   * @returns Promesa con los datos meteorológicos
   */
  public async getWeatherData(options: ApiRequestOptions): Promise<DailyWeatherData[]> {
    try {
      const response = await this.makeApiRequest(options);
      return this.processApiResponse(response.data);
    } catch (error) {
      console.error('Error al obtener datos meteorológicos:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos meteorológicos para una región de España
   * @param region Región española
   * @param startDate Fecha de inicio (YYYYMMDD)
   * @param endDate Fecha de fin (YYYYMMDD)
   * @param parameters Parámetros meteorológicos a obtener
   * @returns Promesa con los datos meteorológicos
   */
  public async getWeatherDataForSpanishRegion(
    region: SpanishRegion,
    startDate: string,
    endDate: string,
    parameters: MeteoParam[] = [
      MeteoParam.T2M,
      MeteoParam.T2M_MAX,
      MeteoParam.T2M_MIN,
      MeteoParam.PRECTOTCORR,
      MeteoParam.RH2M,
      MeteoParam.WS10M,
      MeteoParam.TSOIL1,
      MeteoParam.TSOIL2,
      MeteoParam.EVLAND,
      MeteoParam.ALLSKY_SFC_PAR_TOT
    ]
  ): Promise<DailyWeatherData[]> {
    const coordinates = SPANISH_REGION_COORDINATES[region];
    
    if (!coordinates) {
      throw new Error(`No se encontraron coordenadas para la región: ${region}`);
    }

    return this.getWeatherData({
      coordinates,
      startDate,
      endDate,
      parameters,
      format: ResponseFormat.JSON,
      community: 'SB' // Science/Research & Education
    });
  }

  /**
   * Obtiene datos agroclimáticos completos para una región de España
   * @param region Región española
   * @param startDate Fecha de inicio (YYYYMMDD)
   * @param endDate Fecha de fin (YYYYMMDD)
   * @returns Datos meteorológicos con índices agroclimáticos y recomendaciones
   */
  public async getAgriculturalData(
    region: SpanishRegion,
    startDate: string,
    endDate: string
  ): Promise<{
    weatherData: DailyWeatherData[];
    indices: AgroClimateIndices[];
    recommendations: AgriculturalRecommendations[];
  }> {
    // Limitamos a un máximo de 20 parámetros según la documentación de la API
    // Obtenemos los 20 parámetros más importantes para la agricultura
    const parameters = [
      MeteoParam.T2M,
      MeteoParam.T2M_MAX,
      MeteoParam.T2M_MIN,
      MeteoParam.PRECTOTCORR,
      MeteoParam.RH2M,
      MeteoParam.WS10M,
      MeteoParam.WD10M,
      MeteoParam.PS,
      MeteoParam.CLOUD_AMT,
      MeteoParam.ALLSKY_SFC_SW_DWN,
      MeteoParam.TSOIL1,
      MeteoParam.TSOIL2,
      MeteoParam.GWETROOT,
      MeteoParam.GWETTOP,
      MeteoParam.EVLAND,
      MeteoParam.ALLSKY_SFC_PAR_TOT,
      MeteoParam.T2MDEW,
      MeteoParam.T2MWET
    ];

    const weatherData = await this.getWeatherDataForSpanishRegion(
      region,
      startDate,
      endDate,
      parameters
    );

    // Calculamos los índices agroclimáticos
    const indices = weatherData.map(data => this.calculateAgroClimateIndices(data));
    
    // Generamos recomendaciones
    const recommendations = weatherData.map((data, index) => 
      this.generateRecommendations(data, indices[index])
    );

    return {
      weatherData,
      indices,
      recommendations
    };
  }

  /**
   * Comprueba si está lloviendo en una región española
   * @param region Región española
   * @returns Promesa que indica si está lloviendo (true) o no (false)
   */
  public async isRaining(region: SpanishRegion): Promise<boolean> {
    // Obtenemos los datos de hoy
    const today = new Date();
    const formattedDate = this.formatDate(today);
    
    const weatherData = await this.getWeatherDataForSpanishRegion(
      region,
      formattedDate,
      formattedDate,
      [MeteoParam.PRECTOTCORR]
    );
    
    if (weatherData.length === 0) {
      throw new Error('No se obtuvieron datos meteorológicos');
    }
    
    // Si la precipitación es mayor a 0, está lloviendo
    return (weatherData[0].precipitation || 0) > 0;
  }

  /**
   * Determina si es adecuado regar los cultivos
   * @param region Región española
   * @returns Información sobre necesidad de riego
   */
  public async shouldIrrigate(region: SpanishRegion): Promise<{
    shouldIrrigate: boolean | 'no definido';
    reason: string;
    recommendedAmount?: number;
  }> {
    // Obtenemos datos de los últimos 3 días para análisis
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 2);
    
    const endDateStr = this.formatDate(endDate);
    const startDateStr = this.formatDate(startDate);
    
    const weatherData = await this.getWeatherDataForSpanishRegion(
      region,
      startDateStr,
      endDateStr,
      [
        MeteoParam.PRECTOTCORR, 
        MeteoParam.T2M, 
        MeteoParam.RH2M, 
        MeteoParam.TSOIL1,
        MeteoParam.EVLAND
      ]
    );
    
    if (weatherData.length === 0) {
      throw new Error('No se obtuvieron datos meteorológicos');
    }
    
    // Datos del día actual
    const today = weatherData[weatherData.length - 1];
    
    // Verificar si hay valores -999 o datos críticos en 0 (datos no disponibles)
    if (today.precipitation === -999 || today.soilMoisture === -999 || 
        today.evapotranspiration === -999 || today.soilMoisture === 0) {
      return {
        shouldIrrigate: 'no definido',
        reason: 'No hay datos suficientes para determinar la necesidad de riego.'
      };
    }
    
    // Si ha llovido hoy, no es necesario regar
    if ((today.precipitation || 0) > 5) {
      return {
        shouldIrrigate: false,
        reason: `Ha llovido suficiente hoy (${today.precipitation} mm), no es necesario regar.`
      };
    }
    
    // Calculamos la necesidad de riego basada en evapotranspiración y humedad del suelo
    const soilMoisture = today.soilMoisture || 0;
    const evapotranspiration = today.evapotranspiration || 0;
    
    // Si hay baja humedad del suelo y alta evapotranspiración, se recomienda regar
    if (soilMoisture < 30 && evapotranspiration > 4) {
      // Calculamos cantidad recomendada
      const recommendedAmount = Math.round((30 - soilMoisture) * 0.5);
      
      return {
        shouldIrrigate: true,
        reason: `Baja humedad del suelo (${soilMoisture}%) y alta evapotranspiración (${evapotranspiration} mm/día).`,
        recommendedAmount
      };
    }
    
    return {
      shouldIrrigate: false,
      reason: `Condiciones adecuadas: humedad del suelo (${soilMoisture}%) y evapotranspiración (${evapotranspiration} mm/día).`
    };
  }

  /**
   * Comprueba el riesgo de heladas para los cultivos
   * @param region Región española
   * @returns Información sobre riesgo de heladas
   */
  public async checkFrostRisk(region: SpanishRegion): Promise<{
    riskLevel: 'bajo' | 'medio' | 'alto' | 'no definido';
    message: string;
  }> {
    // Obtenemos previsión para próximos 2 días
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);
    
    const startDateStr = this.formatDate(startDate);
    const endDateStr = this.formatDate(endDate);
    
    const weatherData = await this.getWeatherDataForSpanishRegion(
      region,
      startDateStr,
      endDateStr,
      [MeteoParam.T2M_MIN]
    );
    
    if (weatherData.length === 0) {
      throw new Error('No se obtuvieron datos meteorológicos');
    }
    
    // Analizamos las temperaturas mínimas previstas
    const minTemps = weatherData.map(data => data.minTemperature || 0);
    
    // Verificar si hay algún valor -999 o 0 (dato no disponible)
    if (minTemps.some(temp => temp === -999 || temp === 0)) {
      return {
        riskLevel: 'no definido',
        message: 'No hay datos disponibles para determinar el riesgo de heladas.'
      };
    }
    
    const lowestTemp = Math.min(...minTemps);
    
    if (lowestTemp <= 0) {
      return {
        riskLevel: 'alto',
        message: `¡ALERTA! Riesgo alto de heladas. Temperatura mínima prevista: ${lowestTemp}°C. Se recomienda proteger cultivos sensibles.`
      };
    } else if (lowestTemp <= 3) {
      return {
        riskLevel: 'medio',
        message: `Riesgo medio de heladas. Temperatura mínima prevista: ${lowestTemp}°C. Considere medidas preventivas para cultivos sensibles.`
      };
    } else {
      return {
        riskLevel: 'bajo',
        message: `Riesgo bajo de heladas. Temperatura mínima prevista: ${lowestTemp}°C.`
      };
    }
  }

  /**
   * Verifica condiciones óptimas para siembra
   * @param region Región española
   * @returns Información sobre condiciones de siembra
   */
  public async checkPlantingConditions(region: SpanishRegion): Promise<{
    isOptimal: boolean | 'no definido';
    message: string;
    details: {
      soilMoisture?: number;
      soilTemperature?: number;
      rain?: number;
      forecastRain?: boolean;
    };
  }> {
    // Obtenemos datos actuales y previsión para mañana
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = this.formatDate(today);
    const tomorrowStr = this.formatDate(tomorrow);
    
    const weatherData = await this.getWeatherDataForSpanishRegion(
      region,
      todayStr,
      tomorrowStr,
      [MeteoParam.TSOIL1, MeteoParam.TSOIL2, MeteoParam.PRECTOTCORR, MeteoParam.T2M]
    );
    
    if (weatherData.length === 0) {
      throw new Error('No se obtuvieron datos meteorológicos');
    }
    
    const currentData = weatherData[0];
    const forecastData = weatherData.length > 1 ? weatherData[1] : null;
    
    const soilMoisture = currentData.soilMoisture || 0;
    const soilTemperature = currentData.soilTemperature || 0;
    const rain = currentData.precipitation || 0;
    const forecastRain = forecastData ? (forecastData.precipitation || 0) > 1 : false;
    
    // Verificar valores -999 o soilMoisture y soilTemperature en 0 (datos no disponibles)
    if (soilMoisture === -999 || soilTemperature === -999 || rain === -999 || 
        soilMoisture === 0 || soilTemperature === 0 || 
        (forecastData && forecastData.precipitation === -999)) {
      return {
        isOptimal: 'no definido',
        message: 'No hay datos suficientes para determinar condiciones de siembra.',
        details: {
          soilMoisture,
          soilTemperature,
          rain,
          forecastRain
        }
      };
    }
    
    // Condiciones óptimas: suelo húmedo pero no encharcado, temperatura adecuada y sin lluvia inminente
    const isOptimal = soilMoisture >= 30 && soilMoisture <= 70 && 
                      soilTemperature >= 10 && 
                      rain < 5 && 
                      !forecastRain;
    
    const details = {
      soilMoisture,
      soilTemperature,
      rain,
      forecastRain
    };
    
    if (isOptimal) {
      return {
        isOptimal: true,
        message: 'Condiciones óptimas para siembra. Humedad y temperatura del suelo adecuadas, sin lluvias previstas.',
        details
      };
    } else {
      let message = 'Condiciones no óptimas para siembra:';
      
      if (soilMoisture < 30) {
        message += ' Suelo demasiado seco.';
      } else if (soilMoisture > 70) {
        message += ' Suelo demasiado húmedo.';
      }
      
      if (soilTemperature < 10) {
        message += ' Temperatura del suelo demasiado baja.';
      }
      
      if (rain >= 5) {
        message += ' Lluvia reciente.';
      }
      
      if (forecastRain) {
        message += ' Lluvia prevista para mañana.';
      }
      
      return {
        isOptimal: false,
        message,
        details
      };
    }
  }

  /**
   * Realiza una petición a la API de NASA POWER
   * @param options Opciones de la petición
   * @returns Promesa con la respuesta de la API
   * @private
   */
  private async makeApiRequest(options: ApiRequestOptions): Promise<AxiosResponse<NasaPowerResponse>> {
    const { coordinates, startDate, endDate, parameters, format = ResponseFormat.JSON, community = 'SB' } = options;
    
    const queryParams = {
      parameters: parameters.join(','),
      community,
      latitude: coordinates.latitude.toString(),
      longitude: coordinates.longitude.toString(),
      start: startDate,
      end: endDate,
      format
    };

    //console.log('URL de la petición:', this.apiBaseUrl);
    //console.log('Params de la petición:', queryParams);
    
    try {
      const response = await this.axiosInstance.get('', { params: queryParams });
      //console.log('Respuesta recibida con status:', response.status);
      //console.log('Respuesta headers:', JSON.stringify(response.headers, null, 2));
      //console.log('Estructura de respuesta:', Object.keys(response.data));
      return response;
    } catch (error: unknown) {
      console.error('Error en la petición a NASA POWER API:');
      if (axios.isAxiosError(error) && error.response) {
        console.error('Status:', error.response.status);
        console.error('Mensaje:', error.message);
        console.error('Datos de respuesta:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error desconocido:', error);
      }
      throw error;
    }
  }

  /**
   * Procesa la respuesta de la API y la convierte en un formato más amigable
   * @param response Respuesta de la API
   * @returns Datos meteorológicos procesados
   * @private
   */
  private processApiResponse(response: NasaPowerResponse): DailyWeatherData[] {
    const results: DailyWeatherData[] = [];
    
    //console.log('Procesando respuesta API completa:', JSON.stringify(response, null, 2));
    
    // Verificar que la respuesta tenga la estructura esperada
    if (!response || !response.properties || !response.properties.parameter) {
      console.warn('La respuesta de la API no tiene la estructura esperada:', response);
      return results;
    }
    
    // La nueva estructura tiene los parámetros y sus valores en properties.parameter
    const parameters = response.properties.parameter;
    
    // Verificar si hay al menos un parámetro
    const paramKeys = Object.keys(parameters);
    if (paramKeys.length === 0) {
      console.warn('No se encontraron parámetros en la respuesta');
      return results;
    }
    
    //console.log('Parámetros encontrados en la respuesta:', paramKeys);
    
    // Obtenemos las fechas (claves) de los parámetros
    const firstParamKey = paramKeys[0];
    if (!parameters[firstParamKey] || typeof parameters[firstParamKey] !== 'object') {
      console.warn(`El parámetro ${firstParamKey} no tiene el formato esperado`);
      return results;
    }
    
    // Obtenemos las fechas de los valores (no de las unidades)
    const dates = Object.keys(parameters[firstParamKey]).filter(key => key !== 'units' && key !== 'longname');
    
    // Filtrar las fechas no válidas
    const validDates = dates.filter(date => {
      // Verificar si es formato YYYYMMDD (8 caracteres y todos dígitos)
      return date.length === 8 && /^\d+$/.test(date);
    });
    //console.log('Fechas válidas:', validDates);
    
    for (const date of validDates) {
      const dailyData: DailyWeatherData = {
        date
      };

      // Mantenemos los valores originales (incluyendo -999 y 0)
      const processValue = (value: any): number => {
        return Number(value);
      };

      // Asignamos los valores correspondientes a cada parámetro
      if (parameters['T2M'] && parameters['T2M'][date] !== undefined) {
        dailyData.temperature = processValue(parameters['T2M'][date]);
      }
      
      if (parameters['T2M_MAX'] && parameters['T2M_MAX'][date] !== undefined) {
        dailyData.maxTemperature = processValue(parameters['T2M_MAX'][date]);
      }
      
      if (parameters['T2M_MIN'] && parameters['T2M_MIN'][date] !== undefined) {
        dailyData.minTemperature = processValue(parameters['T2M_MIN'][date]);
      }
      
      if (parameters['PRECTOTCORR'] && parameters['PRECTOTCORR'][date] !== undefined) {
        dailyData.precipitation = processValue(parameters['PRECTOTCORR'][date]);
      }
      
      if (parameters['RH2M'] && parameters['RH2M'][date] !== undefined) {
        dailyData.humidity = processValue(parameters['RH2M'][date]);
      }
      
      if (parameters['WS10M'] && parameters['WS10M'][date] !== undefined) {
        dailyData.windSpeed = processValue(parameters['WS10M'][date]);
      }
      
      if (parameters['WD10M'] && parameters['WD10M'][date] !== undefined) {
        dailyData.windDirection = processValue(parameters['WD10M'][date]);
      }
      
      if (parameters['PS'] && parameters['PS'][date] !== undefined) {
        dailyData.pressure = processValue(parameters['PS'][date]);
      }
      
      if (parameters['CLOUD_AMT'] && parameters['CLOUD_AMT'][date] !== undefined) {
        dailyData.cloudCover = processValue(parameters['CLOUD_AMT'][date]);
      }
      
      if (parameters['ALLSKY_SFC_SW_DWN'] && parameters['ALLSKY_SFC_SW_DWN'][date] !== undefined) {
        dailyData.solarRadiation = processValue(parameters['ALLSKY_SFC_SW_DWN'][date]);
      }
      
      if (parameters['TSOIL1'] && parameters['TSOIL1'][date] !== undefined) {
        dailyData.soilTemperature = processValue(parameters['TSOIL1'][date]);
      }
      
      if (parameters['TSOIL2'] && parameters['TSOIL2'][date] !== undefined) {
        dailyData.deepSoilTemperature = processValue(parameters['TSOIL2'][date]);
      }
      
      if (parameters['GWETROOT'] && parameters['GWETROOT'][date] !== undefined) {
        dailyData.rootZoneMoisture = processValue(parameters['GWETROOT'][date]);
      }
      
      if (parameters['GWETTOP'] && parameters['GWETTOP'][date] !== undefined) {
        dailyData.topSoilMoisture = processValue(parameters['GWETTOP'][date]);
      }
      
      if (parameters['EVLAND'] && parameters['EVLAND'][date] !== undefined) {
        dailyData.evapotranspiration = processValue(parameters['EVLAND'][date]);
      }
      
      if (parameters['ALLSKY_SFC_PAR_TOT'] && parameters['ALLSKY_SFC_PAR_TOT'][date] !== undefined) {
        dailyData.parRadiation = processValue(parameters['ALLSKY_SFC_PAR_TOT'][date]);
      }
      
      if (parameters['T2MDEW'] && parameters['T2MDEW'][date] !== undefined) {
        dailyData.dewPoint = processValue(parameters['T2MDEW'][date]);
      }
      
      if (parameters['T2MWET'] && parameters['T2MWET'][date] !== undefined) {
        dailyData.wetBulbTemperature = processValue(parameters['T2MWET'][date]);
      }
      
      // Mantener compatibilidad con los nombres anteriores
      if (parameters['T_SOIL'] && parameters['T_SOIL'][date] !== undefined) {
        dailyData.soilTemperature = processValue(parameters['T_SOIL'][date]);
      }
      
      if (parameters['SOIL_M'] && parameters['SOIL_M'][date] !== undefined) {
        dailyData.soilMoisture = processValue(parameters['SOIL_M'][date]);
      }
      
      if (parameters['GDD10'] && parameters['GDD10'][date] !== undefined) {
        dailyData.growingDegreeDays = processValue(parameters['GDD10'][date]);
      }
      
      // Actualizar RH2M_HR
      if (parameters['RH2M_HR'] && parameters['RH2M_HR'][date] !== undefined) {
        dailyData.maxHumidity = processValue(parameters['RH2M_HR'][date]);
      }
      
      // Solo agregamos la entrada si tiene al menos un valor válido
      const hasValidData = Object.keys(dailyData).length > 1; // Más que solo 'date'
      if (hasValidData) {
        results.push(dailyData);
      }
    }

    return results;
  }

  /**
   * Calcula índices agroclimáticos basados en datos meteorológicos
   * @param data Datos meteorológicos diarios
   * @returns Índices agroclimáticos
   * @private
   */
  private calculateAgroClimateIndices(data: DailyWeatherData): AgroClimateIndices {
    const indices: AgroClimateIndices = {};
    
    // Índice de sequía (basado en precipitación y evapotranspiración)
    if (data.precipitation !== undefined && data.evapotranspiration !== undefined &&
        data.precipitation !== -999 && data.evapotranspiration !== -999 &&
        data.evapotranspiration !== 0) {
      // Relación entre precipitación y evapotranspiración
      const ratio = data.precipitation / data.evapotranspiration;
      indices.droughtIndex = Math.max(0, 1 - ratio); // 0 (sin sequía) a 1 (severa)
    } else {
      indices.droughtIndex = 'no definido';
    }
    
    // Índice de estrés por calor
    if (data.maxTemperature !== undefined && data.humidity !== undefined &&
        data.maxTemperature !== -999 && data.humidity !== -999 &&
        data.maxTemperature !== 0 && data.humidity !== 0) {
      // Simplificación del índice de calor
      const heatIndex = data.maxTemperature + (data.humidity * 0.1);
      // Normalizado a una escala de 0-10
      indices.heatStressIndex = Math.max(0, Math.min(10, (heatIndex - 25) / 2));
    } else {
      indices.heatStressIndex = 'no definido';
    }
    
    // Riesgo de heladas (0-1 o 'no definido')
    if (data.minTemperature !== undefined && data.minTemperature !== -999) {
      if (data.minTemperature <= 0 && data.minTemperature !== 0) {
        indices.freezeRisk = 1; // Helada confirmada
      } else if (data.minTemperature < 3) {
        indices.freezeRisk = Math.max(0, (3 - data.minTemperature) / 3);
      } else {
        indices.freezeRisk = 0;
      }
    } else {
      indices.freezeRisk = 'no definido';
    }
    
    // Riesgo de enfermedades (basado en humedad y temperatura)
    if (data.humidity !== undefined && data.temperature !== undefined) {
      // Las enfermedades suelen proliferar con alta humedad y temperaturas moderadas
      if (data.humidity > 80 && data.temperature > 15 && data.temperature < 30) {
        indices.diseaseRisk = Math.min(1, (data.humidity - 80) / 20 * ((30 - Math.abs(data.temperature - 22.5)) / 7.5));
      } else {
        indices.diseaseRisk = 0;
      }
    }
    
    // Necesidad de riego (mm)
    if (data.evapotranspiration !== undefined && data.precipitation !== undefined && data.soilMoisture !== undefined) {
      const waterDeficit = Math.max(0, data.evapotranspiration - data.precipitation);
      const soilMoistureDeficit = Math.max(0, 50 - data.soilMoisture); // 50% como humedad objetivo
      indices.irrigationNeed = waterDeficit + (soilMoistureDeficit * 0.5);
    }
    
    // Condiciones de siembra
    if (data.soilTemperature !== undefined && data.soilMoisture !== undefined) {
      // Temperatura del suelo > 10°C y humedad del suelo entre 30-70% son buenas condiciones
      indices.optimalPlantingConditions = (data.soilTemperature >= 10 && 
                                         data.soilMoisture >= 30 && 
                                         data.soilMoisture <= 70);
    }
    
    // Condiciones de cosecha
    if (data.precipitation !== undefined && data.humidity !== undefined) {
      if (data.precipitation < 1 && data.humidity < 70) {
        indices.harvestConditions = 'Buenas';
      } else if (data.precipitation < 5 && data.humidity < 85) {
        indices.harvestConditions = 'Regulares';
      } else {
        indices.harvestConditions = 'Malas';
      }
    }
    
    return indices;
  }

  /**
   * Genera recomendaciones agrícolas basadas en datos meteorológicos e índices
   * @param data Datos meteorológicos diarios
   * @param indices Índices agroclimáticos
   * @returns Recomendaciones agrícolas
   * @private
   */
  private generateRecommendations(
    data: DailyWeatherData, 
    indices: AgroClimateIndices
  ): AgriculturalRecommendations {
    // Recomendaciones de riego
    const irrigation = {
      recommended: false,
      amount: 0,
      message: 'No es necesario regar hoy.'
    };
    
    if (indices.irrigationNeed && indices.irrigationNeed !== 'no definido' && indices.irrigationNeed > 3) {
      irrigation.recommended = true;
      irrigation.amount = Math.round(indices.irrigationNeed);
      irrigation.message = `Se recomienda regar con aproximadamente ${irrigation.amount} mm de agua.`;
    } else if (indices.irrigationNeed === 'no definido') {
      irrigation.message = 'No hay datos suficientes para determinar la necesidad de riego.';
    }
    
    // Recomendaciones de control de plagas
    const pestControl = {
      recommended: false,
      riskLevel: 'bajo' as 'bajo' | 'medio' | 'alto' | 'no definido',
      message: 'Riesgo bajo de plagas y enfermedades hoy.'
    };
    
    if (indices.diseaseRisk && typeof indices.diseaseRisk === 'number' && indices.diseaseRisk > 0.7) {
      pestControl.recommended = true;
      pestControl.riskLevel = 'alto';
      pestControl.message = 'ALERTA: Alto riesgo de enfermedades debido a condiciones de humedad y temperatura. Considere aplicar medidas preventivas.';
    } else if (indices.diseaseRisk && typeof indices.diseaseRisk === 'number' && indices.diseaseRisk > 0.4) {
      pestControl.recommended = true;
      pestControl.riskLevel = 'medio';
      pestControl.message = 'Riesgo moderado de enfermedades. Monitoree sus cultivos con atención.';
    } else if (indices.diseaseRisk === 'no definido') {
      pestControl.riskLevel = 'no definido';
      pestControl.message = 'No hay datos suficientes para evaluar el riesgo de enfermedades.';
    }
    
    // Recomendaciones de fertilización
    const fertilization = {
      recommended: false,
      message: 'No es recomendable fertilizar hoy.'
    };
    
    // No fertilizar si hay mucha lluvia o está prevista
    if ((data.precipitation || 0) < 5 && (data.soilMoisture || 0) > 20) {
      fertilization.recommended = true;
      fertilization.message = 'Condiciones adecuadas para la aplicación de fertilizantes.';
    }
    
    // Operaciones de campo
    const fieldOperations = {
      canWork: true,
      message: 'Condiciones favorables para trabajar en el campo.'
    };
    
    if ((data.precipitation || 0) > 5 || (data.soilMoisture || 0) > 80) {
      fieldOperations.canWork = false;
      fieldOperations.message = 'Suelo demasiado húmedo para operaciones con maquinaria. Se recomienda posponer trabajos de campo.';
    }
    
    // Recomendaciones de siembra
    const planting = {
      recommended: indices.optimalPlantingConditions === 'no definido' ? 
                   'no definido' as 'no definido' : 
                   (indices.optimalPlantingConditions || false),
      message: indices.optimalPlantingConditions === 'no definido' ?
               'No hay datos suficientes para evaluar condiciones de siembra.' :
               (indices.optimalPlantingConditions ?
                'Condiciones óptimas para siembra. Temperatura y humedad del suelo adecuadas.' :
                'Condiciones no óptimas para siembra. Verifique temperatura y humedad del suelo.')
    };
    
    // Recomendaciones de cosecha
    const harvesting = {
      recommended: indices.harvestConditions === 'Buenas',
      message: `Condiciones de cosecha: ${indices.harvestConditions || 'No disponibles'}.`
    };
    
    if (indices.harvestConditions === 'Buenas') {
      harvesting.message += ' Aproveche para cosechar hoy.';
    } else if (indices.harvestConditions === 'Malas') {
      harvesting.message += ' Se recomienda posponer la cosecha.';
    }
    
    return {
      irrigation,
      pestControl,
      fertilization,
      fieldOperations,
      planting,
      harvesting
    };
  }

  /**
   * Formatea una fecha al formato YYYYMMDD
   * @param date Fecha a formatear
   * @returns Fecha formateada
   * @private
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
  }
} 