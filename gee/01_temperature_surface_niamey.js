/*******************************************************************************
 * TEMPÉRATURE DE SURFACE (LST), NIAMEY, NIGER
 * Source : Landsat 8 & 9, Collection 2, Level 2 (USGS), bande ST_B10
 * Période : saison sèche chaude (mars à mai), plusieurs années
 * Auteur : Karl Tancrède Boguhe
 *
 * Logique : le produit L2 fournit déjà une LST corrigée de l'atmosphère et de
 * l'émissivité (algorithme mono-canal USGS, émissivité ASTER GED). On applique
 * donc seulement : masque nuages -> facteurs d'échelle -> Kelvin -> °C -> composite.
 ******************************************************************************/

// ---------------------------------------------------------------------------
// 1. ZONE D'ÉTUDE
// Rectangle englobant l'agglomération de Niamey + sa périphérie rurale.
// La périphérie est INDISPENSABLE : sans référence rurale, pas d'analyse d'îlot.
// ---------------------------------------------------------------------------
var aoi = ee.Geometry.Rectangle([1.95, 13.40, 2.25, 13.65]); // [lonMin, latMin, lonMax, latMax]
Map.centerObject(aoi, 11);

// ---------------------------------------------------------------------------
// 2. PARAMÈTRES TEMPORELS
// Mars à mai = pic thermique à Niamey (avant la mousson). On empile 2022 à 2025
// pour avoir assez de scènes sans nuages et lisser l'effet d'une année anormale.
// ---------------------------------------------------------------------------
var startYear = 2022;
var endYear   = 2025;
var startMonth = 3;
var endMonth   = 5;

// ---------------------------------------------------------------------------
// 3. MASQUE NUAGES (bande QA_PIXEL, bits CFMask)
// bit 1 = nuage dilaté, bit 2 = cirrus, bit 3 = nuage, bit 4 = ombre de nuage
// Un nuage est FROID vu par l'infrarouge thermique : un seul pixel non masqué
// fait chuter la LST de 20 à 30 °C. Le masque n'est pas optionnel.
// ---------------------------------------------------------------------------
function maskL2(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 1).eq(0)
    .and(qa.bitwiseAnd(1 << 2).eq(0))
    .and(qa.bitwiseAnd(1 << 3).eq(0))
    .and(qa.bitwiseAnd(1 << 4).eq(0));

  // Masque qualité thermique : ST_QA = incertitude de la LST (K, échelle 0.01).
  // On rejette les pixels avec une incertitude > 3 K.
  var stUncertainty = image.select('ST_QA').multiply(0.01);
  mask = mask.and(stUncertainty.lte(3));

  return image.updateMask(mask);
}

// ---------------------------------------------------------------------------
// 4. CONVERSION EN LST (°C)
// Le DN est stocké en entier : T(K) = DN * 0.00341802 + 149.0  (doc USGS C2 L2)
// Puis T(°C) = T(K) - 273.15
// ---------------------------------------------------------------------------
function addLST(image) {
  var lst = image.select('ST_B10')
    .multiply(0.00341802)
    .add(149.0)
    .subtract(273.15)
    .rename('LST_C');
  return image.addBands(lst)
    .copyProperties(image, ['system:time_start', 'CLOUD_COVER', 'SPACECRAFT_ID']);
}

// ---------------------------------------------------------------------------
// 5. COLLECTION LANDSAT 8 + 9 FUSIONNÉE
// Même capteur thermique (TIRS / TIRS-2), même chaîne L2 : fusion légitime.
// Deux satellites = revisite de 8 jours au lieu de 16.
// ---------------------------------------------------------------------------
var dateFilter = ee.Filter.and(
  ee.Filter.calendarRange(startYear, endYear, 'year'),
  ee.Filter.calendarRange(startMonth, endMonth, 'month')
);

var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2');

var collection = l8.merge(l9)
  .filterBounds(aoi)
  .filter(dateFilter)
  .filter(ee.Filter.lt('CLOUD_COVER', 30))
  .map(maskL2)
  .map(addLST);

print('Nombre de scènes retenues :', collection.size());

// ---------------------------------------------------------------------------
// 6. COMPOSITE MÉDIAN
// La médiane est robuste aux valeurs aberrantes (résidus de nuages, voiles de
// poussière/harmattan) contrairement à la moyenne.
// ---------------------------------------------------------------------------
var lstMedian = collection.select('LST_C').median().clip(aoi);

// ---------------------------------------------------------------------------
// 7. VISUALISATION
// ---------------------------------------------------------------------------
var visLST = {
  min: 35, max: 60,
  palette: ['040274', '0502ce', '307ef3', '30c8e2', '3be285',
            '86e26f', 'd6e21f', 'ffd611', 'ff8b13', 'ff0000', 'c21301', '911003']
};
Map.addLayer(lstMedian, visLST, 'LST médiane mars-mai (°C)');
Map.addLayer(ee.Image().paint(aoi, 0, 2), {palette: 'black'}, 'Zone d\'étude');

// ---------------------------------------------------------------------------
// 8. STATISTIQUES ZONALES
// scale = 30 m : la bande ST_B10 est livrée à 30 m mais rééchantillonnée depuis
// 100 m (résolution native de TIRS). Ne JAMAIS interpréter des détails < 100 m.
// ---------------------------------------------------------------------------
var stats = lstMedian.reduceRegion({
  reducer: ee.Reducer.mean()
    .combine(ee.Reducer.minMax(), '', true)
    .combine(ee.Reducer.stdDev(), '', true)
    .combine(ee.Reducer.percentile([10, 50, 90]), '', true),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e10
});
print('Statistiques LST (°C) :', stats);

// ---------------------------------------------------------------------------
// 9. SÉRIE TEMPORELLE (moyenne spatiale par scène)
// Utile pour repérer les scènes aberrantes (poussière, nuages résiduels).
// ---------------------------------------------------------------------------
var chart = ui.Chart.image.series({
  imageCollection: collection.select('LST_C'),
  region: aoi,
  reducer: ee.Reducer.mean(),
  scale: 100
}).setOptions({
  title: 'LST moyenne sur Niamey, scènes mars-mai ' + startYear + '-' + endYear,
  vAxis: {title: 'LST (°C)'},
  hAxis: {title: 'Date'},
  pointSize: 4,
  lineWidth: 0
});
print(chart);

// ---------------------------------------------------------------------------
// 10. LÉGENDE
// ---------------------------------------------------------------------------
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px'}});
legend.add(ui.Label('LST (°C)', {fontWeight: 'bold'}));
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select(0),
  params: {bbox: [0, 0, 1, 0.1], dimensions: '150x10', format: 'png',
           min: 0, max: 1, palette: visLST.palette},
  style: {stretch: 'horizontal', margin: '0px 8px'}
});
legend.add(colorBar);
legend.add(ui.Panel([
  ui.Label(visLST.min, {margin: '4px 8px'}),
  ui.Label(visLST.max, {margin: '4px 8px', textAlign: 'right', stretch: 'horizontal'})
], ui.Panel.Layout.flow('horizontal')));
Map.add(legend);

// ---------------------------------------------------------------------------
// 11. EXPORT (GeoTIFF vers Google Drive) -> pour QGIS / Python
// ---------------------------------------------------------------------------
Export.image.toDrive({
  image: lstMedian.toFloat(),
  description: 'LST_Niamey_MAM_' + startYear + '_' + endYear,
  folder: 'GEE_exports',
  region: aoi,
  scale: 30,
  crs: 'EPSG:32631', // UTM 31N : zone UTM de Niamey (2°E)
  maxPixels: 1e10
});
