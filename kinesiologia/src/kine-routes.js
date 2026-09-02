const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./kine-db-unified');
const { serveExerciseVideo } = require('./bucket-media');

const uploadsDir = path.join(process.env.DATA_DIR || path.join(__dirname, '..'), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const JWT_SECRET = process.env.JWT_SECRET || 'kine-ciuro-secret-2024';

router.use(express.json());

router.get('/health', (req, res) => res.json({ ok: true }));
router.get('/media/:filename', serveExerciseVideo);

// ── Middleware auth ───────────────────────────────────────

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sin token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

function soloAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  next();
}

function getPacienteDelUsuario(req) {
  if (req.user?.rol !== 'paciente') return null;
  return db.getPacienteByUsuario(req.user.id);
}

function puedeAccederPaciente(req, pacienteId) {
  if (req.user?.rol === 'admin') return true;
  const miPaciente = getPacienteDelUsuario(req);
  return !!miPaciente && String(miPaciente.id) === String(pacienteId);
}

function puedeAccederMotivo(req, motivoId) {
  if (req.user?.rol === 'admin') return true;
  const motivo = db.getMotivo(motivoId);
  if (!motivo) return false;
  return puedeAccederPaciente(req, motivo.paciente_id);
}

function normalizarEjercicio(data = {}, existente = {}) {
  const articulacion = data.articulacion ?? existente.articulacion ?? '';
  const movimiento = data.movimiento ?? existente.movimiento ?? '';
  return {
    ...existente,
    ...data,
    articulacion,
    movimiento,
    categoria: data.categoria || (articulacion && movimiento ? `${articulacion} · ${movimiento}` : existente.categoria || ''),
    imagen_url: data.imagen_url ?? existente.imagen_url ?? null,
  };
}

// ── Auth ──────────────────────────────────────────────────

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const usuario = db.getUsuarioByEmail(email);
  if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }
  const token = jwt.sign({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre }, JWT_SECRET, { expiresIn: '30d' });

  let paciente = null;
  if (usuario.rol === 'paciente') {
    paciente = db.getPacienteByUsuario(usuario.id);
  }

  res.json({ token, usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre }, paciente });
});

router.get('/me', auth, (req, res) => {
  const usuario = db.getUsuario(req.user.id);
  let paciente = null;
  if (usuario.rol === 'paciente') {
    paciente = db.getPacienteByUsuario(usuario.id);
  }
  res.json({ usuario, paciente });
});

// ── Pacientes (admin) ─────────────────────────────────────

router.get('/pacientes', auth, soloAdmin, (req, res) => {
  res.json(db.getPacientes());
});

router.get('/pacientes/:id', auth, (req, res) => {
  const p = db.getPaciente(req.params.id);
  if (!p) return res.status(404).json({ error: 'No encontrado' });
  if (!puedeAccederPaciente(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(p);
});

router.post('/pacientes', auth, soloAdmin, (req, res) => {
  try {
    const p = db.insertPaciente(req.body);
    let acceso = null;
    // Si tiene email, crear usuario automáticamente
    if (req.body.email) {
      const passDefault = req.body.dni || req.body.celular || '123456';
      const existente = db.getUsuarioByEmail(req.body.email);
      if (existente) {
        db.linkUsuarioPaciente(existente.id, p.id);
        acceso = { email: req.body.email, password: '(ya tenía acceso)' };
      } else {
        const hash = bcrypt.hashSync(passDefault, 10);
        const usuario = db.insertUsuario({ email: req.body.email, password: hash, rol: 'paciente', nombre: `${req.body.nombre} ${req.body.apellido}` });
        db.linkUsuarioPaciente(usuario.id, p.id);
        acceso = { email: req.body.email, password: passDefault };
      }
    }
    res.status(201).json({ paciente: db.getPaciente(p.id), acceso });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/pacientes/:id', auth, soloAdmin, (req, res) => {
  try {
    const existing = db.getPaciente(req.params.id);
    const p = db.updatePaciente({ ...req.body, id: req.params.id, usuario_id: existing?.usuario_id ?? null });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/pacientes/:id', auth, soloAdmin, (req, res) => {
  db.deletePaciente(req.params.id);
  res.json({ ok: true });
});

// Crear acceso para paciente existente
router.post('/pacientes/:id/crear-acceso', auth, soloAdmin, (req, res) => {
  try {
    const p = db.getPaciente(req.params.id);
    if (!p) return res.status(404).json({ error: 'Paciente no encontrado' });
    const email = req.body.email || p.email;
    if (!email) return res.status(400).json({ error: 'Se requiere email' });
    const passDefault = req.body.password || p.dni || '123456';
    const hash = bcrypt.hashSync(passDefault, 10);
    const existente = db.getUsuarioByEmail(email);
    if (existente) {
      db.linkUsuarioPaciente(existente.id, p.id);
    } else {
      const usuario = db.insertUsuario({ email, password: hash, rol: 'paciente', nombre: `${p.nombre} ${p.apellido}` });
      db.linkUsuarioPaciente(usuario.id, p.id);
    }
    res.json({ ok: true, email, password: passDefault });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Lesiones ──────────────────────────────────────────────

router.get('/pacientes/:id/lesiones', auth, (req, res) => {
  res.json(db.getLesionesByPaciente(req.params.id));
});

router.post('/lesiones', auth, soloAdmin, (req, res) => {
  try { res.status(201).json(db.insertLesion(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/lesiones/:id', auth, soloAdmin, (req, res) => {
  try { res.json(db.updateLesion({ ...req.body, id: req.params.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/lesiones/:id', auth, soloAdmin, (req, res) => {
  db.deleteLesion(req.params.id);
  res.json({ ok: true });
});

// ── Sesiones ──────────────────────────────────────────────

router.get('/lesiones/:id/sesiones', auth, (req, res) => {
  res.json(db.getSesionesByLesion(req.params.id));
});

router.post('/sesiones', auth, soloAdmin, (req, res) => {
  try { res.status(201).json(db.insertSesion(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/sesiones/:id', auth, soloAdmin, (req, res) => {
  try { res.json(db.updateSesion({ ...req.body, id: req.params.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/sesiones/:id', auth, soloAdmin, (req, res) => {
  db.deleteSesion(req.params.id);
  res.json({ ok: true });
});

// ── Ejercicios ────────────────────────────────────────────

router.get('/ejercicios', auth, (req, res) => {
  res.json(db.getEjercicios());
});

router.post('/ejercicios', auth, soloAdmin, (req, res) => {
  try { res.status(201).json(db.insertEjercicio(normalizarEjercicio(req.body))); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/ejercicios/:id', auth, soloAdmin, (req, res) => {
  try {
    const existente = db.getEjercicio(req.params.id);
    if (!existente) return res.status(404).json({ error: 'No encontrado' });
    res.json(db.updateEjercicio({ ...normalizarEjercicio(req.body, existente), id: req.params.id }));
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/ejercicios/:id', auth, soloAdmin, (req, res) => {
  db.deleteEjercicio(req.params.id);
  res.json({ ok: true });
});

// ── Dashboard ─────────────────────────────────────────────

router.get('/dashboard', auth, soloAdmin, (req, res) => {
  res.json({
    stats: db.getDashboardStats(),
    sesionesPorMes: db.getSesionesPorMes(),
    proximosTurnos: db.getProximosTurnos(),
  });
});

// ── Turnos ────────────────────────────────────────────────

router.get('/turnos', auth, soloAdmin, (req, res) => {
  const { mes } = req.query;
  res.json(mes ? db.getTurnosByMes(mes) : db.getTurnos());
});

router.get('/pacientes/:id/turnos', auth, (req, res) => {
  if (!puedeAccederPaciente(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(db.getTurnosByPaciente(req.params.id));
});

router.post('/turnos', auth, soloAdmin, (req, res) => {
  try { res.status(201).json(db.insertTurno(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/pacientes/:id/turnos', auth, (req, res) => {
  if (!puedeAccederPaciente(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  try {
    res.status(201).json(db.insertTurno({
      paciente_id: req.params.id,
      fecha: req.body.fecha,
      hora: req.body.hora,
      duracion: req.body.duracion || 45,
      motivo: req.body.motivo || 'Solicitud de turno',
      estado: 'pendiente',
      notas: req.body.notas || '',
    }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/turnos/:id', auth, soloAdmin, (req, res) => {
  try { res.json(db.updateTurno({ ...req.body, id: req.params.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/turnos/:id', auth, soloAdmin, (req, res) => {
  db.deleteTurno(req.params.id);
  res.json({ ok: true });
});

// ── Documentos ────────────────────────────────────────────

router.get('/pacientes/:id/documentos', auth, (req, res) => {
  if (!puedeAccederPaciente(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(db.getDocumentosByPaciente(req.params.id));
});

router.post('/pacientes/:id/documentos', auth, soloAdmin, upload.single('archivo'), (req, res) => {
  try {
    db.insertDocumento({
      paciente_id: req.params.id,
      nombre: req.body.nombre || req.file.originalname,
      tipo: req.body.tipo || 'otro',
      archivo: req.file.filename,
    });
    res.status(201).json(db.getDocumentosByPaciente(req.params.id));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/documentos/:id/descargar', auth, (req, res) => {
  const doc = db.getDocumento(req.params.id);
  if (!doc) return res.status(404).json({ error: 'No encontrado' });
  const filePath = path.join(__dirname, '../uploads/', doc.archivo);
  res.download(filePath, doc.nombre);
});

router.delete('/documentos/:id', auth, soloAdmin, (req, res) => {
  const doc = db.getDocumento(req.params.id);
  if (doc) {
    const filePath = path.join(__dirname, '../uploads/', doc.archivo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.deleteDocumento(req.params.id);
  }
  res.json({ ok: true });
});

// ── Evolución dolor (legacy) ──────────────────────────────

router.get('/pacientes/:id/dolor', auth, (req, res) => {
  if (!puedeAccederPaciente(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(db.getDolorEvolucion(req.params.id));
});

// ── Motivos de consulta ───────────────────────────────────

router.get('/pacientes/:id/motivos', auth, (req, res) => {
  if (!puedeAccederPaciente(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(db.getMotivosByPaciente(req.params.id));
});

router.post('/pacientes/:id/motivos', auth, soloAdmin, (req, res) => {
  try { res.status(201).json(db.insertMotivo({ ...req.body, paciente_id: req.params.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/motivos/:id', auth, soloAdmin, (req, res) => {
  try { res.json(db.updateMotivo({ ...req.body, id: req.params.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/motivos/:id', auth, soloAdmin, (req, res) => {
  db.deleteMotivo(req.params.id);
  res.json({ ok: true });
});

// ── Evoluciones ───────────────────────────────────────────

router.get('/motivos/:id/evoluciones', auth, (req, res) => {
  if (!puedeAccederMotivo(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(db.getEvolucionesByMotivo(req.params.id));
});

router.post('/motivos/:id/evoluciones', auth, soloAdmin, (req, res) => {
  try { res.status(201).json(db.insertEvolucion({ ...req.body, motivo_id: req.params.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/evoluciones/:id', auth, soloAdmin, (req, res) => {
  try { res.json(db.updateEvolucion({ ...req.body, id: req.params.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/evoluciones/:id', auth, soloAdmin, (req, res) => {
  db.deleteEvolucion(req.params.id);
  res.json({ ok: true });
});

router.patch('/evoluciones/:id/pagar', auth, soloAdmin, (req, res) => {
  const ev = db.getEvolucion(req.params.id);
  if (!ev) return res.status(404).json({ error: 'No encontrada' });
  db.updateEvolucion({ ...ev, id: ev.id, pagado: ev.pagado ? 0 : 1 });
  res.json({ ok: true, pagado: !ev.pagado });
});

router.post('/pacientes/:id/pagar-todo', auth, soloAdmin, (req, res) => {
  db.pagarTodasEvoluciones(req.params.id);
  res.json({ ok: true });
});

router.get('/pacientes/:id/saldo', auth, (req, res) => {
  if (!puedeAccederPaciente(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(db.getSaldoPaciente(req.params.id));
});

// Ejercicios de gimnasio: los de la última sesión del paciente
router.get('/pacientes/:id/ejercicios-gimnasio', auth, (req, res) => {
  if (req.user.rol === 'paciente') {
    const miPaciente = db.getPacienteByUsuario(req.user.id);
    if (!miPaciente || miPaciente.id != req.params.id) return res.status(403).json({ error: 'Sin acceso' });
  }
  const ultima = db.getUltimaEvolucionPaciente(req.params.id);
  if (!ultima || !ultima.ejercicios_sesion) return res.json({ ejercicios: [], fecha: null });
  let ejData = [];
  try { ejData = JSON.parse(ultima.ejercicios_sesion); } catch { return res.json({ ejercicios: [], fecha: null }); }
  // normalizar formato (puede ser [id] o [{id, series, reps, seg}])
  const ejDataNorm = ejData.map(x => typeof x === 'number' || typeof x === 'string'
    ? { id: Number(x), series: null, repeticiones: null, segundos: null }
    : { id: x.id, series: x.series || null, repeticiones: x.repeticiones || null, segundos: x.segundos || null }
  );
  const ejercicios = ejDataNorm.map(ejd => {
    const ej = db.getEjercicio(ejd.id);
    if (!ej) return null;
    return { ...ej, series: ejd.series, repeticiones: ejd.repeticiones, segundos: ejd.segundos };
  }).filter(Boolean);
  res.json({ ejercicios, fecha: ultima.fecha });
});

// ── Estudios ──────────────────────────────────────────────

router.get('/motivos/:id/estudios', auth, (req, res) => {
  if (!puedeAccederMotivo(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(db.getEstudiosByMotivo(req.params.id));
});

router.post('/motivos/:id/estudios', auth, upload.single('archivo'), (req, res) => {
  if (!puedeAccederMotivo(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  try {
    db.insertEstudio({
      motivo_id: req.params.id,
      nombre: req.body.nombre || req.file.originalname,
      tipo: req.body.tipo || 'imagen',
      archivo: req.file.filename,
      descripcion: req.body.descripcion || null,
    });
    res.status(201).json(db.getEstudiosByMotivo(req.params.id));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/estudios/:id/descargar', auth, (req, res) => {
  const est = db.getEstudio(req.params.id);
  if (!est) return res.status(404).json({ error: 'No encontrado' });
  res.download(path.join(__dirname, '../uploads/', est.archivo), est.nombre);
});

router.delete('/estudios/:id', auth, soloAdmin, (req, res) => {
  const est = db.getEstudio(req.params.id);
  if (est) {
    const fp = path.join(__dirname, '../uploads/', est.archivo);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    db.deleteEstudio(req.params.id);
  }
  res.json({ ok: true });
});

// ── Rutinas ───────────────────────────────────────────────

// Todas las rutinas de un paciente (para el portal)
router.get('/pacientes/:id/rutinas', auth, (req, res) => {
  if (!puedeAccederPaciente(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  const motivos = db.getMotivosByPaciente(req.params.id);
  const rutinas = motivos.flatMap(m =>
    db.getRutinasByMotivo(m.id).map(r => ({
      ...r,
      motivo_sintoma: m.sintoma,
      ejercicios: r.ejercicios ? JSON.parse(r.ejercicios) : [],
      hielo:      r.hielo ? JSON.parse(r.hielo) : null,
      calor:      r.calor ? JSON.parse(r.calor) : null,
      contraste:  r.contraste ? JSON.parse(r.contraste) : null,
    }))
  );
  // activas primero
  rutinas.sort((a, b) => (a.estado === 'Activa' ? -1 : 1));
  res.json(rutinas);
});

router.get('/motivos/:id/rutinas', auth, (req, res) => {
  if (!puedeAccederMotivo(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  const rutinas = db.getRutinasByMotivo(req.params.id).map(r => ({
    ...r,
    ejercicios: r.ejercicios ? JSON.parse(r.ejercicios) : [],
    hielo:      r.hielo ? JSON.parse(r.hielo) : null,
    calor:      r.calor ? JSON.parse(r.calor) : null,
    contraste:  r.contraste ? JSON.parse(r.contraste) : null,
  }));
  res.json(rutinas);
});

router.post('/motivos/:id/rutinas', auth, soloAdmin, (req, res) => {
  try {
    const { nombre, estado, resumen, ejercicios, hielo, calor, contraste, notas, veces, ejercicios_libres } = req.body;
    const r = db.insertRutina({
      motivo_id: req.params.id, nombre, estado, resumen,
      ejercicios: JSON.stringify(ejercicios || []),
      hielo:      hielo ? JSON.stringify(hielo) : null,
      calor:      calor ? JSON.stringify(calor) : null,
      contraste:  contraste ? JSON.stringify(contraste) : null,
      notas,
      veces: veces || 1,
      ejercicios_libres: ejercicios_libres || null,
    });
    res.status(201).json({ ...r, ejercicios: ejercicios || [], hielo, calor, contraste });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/rutinas/:id', auth, soloAdmin, (req, res) => {
  try {
    const { nombre, estado, resumen, ejercicios, hielo, calor, contraste, notas, veces, ejercicios_libres } = req.body;
    const r = db.updateRutina({
      id: req.params.id, nombre, estado, resumen,
      ejercicios: JSON.stringify(ejercicios || []),
      hielo:      hielo ? JSON.stringify(hielo) : null,
      calor:      calor ? JSON.stringify(calor) : null,
      contraste:  contraste ? JSON.stringify(contraste) : null,
      notas,
      veces: veces || 1,
      ejercicios_libres: ejercicios_libres || null,
    });
    res.json({ ...r, ejercicios: ejercicios || [], hielo, calor, contraste });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/rutinas/:id', auth, soloAdmin, (req, res) => {
  db.deleteRutina(req.params.id);
  res.json({ ok: true });
});

// ── Ejercicios por paciente ───────────────────────────────

router.get('/pacientes/:id/ejercicios', auth, (req, res) => {
  if (!puedeAccederPaciente(req, req.params.id)) return res.status(403).json({ error: 'Sin acceso' });
  res.json(db.getEjerciciosByPaciente(req.params.id));
});

router.post('/pacientes/:id/ejercicios', auth, soloAdmin, (req, res) => {
  try {
    db.insertPacienteEjercicio({ ...req.body, paciente_id: req.params.id });
    res.status(201).json(db.getEjerciciosByPaciente(req.params.id));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/paciente-ejercicios/:id', auth, soloAdmin, (req, res) => {
  db.deletePacienteEjercicio(req.params.id);
  res.json({ ok: true });
});

// ── Claude: generar rutina libre ──────────────────────────

router.post('/claude/rutina', auth, soloAdmin, async (req, res) => {
  try {
    const { descripcion } = req.body;
    if (!descripcion?.trim()) return res.status(400).json({ error: 'Descripción requerida' });

    const AnthropicMod = require('@anthropic-ai/sdk');
    const Anthropic = AnthropicMod.default || AnthropicMod;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: `Sos un kinesiólogo experto. El usuario te describe ejercicios que quiere incluir en una rutina de rehabilitación.
Generá una rutina escrita, clara y ordenada, lista para mostrarle al paciente.
Formato: cada ejercicio en una línea con su nombre, descripción breve, series y repeticiones (si corresponde).
Sin títulos ni secciones, sin markdown. Solo el listado limpio, en español, con lenguaje simple y directo para el paciente.`,
      messages: [{ role: 'user', content: descripcion.trim() }],
    });

    const texto = message.content[0]?.text || '';
    res.json({ texto });
  } catch (e) {
    console.error('Claude rutina error:', e.message);
    res.status(500).json({ error: 'Error al generar rutina con Claude' });
  }
});

// ── Notas admin ──────────────────────────────────────────────
router.get('/notas', auth, soloAdmin, (req, res) => {
  res.json(db.getNotasAdmin());
});
router.post('/notas', auth, soloAdmin, (req, res) => {
  const { texto } = req.body;
  if (!texto?.trim()) return res.status(400).json({ error: 'Texto requerido' });
  res.json(db.insertNotaAdmin(texto.trim()));
});
router.put('/notas/:id', auth, soloAdmin, (req, res) => {
  const { texto } = req.body;
  if (!texto?.trim()) return res.status(400).json({ error: 'Texto requerido' });
  res.json(db.updateNotaAdmin(req.params.id, texto.trim()));
});
router.delete('/notas/:id', auth, soloAdmin, (req, res) => {
  db.deleteNotaAdmin(req.params.id);
  res.json({ ok: true });
});

// ── Movimientos (ingresos/egresos) ───────────────────────────
router.get('/movimientos', auth, soloAdmin, (req, res) => {
  res.json(db.getMovimientos(req.query.tipo));
});
router.post('/movimientos', auth, soloAdmin, (req, res) => {
  const { tipo, descripcion, monto, fecha } = req.body;
  if (!tipo || !descripcion || !monto) return res.status(400).json({ error: 'Faltan campos' });
  const hoy = new Date().toISOString().split('T')[0];
  res.json(db.insertMovimiento({ tipo, descripcion, monto: parseFloat(monto), fecha: fecha || hoy }));
});
router.delete('/movimientos/:id', auth, soloAdmin, (req, res) => {
  db.deleteMovimiento(req.params.id);
  res.json({ ok: true });
});

// ── Saldos todos los pacientes ────────────────────────────────
router.get('/saldos', auth, soloAdmin, (req, res) => {
  res.json(db.getSaldosTodos());
});
router.post('/saldos/:pacienteId/pagar', auth, soloAdmin, (req, res) => {
  db.pagarSaldoPaciente(req.params.pacienteId);
  res.json({ ok: true });
});

module.exports = router;
