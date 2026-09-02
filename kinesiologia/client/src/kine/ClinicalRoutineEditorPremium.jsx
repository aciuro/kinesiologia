import { useMemo, useState } from 'react'
import {
  AGENTES_FISICOS,
  ARTICULACION_FILTROS,
  CAMPO_PRESETS,
  CARDIO_PRESETS,
  CONTRACCION_FILTROS,
  MOVILIDAD_PRESETS,
  getRoutineFocus,
  getRoutineFrequency,
  normalizeRoutineItems,
  summarizeItem,
} from './clinicalRoutineUtils.js'
import { getPremiumExerciseOptions } from './premiumExerciseLibrary.js'
import { CLINICAL_ROUTINE_TEMPLATES } from './clinicalRoutineTemplates.js'

const c = {
  ink: '#082B34', ink2: '#315F68', muted: '#789FAA', sky: '#2F9FB2', skyDark: '#176F82',
  border: 'rgba(83,151,166,.30)', white: '#fff', soft: '#F4FAFB', danger: '#B91C1C', green: '#159A6A', purple: '#7C5CE8'
}

const card = { background: 'rgba(255,255,255,.96)', border: `1px solid ${c.border}`, borderRadius: 24, boxShadow: '0 12px 34px rgba(13,53,64,.06)' }
const input = { width: '100%', borderRadius: 16, border: `1px solid ${c.border}`, background: '#fff', padding: '12px 13px', fontSize: 14, color: c.ink, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const ghost = { border: `1px solid ${c.border}`, background: '#fff', color: c.skyDark, borderRadius: 16, padding: '10px 13px', fontSize: 13, fontWeight: 950, cursor: 'pointer', fontFamily: 'inherit' }
const primary = { border: 'none', background: `linear-gradient(135deg, ${c.sky} 0%, ${c.skyDark} 100%)`, color: '#fff', borderRadius: 18, padding: '12px 16px', fontSize: 13, fontWeight: 950, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 14px 28px rgba(23,111,130,.22)' }
const tag = { fontSize: 10, color: c.skyDark, background: '#E9F7FA', borderRadius: 999, padding: '4px 7px', fontWeight: 900 }
const tag2 = { fontSize: 10, color: '#5B21B6', background: '#F6F1FF', borderRadius: 999, padding: '4px 7px', fontWeight: 900 }

const BLOCKS = {
  movilidad: { label: 'Movilidad', icon: '●', hint: 'Caminar, bici, elíptico o movilidad articular.', bg: '#EAFBF5', color: '#13795B' },
  ejercicio: { label: 'Gimnasio', icon: '⌁', hint: 'Ejercicios por articulación y tipo de contracción.', bg: '#EFF8FF', color: '#075985' },
  agente: { label: 'Agente físico', icon: '❄', hint: 'Frío, calor o contraste.', bg: '#F0FDFF', color: '#0E7490' },
  campo: { label: 'Intermitente / campo', icon: '↗', hint: 'Pasadas, trote, cambios de ritmo.', bg: '#FFF9E8', color: '#7A5C00' },
  cardio: { label: 'Cardio', icon: '◌', hint: 'Bloque aeróbico por tiempo o intensidad.', bg: '#F1F5FF', color: '#334E99' },
  indicacion: { label: 'Indicación', icon: '□', hint: 'Cuidados, dolor permitido o técnica.', bg: '#F6F1FF', color: '#5B21B6' },
}

const BLOCK_ORDER = ['movilidad', 'ejercicio', 'agente', 'campo', 'cardio', 'indicacion']
const STEP_LABELS = [
  { title: 'Info general', sub: 'Datos principales' },
  { title: 'Bloques y frecuencia', sub: 'Estructura' },
  { title: 'Seleccionar ejercicios', sub: 'Armado por bloque' },
  { title: 'Resumen', sub: 'Revisá y guardá' },
]

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

function normalizeText(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function exerciseMatchesMuscle(option, muscle) {
  if (!muscle || muscle === 'Todos') return true
  const haystack = normalizeText([
    option.name,
    option.group,
    ...(option.tags || []),
    ...(option.regiones || []),
    ...(option.contracciones || []),
  ].filter(Boolean).join(' '))
  const wanted = normalizeText(muscle)
  const aliases = {
    'cuadriceps': ['cuadriceps', 'camilla de cuadriceps', 'extension de rodilla', 'sentadilla', 'prensa'],
    'recto femoral': ['recto femoral', 'cuadriceps', 'elevacion de pierna'],
    'vasto medial': ['vasto medial', 'cuadriceps', 'extension de rodilla'],
    'vasto lateral': ['vasto lateral', 'cuadriceps', 'extension de rodilla'],
    'isquiotibiales': ['isquiotibiales', 'isquiosurales', 'femoral', 'curl femoral', 'nordico', 'peso muerto'],
    'biceps femoral': ['biceps femoral', 'femoral', 'isquiotibiales', 'curl femoral'],
    'semitendinoso': ['semitendinoso', 'isquiotibiales', 'femoral'],
    'semimembranoso': ['semimembranoso', 'isquiotibiales', 'femoral'],
    'gemelos': ['gemelo', 'gemelos', 'talon', 'talones', 'elevacion de talones'],
    'soleo': ['soleo', 'rodilla flexionada', 'talon', 'talones'],
    'gluteo mayor': ['gluteo mayor', 'gluteo', 'hip thrust', 'puente'],
    'gluteo medio': ['gluteo medio', 'abduccion', 'caminata lateral', 'clamshell'],
    'gluteo menor': ['gluteo menor', 'abduccion', 'clamshell'],
    'psoas': ['psoas', 'flexor de cadera', 'elevacion de pierna'],
    'aductores': ['aductor', 'aductores', 'copenhagen', 'aduccion'],
    'abductores': ['abductor', 'abductores', 'abduccion', 'gluteo medio'],
    'rotadores externos': ['rotacion externa', 'piriforme', 'rotadores'],
    'deltoides': ['deltoides', 'elevacion', 'hombro'],
    'supraespinoso': ['supraespinoso', 'plano escapular', 'rotadores'],
    'infraespinoso': ['infraespinoso', 'rotacion externa', 'rotadores'],
    'redondo menor': ['redondo menor', 'rotacion externa', 'rotadores'],
    'subescapular': ['subescapular', 'rotacion interna', 'rotadores'],
    'serrato anterior': ['serrato', 'push up plus', 'serrato punch'],
    'dorsal ancho': ['dorsal ancho', 'pullover', 'jalon', 'dorsal'],
    'trapecio': ['trapecio', 'face pull', 'remo', 'escapular'],
    'romboides': ['romboides', 'remo', 'escapular'],
    'transverso abdominal': ['transverso', 'core', 'dead bug', 'pallof'],
    'oblicuos': ['oblicuo', 'oblicuos', 'plancha lateral', 'pallof'],
    'recto abdominal': ['recto abdominal', 'curl up', 'plancha'],
    'erectores espinales': ['erectores', 'extension lumbar', 'bisagra'],
    'multifidos': ['multifido', 'multifidos', 'bird dog', 'lumbar'],
  }
  return (aliases[wanted] || [wanted]).some(alias => haystack.includes(alias))
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

function Stepper({ step, setStep }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, margin: '6px 0 12px' }}>
    {STEP_LABELS.map((st, i) => {
      const n = i + 1
      const done = step > n
      const active = step === n
      return <button key={st.title} type="button" onClick={() => setStep(n)} style={{ border: 'none', background: 'transparent', padding: 0, display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', minWidth: 0 }}>
        <span style={{ width: 28, height: 28, borderRadius: 999, display: 'grid', placeItems: 'center', flexShrink: 0, background: done || active ? c.sky : '#EFF6F8', color: done || active ? '#fff' : c.skyDark, border: `1px solid ${done || active ? c.sky : c.border}`, fontWeight: 950, fontSize: 13 }}>{done ? '✓' : n}</span>
        <span style={{ minWidth: 0 }}><span style={{ display: 'block', color: active ? c.ink : c.ink2, fontWeight: 950, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.title}</span><span style={{ display: 'block', color: c.muted, fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.sub}</span></span>
      </button>
    })}
  </div>
}

function TemplatePanel({ onApply }) {
  const [open, setOpen] = useState(false)
  return <section style={{ ...card, padding: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <div><div style={{ fontSize: 11, color: c.muted, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.1em' }}>Plantillas clínicas</div><div style={{ marginTop: 3, fontSize: 15, fontWeight: 950, color: c.ink }}>Cargar rutina base por lesión/fase</div></div>
      <button type="button" onClick={() => setOpen(v => !v)} style={ghost}>{open ? 'Ocultar' : 'Usar plantilla'}</button>
    </div>
    {open && <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
      {CLINICAL_ROUTINE_TEMPLATES.map(t => <button key={t.id} type="button" onClick={() => { onApply(t); setOpen(false) }} style={{ border: `1px solid ${c.border}`, background: '#fff', borderRadius: 16, padding: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div style={{ fontSize: 15, fontWeight: 950, color: c.ink }}>{t.title}</div><span style={tag}>{t.region}</span></div>
        <div style={{ marginTop: 5, fontSize: 12, color: c.muted, lineHeight: 1.35 }}>{t.goal}</div>
      </button>)}
    </div>}
  </section>
}

function Footer({ step, setStep, canNext = true }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
    <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} style={{ ...ghost, opacity: step === 1 ? .45 : 1 }}>Atrás</button>
    {step < 4 && <button type="button" onClick={() => setStep(Math.min(4, step + 1))} disabled={!canNext} style={{ ...primary, opacity: canNext ? 1 : .5 }}>Siguiente →</button>}
  </div>
}

function BlockCard({ id, active, onToggle }) {
  const b = BLOCKS[id]
  return <button type="button" onClick={() => onToggle(id)} style={{ border: `1px solid ${active ? b.color : c.border}`, background: active ? `linear-gradient(135deg, ${b.bg} 0%, #fff 75%)` : '#fff', borderRadius: 20, padding: 13, minHeight: 126, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
    <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 8, border: `1px solid ${active ? b.color : c.border}`, background: active ? b.color : '#fff', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 950 }}>{active ? '✓' : ''}</div>
    <div style={{ width: 42, height: 42, borderRadius: 15, background: b.bg, color: b.color, display: 'grid', placeItems: 'center', fontWeight: 950 }}>{b.icon}</div>
    <div style={{ marginTop: 10, fontSize: 16, fontWeight: 950, color: c.ink }}>{b.label}</div>
    <div style={{ marginTop: 5, fontSize: 12, color: c.muted, lineHeight: 1.3 }}>{b.hint}</div>
  </button>
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

function FilterField({ label, children }) {
  return <label style={{ display: 'grid', gap: 6, minWidth: 0 }}><span style={{ fontSize: 11, color: c.muted, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>{children}</label>
}

function ExerciseLibrary({ selectedBlock, items, setItems }) {
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

  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(290px,.85fr)', gap: 14 }}>
    <section style={{ ...card, padding: 14, minWidth: 0 }}>
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

    <section style={{ ...card, padding: 14, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}><div><div style={{ fontSize: 17, fontWeight: 950, color: c.ink }}>Seleccionados</div><div style={{ color: c.muted, fontSize: 12, fontWeight: 750, marginTop: 3 }}>{BLOCKS[selectedBlock]?.label}</div></div><span style={tag}>{selected.length}</span></div>
      <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>{selected.length === 0 && <div style={{ border: `1px dashed ${c.border}`, borderRadius: 18, padding: 18, textAlign: 'center', color: c.muted, fontSize: 13 }}>Todavía no agregaste ítems a este bloque.</div>}{selected.map((item, i) => <SelectedItem key={i} item={item} index={i} update={patch => updateSelected(i, patch)} remove={() => removeSelected(i)} />)}</div>
    </section>
  </div>
}

export default function ClinicalRoutineEditorPremium({ rutina, onChange, onGeneralChange }) {
  const [step, setStep] = useState(1)
  const [nombre, setNombre] = useState(rutina?.nombre || '')
  const [notas, setNotas] = useState(rutina?.notas || '')
  const [frecuencia, setFrecuencia] = useState(getRoutineFrequency(rutina))
  const initialItems = useMemo(() => normalizeRoutineItems(rutina), [])
  const [items, setItemsState] = useState(initialItems)
  const initialBlocks = useMemo(() => {
    const fromItems = Array.from(new Set(initialItems.map(itemType))).filter(Boolean)
    return fromItems.length ? fromItems : getRoutineFocus(rutina).filter(x => BLOCKS[x])
  }, [])
  const [blocks, setBlocks] = useState(initialBlocks.length ? initialBlocks : ['ejercicio'])
  const [selectedBlock, setSelectedBlock] = useState((initialBlocks.length ? initialBlocks : ['ejercicio'])[0])

  function emit(nextItems = items, nextFrecuencia = frecuencia, nextBlocks = blocks, general = { nombre, notas }) {
    onGeneralChange?.({ nombre: general.nombre, notas: general.notas, resumen: general.notas })
    onChange?.({ contexto: nextBlocks[0] || 'gimnasio', ejercicios: nextItems, frecuencia: nextFrecuencia, focos: nextBlocks })
  }
  function setItems(next) { setItemsState(next); emit(next) }
  function toggleBlock(id) {
    const next = blocks.includes(id) ? blocks.filter(x => x !== id) : [...blocks, id]
    const safe = next.length ? next : [id]
    setBlocks(safe)
    if (!safe.includes(selectedBlock)) setSelectedBlock(safe[0])
    emit(items, frecuencia, safe)
  }
  function applyTemplate(t) {
    const nextItems = (t.items || []).map(x => ({ ...x }))
    const nextBlocks = Array.from(new Set(nextItems.map(itemType))).filter(Boolean)
    setItemsState(nextItems)
    setBlocks(nextBlocks.length ? nextBlocks : blocks)
    setSelectedBlock((nextBlocks.length ? nextBlocks : blocks)[0] || 'ejercicio')
    setFrecuencia(t.frecuencia || frecuencia)
    emit(nextItems, t.frecuencia || frecuencia, nextBlocks.length ? nextBlocks : blocks)
  }

  return <div style={{ display: 'grid', gap: 12, overflowX: 'hidden' }}>
    <Stepper step={step} setStep={setStep} />

    {step === 1 && <section style={{ ...card, padding: 16, display: 'grid', gap: 12 }}>
      <div><div style={{ fontSize: 11, color: c.muted, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.1em' }}>Información general</div><div style={{ marginTop: 4, fontSize: 20, fontWeight: 950, color: c.ink }}>Datos principales</div></div>
      <label><div style={{ fontSize: 13, fontWeight: 950, color: c.ink2, marginBottom: 7 }}>Nombre de la rutina</div><input style={input} value={nombre} onChange={e => { setNombre(e.target.value); emit(items, frecuencia, blocks, { nombre: e.target.value, notas }) }} placeholder="Ej: Rodilla derecha · Semana 2" /></label>
      <label><div style={{ fontSize: 13, fontWeight: 950, color: c.ink2, marginBottom: 7 }}>Notas generales</div><textarea style={{ ...input, minHeight: 108, resize: 'vertical' }} value={notas} onChange={e => { setNotas(e.target.value); emit(items, frecuencia, blocks, { nombre, notas: e.target.value }) }} placeholder="Indicaciones generales, objetivo de la rutina, cuidados o señales de alerta..." /></label>
      <Footer step={step} setStep={setStep} canNext={!!nombre.trim()} />
    </section>}

    {step === 2 && <div style={{ display: 'grid', gap: 12 }}>
      <TemplatePanel onApply={applyTemplate} />
      <section style={{ ...card, padding: 16, display: 'grid', gap: 12 }}>
        <div><div style={{ fontSize: 11, color: c.muted, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.1em' }}>Bloques y frecuencia</div><div style={{ marginTop: 4, fontSize: 20, fontWeight: 950, color: c.ink }}>Elegí la estructura de la rutina</div></div>
        <label><div style={{ fontSize: 13, fontWeight: 950, color: c.ink2, marginBottom: 7 }}>Frecuencia</div><select style={input} value={frecuencia} onChange={e => { setFrecuencia(e.target.value); emit(items, e.target.value, blocks) }}><option>2 veces antes del próximo control</option><option>3 veces antes del próximo control</option><option>2-3 veces antes del próximo control</option><option>Día por medio hasta el próximo control</option><option>Todos los días suave</option></select></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>{BLOCK_ORDER.map(id => <BlockCard key={id} id={id} active={blocks.includes(id)} onToggle={toggleBlock} />)}</div>
        <Footer step={step} setStep={setStep} canNext={blocks.length > 0} />
      </section>
    </div>}

    {step === 3 && <section style={{ display: 'grid', gap: 12 }}>
      <section style={{ ...card, padding: 12 }}><div style={{ fontSize: 11, color: c.muted, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.1em' }}>Bloques seleccionados</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', overflowX: 'visible', paddingTop: 10 }}>{blocks.map(id => { const b = BLOCKS[id]; const a = selectedBlock === id; return <button key={id} type="button" onClick={() => setSelectedBlock(id)} style={{ border: `1px solid ${a ? b.color : c.border}`, background: a ? b.bg : '#fff', color: a ? b.color : c.ink, borderRadius: 999, padding: '9px 12px', fontWeight: 950, fontFamily: 'inherit', whiteSpace: 'normal', lineHeight: 1.15, maxWidth: '100%' }}>{b.icon} {b.label}</button> })}</div></section>
      <ExerciseLibrary selectedBlock={selectedBlock} items={items} setItems={setItems} />
      <Footer step={step} setStep={setStep} />
    </section>}

    {step === 4 && <section style={{ ...card, padding: 16, display: 'grid', gap: 14 }}>
      <div><div style={{ fontSize: 11, color: c.muted, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.1em' }}>Resumen</div><div style={{ marginTop: 4, fontSize: 20, fontWeight: 950, color: c.ink }}>Revisá antes de guardar</div></div>
      <div style={{ border: `1px solid ${c.border}`, borderRadius: 18, padding: 12, background: '#fff' }}><div style={{ color: c.muted, fontSize: 12, fontWeight: 900 }}>Nombre</div><div style={{ color: c.ink, fontSize: 16, fontWeight: 950, marginTop: 3 }}>{nombre || 'Sin nombre'}</div>{notas && <div style={{ color: c.ink2, fontSize: 13, lineHeight: 1.4, marginTop: 8 }}>{notas}</div>}</div>
      <div style={{ border: `1px solid ${c.border}`, borderRadius: 18, padding: 12, background: '#fff' }}><div style={{ color: c.muted, fontSize: 12, fontWeight: 900 }}>Frecuencia</div><div style={{ color: c.ink, fontSize: 16, fontWeight: 950, marginTop: 3 }}>{frecuencia}</div></div>
      <div style={{ display: 'grid', gap: 10 }}>{blocks.map(id => { const b = BLOCKS[id]; const groupItems = items.filter(x => itemType(x) === id); return <div key={id} style={{ border: `1px solid ${c.border}`, borderRadius: 18, padding: 12, background: '#fff' }}><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 32, height: 32, borderRadius: 12, display: 'grid', placeItems: 'center', background: b.bg, color: b.color, fontWeight: 950 }}>{b.icon}</span><div style={{ color: c.ink, fontSize: 16, fontWeight: 950 }}>{b.label}</div><span style={{ ...tag, marginLeft: 'auto' }}>{groupItems.length}</span></div><div style={{ display: 'grid', gap: 7, marginTop: 10 }}>{groupItems.length === 0 && <div style={{ color: c.muted, fontSize: 13 }}>Sin ítems cargados.</div>}{groupItems.map((it, i) => <div key={i} style={{ background: '#F8FCFD', border: `1px solid rgba(83,151,166,.18)`, borderRadius: 14, padding: 9 }}><div style={{ color: c.ink, fontSize: 13, fontWeight: 950 }}>{it.nombre || it.texto}</div><div style={{ color: c.muted, fontSize: 12, marginTop: 3 }}>{summarizeItem(it)}</div></div>)}</div></div> })}</div>
      <Footer step={step} setStep={setStep} />
    </section>}
  </div>
}
