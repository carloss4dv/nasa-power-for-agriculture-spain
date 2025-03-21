# NASA POWER for Agriculture Spain 

## Descripción General

Este cliente proporciona una interfaz sencilla para acceder a los datos meteorológicos y agroclimáticos de la API NASA POWER, especialmente adaptado para su uso en aplicaciones agrícolas en España. La biblioteca facilita la obtención de datos meteorológicos, el cálculo de índices agroclimáticos y la generación de recomendaciones personalizadas para la gestión de cultivos.

## Características Principales

- Obtención de datos meteorológicos por coordenadas o región española
- Cálculo de índices agroclimáticos (sequía, estrés por calor, riesgo de heladas, etc.)
- Generación de recomendaciones agrícolas personalizadas
- Funciones especializadas para análisis agrícola:
  - Verificación de condiciones de lluvia
  - Determinación de necesidad de riego
  - Evaluación de riesgo de heladas
  - Análisis de condiciones óptimas para siembra
  - Cálculo de estrés hídrico
  - Estimación de rendimiento potencial de cultivos
  - Generación de calendarios de actividades agrícolas

## Instalación

```bash
npm install nasa-power-for-agriculture-spain
```

## Funciones Principales

### Clase Principal

```typescript
import { NasaPowerClient } from 'nasa-power-for-agriculture-spain';
```

La clase `NasaPowerClient` es el punto de entrada principal para interactuar con la API NASA POWER. Proporciona métodos para obtener datos meteorológicos y agrícolas para diferentes regiones de España.

### Tipos Exportados

La biblioteca exporta varios tipos y enumeraciones útiles:

```typescript
import {
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
} from 'nasa-power-for-agriculture-spain';
```

## Funciones Utilitarias

### formatDateToYYYYMMDD

Convierte un objeto `Date` en una cadena de texto con formato YYYYMMDD, que es el formato requerido por la API NASA POWER.

```typescript
function formatDateToYYYYMMDD(date: Date): string
```

#### Parámetros

- `date`: Objeto `Date` que se desea formatear

#### Valor de retorno

- `string`: Fecha formateada en formato YYYYMMDD (por ejemplo, "20230101" para el 1 de enero de 2023)

#### Ejemplo de uso

```typescript
import { formatDateToYYYYMMDD } from 'nasa-power-for-agriculture-spain';

const hoy = new Date();
const fechaFormateada = formatDateToYYYYMMDD(hoy);
console.log(`Fecha formateada: ${fechaFormateada}`);
```

### parseYYYYMMDDToDate

Convierte una cadena de texto en formato YYYYMMDD a un objeto `Date`.

```typescript
function parseYYYYMMDDToDate(dateString: string): Date
```

#### Parámetros

- `dateString`: Cadena de texto en formato YYYYMMDD (por ejemplo, "20230101")

#### Valor de retorno

- `Date`: Objeto `Date` correspondiente a la fecha proporcionada

#### Ejemplo de uso

```typescript
import { parseYYYYMMDDToDate } from 'nasa-power-for-agriculture-spain';

const fechaString = '20230101';
const fechaObjeto = parseYYYYMMDDToDate(fechaString);
console.log(`Fecha convertida: ${fechaObjeto.toLocaleDateString()}`);
```

### checkWeatherAlert

Analiza los datos meteorológicos diarios para identificar posibles alertas meteorológicas que puedan afectar a los cultivos.

```typescript
function checkWeatherAlert(weatherData: DailyWeatherData): {
  hasAlert: boolean;
  alerts: string[];
}
```

#### Parámetros

- `weatherData`: Objeto `DailyWeatherData` con los datos meteorológicos del día a analizar

#### Valor de retorno

- Objeto con las siguientes propiedades:
  - `hasAlert`: Booleano que indica si hay alguna alerta activa
  - `alerts`: Array de cadenas de texto con las descripciones de las alertas detectadas

#### Alertas detectadas

- Precipitación excesiva (>50mm): Posible inundación
- Vientos fuertes (>15m/s)
- Calor extremo (>40°C)
- Temperaturas bajo cero: Riesgo de heladas
- Sequía en el suelo (<15% de humedad): Cultivos en riesgo
- Exceso de humedad en el suelo (>85%): Riesgo de enfermedades radiculares
- Condiciones favorables para enfermedades fúngicas (humedad >85% y temperatura entre 18-30°C)

#### Ejemplo de uso

```typescript
import { NasaPowerClient, checkWeatherAlert, SpanishRegion } from 'nasa-power-for-agriculture-spain';

async function verificarAlertas() {
  const cliente = new NasaPowerClient();
  
  // Obtener datos meteorológicos para hoy en Andalucía
  const datosMeteorológicos = await cliente.getWeatherDataForToday(SpanishRegion.ANDALUCIA);
  
  // Verificar si hay alertas
  const alertas = checkWeatherAlert(datosMeteorológicos);
  
  if (alertas.hasAlert) {
    console.log('¡ATENCIÓN! Se han detectado las siguientes alertas:');
    alertas.alerts.forEach(alerta => console.log(`- ${alerta}`));
  } else {
    console.log('No se han detectado alertas meteorológicas para hoy.');
  }
}
```

### calculateWaterStressIndex

Calcula el índice de estrés hídrico para cultivos basado en la precipitación, evapotranspiración y humedad del suelo. Esta función es crucial para la gestión del riego y la evaluación del estado hídrico de los cultivos.

```typescript
function calculateWaterStressIndex(
  precipitation: number,
  evapotranspiration: number,
  soilMoisture: number
): {
  stressIndex: number;
  status: 'óptimo' | 'leve' | 'moderado' | 'severo';
  recommendation: string;
}
```

#### Parámetros

- `precipitation`: Precipitación en mm/día
- `evapotranspiration`: Evapotranspiración en mm/día
- `soilMoisture`: Humedad del suelo en porcentaje (0-100%)

#### Valor de retorno

- Objeto con las siguientes propiedades:
  - `stressIndex`: Valor numérico entre 0 y 10 que indica el nivel de estrés hídrico (0: sin estrés, 10: estrés extremo)
  - `status`: Categoría cualitativa del estrés ('óptimo', 'leve', 'moderado', 'severo')
  - `recommendation`: Recomendación de manejo basada en el nivel de estrés

#### Cálculo del índice

El índice se calcula mediante la siguiente fórmula:
```
stressIndex = max(0, min(10, 5 - waterBalance - (soilMoisture / 20)))
```
donde `waterBalance = precipitation - evapotranspiration`

Esta fórmula considera tanto el balance hídrico (diferencia entre precipitación y evapotranspiración) como la humedad actual del suelo para determinar el nivel de estrés.

#### Categorías de estrés y recomendaciones

- **Óptimo** (stressIndex < 3):
  - "No es necesario regar. Condiciones hídricas adecuadas."
  
- **Leve** (stressIndex < 5):
  - "Monitorear la humedad del suelo. Riego ligero recomendado si no hay previsión de lluvia."
  
- **Moderado** (stressIndex < 7.5):
  - "Estrés hídrico moderado. Se recomienda riego para evitar daños a los cultivos."
  
- **Severo** (stressIndex >= 7.5):
  - "Estrés hídrico severo. Riego urgente para evitar pérdidas significativas."

#### Ejemplo de uso: Monitoreo de estrés hídrico en viñedos

```typescript
import { NasaPowerClient, calculateWaterStressIndex, SpanishRegion } from 'nasa-power-for-agriculture-spain';

async function monitoreoRiegoViñedo() {
  const cliente = new NasaPowerClient();
  
  // Obtener datos meteorológicos para La Rioja (región vinícola)
  const datosMeteo = await cliente.getWeatherDataForToday(SpanishRegion.LA_RIOJA);
  
  // Verificar si tenemos todos los datos necesarios
  if (datosMeteo.precipitation !== undefined && 
      datosMeteo.evapotranspiration !== undefined && 
      datosMeteo.soilMoisture !== undefined) {
    
    // Calcular el índice de estrés hídrico
    const estresHidrico = calculateWaterStressIndex(
      datosMeteo.precipitation,
      datosMeteo.evapotranspiration,
      datosMeteo.soilMoisture
    );
    
    console.log(`Índice de estrés hídrico: ${estresHidrico.stressIndex.toFixed(2)}`);
    console.log(`Estado: ${estresHidrico.status}`);
    console.log(`Recomendación: ${estresHidrico.recommendation}`);
    
    // Programar riego automático si es necesario
    if (estresHidrico.status === 'moderado' || estresHidrico.status === 'severo') {
      console.log('Activando sistema de riego automático...');
      // Código para activar el sistema de riego
    }
  } else {
    console.log('No hay datos suficientes para calcular el estrés hídrico');
  }
}
```

### estimateCropPotential

Estima el rendimiento potencial de diferentes tipos de cultivos basado en condiciones meteorológicas históricas. Esta función es especialmente útil para la planificación agrícola y la toma de decisiones sobre qué cultivos sembrar.

```typescript
function estimateCropPotential(
  weatherData: DailyWeatherData[],
  cropType: 'cereal' | 'hortícola' | 'frutal' | 'olivo' | 'viñedo'
): {
  potentialYield: 'alto' | 'medio' | 'bajo';
  limitingFactors: string[];
  recommendations: string[];
}
```

#### Parámetros

- `weatherData`: Array de objetos `DailyWeatherData` con datos meteorológicos históricos
- `cropType`: Tipo de cultivo a evaluar ('cereal', 'hortícola', 'frutal', 'olivo', 'viñedo')

#### Valor de retorno

- Objeto con las siguientes propiedades:
  - `potentialYield`: Estimación cualitativa del rendimiento potencial ('alto', 'medio', 'bajo')
  - `limitingFactors`: Array de factores limitantes identificados
  - `recommendations`: Array de recomendaciones para mejorar el rendimiento

#### Factores evaluados por tipo de cultivo

La función evalúa diferentes factores según el tipo de cultivo:

- **Cereales**:
  - Precipitación total (óptimo > 200mm)
  - Temperatura media (óptimo entre 8-22°C)

- **Hortícolas**:
  - Humedad del suelo (óptimo > 40%)
  - Temperaturas máximas (problemático > 35°C)

- **Frutales**:
  - Riesgo de heladas (problemático < -2°C)
  - Acumulación de horas-frío (óptimo > 200 horas)

- **Olivo**:
  - Precipitación total (problemático > 600mm)
  - Temperaturas mínimas (problemático < -10°C)

- **Viñedo**:
  - Humedad del suelo (problemático > 60%)
  - Días con alta humedad ambiental (problemático > 50% de los días)

#### Ejemplo de uso: Evaluación de potencial para cultivo de cereales en Castilla y León

```typescript
import { NasaPowerClient, estimateCropPotential, SpanishRegion, formatDateToYYYYMMDD } from 'nasa-power-for-agriculture-spain';

async function evaluarPotencialCereales() {
  const cliente = new NasaPowerClient();
  
  // Definir periodo de análisis (últimos 30 días)
  const fechaFin = new Date();
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - 30);
  
  const fechaInicioStr = formatDateToYYYYMMDD(fechaInicio);
  const fechaFinStr = formatDateToYYYYMMDD(fechaFin);
  
  // Obtener datos meteorológicos para Castilla y León (región cerealista)
  const datosHistoricos = await cliente.getWeatherDataForSpanishRegion(
    SpanishRegion.CASTILLA_Y_LEON,
    fechaInicioStr,
    fechaFinStr
  );
  
  // Estimar potencial para cultivo de cereales
  const potencialCereales = estimateCropPotential(datosHistoricos, 'cereal');
  
  console.log(`\nEvaluación de potencial para cultivo de cereales en Castilla y León:`);
  console.log(`Rendimiento potencial: ${potencialCereales.potentialYield}`);
  
  if (potencialCereales.limitingFactors.length > 0) {
    console.log('\nFactores limitantes identificados:');
    potencialCereales.limitingFactors.forEach(factor => console.log(`- ${factor}`));
  } else {
    console.log('\nNo se identificaron factores limitantes significativos.');
  }
  
  console.log('\nRecomendaciones:');
  potencialCereales.recommendations.forEach(recomendacion => console.log(`- ${recomendacion}`));
  
  // Decisión basada en el potencial
  if (potencialCereales.potentialYield === 'alto') {
    console.log('\nCONCLUSIÓN: Condiciones favorables para la siembra de cereales.');
  } else if (potencialCereales.potentialYield === 'medio') {
    console.log('\nCONCLUSIÓN: Considerar la implementación de las recomendaciones antes de sembrar.');
  } else {
    console.log('\nCONCLUSIÓN: Evaluar cultivos alternativos más adaptados a las condiciones actuales.');
  }
}
```

### generateAgriculturalCalendar

Genera un calendario de actividades agrícolas basado en datos meteorológicos de pronóstico, indicando qué actividades son recomendadas o no recomendadas para cada día.

```typescript
function generateAgriculturalCalendar(
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
}
```

#### Parámetros

- `region`: Nombre de la región
- `weatherForecast`: Array de objetos `DailyWeatherData` con pronóstico meteorológico
- `cropType`: Tipo de cultivo

#### Valor de retorno

- Objeto con la propiedad `nextDays` que contiene un array de objetos con:
  - `date`: Fecha en formato string
  - `recommendedActivities`: Array de actividades recomendadas para ese día
  - `notRecommendedActivities`: Array de actividades no recomendadas
  - `weatherSummary`: Resumen de las condiciones meteorológicas

#### Actividades evaluadas

La función evalúa las condiciones para las siguientes actividades:

- **Siembra/trasplante**: Recomendada cuando:
  - Humedad del suelo entre 30-70%
  - Temperatura del suelo ≥ 10°C
  - Precipitación < 5mm

- **Aplicación de tratamientos fitosanitarios**: Recomendada cuando:
  - Velocidad del viento < 10m/s
  - Precipitación < 1mm

- **Cosecha**: Recomendada cuando:
  - Precipitación < 1mm
  - Humedad < 70%

- **Riego**: Recomendado cuando:
  - Humedad del suelo < 30%
  - Precipitación < 3mm

#### Ejemplo de uso: Planificación semanal de actividades para olivar en Andalucía

```typescript
import { NasaPowerClient, generateAgriculturalCalendar, SpanishRegion, formatDateToYYYYMMDD } from 'nasa-power-for-agriculture-spain';

async function planificarActividadesOlivar() {
  const cliente = new NasaPowerClient();
  
  // Obtener pronóstico para los próximos 7 días en Andalucía
  const fechaInicio = new Date();
  const fechaFin = new Date();
  fechaFin.setDate(fechaFin.getDate() + 6);
  
  const fechaInicioStr = formatDateToYYYYMMDD(fechaInicio);
  const fechaFinStr = formatDateToYYYYMMDD(fechaFin);
  
  try {
    // Obtener pronóstico meteorológico
    const pronostico = await cliente.getWeatherForecast(
      SpanishRegion.ANDALUCIA,
      fechaInicioStr,
      fechaFinStr
    );
    
    // Generar calendario de actividades para olivar
    const calendario = generateAgriculturalCalendar(
      'Andalucía',
      pronostico,
      'olivo'
    );
    
    console.log('CALENDARIO DE ACTIVIDADES PARA OLIVAR EN ANDALUCÍA');
    console.log('=================================================');
    
    calendario.nextDays.forEach(dia => {
      console.log(`\nFecha: ${dia.date}`);
      console.log(`Condiciones: ${dia.weatherSummary}`);
      
      console.log('\nActividades recomendadas:');
      if (dia.recommendedActivities.length > 0) {
        dia.recommendedActivities.forEach(actividad => console.log(`- ${actividad}`));
      } else {
        console.log('- Ninguna actividad recomendada para este día');
      }
      
      console.log('\nActividades NO recomendadas:');
      dia.notRecommendedActivities.forEach(actividad => console.log(`- ${actividad}`));
    });
    
    // Exportar calendario a formato CSV para uso en aplicaciones de gestión agrícola
    console.log('\nGenerando archivo CSV con el calendario...');
    // Código para exportar a CSV
    
  } catch (error) {
    console.error('Error al generar el calendario de actividades:', error);
  }
}
```

## Casos de Uso Reales

### Caso de Uso 1: Sistema de Alerta Temprana para Viticultores en La Rioja

Este caso de uso muestra cómo utilizar la biblioteca para crear un sistema de alerta temprana para viticultores, enfocado en la detección de condiciones favorables para enfermedades fúngicas como el mildiu y el oídio.

```typescript
import { 
  NasaPowerClient, 
  SpanishRegion, 
  checkWeatherAlert, 
  calculateWaterStressIndex,
  estimateCropPotential,
  formatDateToYYYYMMDD 
} from 'nasa-power-for-agriculture-spain';

async function sistemaAlertaViticultores() {
  // Inicializar cliente
  const cliente = new NasaPowerClient();
  
  // Definir periodo de análisis (últimos 7 días y pronóstico de 3 días)
  const hoy = new Date();
  const hace7Dias = new Date(hoy);
  hace7Dias.setDate(hoy.getDate() - 7);
  
  const en3Dias = new Date(hoy);
  en3Dias.setDate(hoy.getDate() + 3);
  
  const fechaInicioStr = formatDateToYYYYMMDD(hace7Dias);
  const fechaHoyStr = formatDateToYYYYMMDD(hoy);
  const fechaPronosticoStr = formatDateToYYYYMMDD(en3Dias);
  
  try {
    // 1. Obtener datos históricos recientes
    console.log('Obteniendo datos históricos recientes...');
    const datosHistoricos = await cliente.getWeatherDataForSpanishRegion(
      SpanishRegion.LA_RIOJA,
      fechaInicioStr,
      fechaHoyStr
    );
    
    // 2. Obtener pronóstico
    console.log('Obteniendo pronóstico meteorológico...');
    const pronostico = await cliente.getWeatherForecast(
      SpanishRegion.LA_RIOJA,
      fechaHoyStr,
      fechaPronosticoStr
    );
    
    // 3. Analizar condiciones actuales
    console.log('Analizando condiciones actuales...');
    const condicionesHoy = datosHistoricos[datosHistoricos.length - 1];
    const alertasHoy = checkWeatherAlert(condicionesHoy);
    
    // 4. Evaluar estrés hídrico
    let estresHidrico = null;
    if (condicionesHoy.precipitation !== undefined && 
        condicionesHoy.evapotranspiration !== undefined && 
        condicionesHoy.soilMoisture !== undefined) {
      
      estresHidrico = calculateWaterStressIndex(
        condicionesHoy.precipitation,
        condicionesHoy.evapotranspiration,
        condicionesHoy.soilMoisture
      );
    }
    
    // 5. Estimar potencial del viñedo
    const potencialViñedo = estimateCropPotential(datosHistoricos, 'viñedo');
    
    // 6. Generar informe
    console.log('\n========= SISTEMA DE ALERTA PARA VITICULTORES - LA RIOJA =========');
    console.log(`Fecha del informe: ${new Date().toLocaleDateString()}`);
    
    console.log('\n--- ALERTAS ACTUALES ---');
    if (alertasHoy.hasAlert) {
      console.log('¡ATENCIÓN! Se han detectado las siguientes alertas:');
      alertasHoy.alerts.forEach(alerta => console.log(`- ${alerta}`));
    } else {
      console.log('No se han detectado alertas meteorológicas para hoy.');
    }
    
    console.log('\n--- ESTADO HÍDRICO ---');
    if (estresHidrico) {
      console.log(`Estado: ${estresHidrico.status}`);
      console.log(`Recomendación: ${estresHidrico.recommendation}`);
    } else {
      console.log('Datos insuficientes para evaluar el estado hídrico');
    }
    
    console.log('\n--- POTENCIAL DEL VIÑEDO ---');
    console.log(`Rendimiento potencial: ${potencialViñedo.potentialYield}`);
    
    if (potencialViñedo.limitingFactors.length > 0) {
      console.log('\nFactores limitantes:');
      potencialViñedo.limitingFactors.forEach(factor => console.log(`- ${factor}`));
    }
    
    console.log('\nRecomendaciones:');
    potencialViñedo.recommendations.forEach(recomendacion => console.log(`- ${recomendacion}`));
    
    console.log('\n--- PRONÓSTICO Y RIESGO DE ENFERMEDADES ---');
    let riesgoEnfermedadAlto = false;
    
    pronostico.forEach(dia => {
      console.log(`\nFecha: ${dia.date}`);
      
      // Verificar condiciones favorables para enfermedades fúngicas
      const alertasDia = checkWeatherAlert(dia);
      const tieneRiesgoFungico = alertasDia.alerts.some(alerta => 
        alerta.includes('enfermedades fúngicas'));
      
      if (tieneRiesgoFungico) {
        riesgoEnfermedadAlto = true;
        console.log('⚠️ ALERTA: Condiciones favorables para enfermedades fúngicas');
      }
      
      // Mostrar resumen de condiciones
      console.log(`Temperatura: ${dia.temperature?.toFixed(1) || 'N/D'}°C`);
      console.log(`Humedad: ${dia.humidity?.toFixed(0) || 'N/D'}%`);
      console.log(`Precipitación: ${dia.precipitation?.toFixed(1) || 'N/D'} mm`);
    });
    
    console.log('\n--- RECOMENDACIONES FINALES ---');
    if (riesgoEnfermedadAlto) {
      console.log('1. URGENTE: Aplicar tratamiento preventivo contra mildiu y oídio');
      console.log('2. Monitorear diariamente el desarrollo de síntomas en hojas y racimos');
      console.log('3. Asegurar buena ventilación en la zona de racimos mediante deshojado moderado');
    } else {
      console.log('1. Mantener vigilancia regular de las condiciones meteorológicas');
      console.log('2. Continuar con el programa habitual de tratamientos preventivos');
    }
    
    if (estresHidrico && (estresHidrico.status === 'moderado' || estresHidrico.status === 'severo')) {
      console.log('3. Programar riego para compensar el déficit hídrico actual');
    }
    
    console.log('\n================================================================');
    
  } catch (error) {
    console.error('Error en el sistema de alerta:', error);
  }
}

// Ejecutar el sistema de alerta
sistemaAlertaViticultores();
```

### Caso de Uso 2: Planificación de Siembra de Cereales en Castilla y León

Este caso de uso demuestra cómo utilizar la biblioteca para determinar el momento óptimo para la siembra de cereales, basándose en condiciones meteorológicas históricas y pronósticos.

```typescript
import { 
  NasaPowerClient, 
  SpanishRegion, 
  formatDateToYYYYMMDD,
  parseYYYYMMDDToDate,
  estimateCropPotential,
  generateAgriculturalCalendar
} from 'nasa-power-for-agriculture-spain';

async function planificadorSiembraCereales() {
  // Inicializar cliente
  const cliente = new NasaPowerClient();
  
  // Definir periodos de análisis
  const hoy = new Date();
  
  // Datos históricos: últimos 30 días
  const hace30Dias = new Date(hoy);
  hace30Dias.setDate(hoy.getDate() - 30);
  
  // Pronóstico: próximos 10 días
  const en10Dias = new Date(hoy);
  en10Dias.setDate(hoy.getDate() + 10);
  
  const fechaInicioHistoricaStr = formatDateToYYYYMMDD(hace30Dias);
  const fechaHoyStr = formatDateToYYYYMMDD(hoy);
  const fechaFinPronosticoStr = formatDateToYYYYMMDD(en10Dias);
  
  try {
    console.log('PLANIFICADOR DE SIEMBRA DE CEREALES - CASTILLA Y LEÓN');
    console.log('====================================================');
    console.log(`Fecha de análisis: ${hoy.toLocaleDateString()}`);
    
    // 1. Obtener datos históricos
    console.log('\nObteniendo datos históricos...');
    const datosHistoricos = await cliente.getWeatherDataForSpanishRegion(
      SpanishRegion.CASTILLA_Y_LEON,
      fechaInicioHistoricaStr,
      fechaHoyStr
    );
    
    // 2. Evaluar potencial para cereales basado en datos históricos
    console.log('Evaluando condiciones históricas para cereales...');
    const potencialCereales = estimateCropPotential(datosHistoricos, 'cereal');
    
    // 3. Obtener pronóstico
    console.log('Obteniendo pronóstico meteorológico...');
    const pronostico = await cliente.getWeatherForecast(
      SpanishRegion.CASTILLA_Y_LEON,
      fechaHoyStr,
      fechaFinPronosticoStr
    );
    
    // 4. Generar calendario de actividades
    console.log('Generando calendario de actividades...');
    const calendario = generateAgriculturalCalendar(
      'Castilla y León',
      pronostico,
      'cereal'
    );
    
    // 5. Analizar días óptimos para siembra
    const diasOptimosParaSiembra = calendario.nextDays.filter(dia => 
      dia.recommendedActivities.includes('Siembra/trasplante')
    );
    
    // 6. Generar informe
    console.log('\n--- EVALUACIÓN DE CONDICIONES HISTÓRICAS ---');
    console.log(`Rendimiento potencial esperado: ${potencialCereales.potentialYield.toUpperCase()}`);
    
    if (potencialCereales.limitingFactors.length > 0) {
      console.log('\nFactores limitantes identificados:');
      potencialCereales.limitingFactors.forEach(factor => console.log(`- ${factor}`));
    } else {
      console.log('\nNo se identificaron factores limitantes significativos.');
    }
    
    console.log('\nRecomendaciones basadas en datos históricos:');
    potencialCereales.recommendations.forEach(recomendacion => console.log(`- ${recomendacion}`));
    
    console.log('\n--- VENTANA DE SIEMBRA RECOMENDADA ---');
    if (diasOptimosParaSiembra.length > 0) {
      console.log('Días óptimos para siembra en los próximos 10 días:');
      diasOptimosParaSiembra.forEach(dia => {
        const fecha = parseYYYYMMDDToDate(dia.date);
        console.log(`\n${fecha.toLocaleDateString()}:`);
        console.log(`Condiciones: ${dia.weatherSummary}`);
        
        // Verificar si hay otras actividades recomendadas ese día
        const otrasActividades = dia.recommendedActivities
          .filter(act => act !== 'Siembra/trasplante');
        
        if (otrasActividades.length > 0) {
          console.log('También recomendado para:');
          otrasActividades.forEach(act => console.log(`- ${act}`));
        }
      });
      
      // Identificar el mejor día para siembra
      let mejorDia = diasOptimosParaSiembra[0];
      let mejorIndiceHumedad = 0;
      
      diasOptimosParaSiembra.forEach(dia => {
        // Extraer humedad del suelo del resumen
        const humedadMatch = dia.weatherSummary.match(/Humedad suelo: (\d+)%/);
        if (humedadMatch) {
          const humedad = parseInt(humedadMatch[1]);
          // Consideramos que 50% es la humedad óptima para siembra de cereales
          const indiceOptimalidad = 100 - Math.abs(humedad - 50);
          if (indiceOptimalidad > mejorIndiceHumedad) {
            mejorIndiceHumedad = indiceOptimalidad;
            mejorDia = dia;
          }
        }
      });
      
      const fechaMejorDia = parseYYYYMMDDToDate(mejorDia.date);
      console.log(`\n👉 DÍA ÓPTIMO RECOMENDADO: ${fechaMejorDia.toLocaleDateString()}`);
      console.log(`Condiciones: ${mejorDia.weatherSummary}`);
      
    } else {
      console.log('⚠️ No se identificaron días óptimos para siembra en los próximos 10 días.');
      console.log('\nRecomendaciones:');
      console.log('- Esperar a que mejoren las condiciones meteorológicas');
      console.log('- Considerar variedades de ciclo más corto si se retrasa la siembra');
      console.log('- Consultar nuevamente el pronóstico en 3-5 días');
    }
    
    console.log('\n--- CALENDARIO COMPLETO DE ACTIVIDADES ---');
    calendario.nextDays.forEach(dia => {
      const fecha = parseYYYYMMDDToDate(dia.date);
      console.log(`\n${fecha.toLocaleDateString()}:`);
      console.log(`Condiciones: ${dia.weatherSummary}`);
      
      console.log('Actividades recomendadas:');
      if (dia.recommendedActivities.length > 0) {
        dia.recommendedActivities.forEach(act => console.log(`- ${act}`));
      } else {
        console.log('- Ninguna actividad agrícola recomendada');
      }
      
      console.log('Actividades NO recomendadas:');
      dia.notRecommendedActivities.forEach(act => console.log(`- ${act}`));
    });
    
  } catch (error) {
    console.error('Error en el planificador de siembra:', error);
  }
}

// Ejecutar el planificador
planificadorSiembraCereales();
```

### Caso de Uso 3: Sistema de Gestión de Riego para Cultivos Hortícolas en Murcia

Este caso de uso muestra cómo utilizar la biblioteca para optimizar la gestión del riego en cultivos hortícolas, basándose en el cálculo del estrés hídrico y las condiciones meteorológicas.

```typescript
import { 
  NasaPowerClient, 
  SpanishRegion, 
  formatDateToYYYYMMDD,
  calculateWaterStressIndex,
  checkWeatherAlert,
  DailyWeatherData
} from 'nasa-power-for-agriculture-spain';

// Interfaz para el plan de riego
interface PlanRiego {
  fecha: string;
  necesidadRiego: number; // mm
  duracionRiego: number; // minutos
  prioridad: 'baja' | 'media' | 'alta' | 'crítica';
  observaciones: string;
}

async function gestionRiegoHorticolas() {
  // Inicializar cliente
  const cliente = new NasaPowerClient();
  
  // Definir periodos de análisis
  const hoy = new Date();
  
  // Datos históricos: últimos 7 días
  const hace7Dias = new Date(hoy);
  hace7Dias.setDate(hoy.getDate() - 7);
  
  // Pronóstico: próximos 5 días
  const en5Dias = new Date(hoy);
  en5Dias.setDate(hoy.getDate() + 5);
  
  const fechaInicioHistoricaStr = formatDateToYYYYMMDD(hace7Dias);
  const fechaHoyStr = formatDateToYYYYMMDD(hoy);
  const fechaFinPronosticoStr = formatDateToYYYYMMDD(en5Dias);
  
  // Parámetros del sistema de riego
  const eficienciaRiego = 0.85; // 85% de eficiencia
  const caudalEmisores = 2.2; // L/h
  const distanciaEmisores = 0.3; // m
  const distanciaLineas = 1.0; // m
  const emisoresPorPlanta = 2;
  
  try {
    console.log('SISTEMA DE GESTIÓN DE RIEGO - CULTIVOS HORTÍCOLAS EN MURCIA');
    console.log('=========================================================');
    
    // 1. Obtener datos históricos
    console.log('\nObteniendo datos históricos...');
    const datosHistoricos = await cliente.getWeatherDataForSpanishRegion(
      SpanishRegion.MURCIA,
      fechaInicioHistoricaStr,
      fechaHoyStr
    );
    
    // 2. Obtener pronóstico
    console.log('Obteniendo pronóstico meteorológico...');
    const pronostico = await cliente.getWeatherForecast(
      SpanishRegion.MURCIA,
      fechaHoyStr,
      fechaFinPronosticoStr
    );
    
    // 3. Calcular balance hídrico histórico
    console.log('Calculando balance hídrico...');
    
    // Acumulados de los últimos 7 días
    const precipitacionAcumulada = datosHistoricos.reduce(
      (sum, dia) => sum + (dia.precipitation || 0), 0
    );
    
    const evapotranspiracionAcumulada = datosHistoricos.reduce(
      (sum, dia) => sum + (dia.evapotranspiration || 0), 0
    );
    
    // 4. Analizar condiciones actuales
    const condicionesHoy = datosHistoricos[datosHistoricos.length - 1];
    let estresHidricoActual = null;
    
    if (condicionesHoy.precipitation !== undefined && 
        condicionesHoy.evapotranspiration !== undefined && 
        condicionesHoy.soilMoisture !== undefined) {
      
      estresHidricoActual = calculateWaterStressIndex(
        condicionesHoy.precipitation,
        condicionesHoy.evapotranspiration,
        condicionesHoy.soilMoisture
      );
    }
    
    // 5. Generar plan de riego para los próximos días
    const planRiego: PlanRiego[] = [];
    
    // Función para calcular necesidad de riego diaria
    const calcularNecesidadRiego = (dia: DailyWeatherData): number => {
      if (dia.evapotranspiration === undefined || 
          dia.precipitation === undefined || 
          dia.soilMoisture === undefined) {
        return 0;
      }
      
      const estresHidrico = calculateWaterStressIndex(
        dia.precipitation,
        dia.evapotranspiration,
        dia.soilMoisture
      );
      
      // Calculamos necesidad de riego basada en evapotranspiración y estrés hídrico
      let necesidad = dia.evapotranspiration - dia.precipitation;
      
      // Ajustamos según nivel de estrés
      if (estresHidrico.status === 'severo') {
        necesidad *= 1.2; // 20% extra para recuperar el cultivo
      } else if (estresHidrico.status === 'moderado') {
        necesidad *= 1.1; // 10% extra para prevenir daños
      } else if (estresHidrico.status === 'óptimo') {
        necesidad *= 0.9; // 10% menos para optimizar agua
      }
      
      return Math.max(0, necesidad);
    };
    
    // Función para convertir mm a minutos de riego
    const mmARiegoMinutos = (mm: number): number => {
      // Cálculo basado en parámetros del sistema de riego
      const areaPlanta = distanciaEmisores * distanciaLineas; // m²
      const litrosPorMm = areaPlanta * 1; // 1mm = 1L/m²
      const litrosNecesarios = litrosPorMm * mm;
      const litrosPorMinuto = (caudalEmisores * emisoresPorPlanta) / 60;
      
      return Math.ceil(litrosNecesarios / (litrosPorMinuto * eficienciaRiego));
    };
    
    // Generar plan para cada día del pronóstico
    pronostico.forEach(dia => {
      const necesidadRiego = calcularNecesidadRiego(dia);
      const duracionRiego = mmARiegoMinutos(necesidadRiego);
      
      // Determinar prioridad
      let prioridad: 'baja' | 'media' | 'alta' | 'crítica' = 'baja';
      let observaciones = '';
      
      // Verificar alertas
      const alertas = checkWeatherAlert(dia);
      
      if (necesidadRiego > 5) {
        prioridad = 'alta';
      } else if (necesidadRiego > 3) {
        prioridad = 'media';
      }
      
      // Ajustar según alertas
      if (alertas.hasAlert) {
        if (alertas.alerts.some(a => a.includes('sequía'))) {
          prioridad = 'crítica';
          observaciones = 'Alerta por sequía en el suelo. Riego prioritario.';
        } else if (alertas.alerts.some(a => a.includes('exceso de humedad'))) {
          prioridad = 'baja';
          observaciones = 'Exceso de humedad detectado. Reducir o suspender riego.';
        } else if (alertas.alerts.some(a => a.includes('enfermedades fúngicas'))) {
          observaciones = 'Riesgo de enfermedades fúngicas. Regar por la mañana para permitir secado del follaje.';
        }
      }
      
      // Si va a llover, ajustar el riego
      if (dia.precipitation && dia.precipitation > 2) {
        prioridad = 'baja';
        observaciones += ' Se prevé lluvia significativa. Considerar reducir o posponer el riego.';
      }
      
      planRiego.push({
        fecha: dia.date,
        necesidadRiego: parseFloat(necesidadRiego.toFixed(2)),
        duracionRiego,
        prioridad,
        observaciones: observaciones.trim()
      });
    });
    
    // 6. Generar informe
    console.log('\n--- ANÁLISIS DE CONDICIONES ACTUALES ---');
    console.log(`Precipitación acumulada (7 días): ${precipitacionAcumulada.toFixed(1)} mm`);
    console.log(`Evapotranspiración acumulada (7 días): ${evapotranspiracionAcumulada.toFixed(1)} mm`);
    console.log(`Balance hídrico: ${(precipitacionAcumulada - evapotranspiracionAcumulada).toFixed(1)} mm`);
    
    if (estresHidricoActual) {
      console.log(`\nÍndice de estrés hídrico actual: ${estresHidricoActual.stressIndex.toFixed(2)}`);
      console.log(`Estado: ${estresHidricoActual.status}`);
      console.log(`Recomendación: ${estresHidricoActual.recommendation}`);
    } else {
      console.log('\nNo hay datos suficientes para calcular el estrés hídrico actual');
    }
    
    console.log('\n--- PLAN DE RIEGO PARA LOS PRÓXIMOS 5 DÍAS ---');
    console.log('Fecha       | Necesidad | Duración | Prioridad | Observaciones');
    console.log('-----------|-----------|----------|-----------|-------------');
    
    planRiego.forEach(plan => {
      const fecha = new Date(plan.fecha.substring(0, 4) + '-' + 
                            plan.fecha.substring(4, 6) + '-' + 
                            plan.fecha.substring(6, 8));
      
      console.log(
        `${fecha.toLocaleDateString().padEnd(12)}| ` +
        `${plan.necesidadRiego.toFixed(1)} mm`.padEnd(12) + '| ' +
        `${plan.duracionRiego} min`.padEnd(11) + '| ' +
        `${plan.prioridad}`.padEnd(11) + '| ' +
        plan.observaciones
      );
    });
    
    // 7. Calcular ahorro potencial de agua
    const aguaTotalSinOptimizar = pronostico.reduce(
      (sum, dia) => sum + (dia.evapotranspiration || 0), 0
    );
    
    const aguaTotalOptimizada = planRiego.reduce(
      (sum, plan) => sum + plan.necesidadRiego, 0
    );
    
    const ahorroAgua = aguaTotalSinOptimizar - aguaTotalOptimizada;
    const porcentajeAhorro = (ahorroAgua / aguaTotalSinOptimizar) * 100;
    
    console.log('\n--- EFICIENCIA DEL SISTEMA ---');
    console.log(`Agua requerida sin optimización: ${aguaTotalSinOptimizar.toFixed(1)} mm`);
    console.log(`Agua requerida con plan optimizado: ${aguaTotalOptimizada.toFixed(1)} mm`);
    console.log(`Ahorro potencial de agua: ${ahorroAgua.toFixed(1)} mm (${porcentajeAhorro.toFixed(1)}%)`);
    
    console.log('\n--- RECOMENDACIONES ADICIONALES ---');
    if (estresHidricoActual && estresHidricoActual.status === 'severo') {
      console.log('- Considerar aplicación de acolchados para reducir la evaporación');
      console.log('- Evaluar la posibilidad de instalar mallas de sombreo temporal');
    }
    
    if (planRiego.some(p => p.prioridad === 'crítica')) {
      console.log('- Verificar el funcionamiento del sistema de riego antes de los días críticos');
      console.log('- Considerar riego nocturno para maximizar la eficiencia');
    }
    
    console.log('- Monitorear regularmente la humedad del suelo con sensores');
    console.log('- Ajustar el plan según las condiciones reales observadas');
    
  } catch (error) {
    console.error('Error en el sistema de gestión de riego:', error);
  }
}

// Ejecutar el sistema de gestión de riego
gestionRiegoHorticolas();
```

## Consideraciones Importantes

### Posibles valores no definidos
- Algunos registros pueden contener valores `undefined` o `null` cuando los datos no están disponibles para ciertas fechas.
- Recomendamos siempre verificar la existencia de los datos antes de utilizarlos.

### Formato de fechas
- Las fechas se representan en formato YYYYMMDD (por ejemplo, 20220101 para el 1 de enero de 2022).
- Utilice las funciones `formatDateToYYYYMMDD` y `parseYYYYMMDDToDate` para manejar correctamente la conversión de estos formatos.

### Errores de API
- La API puede devolver errores cuando:
  - Las coordenadas geográficas están fuera de rango
  - El rango de fechas solicitado es inválido
  - Hay problemas de conectividad con el servidor
  - El servicio está en mantenimiento

### Especificidad para España
- Esta implementación está optimizada para coordenadas dentro del territorio español.
- Los datos pueden utilizarse para planificación agrícola, gestión de riego, y previsión de cosechas.

## Requisitos

- Node.js 14.x o superior
- Conexión a Internet para acceder a la API de NASA POWER

## Tecnologías utilizadas
- TypeScript
- Axios para peticiones HTTP
- Jest para pruebas

## Fuente de datos
Los datos son proporcionados por [NASA POWER](https://power.larc.nasa.gov/), un servicio que ofrece datos meteorológicos y de energía solar para diversas aplicaciones, incluyendo la agricultura.

## Licencia
Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
