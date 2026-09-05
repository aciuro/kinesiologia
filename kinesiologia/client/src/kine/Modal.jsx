const s = {
  white: '#112433', s200: 'rgba(148,184,204,.18)', s400: '#8EA5B6',
  s500: '#B5C5D0', s900: '#F2F7FB',
}

export default function Modal({ open, onClose, titulo, subtitulo, maxWidth = 520, footer, children }) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 50,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth,
          background: s.white, borderRadius: 24,
          border: `1px solid ${s.s200}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.42)',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '20px 24px',
          borderBottom: `1px solid ${s.s200}`,
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: s.s900 }}>{titulo}</h2>
            {subtitulo && <p style={{ fontSize: 14, color: s.s500, marginTop: 3 }}>{subtitulo}</p>}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 18, color: s.s400, cursor: 'pointer', padding: '4px 8px', borderRadius: 10, lineHeight: 1, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px',
            borderTop: `1px solid ${s.s200}`,
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
