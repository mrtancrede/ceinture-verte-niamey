/*******************************************************************************
 * CEINTURE VERTE DE NIAMEY, ÉVOLUTION DU COUVERT VÉGÉTAL (≈1986 -> 2025)
 * Google Earth Engine (éditeur JavaScript)
 *
 * Principe : une SEULE famille de capteurs (Landsat, 30 m) pour toutes les dates
 * comparées, même saison, même masque nuages, même traitement, même affichage.
 * Sentinel-2 (10 m) n'est utilisé qu'en BONUS pour le détail actuel, jamais
 * dans la comparaison.
 *
 * Auteur : Karl Tancrède Boguhe
 ******************************************************************************/

// =============================================================================
// 0. ZONE D'ÉTUDE
// =============================================================================
// Contour officiel : relation OpenStreetMap 8840816 "Ceinture Verte"
// (leisure=nature_reserve), exportée via overpass-turbo le 14/11/2026.
// Données © contributeurs OpenStreetMap, licence ODbL.
// 2 polygones, ~512 ha au total ; le grand polygone contient un "trou" (enclave).
var ceintureOSM = ee.Geometry.MultiPolygon([
  [
    [
      [2.166602,13.530123],[2.167968,13.530394],[2.167176,13.534327],[2.163567,13.533274],[2.160119,13.531809],
      [2.159633,13.531454],[2.160605,13.528832],[2.158256,13.526537],[2.158656,13.525836],[2.160594,13.52638],
      [2.164141,13.527331],[2.164319,13.526341],[2.167358,13.526798],[2.167224,13.527432],[2.166602,13.530123]
    ]
  ],
  [
    [
      [2.17041,13.525681],[2.162586,13.524445],[2.162773,13.523188],[2.161518,13.523021],[2.160941,13.52297],
      [2.160629,13.522428],[2.160177,13.52226],[2.160069,13.522613],[2.157393,13.521282],[2.151759,13.519012],
      [2.151957,13.517836],[2.152462,13.51549],[2.152821,13.513816],[2.152843,13.513415],[2.152655,13.513065],
      [2.148445,13.509555],[2.137388,13.50044],[2.137946,13.49983],[2.136731,13.498914],[2.13677,13.49885],
      [2.137018,13.498919],[2.137341,13.498977],[2.139393,13.498959],[2.141359,13.498881],[2.141743,13.498819],
      [2.141943,13.498748],[2.142145,13.49865],[2.142284,13.498558],[2.142483,13.498402],[2.142628,13.498258],
      [2.142794,13.49805],[2.14302,13.497612],[2.143609,13.495796],[2.143629,13.495598],[2.143626,13.495334],
      [2.143575,13.495094],[2.143492,13.49485],[2.143766,13.494877],[2.144143,13.495095],[2.144355,13.495268],
      [2.145132,13.495898],[2.1453,13.496034],[2.145758,13.496409],[2.146591,13.497051],[2.147516,13.497845],
      [2.148334,13.498513],[2.150359,13.500167],[2.15135,13.501027],[2.152604,13.502182],[2.152759,13.502309],
      [2.158104,13.506748],[2.160124,13.508684],[2.160108,13.510324],[2.160192,13.51231],[2.1641,13.512341],
      [2.164084,13.513102],[2.163832,13.513117],[2.163548,13.513625],[2.163213,13.5138],[2.162899,13.513915],
      [2.162875,13.515375],[2.164264,13.515703],[2.173044,13.517586],[2.177836,13.518469],[2.177646,13.519677],
      [2.177974,13.519744],[2.177863,13.520141],[2.17613,13.519859],[2.175274,13.521048],[2.175507,13.523545],
      [2.176312,13.523785],[2.1759,13.525412],[2.173498,13.524942],[2.173091,13.526138],[2.17041,13.525681]
    ],
    [
      [2.152878,13.510554],[2.152875,13.510407],[2.152893,13.510195],[2.153069,13.510006],[2.15316,13.509852],
      [2.153519,13.509778],[2.153625,13.509702],[2.153655,13.509548],[2.15361,13.509374],[2.153437,13.509303],
      [2.15323,13.509224],[2.153082,13.509106],[2.152833,13.509123],[2.152657,13.5092],[2.15256,13.509035],
      [2.152511,13.508855],[2.152353,13.508713],[2.152153,13.508698],[2.15201,13.508752],[2.151749,13.508749],
      [2.151567,13.508684],[2.151543,13.50856],[2.15134,13.508533],[2.151133,13.508589],[2.151033,13.508722],
      [2.151012,13.50892],[2.151003,13.509053],[2.150982,13.509153],[2.151036,13.509294],[2.150942,13.50941],
      [2.15086,13.50966],[2.150854,13.509837],[2.151158,13.509991],[2.151989,13.510132],[2.152038,13.510348],
      [2.15208,13.510563],[2.151828,13.510796],[2.151413,13.511006],[2.151391,13.51118],[2.151701,13.511555],
      [2.151934,13.511395],[2.15235,13.511658],[2.152478,13.511785],[2.152405,13.511953],[2.152356,13.512171],
      [2.152581,13.512405],[2.15286,13.512366],[2.153212,13.51257],[2.153163,13.512741],[2.153136,13.51285],
      [2.153355,13.512909],[2.153588,13.512859],[2.153892,13.512821],[2.15411,13.512782],[2.154271,13.51249],
      [2.154456,13.512225],[2.154611,13.512024],[2.154854,13.511977],[2.155178,13.511543],[2.15533,13.510882],
      [2.155273,13.510723],[2.155121,13.510469],[2.154675,13.510312],[2.154474,13.510416],[2.15418,13.510637],
      [2.153822,13.510628],[2.153634,13.510619],[2.153057,13.510971],[2.152817,13.510885],[2.152878,13.510554]
    ]
  ]
], null, false);

var reserveOSM = ceintureOSM;

// Tracé manuel Google Earth Pro (Cadre_Ceinture_Verte.kmz, novembre 2026)
// ~1 593 ha. BASE DU TRACÉ À DOCUMENTER (source historique ? imagerie ancienne ?).
var traceGE = ee.Geometry.Polygon([[
    [2.14129,13.548603],[2.148237,13.537237],[2.151111,13.520984],[2.152213,13.513525],[2.146912,13.508954],
    [2.142246,13.504724],[2.139975,13.502735],[2.138236,13.501218],[2.137134,13.500252],[2.13576,13.499361],
    [2.134781,13.498315],[2.136682,13.496164],[2.137527,13.495264],[2.140049,13.493417],[2.141043,13.493214],
    [2.142426,13.493586],[2.14342,13.494062],[2.15246,13.501915],[2.164366,13.511933],[2.162295,13.515262],
    [2.179742,13.51838],[2.177831,13.528305],[2.174063,13.544251],[2.165123,13.558289],[2.14129,13.548603]
]], null, false);

// Le tracé contient la quasi-totalité de la réserve OSM (511,6 ha sur 512,3).
var ceinture = traceGE.union(reserveOSM, 30);                 // emprise étudiée
var horsReserve = traceGE.difference(reserveOSM, 30);          // ~1 081 ha hors réserve

// ZONE TÉMOIN : anneau de 0 à 1 km autour de l'emprise, emprise exclue
// (quartiers voisins). Comparer ceinture vs témoin permet de séparer
// la dégradation LOCALE de la tendance régionale (sécheresses, climat).
var temoin = ceinture.buffer(1000, 30).difference(ceinture, 30);

// Zones sur lesquelles on calcule les statistiques
var zones = {
  reserve_osm: reserveOSM,     // partie encore classée en réserve
  hors_reserve: horsReserve,   // partie du tracé non classée aujourd'hui
  temoin: temoin               // quartiers voisins (0-1 km)
};

// Cadre d'affichage : emprise + ~1,5 km de marge
var cadre = ee.Geometry.Rectangle([2.12, 13.48, 2.195, 13.572], null, false);

Map.centerObject(cadre, 13);

// =============================================================================
// 1. ÉPOQUES COMPARÉES
// =============================================================================
// Saison sèche novembre -> mars : l'herbe est sèche (NDVI ~ 0.1), donc le signal
// vert restant vient surtout des ARBRES. C'est ce qu'on veut mesurer.
// (En septembre-décembre comme dans la v1, l'herbe de fin de saison des pluies
//  est encore verte et "maquille" la disparition des arbres.)
// Fenêtres de 2 saisons sèches pour avoir assez d'images sans nuages.
// Landsat 7 : uniquement AVANT le 31 mai 2003 (panne SLC -> bandes manquantes).
var epoques = [
  {nom: '1986', capteur: 'L5',  debut: '1984-11-01', fin: '1987-03-31'},
  {nom: '2002', capteur: 'L7',  debut: '2000-11-01', fin: '2003-03-31'},
  {nom: '2014', capteur: 'L8',  debut: '2013-11-01', fin: '2015-03-31'},
  {nom: '2025', capteur: 'L89', debut: '2023-11-01', fin: '2025-03-31'}
];

var saisonSeche = ee.Filter.or(
  ee.Filter.calendarRange(11, 12, 'month'),
  ee.Filter.calendarRange(1, 3, 'month')
);

// =============================================================================
// 2. PRÉTRAITEMENT LANDSAT COLLECTION 2 LEVEL 2
// =============================================================================
// Masque : nuage dilaté (bit 1), cirrus (2), nuage (3), ombre (4) + saturation.
function masqueNuages(img) {
  var qa = img.select('QA_PIXEL');
  var clair = qa.bitwiseAnd(parseInt('11110', 2)).eq(0);
  var nonSature = img.select('QA_RADSAT').eq(0);
  return img.updateMask(clair).updateMask(nonSature);
}

// Réflectance de surface : DN * 0.0000275 - 0.2 (facteurs officiels USGS C2).
// C'est CE QUI MANQUAIT dans la v1 (min 8000 / max 18000 en DN bruts).
function reflectance(img) {
  return img.select('SR_B.').multiply(0.0000275).add(-0.2);
}

// Noms de bandes communs à tous les Landsat
function bandesTM(img) {   // Landsat 5 TM et 7 ETM+
  return reflectance(img)
    .select(['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'],
            ['blue', 'green', 'red', 'nir', 'swir1', 'swir2']);
}
function bandesOLI(img) {  // Landsat 8 et 9 OLI
  return reflectance(img)
    .select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'],
            ['blue', 'green', 'red', 'nir', 'swir1', 'swir2']);
}

// Harmonisation TM/ETM+ -> OLI (Roy et al., 2016, Remote Sensing of Environment).
// Les bandes spectrales ne sont pas identiques : sans cette correction, une
// partie de la "baisse de NDVI" serait un artefact de changement de capteur.
var pente = ee.Image.constant([0.8474, 0.8483, 0.9047, 0.8462, 0.8937, 0.9071]);
var ordonnee = ee.Image.constant([0.0003, 0.0088, 0.0061, 0.0412, 0.0254, 0.0172]);
function versOLI(img) {
  return img.multiply(pente).add(ordonnee)
    .rename(['blue', 'green', 'red', 'nir', 'swir1', 'swir2']);
}

function ajouterNDVI(img) {
  return img.addBands(img.normalizedDifference(['nir', 'red']).rename('NDVI'));
}

function collection(capteur, debut, fin) {
  var base;
  if (capteur === 'L5') {
    base = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2');
  } else if (capteur === 'L7') {
    base = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2');
  } else if (capteur === 'L8') {
    base = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
  } else {
    base = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .merge(ee.ImageCollection('LANDSAT/LC09/C02/T1_L2'));
  }
  var col = base.filterBounds(cadre)
    .filterDate(debut, fin)
    .filter(saisonSeche)
    .filter(ee.Filter.lt('CLOUD_COVER', 40))   // filtre large : le masque pixel fait le reste
    .map(masqueNuages);

  var tm = (capteur === 'L5' || capteur === 'L7');
  return col.map(function (img) {
    var b = tm ? versOLI(bandesTM(img)) : bandesOLI(img);
    return ajouterNDVI(b).copyProperties(img, ['system:time_start']);
  });
}

// =============================================================================
// 3. COMPOSITES + AFFICHAGE IDENTIQUE POUR TOUTES LES ÉPOQUES
// =============================================================================
var visRGB  = {bands: ['red', 'green', 'blue'], min: 0.03, max: 0.35, gamma: 1.3};
var visNDVI = {min: 0.05, max: 0.45,
               palette: ['a50026', 'f46d43', 'fee08b', 'd9ef8b', '66bd63', '006837']};

// Contour de la zone pour les images (blanc, 2 px)
var contour = ee.Image().byte()
  .paint(ee.FeatureCollection([ee.Feature(ceinture)]), 1, 2)
  .visualize({palette: 'ffffff'});

var composites = {};
var statsListe = [];

epoques.forEach(function (e) {
  var col = collection(e.capteur, e.debut, e.fin);
  var comp = col.median().clip(cadre);
  composites[e.nom] = comp;

  print('Époque ' + e.nom + ' (' + e.capteur + '), images utilisées :', col.size());

  Map.addLayer(comp, visRGB, e.nom + ', couleurs naturelles', false);
  Map.addLayer(comp.select('NDVI'), visNDVI, e.nom + ', NDVI', false);

  // NDVI moyen + part de surface "végétation dense" (NDVI > 0.25 en saison
  // sèche : seuil indicatif, à valider sur des points vus en très haute résolution)
  var ndvi = comp.select('NDVI');
  var dense = ndvi.gt(0.25).rename('dense');
  var red = ee.Reducer.mean();
  var props = {epoque: e.nom};
  Object.keys(zones).forEach(function (z) {
    var r = ndvi.addBands(dense).reduceRegion({
      reducer: red, geometry: zones[z], scale: 30, maxPixels: 1e9});
    props['ndvi_' + z] = r.get('NDVI');
    props['dense_pct_' + z] = ee.Number(r.get('dense')).multiply(100);
  });
  statsListe.push(ee.Feature(null, props));
});

// Carte de changement : NDVI 2025 - NDVI 1986 (rouge = perte, vert = gain)
var dNDVI = composites['2025'].select('NDVI')
  .subtract(composites['1986'].select('NDVI')).rename('dNDVI');
var visDiff = {min: -0.2, max: 0.2,
               palette: ['67001f', 'd6604d', 'fddbc7', 'f7f7f7', 'd9f0d3', '5aae61', '00441b']};
Map.addLayer(dNDVI, visDiff, 'Changement NDVI 1986 -> 2025', true);
Map.addLayer(contour, {}, 'Contour emprise étudiée (tracé GE + OSM)');
Map.addLayer(ee.Image().byte().paint(ee.FeatureCollection([ee.Feature(reserveOSM)]), 1, 2),
             {palette: '00ff00'}, 'Contour réserve OSM (vert)');
Map.addLayer(ee.Image().byte().paint(ee.FeatureCollection([ee.Feature(temoin)]), 1, 1),
             {palette: 'ffff00'}, 'Contour zone témoin (0-1 km)', false);

// =============================================================================
// 4. BONUS : DÉTAIL ACTUEL À 10 m (Sentinel-2 L2A), NE PAS COMPARER À LANDSAT
// =============================================================================
function masqueS2(img) {
  var scl = img.select('SCL');   // 3 ombre, 8-9 nuages, 10 cirrus
  var ok = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return img.updateMask(ok).divide(10000);
}
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(cadre)
  .filterDate('2024-11-01', '2025-03-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(masqueS2)
  .median().clip(cadre);
Map.addLayer(s2, {bands: ['B4', 'B3', 'B2'], min: 0.03, max: 0.35, gamma: 1.3},
             '2025, Sentinel-2 10 m (détail)', false);

// =============================================================================
// 5. STATISTIQUES ET GRAPHIQUE
// =============================================================================
var stats = ee.FeatureCollection(statsListe);
print('NDVI saison sèche par époque :', stats);
print(ui.Chart.feature.byFeature(stats, 'epoque', ['ndvi_reserve_osm', 'ndvi_hors_reserve', 'ndvi_temoin'])
  .setChartType('ColumnChart')
  .setOptions({title: 'NDVI moyen de saison sèche, réserve OSM / hors réserve / témoin 0-1 km',
               vAxis: {title: 'NDVI'}, colors: ['1b7837', 'e08214', 'b2abd2']}));

// =============================================================================
// 6. IMAGES PNG POUR LE PORTFOLIO (même cadrage, même rendu)
// =============================================================================
// 'dimensions' = UNE seule valeur (le plus grand côté) : GEE garde les
// proportions. Un '1000x1000' forcé déforme l'image (le cadre n'est pas carré).
var paramsPNG = {region: cadre, dimensions: 1400, crs: 'EPSG:3857', format: 'png'};

epoques.forEach(function (e) {
  var rgb = composites[e.nom].visualize(visRGB).blend(contour);
  print('PNG ' + e.nom + ' couleurs naturelles :', rgb.getThumbURL(paramsPNG));
});
print('PNG changement NDVI :', dNDVI.visualize(visDiff).blend(contour).getThumbURL(paramsPNG));

// =============================================================================
// 7. EXPORT DES DONNÉES (GeoTIFF) -> analyse en Python / QGIS
// =============================================================================
epoques.forEach(function (e) {
  Export.image.toDrive({
    image: composites[e.nom].select(['red', 'green', 'blue', 'nir', 'NDVI']).toFloat(),
    description: 'CeintureVerte_Niamey_' + e.nom,
    folder: 'GEE_exports',
    region: cadre,
    scale: 30,
    crs: 'EPSG:32631',          // UTM 31N : mètres, adapté aux mesures de surface
    maxPixels: 1e10
  });
});
Export.table.toDrive({
  collection: stats,
  description: 'CeintureVerte_Niamey_stats_NDVI',
  folder: 'GEE_exports',
  fileFormat: 'CSV'
});
