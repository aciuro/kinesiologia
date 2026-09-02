import library from './premium-exercise-library.json'

function normalizeText(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function regionFor(articulacion = '') {
  const normal = normalizeText(articulacion)
  if (normal.includes('columna')) return normal.includes('lumbar') ? 'lumbar' : 'dorsal'
  if (normal === 'escapula') return 'hombro'
  if (normal === 'antebrazo' || normal === 'muneca') return 'brazo'
  if (normal.includes('miembro')) return normal.includes('inferior') ? 'rodilla' : 'hombro'
  return normal || 'core'
}

export const premiumExerciseLibrary = library.map(item => ({
  id: item.source_filename,
  name: item.nombre,
  nombre: item.nombre,
  group: `${item.articulacion} · ${item.movimiento}`,
  articulacion: item.articulacion,
  movimiento: item.movimiento,
  categoria: item.categoria,
  regiones: [regionFor(item.articulacion)],
  contracciones: [],
  tags: [item.articulacion, item.movimiento],
  video_url: item.video_url,
  video: item.video_url,
  images: [],
  imageSource: 'video premium',
  hasRealImage: false,
}))

export function getPremiumExerciseGroups() {
  return ['Todos', ...Array.from(new Set(premiumExerciseLibrary.map(e => e.group))).sort((a, b) => a.localeCompare(b, 'es'))]
}

export function auditPremiumExerciseImages() {
  return { total: premiumExerciseLibrary.length, required: 0, withReal: 0, missing: 0, missingNames: [] }
}

export function getPremiumExerciseOptions(context = 'gimnasio', search = '', group = 'Todos', region = 'Todos', contraction = 'Todos') {
  const query = normalizeText(search)
  return premiumExerciseLibrary
    .filter(e => group === 'Todos' || e.group === group)
    .filter(e => region === 'Todos' || (e.regiones || []).includes(region))
    .filter(e => contraction === 'Todos' || (e.contracciones || []).includes(contraction))
    .filter(e => !query || normalizeText([e.name, e.group, ...(e.tags || [])].join(' ')).includes(query))
    .sort((a, b) => a.group.localeCompare(b.group, 'es') || a.name.localeCompare(b.name, 'es'))
}
