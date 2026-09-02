import { useMemo, useState } from 'react'
import {
  AGENTES_FISICOS,
  ARTICULACION_FILTROS,
  CAMPO_PRESETS,
  CARDIO_PRESETS,
  CONTRACCION_FILTROS,
  MOVILIDAD_PRESETS,
  summarizeItem,
} from './clinicalRoutineUtils.js'
import { getPremiumExerciseOptions } from './premiumExerciseLibrary.js'

const c = {
  ink: '#082B34', ink2: '#315F68', muted: '#789FAA', sky: '#2F9FB2', skyDark: '#176F82',
  border: 'rgba(83,151,166,.30)', danger: '#B91C1C'
}
const card = { background: '#fff', border: `1px solid ${c.border}`, borderRadius: 24, boxShadow: '0 12px 34px rgba(13,53,64,.06)' }
const input = { width: '100%', borderRadius: 16, border: `1px solid ${c.border}`, background: '#fff', padding: '12px 13px', fontSize: 14, color: c.ink, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const tag = { fontSize: 10, color: c.skyDark, background: '#E9F7FA', borderRadius: 999, padding: '4px 7px', fontWeight: 900 }
const tag2 = { fontSize: 10, color: '#5B21B6', background: '#F6F1FF', borderRadius: 999, padding: '4px 7px', fontWeight: 900 }

const BLOCKS = {
  movilidad: { label: 'Movilidad', icon: '●', bg: '#EAFBF5', color: '#13795B' },
  ejercicio: { label: 'Gimnasio', icon: '⌁', bg: '#EFF8FF', color: '#075985' },
  agente: { label: 'Agente físico', icon: '❄', bg: '#F0FDFF', color: '#0E7490' },
  campo: { label: 'Intermitente / campo', icon: '↗', bg: '#FFF9E8', color: '#7A5C00' },
  cardio: { label: 'Cardio', icon: '◌', bg: '#F1F5FF', color: '#334E99' },
  indicacion: { label: 'Indicación', icon: '□', bg: '#F6F1FF', color: '#5B21B6' },
}

const MUSCLES_BY_ARTICULATION = {
  Todos: ['Todos'],
  tobillo: ['Todos', 'Gemelos', 'Sóleo', 'Tibial anterior', 'Tibial posterior', 'Peroneos', 'Flexores plantares', 'Extensores del pie'],
  rodilla: ['Todos', 'Cuádriceps', 'Recto femoral', 'Vasto medial', 'Vasto lateral', 'Isquiotibiales', 'Bíceps femoral', 'Semitendinoso', 'Semimembranoso', 'Gemelos', 'Poplíteo', 'Sartorio', 'Grácil', 'Tensor fascia lata'],
  cadera: ['Todos', 'Glúteo mayor', 'Glúteo medio', 'Glúteo menor', 'Psoas', 'Ilíaco', 'Aductores', 'Abductores', 'Isquiotibiales', 'Piriforme', 'Rotadores externos', 'Tensor fascia lata', 'Cuádriceps'],
  lumbar: ['Todos', 'Erectores espinales', 'Multífidos', 'Cuadrado lumbar', 'Transverso abdominal', 'Oblicuos', 'Recto abdominal', 'Glúteos', 'Psoas'],
  dorsal: ['Todos', 'Dorsal ancho', 'Trapecio', 'Romboides', 'Serrato anterior', 'Erectores torácicos', 'Rotadores torácicos'],
  hombro: ['Todos', 'Deltoides', 'Supraespinoso', 'Infraespinoso', 'Redondo menor', 'Subescapular', 'Bíceps', 'Tríceps', 'Pectoral', 'Dorsal ancho', 'Trapecio', 'Serrato anterior', 'Romboides'],
  brazo: ['Todos', 'Bíceps', 'Tríceps', 'Braquial', 'Braquiorradial', 'Pronadores', 'Supinadores', 'Flexores de muñeca', 'Extensores de muñeca'],
  core: ['Todos', 'Transverso abdominal', 'Recto abdominal', 'Oblicuos', 'Multífidos', 'Diafragma', 'Piso pélvico', 'Glúteos'],
}

function norm(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function itemType(item) {
  if (item.tipo === 'ejercicio') return 'ejercicio'
  if (item.tipo && BLOCKS[item.tipo]) return item.tipo
  if (item.bloque === 'gimnasio') return 'ejercicio'
  if (item.bloque && BLOCKS[item.bloque]) return item.bloque
  return 'ejercicio'
}

function emptyItem(tipo, patch = {}) {
  if (tipo === 'movilidad') return { tipo, bloque: 'movilidad', nombre: 'Bicicleta fija', duracion: '10 min', detalle: 'Entrada en calor suave', ...patch }
  if (tipo === 'cardio') return { tipo, bloque: 'cardio', nombre: 'Bicicleta fija', duracion: '10 min', intensidad: 'suave', detalle: '', ...patch }
  if (tipo === 'campo') return { tipo, bloque: 'campo', nombre: 'Intermitente', detalle: '8 x (30 seg rápido / 30 seg lento)', ...patch }
  if (tipo === 'agente') return { tipo, bloque: 'post', nombre: 'Hielo', duracion: '15 min', frecuencia: 'post entrenamiento', detalle: '', ...patch }
  if (tipo === 'indicacion') return { tipo, bloque: 'indicacion', texto: 'No superar dolor 5/10. Priorizar técnica.', ...patch }
  return { tipo: 'ejercicio', bloque: 'gimnasio', nombre: 'Ejercicio libre', series: '3', repeticiones: '10', pausa: '60 seg', indicacion: '', ...patch }
}

function exerciseMatchesMuscle(option, muscle) {
  if (!muscle || muscle === 'Todos') return true
  const haystack = norm([option.name, option.group, ...(option.tags || []), ...(option.regiones || []), ...(option.contracciones || [])].join(' '))
  const wanted = norm(muscle)
  const aliases = {
    cuadriceps: ['cuadriceps', 'extension de rodilla', 'sentadilla', 'prensa'],
    isquiotibiales: ['isquiotibiales', 'isquiosurales', 'femoral', 'curl femoral', 'nordico', 'peso muerto'],
    gemelos: ['gemelo', 'gemelos', 'talon', 'talones', 'elevacion de talones'],
    soleo: ['soleo', 'rodilla flexionada', 'talon', 'talones'],
    'gluteo mayor': ['gluteo mayor', 'gluteo', 'hip thrust', 'puente'],
    'gluteo medio': ['gluteo medio', 'abduccion', 'caminata lateral', 'clamshell'],
    psoas: ['psoas', 'flexor de cadera', 'elevacion de pierna'],
    aductores: ['aductor', 'aductores', 'copenhagen', 'aduccion'],
    abductores: ['abductor', 'abductores', 'abduccion', 'gluteo medio'],
    deltoides: ['deltoides', 'elevacion', 'hombro'],
    supraespinoso: ['supraespinoso', 'plano escapular', 'rotadores'],
    infraespinoso: ['infraespinoso', 'rotacion externa', 'rotadores'],
    'redondo menor': ['redondo menor', 'rotacion externa', 'rotadores'],
    subescapular: ['subescapular', 'rotacion interna', 'rotadores'],
    'serrato anterior': ['serrato', 'push up plus', 'serrato punch'],
    'dorsal ancho': ['dorsal ancho', 'pullover', 'jalon', 'dorsal'],
    trapecio: ['trapecio', 'face pull', 'remo', 'escapular'],
    romboides: ['romboides', 'remo', 'escapular'],
    'transverso abdominal': ['transverso', 'core', 'dead bug', 'pallof'],
    oblicuos: ['oblicuo', 'oblicuos', 'plancha lateral', 'pallof'],
    'recto abdominal': ['recto abdominal', 'curl up', 'plancha'],
    'erectores espinales': ['erectores', 'extension lumbar', 'bisagra'],
    multifidos: ['multifido', 'multifidos', 'bird dog', 'lumbar'],
  }
  return (aliases[wanted] || [wanted]).some(alias => haystack.includes(alias))
}

function FilterField({ label, children }) {
  return <label style={{ display: 'grid', gap: 6, minWidth: 0 }}><span style={{ fontSize: 11, color: c.muted, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>{children}</label>
}

function SelectedItem({ item, index, update, remove }) {
  const tipo = itemType(item)
  const b = BLOCKS[tipo] || BLOCKS.ejercicio
  return <div style={{ border: `1px solid ${c.border}`, borderRadius: 18, background: '#fff', padding: 10 }}>
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: b.bg, color: b.color, fontWeight: 950, flexShrink: 0 }}>{index + 1}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div style={{ color: c.ink, fontSize: 14, fontWeight: 950 }}>{item.nombre || item.texto || b.label}</div><button type="button" onClick={remove} style={{ border: 'none', background: 'transparent', color: c.danger, fontWeight: 950, cursor: 'pointer' }}>×</button></div>
        <div style={{ marginTop: 8, display: 'grid', gap: 7 }}>
          {tipo !== 'indicacion' && <input style={input} value={item.nombre || ''} onChange={e => update({ nombre: e.target.value })} placeholder="Nombre" />}
          {tipo === 'ejercicio' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}><input style={input} value={item.series || ''} onChange={e => update({ series: e.target.value })} placeholder="Series" /><input style={input} value={item.repeticiones || ''} onChange={e => update({ repeticiones: e.target.value })} placeholder="Reps" /><input style={input} value={item.pausa || ''} onChange={e => update({ pausa: e.target.value })} placeholder="Pausa" /></div>}
          {tipo !== 'ejercicio' && tipo !== 'indicacion' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}><input style={input} value={item.duracion || ''} onChange={e => update({ duracion: e.target.value })} placeholder="Duración" /><input style={input} value={item.frecuencia || item.intensidad || ''} onChange={e => update(tipo === 'cardio' ? { intensidad: e.target.value } : { frecuencia: e.target.value })} placeholder="Frecuencia/intensidad" /></div>}
          <textarea style={{ ...input, minHeight: 66, resize: 'vertical' }} value={item.indicacion || item.detalle || item.texto || ''} onChange={e => update(tipo === 'indicacion' ? { texto: e.target.value } : tipo === 'ejercicio' ? { indicacion: e.target.value } : { detalle: e.target.value })} placeholder="Indicaciones / detalle" />
        </div>
      </div>
    </div>
  </div>
}

export default function ClinicalRoutineExerciseStep({ selectedBlock, items, setItems }) {
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('Todos')
  const [muscle, setMuscle] = useState('Todos')
  const [contraction, setContraction] = useState('Todos')
  const muscleOptions = MUSCLES_BY_ARTICULATION[region] || MUSCLES_BY_ARTICULATION.Todos
  const allOptions = useMemo(() => getPremiumExerciseOptions('gimnasio', search, 'Todos', region, contraction), [search, region, contraction])
  const options = useMemo(() => allOptions.filter(opt => exerciseMatchesMuscle(opt, muscle)).slice(0, 60), [allOptions, muscle])
  const selected = items.filter(x => itemType(x) === selectedBlock)
  const presets = { movilidad: MOVILIDAD_PRESETS, cardio: CARDIO_PRESETS, campo: CAMPO_PRESETS, agente: AGENTES_FISICOS, indicacion: ['No superar dolor 5/10', 'Priorizar técnica y control', 'Suspender si aumenta inflamación', 'Repetir 2 a 3 veces antes del próximo control'] }

  function addItem(item) { setItems([...items, item]) }
  function updateSelected(localIndex, patch) {
    let count = -1
    setItems(items.map(it => {
      if (itemType(it) !== selectedBlock) return it
      count += 1
      return count === localIndex ? { ...it, ...patch } : it
    }))
  }
  function removeSelected(localIndex) {
    let count = -1
    setItems(items.filter(it => {
      if (itemType(it) !== selectedBlock) return true
      count += 1
      return count !== localIndex
    }))
  }

  return <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, width: '100%', minWidth: 0 }}>
    <section style={{ ...card, padding: 14, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 17, fontWeight: 950, color: c.ink }}>Biblioteca</div>
      {selectedBlock === 'ejercicio' ? <>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <input style={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ejercicio..." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 8 }}>
            <FilterField label="Articulación"><select style={input} value={region} onChange={e => { setRegion(e.target.value); setMuscle('Todos') }}>{ARTICULACION_FILTROS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></FilterField>
            <FilterField label="Músculo"><select style={input} value={muscle} onChange={e => setMuscle(e.target.value)}>{muscleOptions.map(x => <option key={x} value={x}>{x}</option>)}</select></FilterField>
            <FilterField label="Tipo de contracción"><select style={input} value={contraction} onChange={e => setContraction(e.target.value)}>{CONTRACCION_FILTROS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></FilterField>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 12 }}>{options.map(opt => <button key={`${opt.group}-${opt.name}`} type="button" onClick={() => addItem(emptyItem('ejercicio', { nombre: opt.name, group: opt.group, articulacion: opt.articulacion, movimiento: opt.movimiento, video_url: opt.video_url, video: opt.video_url, indicacion: opt.contracciones?.includes('excentrica') ? 'Bajada lenta y controlada' : '' }))} style={{ border: `1px solid ${c.border}`, borderRadius: 18, background: '#fff', padding: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}><div style={{ fontSize: 14, fontWeight: 950, color: c.ink }}>{opt.name}</div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}><span style={tag}>{opt.group}</span>{(opt.contracciones || []).slice(0, 2).map(x => <span key={x} style={tag2}>{x}</span>)}</div><div style={{ marginTop: 10, color: c.skyDark, fontSize: 12, fontWeight: 950 }}>Agregar</div></button>)}</div>
      </> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginTop: 12 }}>{(presets[selectedBlock] || []).map(name => <button key={name} type="button" onClick={() => addItem(emptyItem(selectedBlock, selectedBlock === 'indicacion' ? { texto: name } : { nombre: name }))} style={{ border: `1px solid ${c.border}`, borderRadius: 18, background: '#fff', padding: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}><div style={{ fontSize: 14, fontWeight: 950, color: c.ink }}>{name}</div><div style={{ marginTop: 5, color: c.muted, fontSize: 12 }}>Agregar y ajustar dosis</div></button>)}</div>}
    </section>

    <section style={{ ...card, padding: 14, minWidth: 0, width: '100%', boxSizing: 'border-box', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}><div><div style={{ fontSize: 17, fontWeight: 950, color: c.ink }}>Seleccionados</div><div style={{ color: c.muted, fontSize: 12, fontWeight: 750, marginTop: 3 }}>{BLOCKS[selectedBlock]?.label}</div></div><span style={tag}>{selected.length}</span></div>
      <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>{selected.length === 0 && <div style={{ border: `1px dashed ${c.border}`, borderRadius: 18, padding: 18, textAlign: 'center', color: c.muted, fontSize: 13 }}>Todavía no agregaste ítems a este bloque.</div>}{selected.map((item, i) => <SelectedItem key={i} item={item} index={i} update={patch => updateSelected(i, patch)} remove={() => removeSelected(i)} />)}</div>
    </section>
  </div>
}
