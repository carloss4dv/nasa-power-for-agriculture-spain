# NASA POWER for Agriculture Spain

## Descripción
Esta aplicación proporciona acceso a datos climáticos de la NASA POWER específicamente adaptados para la agricultura en España. Permite consultar diferentes parámetros meteorológicos como temperatura, precipitación, humedad y otros factores relevantes para el sector agrícola.

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

## Tecnologías utilizadas
- TypeScript
- Axios para peticiones HTTP
- Jest para pruebas

## Fuente de datos
Los datos son proporcionados por [NASA POWER](https://power.larc.nasa.gov/), un servicio que ofrece datos meteorológicos y de energía solar para diversas aplicaciones, incluyendo la agricultura.

## Licencia
Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 