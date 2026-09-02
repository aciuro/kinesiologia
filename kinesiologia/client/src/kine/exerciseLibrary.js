import library from './premium-exercise-library.json'

const groups = new Map()

for (const exercise of library) {
  const title = `${exercise.articulacion} · ${exercise.movimiento}`
  if (!groups.has(title)) groups.set(title, [])
  groups.get(title).push({
    name: exercise.nombre,
    nombre: exercise.nombre,
    group: title,
    articulacion: exercise.articulacion,
    movimiento: exercise.movimiento,
    video_url: exercise.video_url,
    video: exercise.video_url,
    images: ['/exercise-placeholder.svg'],
  })
}

export const exerciseLibrary = [...groups.entries()]
  .sort(([a], [b]) => a.localeCompare(b, 'es'))
  .map(([title, items]) => ({
    title,
    items: items.sort((a, b) => a.name.localeCompare(b.name, 'es')),
  }))
