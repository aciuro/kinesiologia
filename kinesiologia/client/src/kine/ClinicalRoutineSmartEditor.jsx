import { useMemo, useState } from 'react'
import ClinicalRoutineEditorWizard from './ClinicalRoutineEditorWizard.jsx'
import { getExerciseSuggestions, inferArticulationFromText, getSuggestionSummary } from './exerciseSuggestions.js'
import { getPremiumExerciseOptions } from './premiumExerciseLibrary.js'
import { api } from './api.js'

const c = {
  ink: '#082B34',
  muted: '#789FAA',
  border: 'rgba(83,151,166,.30)',
  sky: '#2F9FB2',
  skyDark: '#176F82',
  mint: '#E5F8F3',
  mintDark: '#16855F',
}

const fieldStyle = {
  width: '100%',
  border: `1px solid ${c.border}`,
  borderRadius: 14,
  padding: 12,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  fontSize: 14,
  background: '#FFFFFF',
  color: c.ink,
  WebkitTextFillColor: c.ink,
  caretColor: c.skyDark,
  outline: 'none',
}

function norm(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function itemText(item = {}) {
  return norm(item.nombre || item.name || item.texto || item.titulo || '')
}

function matches(item, query = '') {
  const q = norm(query)
  if (!q) return false
  const name = itemText(item)
  return name.includes(q) || q.split(/\s+/).some(t => t.length > 3 && name.includes(t))
}

function inferMuscle(text = '') {
  const q = norm(text)
  if (q.includes('cuad') || q.includes('vasto') || q.includes('recto femoral')) return 'cuadriceps'
  if (q.includes('isquio') || q.includes('femoral')) return 'isquiotibiales'
  if (q.includes('gemelo') || q.includes('soleo') || q.includes('aquiles')) return 'gemelos'
  if (q.includes('gluteo mayor') || q.includes('hip thrust') || q.includes('puente')) return 'gluteo mayor'
  if (q.includes('gluteo medio') || q.includes('abduccion') || q.includes('clamshell')) return 'gluteo medio'
  if (q.includes('aductor')) return 'aductores'
  return q || 'general'
}

function inferChainFromName(name = '', tags = []) {
  const q = norm([name, ...tags].join(' '))
  if (q.includes('camilla') || q.includes('silla extensora') || q.includes('curl femoral') || q.includes('banda') || q.includes('polea') || q.includes('elevacion de pierna recta')) return 'abierta'
  if (q.includes('sentadilla') || q.includes('step') || q.includes('split') || q.includes('prensa') || q.includes('hip thrust') || q.includes('puente') || q.includes('peso muerto') || q.includes('balance') || q.includes('copenhagen')) return 'cerrada'
  return 'mixta'
}

function matchesChain(option, chain) {
  if (!chain || chain === 'cualquiera') return true
  const inferred = inferChainFromName(option.name, option.tags || [])
  return inferred === chain || inferred === 'mixta'
}

function matchesMuscle(option, muscle) {
  if (!muscle) return true
  const hay = norm([option.name, option.group, ...(option.tags || [])].join(' '))
  const m = norm(muscle)
  const aliases = {
    cuadriceps: ['cuadriceps', 'extension', 'sentadilla', 'step', 'prensa', 'spanish', 'vasto'],
    isquiotibiales: ['isquio', 'isquiosurales', 'femoral', 'curl femoral', 'nordico', 'peso muerto'],
    gemelos: ['gemelo', 'talon', 'talones', 'soleo', 'aquiles'],
    'gluteo mayor': ['gluteo mayor', 'gluteo', 'hip thrust', 'puente', 'patada'],
    'gluteo medio': ['gluteo medio', 'abduccion', 'clamshell', 'monster walk', 'caminata lateral'],
    aductores: ['aductor', 'aduccion', 'copenhagen'],
  }
  return (aliases[m] || [m]).some(a => hay.includes(a))
}

function makeExercise(action = {}) {
  return {
    tipo: 'ejercicio',
    bloque: 'gimnasio',
    nombre: action.nombre || action.name || 'Ejercicio sugerido',
    series: action.series || '3',
    repeticiones: action.repeticiones || action.reps || '10',
    pausa: action.pausa || '60 seg',
    indicacion: action.indicacion || action.detalle || '',
    musculo: action.musculo || inferMuscle(action.nombre || action.name || ''),
    contraccion: action.contraccion || '',
    cadena: action.cadena || inferChainFromName(action.nombre || action.name || '', action.tags || []),
    imagen: action.imagen || action.image || null,
    sugerido_ia: true,
  }
}

function makeAgent(action = {}) {
  return {
    tipo: 'agente',
    bloque: 'post',
    nombre: action.nombre || 'Agente físico',
    duracion: action.duracion || '15 min',
    frecuencia: action.frecuencia || 'post rutina',
    detalle: action.detalle || '',
    sugerido_ia: true,
  }
}

function makeIndication(action = {}) {
  return {
    tipo: 'indicacion',
    bloque: 'indicacion',
    texto: action.texto || action.indicacion || 'Indicación sugerida por IA',
    sugerido_ia: true,
  }
}

function makeMobility(action = {}) {
  return {
    tipo: 'movilidad',
    bloque: 'movilidad',
    nombre: action.nombre || 'Bicicleta fija',
    duracion: action.duracion || '10 min',
    detalle: action.detalle || 'Entrada en calor suave',
    sugerido_ia: true,
  }
}

function makeStretching(action = {}) {
  return {
    tipo: 'indicacion',
    bloque: 'indicacion',
    texto: `${action.nombre || 'Elongación final'} · ${action.duracion || '5-8 min'} · ${action.detalle || 'Suave, sin dolor'}`,
    sugerido_ia: true,
  }
}

function resolveExerciseQuery(action = {}) {
  const cantidad = Number(action.cantidad || 1)
  const region = action.region || 'Todos'
  const contraccion = action.contraccion || 'Todos'
  const musculo = action.musculo || ''
  const cadena = action.cadena || 'cualquiera'

  const options = getPremiumExerciseOptions('gimnasio', '', 'Todos', region, contraccion)
    .filter(opt => matchesMuscle(opt, musculo))
    .filter(opt => matchesChain(opt, cadena))

  const fallback = getPremiumExerciseOptions('gimnasio', '', 'Todos', region, contraccion)
    .filter(opt => matchesMuscle(opt, musculo))

  return (options.length ? options : fallback).slice(0, cantidad).map(opt => makeExercise({
    nombre: opt.name,
    series: action.series || (contraccion === 'isometrica' ? '4' : '3'),
    repeticiones: action.repeticiones || (contraccion === 'isometrica' ? '30-45 seg' : '8-10'),
    pausa: action.pausa || '60-90 seg',
    indicacion: action.indicacion || (contraccion === 'excentrica' ? 'Bajada lenta y controlada' : ''),
    musculo,
    contraccion,
    cadena: cadena === 'cualquiera' ? inferChainFromName(opt.name, opt.tags || []) : cadena,
    articulacion: opt.articulacion,
    movimiento: opt.movimiento,
    video_url: opt.video_url,
    video: opt.video_url,
    tags: opt.tags || [],
  }))
}

function interleaveExercises(items = []) {
  const warm = items.filter(it => ['movilidad', 'cardio'].includes(it.tipo || it.bloque))
  const gym = items.filter(it => (it.tipo === 'ejercicio' || it.bloque === 'gimnasio'))
  const rest = items.filter(it => !['movilidad', 'cardio'].includes(it.tipo || it.bloque) && !(it.tipo === 'ejercicio' || it.bloque === 'gimnasio'))

  const buckets = new Map()
  gym.forEach(item => {
    const key = inferMuscle(item.musculo || item.nombre || '')
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(item)
  })

  const result = []
  let lastKey = ''
  while ([...buckets.values()].some(list => list.length)) {
    const candidates = [...buckets.entries()]
      .filter(([, list]) => list.length)
      .sort((a, b) => b[1].length - a[1].length)
    const chosen = candidates.find(([key]) => key !== lastKey) || candidates[0]
    const [key, list] = chosen
    result.push(list.shift())
    lastKey = key
  }

  return [...warm, ...result, ...rest]
}

function reorderClinical(items = []) {
  const order = { movilidad: 0, cardio: 1, ejercicio: 2, gimnasio: 2, campo: 3, agente: 4, post: 4, indicacion: 5 }
  const type = it => it.tipo || it.bloque || 'ejercicio'
  const grouped = [...items].sort((a, b) => (order[type(a)] ?? 9) - (order[type(b)] ?? 9))
  return interleaveExercises(grouped)
}

function applyActionsToRoutine(rutina = {}, actions = []) {
  let ejercicios = Array.isArray(rutina.ejercicios) ? [...rutina.ejercicios] : []
  let next = { ...rutina }
  const applied = []

  actions.forEach(action => {
    if (!action?.type) return

    if (action.type === 'add_exercise') {
      ejercicios.push(makeExercise(action))
      applied.push(`Agregado ejercicio: ${action.nombre || 'Ejercicio'}`)
    }

    if (action.type === 'add_exercise_query') {
      const resolved = resolveExerciseQuery(action)
      ejercicios.push(...resolved)
      applied.push(`Agregados ${resolved.length} ejercicios de ${action.musculo || 'biblioteca'}${action.cadena ? ` · cadena ${action.cadena}` : ''}`)
    }

    if (action.type === 'add_mobility' || action.type === 'add_cardio') {
      ejercicios.push(makeMobility(action))
      applied.push(`Agregada movilidad/cardio: ${action.nombre || 'Bicicleta fija'}`)
    }

    if (action.type === 'add_stretching') {
      ejercicios.push(makeStretching(action))
      applied.push('Agregada elongación final')
    }

    if (action.type === 'add_agent') {
      ejercicios.push(makeAgent(action))
      applied.push(`Agregado agente: ${action.nombre || 'Agente físico'}`)
    }

    if (action.type === 'add_indication') {
      ejercicios.push(makeIndication(action))
      applied.push('Agregada indicación')
    }

    if (action.type === 'remove_item') {
      const before = ejercicios.length
      ejercicios = ejercicios.filter(item => !matches(item, action.query || action.nombre || action.name))
      if (before !== ejercicios.length) applied.push(`Eliminado: ${action.query || action.nombre}`)
    }

    if (action.type === 'remove_agent') {
      const query = action.query || action.nombre || 'hielo'
      const before = ejercicios.length
      ejercicios = ejercicios.filter(item => !(item.tipo === 'agente' && matches(item, query)))
      if (before !== ejercicios.length) applied.push(`Eliminado agente: ${query}`)
    }

    if (action.type === 'update_all_exercises') {
      ejercicios = ejercicios.map(item => {
        const isExercise = item.tipo === 'ejercicio' || item.bloque === 'gimnasio'
        if (!isExercise) return item
        return {
          ...item,
          ...(action.series ? { series: action.series } : {}),
          ...(action.repeticiones ? { repeticiones: action.repeticiones, reps: action.repeticiones } : {}),
          ...(action.reps ? { repeticiones: action.reps, reps: action.reps } : {}),
          ...(action.pausa ? { pausa: action.pausa } : {}),
          ...(action.indicacion ? { indicacion: action.indicacion } : {}),
        }
      })
      applied.push('Actualizados ejercicios')
    }

    if (action.type === 'set_frequency') {
      next.veces = action.veces || next.veces
      next.frecuencia = action.frecuencia || (action.veces ? `${action.veces} veces antes del próximo control` : next.frecuencia)
      applied.push(`Frecuencia: ${next.frecuencia}`)
    }

    if (action.type === 'interleave_groups' || action.type === 'reorder_clinical') {
      ejercicios = reorderClinical(ejercicios)
      applied.push('Orden clínico aplicado con intercalado de grupos')
    }
  })

  ejercicios = reorderClinical(ejercicios)
  next.ejercicios = ejercicios
  return { rutina: next, applied }
}

function inferFocus(items = []) {
  const types = Array.from(new Set(items.map(it => it.tipo || it.bloque || 'ejercicio')))
  return types.length ? types : ['ejercicio']
}

export default function ClinicalRoutineSmartEditor(props) {
  const { rutina } = props

  const [pain, setPain] = useState(3)
  const [objetivo, setObjetivo] = useState('rehab')
  const [localRutina, setLocalRutina] = useState(rutina || {})
  const [editorKey, setEditorKey] = useState(0)

  const [iaPrompt, setIaPrompt] = useState('')
  const [iaLoading, setIaLoading] = useState(false)
  const [iaResponse, setIaResponse] = useState(null)
  const [iaError, setIaError] = useState('')
  const [iaAppliedMessage, setIaAppliedMessage] = useState('')

  const articulation = useMemo(
    () => inferArticulationFromText(localRutina?.nombre || localRutina?.notas || ''),
    [localRutina]
  )

  const suggestions = useMemo(
    () => getExerciseSuggestions({ articulation, pain, objetivo }),
    [articulation, pain, objetivo]
  )

  function commitRoutine(next, message = '') {
    setLocalRutina(next)
    setEditorKey(k => k + 1)
    const focos = inferFocus(next.ejercicios || [])
    props.onChange?.({
      contexto: focos[0] || 'ejercicio',
      ejercicios: next.ejercicios || [],
      frecuencia: next.frecuencia,
      focos,
    })
    props.onGeneralChange?.({ nombre: next.nombre, notas: next.notas, resumen: next.notas })
    if (message) setIaAppliedMessage(message)
  }

  function applyAll() {
    commitRoutine({
      ...localRutina,
      ejercicios: reorderClinical([...(localRutina?.ejercicios || []), ...suggestions]),
    }, 'Sugerencias agregadas al borrador. Revisá, editá o eliminá antes de guardar.')
  }

  function applyOne(ex) {
    commitRoutine({
      ...localRutina,
      ejercicios: reorderClinical([...(localRutina?.ejercicios || []), ex]),
    }, `${ex.nombre || 'Ejercicio'} agregado al borrador.`)
  }

  async function handleIA() {
    const prompt = iaPrompt.trim()
    if (!prompt) return

    setIaLoading(true)
    setIaError('')
    setIaResponse(null)
    setIaAppliedMessage('')

    try {
      const res = await api.iaRutina({
        prompt,
        rutina: localRutina,
        contexto: {
          dolor: pain,
          objetivo,
          articulacion: articulation,
        },
      })

      const actions = Array.isArray(res.actions) ? res.actions : []
      const appliedResult = applyActionsToRoutine(localRutina, actions)

      if (appliedResult.applied.length) {
        commitRoutine(
          appliedResult.rutina,
          `IA aplicada al borrador: ${appliedResult.applied.join(' · ')}. Todavía no se guardó en la base.`
        )
      } else {
        setIaAppliedMessage('La IA respondió, pero no hubo acciones aplicables al borrador.')
      }

      setIaResponse(res)
      setIaPrompt('')
    } catch (e) {
      console.error(e)
      setIaError(e?.message || 'Error con IA')
    } finally {
      setIaLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ border: `1px solid ${c.border}`, borderRadius: 20, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 900, color: c.ink }}>Asistente IA</div>
        <div style={{ marginTop: 5, fontSize: 12, color: c.muted, lineHeight: 1.35 }}>
          Auto-aplica al borrador, busca ejercicios reales de la biblioteca e intercala grupos musculares.
        </div>
        <textarea value={iaPrompt} onChange={e => setIaPrompt(e.target.value)} placeholder="Ej: bici 10 min, 2 excéntricos cuádriceps cadena cerrada, 2 concéntricos isquios, gemelo, glúteo mayor y elongación..." style={{ ...fieldStyle, minHeight: 76, marginTop: 10, resize: 'vertical' }} />
        <button type="button" onClick={handleIA} disabled={iaLoading || !iaPrompt.trim()} style={{ marginTop: 8, border: 'none', borderRadius: 14, padding: '10px 14px', background: `linear-gradient(135deg, ${c.sky}, ${c.skyDark})`, color: '#fff', fontWeight: 900, cursor: iaLoading || !iaPrompt.trim() ? 'default' : 'pointer', opacity: iaLoading || !iaPrompt.trim() ? 0.55 : 1, fontFamily: 'inherit' }}>
          {iaLoading ? 'Pensando y aplicando...' : 'Enviar y auto-aplicar'}
        </button>
        {iaAppliedMessage && <div style={{ marginTop: 10, border: `1px solid rgba(22,133,95,.25)`, background: c.mint, color: c.mintDark, borderRadius: 12, padding: 10, fontSize: 13, fontWeight: 900 }}>{iaAppliedMessage}</div>}
        {iaError && <div style={{ marginTop: 10, border: '1px solid #F5A897', background: '#FEF2F2', color: '#B91C1C', borderRadius: 12, padding: 10, fontSize: 13, fontWeight: 800 }}>{iaError}</div>}
        {iaResponse && <div style={{ marginTop: 12, border: `1px solid ${c.border}`, background: '#F6FBFC', borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 900, color: c.ink }}>IA aplicó:</div>
          {iaResponse.resumen && <div style={{ marginTop: 5, fontSize: 13, color: c.muted }}>{iaResponse.resumen}</div>}
          {Array.isArray(iaResponse.actions) && iaResponse.actions.length > 0 && <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
            {iaResponse.actions.map((action, index) => <div key={`${action.type}-${index}`} style={{ border: `1px solid ${c.border}`, background: '#fff', borderRadius: 12, padding: 10, fontSize: 12, color: c.ink }}>
              <b>{action.type}</b>{action.musculo ? ` · ${action.musculo}` : ''}{action.contraccion ? ` · ${action.contraccion}` : ''}{action.cadena ? ` · cadena ${action.cadena}` : ''}{action.nombre ? ` · ${action.nombre}` : ''}{action.query ? ` · ${action.query}` : ''}
            </div>)}
          </div>}
        </div>}
      </div>

      <div style={{ border: `1px solid ${c.border}`, borderRadius: 20, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 900, color: c.ink }}>Sugerencias automáticas</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input value={pain} onChange={e => setPain(Number(e.target.value) || 0)} placeholder="Dolor 0-10" style={fieldStyle} />
          <select value={objetivo} onChange={e => setObjetivo(e.target.value)} style={fieldStyle}>
            <option value="rehab">Rehab</option>
            <option value="fuerza">Fuerza</option>
            <option value="retorno">Retorno</option>
          </select>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: c.muted }}>{getSuggestionSummary({ pain, objetivo })}</div>
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {suggestions.map(s => <div key={s.id} style={{ border: `1px solid ${c.border}`, borderRadius: 14, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <div><div style={{ fontWeight: 900, color: c.ink }}>{s.nombre}</div><div style={{ fontSize: 11, color: c.muted }}>{s.motivo_sugerencia}</div></div>
            <button type="button" onClick={() => applyOne(s)} style={{ background: c.sky, color: '#fff', border: 'none', borderRadius: 10, padding: '6px 10px', fontWeight: 900, cursor: 'pointer' }}>+</button>
          </div>)}
        </div>
        <button type="button" onClick={applyAll} style={{ marginTop: 10, border: `1px solid ${c.border}`, borderRadius: 14, padding: '10px 12px', background: '#fff', color: c.skyDark, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Agregar todas</button>
      </div>

      <ClinicalRoutineEditorWizard key={editorKey} {...props} rutina={localRutina} />
    </div>
  )
}
