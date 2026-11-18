"""
Carte interactive de la température de surface (LST) - Niamey, Niger
=====================================================================
Saison sèche chaude (mars-mai), composite médian 2022-2025, Landsat 8/9 C2 L2.

Sortie : un fichier HTML AUTONOME (l'image LST est intégrée dans le fichier),
publiable tel quel sur GitHub Pages ou joint à un portfolio. Il ne dépend pas
d'un jeton Earth Engine : il ne "casse" pas au bout de quelques heures.

Dépendances :  pip install earthengine-api folium branca requests
Auteur : Karl Tancrède Boguhe
"""

import base64

import branca.colormap as cm
import ee
import folium
import requests
from folium.plugins import Fullscreen, MiniMap

# ---------------------------------------------------------------------------
# 0. PARAMÈTRES
# ---------------------------------------------------------------------------
PROJECT_ID = "VOTRE_PROJET_GOOGLE_CLOUD"
WEST, SOUTH, EAST, NORTH = 1.95, 13.40, 2.25, 13.65   # emprise Niamey + périphérie
YEARS = (2022, 2025)
MONTHS = (3, 5)                                       # mars -> mai
VMIN, VMAX = 38, 54          # étirement ~ p5-p95 observés : on ne gaspille pas
                             # la palette sur les extrêmes (eau, 31 °C)
OPACITY = 0.65
OUTPUT_HTML = "carte_LST_Niamey.html"

# Palette divergente bleu -> rouge (ColorBrewer RdYlBu inversée) :
# lisible, perceptuellement ordonnée, compréhensible par un non-spécialiste.
PALETTE = ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf",
           "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]

# ---------------------------------------------------------------------------
# 1. CALCUL DE LA LST DANS EARTH ENGINE
# ---------------------------------------------------------------------------
ee.Initialize(project=PROJECT_ID)
aoi = ee.Geometry.Rectangle([WEST, SOUTH, EAST, NORTH], proj="EPSG:4326", geodesic=False)


def lst_celsius(img):
    """Masque nuages/ombres/cirrus + qualité thermique, puis DN -> °C."""
    qa = img.select("QA_PIXEL")
    clear = (qa.bitwiseAnd(1 << 1).eq(0)        # nuage dilaté
             .And(qa.bitwiseAnd(1 << 2).eq(0))  # cirrus
             .And(qa.bitwiseAnd(1 << 3).eq(0))  # nuage
             .And(qa.bitwiseAnd(1 << 4).eq(0))) # ombre de nuage
    good_st = img.select("ST_QA").multiply(0.01).lte(3)   # incertitude <= 3 K
    lst = (img.select("ST_B10").multiply(0.00341802).add(149.0)  # facteurs USGS C2
           .subtract(273.15).rename("LST_C"))
    return lst.updateMask(clear.And(good_st))


season = ee.Filter.And(
    ee.Filter.calendarRange(YEARS[0], YEARS[1], "year"),
    ee.Filter.calendarRange(MONTHS[0], MONTHS[1], "month"),
)
collection = (
    ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .merge(ee.ImageCollection("LANDSAT/LC09/C02/T1_L2"))
    .filterBounds(aoi)
    .filter(season)
    .filter(ee.Filter.lt("CLOUD_COVER", 30))
    .map(lst_celsius)
)
n_images = collection.size().getInfo()
lst = collection.median().clip(aoi)
print(f"{n_images} images Landsat utilisées")

# ---------------------------------------------------------------------------
# 2. RENDU DE LA LST EN PNG (géoréférencé sur l'emprise exacte)
# On demande l'image en EPSG:4326 sur le rectangle exact : les coins du PNG
# correspondent alors exactement aux bornes passées à folium.
# Les pixels masqués (nuages persistants) restent transparents.
# ---------------------------------------------------------------------------
thumb_url = lst.visualize(min=VMIN, max=VMAX, palette=PALETTE).getThumbURL({
    "region": aoi,
    "dimensions": 1600,
    "crs": "EPSG:4326",
    "format": "png",
})
# Earth Engine calcule le composite (76 images) AU MOMENT de la requête :
# ça peut dépasser 2 min. On laisse 5 min et on réessaie jusqu'à 3 fois.
for attempt in range(1, 4):
    try:
        png = requests.get(thumb_url, timeout=300)
        png.raise_for_status()
        break
    except requests.exceptions.RequestException as err:
        print(f"Tentative {attempt}/3 échouée ({type(err).__name__}), nouvel essai...")
        if attempt == 3:
            raise
png_b64 = base64.b64encode(png.content).decode("ascii")

# ---------------------------------------------------------------------------
# 3. CARTE FOLIUM
# ---------------------------------------------------------------------------
center = [(SOUTH + NORTH) / 2, (WEST + EAST) / 2]
m = folium.Map(location=center, zoom_start=12, tiles=None, control_scale=True)

# Fonds de carte : services Esri publics, sans clé API.
# (Les tuiles CARTO renvoient "API KEY REQUIRED" et les tuiles OpenStreetMap
#  sont bloquées pour un fichier HTML ouvert en local : on ne les utilise plus.)
ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/"
ESRI_ATTR = "Tiles © Esri, Esri, HERE, Garmin, © OpenStreetMap contributors"

folium.TileLayer(
    tiles=ESRI + "Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attr=ESRI_ATTR, name="Fond gris clair (Esri)", max_zoom=16,
).add_to(m)
folium.TileLayer(
    tiles=ESRI + "World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr="Tiles © Esri, Maxar, Earthstar Geographics", name="Image satellite (Esri)",
).add_to(m)

# Couche LST semi-transparente
folium.raster_layers.ImageOverlay(
    image=f"data:image/png;base64,{png_b64}",
    bounds=[[SOUTH, WEST], [NORTH, EAST]],
    opacity=OPACITY,
    name="LST - saison sèche (°C)",
    interactive=False,
    zindex=10,
).add_to(m)

# Étiquettes des rues/quartiers AU-DESSUS de la LST (sinon on ne lit plus rien)
folium.TileLayer(
    tiles=ESRI + "Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attr=ESRI_ATTR,
    name="Noms de lieux (Esri)",
    max_zoom=16,
    overlay=True,
    control=True,
    z_index=20,
).add_to(m)

# Légende continue : bleu = frais, rouge = chaud
legend = cm.LinearColormap(PALETTE, vmin=VMIN, vmax=VMAX)
legend.caption = "Température de surface (°C), bleu : frais · rouge : chaud"
legend.add_to(m)

# ---------------------------------------------------------------------------
# 4. TITRE + SOURCES (bloc HTML fixe)
# ---------------------------------------------------------------------------
title_html = f"""
<div style="position: fixed; top: 12px; left: 55px; z-index: 9999;
     background: rgba(255,255,255,0.92); padding: 10px 16px; border-radius: 6px;
     box-shadow: 0 1px 6px rgba(0,0,0,0.25); font-family: Arial, sans-serif;
     max-width: 460px;">
  <div style="font-size: 17px; font-weight: bold; color: #222;">
    Température de surface, Niamey (Niger)
  </div>
  <div style="font-size: 12.5px; color: #444; margin-top: 3px;">
    Saison sèche chaude (mars à mai), composite médian {YEARS[0]} à {YEARS[1]},
    passage satellite ≈ 10h30 heure locale
  </div>
</div>
"""

source_html = f"""
<div style="position: fixed; bottom: 48px; left: 12px; z-index: 9999;
     background: rgba(255,255,255,0.9); padding: 6px 10px; border-radius: 4px;
     font-family: Arial, sans-serif; font-size: 11px; color: #333; max-width: 520px;">
  <b>Sources :</b> Landsat 8/9 Collection 2 Level 2, bande ST_B10 (USGS / NASA),
  {n_images} images, masque nuages CFMask · Traitement : Google Earth Engine ·
  Fonds : Esri, © OpenStreetMap contributors.<br>
  <i>Température de la surface du sol (et non de l'air). Résolution thermique native : 100 m.</i><br>
  Réalisation : Karl Tancrède Boguhe, 2026
</div>
"""
m.get_root().html.add_child(folium.Element(title_html))
m.get_root().html.add_child(folium.Element(source_html))

# Échelle en mètres uniquement (on masque la ligne en miles)
m.get_root().header.add_child(folium.Element(
    "<style>.leaflet-control-scale-line:nth-child(2){display:none;}</style>"))

# Confort de lecture
Fullscreen(position="topright").add_to(m)
# Mini-carte sur tuiles Esri (par défaut elle utilise OpenStreetMap -> "Access blocked")
MiniMap(
    tile_layer=folium.TileLayer(
        tiles=ESRI + "Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attr=ESRI_ATTR),
    toggle_display=True, position="bottomright", zoom_level_offset=-6,
).add_to(m)
folium.LayerControl(collapsed=False, position="topright").add_to(m)
m.fit_bounds([[SOUTH, WEST], [NORTH, EAST]])

m.save(OUTPUT_HTML)
print(f"Carte enregistrée : {OUTPUT_HTML}")
