# Cliente NASA POWER para Agricultura en España

## Descripción

Este cliente proporciona una interfaz sencilla para acceder a los datos meteorológicos y agroclimáticos de la API NASA POWER, especialmente adaptado para su uso en aplicaciones agrícolas en España.

## Características

- Obtención de datos meteorológicos por coordenadas o región española
- Cálculo de índices agroclimáticos (sequía, estrés por calor, riesgo de heladas, etc.)
- Generación de recomendaciones agrícolas personalizadas
- Funciones especializadas:
  - Verificación de condiciones de lluvia
  - Determinación de necesidad de riego
  - Evaluación de riesgo de heladas
  - Análisis de condiciones óptimas para siembra

## Instalación

```bash
npm install nasa-power-client
```

## Uso básico

```typescript
import { NasaPowerClient, SpanishRegion } from 'nasa-power-client';

// Crear instancia del cliente
const client = new NasaPowerClient();

// Obtener datos meteorológicos para una región de España
async function getWeatherData() {
  const startDate = '20230101';
  const endDate = '20230105';
  
  const data = await client.getWeatherDataForSpanishRegion(
    SpanishRegion.ANDALUCIA,
    startDate,
    endDate
  );
  
  console.log(data);
}

getWeatherData();
```

## Ejemplos de uso

### Verificar si está lloviendo

```typescript
const isRaining = await client.isRaining(SpanishRegion.GALICIA);
console.log(`¿Está lloviendo en Galicia? ${isRaining ? 'Sí' : 'No'}`);
```

### Determinar necesidad de riego

```typescript
const irrigationInfo = await client.shouldIrrigate(SpanishRegion.VALENCIA);
console.log(`¿Se debe regar? ${irrigationInfo.shouldIrrigate ? 'Sí' : 'No'}`);
console.log(`Razón: ${irrigationInfo.reason}`);
if (irrigationInfo.recommendedAmount) {
  console.log(`Cantidad recomendada: ${irrigationInfo.recommendedAmount} mm`);
}
```

### Verificar riesgo de heladas

```typescript
const frostRisk = await client.checkFrostRisk(SpanishRegion.CASTILLA_Y_LEON);
console.log(`Nivel de riesgo: ${frostRisk.riskLevel}`);
console.log(`Mensaje: ${frostRisk.message}`);
```

### Analizar condiciones para siembra

```typescript
const plantingConditions = await client.checkPlantingConditions(SpanishRegion.ARAGON);
console.log(`¿Condiciones óptimas? ${plantingConditions.isOptimal ? 'Sí' : 'No'}`);
console.log(`Detalles: ${plantingConditions.message}`);
```

### Obtener datos agrícolas completos

```typescript
const agriculturalData = await client.getAgriculturalData(
  SpanishRegion.CATALUÑA,
  '20230601',
  '20230615'
);

// Datos meteorológicos
console.log(agriculturalData.weatherData);

// Índices agroclimáticos calculados
console.log(agriculturalData.indices);

// Recomendaciones agrícolas
console.log(agriculturalData.recommendations);
```

## Parámetros meteorológicos disponibles

La librería permite obtener los siguientes parámetros meteorológicos:

- Temperatura media, máxima y mínima (°C)
- Precipitación (mm/día)
- Humedad relativa (%)
- Velocidad y dirección del viento
- Temperatura del suelo a distintas profundidades
- Humedad del suelo
- Evapotranspiración (mm/día)
- Radiación solar y PAR
- Punto de rocío
- Presión atmosférica
- Cobertura de nubes

## Regiones españolas soportadas

La librería incluye coordenadas predefinidas para todas las comunidades autónomas de España.

## Requisitos

- Node.js 14.x o superior
- Conexión a Internet para acceder a la API de NASA POWER

## Licencia

MIT 