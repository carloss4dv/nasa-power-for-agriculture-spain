# NASA POWER for Agriculture Spain

# Descripción
 
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

## Estructura de Datos
Los datos se reciben en el siguiente formato:

```json
{
  "properties": {
    "parameter": {
      "PARÁMETRO_CLIMÁTICO": {
        "units": "UNIDAD_DE_MEDIDA",
        "FECHA": VALOR_NUMÉRICO,
        ...
      }
    }
  }
}
```

### Parámetros disponibles

| Parámetro | Descripción | Unidad |
|-----------|-------------|--------|
| T2M | Temperatura media a 2 metros | °C |
| T2M_MAX | Temperatura máxima a 2 metros | °C |
| T2M_MIN | Temperatura mínima a 2 metros | °C |
| PRECTOTCORR | Precipitación total corregida | mm/día |
| RH2M | Humedad relativa a 2 metros | % |
| TSOIL1 | Temperatura del suelo (capa 1) | °C |
| EVLAND | Evaporación terrestre | mm/día |

## Consideraciones importantes

### Posibles valores no definidos
- Algunos registros pueden contener valores `undefined` o `null` cuando los datos no están disponibles para ciertas fechas.
- Recomendamos siempre verificar la existencia de los datos antes de utilizarlos.

### Formato de fechas
- Las fechas se representan en formato YYYYMMDD (por ejemplo, 20220101 para el 1 de enero de 2022).
- Asegúrese de manejar correctamente la conversión de estos formatos según sea necesario.

### Errores de API
- La API puede devolver errores cuando:
  - Las coordenadas geográficas están fuera de rango
  - El rango de fechas solicitado es inválido
  - Hay problemas de conectividad con el servidor
  - El servicio está en mantenimiento

### Especificidad para España
- Esta implementación está optimizada para coordenadas dentro del territorio español.
- Los datos pueden utilizarse para planificación agrícola, gestión de riego, y previsión de cosechas.

## Instalación

```bash
npm install nasa-power-for-agriculture-spain
```

## Ejecución

```bash
npm start
```

## Pruebas

```bash
npm test
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

## Regiones españolas soportadas
 
 La librería incluye coordenadas predefinidas para todas las comunidades autónomas de España.

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
