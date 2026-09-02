#!/usr/bin/env python3
"""Genera el catálogo estático de los 406 videos premium."""

import json
import os
import re
import unicodedata
import urllib.parse
from pathlib import Path

SOURCE = Path(os.environ.get(
    "EXERCISE_SOURCE_DIR",
    "/Users/augustociuro/Desktop/1° BIBLIOTECA - GIFs PREMIUM DE EJERCICIOS",
))
OUTPUT = Path(__file__).resolve().parent.parent / "src" / "premium-exercise-library.json"
# Railway Buckets are private. The app sirve cada video mediante su propia ruta
# autenticada con las credenciales del servidor, nunca mediante un URL público.
MEDIA_BASE = os.environ.get("EXERCISE_MEDIA_BASE_URL", "/api/kine/media")


def normalized(value: str) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFD", value)
        if unicodedata.category(char) != "Mn"
    ).upper()


def contains(text: str, *terms: str) -> bool:
    return any(normalized(term) in text for term in terms)


def classified(name: str) -> dict:
    # La parte posterior al guion explica técnica (por ejemplo, "posición de las
    # muñecas") y no define la articulación objetivo. Clasificamos por el título.
    text = normalized(name.split(" — ", 1)[0])

    def result(articulacion: str, movimiento: str, confidence: str = "alta") -> dict:
        return {
            "articulacion": articulacion,
            "movimiento": movimiento,
            "categoria": f"{articulacion} · {movimiento}",
            "confidence": confidence,
        }

    # Estos videos combinan varios segmentos, así que no sería clínicamente
    # correcto forzarlos dentro de una sola articulación.
    if contains(text, "CIRCUITO", "ENTRENAMIENTO EN EL SUELO"):
        return result("Multiartricular", "Circuito / rutina", "media")
    if contains(text, "VARIACIONES DE EJERCICIOS", "VARIACIONES INCLINADAS", "VARIACIONES CON LANDMINE"):
        return result("Multiartricular", "Multiplanar", "media")
    if contains(text, "FONDOS EN PARALELAS"):
        return result("Multiartricular", "Empuje", "alta")

    # Tobillo y pie
    if contains(text, "PANTORRILLA", "GEMELO", "TALON", "PUNTILLAS"):
        return result("Tobillo", "Flexión plantar")
    if contains(text, "DORSIFLEX"):
        return result("Tobillo", "Dorsiflexión")
    if contains(text, "EVERSION"):
        return result("Tobillo", "Eversión")
    if contains(text, "INVERSION"):
        return result("Tobillo", "Inversión")

    # Muñeca y mano
    if contains(text, "MUÑECA", "MUNECA"):
        if contains(text, "EXTENSION"):
            return result("Muñeca", "Extensión")
        if contains(text, "FLEXION"):
            return result("Muñeca", "Flexión")
        return result("Muñeca", "Movilidad", "media")

    # Codo y antebrazo
    if contains(text, "PRONACION"):
        return result("Antebrazo", "Pronación")
    if contains(text, "SUPINACION"):
        return result("Antebrazo", "Supinación")
    if contains(text, "TRICEPS", "FONDOS EN BANCO", "FONDOS EN MAQUINA", "EXTENSION DE TRICEPS", "TRICEPS FRANCES", "PATADA DE TRICEPS"):
        return result("Codo", "Extensión")
    if contains(text, "BICEPS", "CURL SCOTT", "CURL CONCENTRADO", "CURL SPIDER", "CURL CON MANCUERNAS", "CURL CON BARRA"):
        return result("Codo", "Flexión")

    # Cadera y rodilla
    if contains(text, "ABDUCCION DE CADERA", "MAQUINA ABDUCTORA"):
        return result("Cadera", "Abducción")
    if contains(text, "ADUCTOR", "ADUCCION DE CADERA", "SENTADILLA SUMO"):
        return result("Cadera", "Aducción")
    if contains(text, "HIP THRUST", "GLUTEO", "PATADA TRASERA", "PUENTE DE CADERA", "PUENTE DE GLUTEOS"):
        return result("Cadera", "Extensión")
    if contains(text, "PESO MUERTO", "RUMANO", "GOOD MORNING"):
        return result("Cadera", "Flexión")
    if contains(text, "CURL FEMORAL", "FLEXORA", "FLEXION DE RODILLA"):
        return result("Rodilla", "Flexión")
    if contains(text, "SENTADILLA", "PRENSA DE PIERNAS", "EXTENSION DE PIERNAS", "MAQUINA DE EXTENSION", "ZANCADA", "BULGARA", "GOBLET", "LANDMINE PARA PIERNAS"):
        return result("Rodilla", "Extensión")

    # Columna y control del tronco
    if contains(text, "HIPEREXTENSION", "BANCO ROMANO"):
        return result("Columna lumbar", "Extensión")
    if contains(text, "RUSSIAN TWIST", "ROTACION DEL TRONCO", "OBLICUO", "CHOP"):
        return result("Columna lumbar", "Rotación")
    if contains(text, "PLANCHA", "RUEDA ABDOMINAL", "BIRD DOG", "MOUNTAIN CLIMBER"):
        return result("Columna lumbar", "Estabilización")
    if contains(text, "ABDOMINAL", "CRUNCH", "ELEVACION DE RODILLAS", "FLUTTER KICK"):
        return result("Columna lumbar", "Flexión")
    if contains(text, "POSTURA DEL NIÑO"):
        return result("Columna lumbar", "Flexión")
    if contains(text, "MOVILIDAD", "POSTURA", "ESTIRAMIENTO"):
        return result("Columna", "Movilidad", "media")

    # Hombro y escápula. El orden conserva los movimientos específicos.
    if contains(text, "FACE PULL"):
        return result("Hombro", "Rotación externa")
    if contains(text, "APERTURA INVERSA", "DELTOIDE POSTERIOR", "VUELO POSTERIOR"):
        return result("Hombro", "Abducción horizontal")
    if contains(text, "ELEVACION LATERAL"):
        return result("Hombro", "Abducción")
    if contains(text, "ELEVACION FRONTAL", "PRESS DE HOMBROS", "PRESS MILITAR", "PINO"):
        return result("Hombro", "Flexión")
    if contains(text, "ENCOGIMIENTO"):
        return result("Escápula", "Elevación")
    if contains(text, "REMO", "RETRACCION ESCAPULAR"):
        return result("Escápula", "Retracción")
    if contains(text, "JALON", "DOMINADA", "PULLOVER"):
        return result("Hombro", "Aducción")
    if contains(text, "APERTURA", "CROSSOVER", "PRESS DE BANCA", "PRESS DE PECHO", "FLEXIONES DE BRAZOS", "FLEXIONES"):
        return result("Hombro", "Aducción horizontal")
    if contains(text, "HOMBRO", "HOMBROS"):
        return result("Hombro", "Multiplanar", "media")

    # Circuitos y rutinas sin una articulación primaria única.
    if contains(text, "PIERNA", "PIERNAS"):
        return result("Miembro inferior", "Multiartricular", "media")
    if contains(text, "PECHO", "ESPALDA", "BRAZO", "BRAZOS", "TREN SUPERIOR"):
        return result("Miembro superior", "Multiartricular", "media")
    return result("Multiartricular", "General", "media")


def display_name(filename: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"\((\d+)\)", r"· variante \1", Path(filename).stem)).strip()


if not SOURCE.is_dir():
    raise SystemExit(f"No se encontró la carpeta de videos: {SOURCE}")

videos = sorted((path for path in SOURCE.glob("*.mp4")), key=lambda item: item.name)
if len(videos) != 406:
    raise SystemExit(f"Se esperaban 406 videos y se encontraron {len(videos)}.")

library = []
for video in videos:
    nombre = display_name(video.name)
    library.append({
        "nombre": nombre,
        "descripcion": f"Video demostrativo: {nombre.split(' — ')[0]}.",
        "video_url": f"{MEDIA_BASE}/{urllib.parse.quote(video.name, safe='')}",
        "source_filename": video.name,
        **classified(nombre),
    })

OUTPUT.write_text(json.dumps(library, ensure_ascii=False, indent=2) + "\n")
print(f"Catálogo generado: {len(library)} videos en {OUTPUT}")
