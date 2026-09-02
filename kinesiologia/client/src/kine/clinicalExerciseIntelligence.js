import { premiumExerciseLibrary } from './premiumExerciseLibrary.js'

function norm(t=''){return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}

function enrich(ex){
  let images = ex.images && ex.images.length ? ex.images : null

  if(!images || images.length===0){
    images = ['/exercise-placeholder.svg']
  }

  return {
    ...ex,
    images,
    hasRealImage: images[0] !== '/exercise-placeholder.svg',
    nivel: ex.tags?.includes('pliometría') ? 'avanzado' : ex.tags?.includes('isometrica') ? 'inicial' : 'medio',
    objetivo: ex.contracciones?.includes('excentrica') ? 'rehab' : ex.tags?.includes('pliometría') ? 'retorno' : 'fuerza',
    material: ex.group?.includes('polea') ? 'polea' : ex.group?.includes('máquina') ? 'maquina' : 'libre'
  }
}

export const clinicalExercises = premiumExerciseLibrary.map(enrich)

export function getClinicalExerciseOptions(search='', filters={}){
  const q = norm(search)
  return clinicalExercises.filter(e=>{
    if(q && !norm(e.name).includes(q)) return false
    if(filters.articulacion && filters.articulacion!=='Todos' && !e.regiones.includes(filters.articulacion)) return false
    if(filters.contraccion && filters.contraccion!=='Todos' && !e.contracciones.includes(filters.contraccion)) return false
    if(filters.nivel && filters.nivel!=='Todos' && e.nivel!==filters.nivel) return false
    if(filters.objetivo && filters.objetivo!=='Todos' && e.objetivo!==filters.objetivo) return false
    return true
  })
}

export function auditExerciseImages(){
  const total = clinicalExercises.length
  const withReal = clinicalExercises.filter(e=>e.hasRealImage).length
  return {
    total,
    withReal,
    missing: total - withReal
  }
}

// Motor simple de inteligencia de rutina
export function getRoutineRecommendation({adherence=0,pain=0,difficulty='normal'}){
  if(pain>=7) return {action:'bajar',reason:'dolor alto'}
  if(adherence<40) return {action:'simplificar',reason:'baja adherencia'}
  if(difficulty==='facil' && adherence>70) return {action:'progresar',reason:'adaptacion positiva'}
  return {action:'mantener',reason:'carga adecuada'}
}
