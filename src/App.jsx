import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import './index.css'


const DEFAULT_CONFIG = {
  eventName: 'Your Event',
  tagline: '',
  date: '',
  location: '',
  hashtags: '',
  mention: '',
  logoUrl: null,
  captionAttending:
    "Excited to be joining {eventName} in {location}. {mention} {hashtags}",
  captionSpeaking:
    "Excited to be speaking at {eventName} in {location}. Come find me there — let's talk. {mention} {hashtags}",
  captionPartner:
    "Proud to be a partner at {eventName} in {location}. See you there! {mention} {hashtags}",
  primaryColor: '#0066FF',
  bgColor: '#0A0F1E',
  fontFamily: 'Inter',
}


function getTemplate(config, badge) {
  if (badge === 'Speaking') return config.captionSpeaking || config.captionAttending || ''
  if (badge === 'Partner') return config.captionPartner || config.captionAttending || ''
  return config.captionAttending || ''
}

function buildCaption(template, config, name) {
  return (template || '')
    .replace(/{name}/g, name || '')
    .replace(/{eventName}/g, config.eventName || '')
    .replace(/{location}/g, config.location || '')
    .replace(/{mention}/g, config.mention || '')
    .replace(/{hashtags}/g, config.hashtags || '')
    .replace(/{date}/g, config.date || '')
    .replace(/{tagline}/g, config.tagline || '')
}

// ─── Stats Panel ─────────────────────────────────────────────────────────────

function StatsPanel({ slug, setupKey }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug || !setupKey) return
    fetch(`/api/stats/${slug}?key=${encodeURIComponent(setupKey)}`)
      .then(r => r.json())
      .then(d => { setStats(d.error ? null : d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, setupKey])

  const fmt = n => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))
  const s = stats || { views: 0, downloads: 0, conversionPct: 0, impressionsEst: 0 }

  const tiles = [
    { label: 'Page Views', value: loading ? '…' : fmt(s.views), icon: '👁' },
    { label: 'Downloads', value: loading ? '…' : fmt(s.downloads), icon: '⬇️' },
    { label: 'Conversion', value: loading ? '…' : `${s.conversionPct}%`, icon: '📈' },
    { label: 'Est. Impressions', value: loading ? '…' : fmt(s.impressionsEst), icon: '🚀' },
  ]

  return (
    <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Event Stats</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {tiles.map(({ label, value, icon }) => (
          <div key={label} style={{ background: '#1F2937', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{icon} {label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#4B5563', textAlign: 'center' }}>
        Each download reaches ~2,500 people on LinkedIn
      </div>
    </div>
  )
}

// ─── Color Swatches (module-level to avoid React remount on every render) ────

const PRIMARY_PRESETS = ['#0066FF','#6366F1','#8B5CF6','#EC4899','#EF4444','#F97316','#EAB308','#22C55E','#14B8A6','#06B6D4','#000000','#FFFFFF']
const BG_PRESETS = ['#0A0F1E','#0F172A','#1A1A2E','#111827','#18181B','#0D0D0D','#1E1B4B','#0C1A0C','#1A0A0A','#FFFFFF','#F3F4F6','#E5E7EB']

function ColorSwatches({ label, currentColor, presets, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={styles.label}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {presets.map(c => (
          <button key={c} onClick={() => onChange(c)} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: currentColor === c ? '3px solid #fff' : '2px solid #374151', cursor: 'pointer', flexShrink: 0, boxShadow: currentColor === c ? '0 0 0 2px #6366F1' : 'none', transition: 'all 0.1s' }} />
        ))}
        <label style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '2px dashed #374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#6B7280', flexShrink: 0 }}>
          +<input type="color" value={currentColor} style={{ display: 'none' }} onChange={(e) => onChange(e.target.value)} />
        </label>
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#6B7280' }}>{currentColor}</span>
      </div>
    </div>
  )
}

// ─── Organizer Panel ──────────────────────────────────────────────

function OrganizerPanel({ config, onChange, onDone }) {
  const fileRef = useRef()

  function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange({ ...config, logoUrl: ev.target.result })
    reader.readAsDataURL(file)
  }

  function f(label, key, placeholder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={styles.label}>{label}</label>
        <input
          style={styles.input}
          value={config[key] || ''}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...config, [key]: e.target.value })}
        />
      </div>
    )
  }

  return (
    <div style={{ ...styles.panel, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={styles.grid2}>
        {f('Event Name', 'eventName', 'Your Event Name')}
        {f('Edition / Tagline', 'tagline', '15th Anniversary Edition')}
        {f('Date', 'date', 'June 11–12, 2026')}
        {f('Location', 'location', 'Helsinki, Finland')}
        {f('Hashtags', 'hashtags', '#YourEvent #City #Industry')}
        {f('LinkedIn Mention', 'mention', '@YourOrganization')}
      </div>

      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={styles.label}>Logo (PNG / SVG)</label>
        <div
          style={{ ...styles.input, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          onClick={() => fileRef.current.click()}
        >
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="logo" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: '#6B7280', fontSize: 13 }}>Click to upload logo…</span>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/svg+xml" style={{ display: 'none' }} onChange={handleLogoUpload} />
      </div>

      {/* Caption templates per badge */}
      {[
        { key: 'captionAttending', label: 'Caption — Attending' },
        { key: 'captionSpeaking',  label: 'Caption — Speaking'  },
        { key: 'captionPartner',   label: 'Caption — Partner'   },
      ].map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={styles.label}>
            {label}{' '}
            <span style={{ color: '#6B7280', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              — {'{eventName}'}, {'{location}'}, {'{mention}'}, {'{hashtags}'}
            </span>
          </label>
          <textarea
            style={{ ...styles.input, resize: 'none', minHeight: 72 }}
            value={config[key] || ''}
            onChange={(e) => onChange({ ...config, [key]: e.target.value })}
          />
        </div>
      ))}

      {/* Font */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={styles.label}>Graphic Font</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { name: 'Inter',            label: 'Inter'           },
            { name: 'Poppins',          label: 'Poppins'         },
            { name: 'Montserrat',       label: 'Montserrat'      },
            { name: 'Space Grotesk',    label: 'Space Grotesk'   },
            { name: 'Playfair Display', label: 'Playfair Display'},
            { name: 'Oswald',           label: 'Oswald'          },
            { name: 'DM Sans',          label: 'DM Sans'         },
          ].map(({ name, label }) => {
            const active = (config.fontFamily || 'Inter') === name
            return (
              <button
                key={name}
                onClick={() => onChange({ ...config, fontFamily: name })}
                style={{
                  fontFamily: `'${name}', sans-serif`,
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${active ? config.primaryColor : '#374151'}`,
                  background: active ? `${config.primaryColor}22` : 'transparent',
                  color: active ? config.primaryColor : '#9CA3AF',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Colors */}
      <ColorSwatches label="Primary Color" currentColor={config.primaryColor} presets={PRIMARY_PRESETS} onChange={c => onChange({ ...config, primaryColor: c })} />
      <ColorSwatches label="Background Color" currentColor={config.bgColor} presets={BG_PRESETS} onChange={c => onChange({ ...config, bgColor: c })} />

      <button
        onClick={onDone}
        style={{ ...styles.btn(config.primaryColor), marginTop: 4 }}
      >
        Done — Launch Attendee View →
      </button>
    </div>
  )
}

// ─── Photo Image (module-level to avoid React remount on every render) ────────

const PHOTO_FILTERS = { none: 'none', bw: 'grayscale(100%)', warm: 'sepia(50%) saturate(1.3) brightness(1.05)', fade: 'brightness(1.15) contrast(0.8) saturate(0.7)', vivid: 'saturate(1.8) contrast(1.1)' }

function PhotoImg({ photoUrl, objPos, filterCss, style: imgStyle }) {
  return photoUrl
    ? <div style={{ width: '100%', height: '100%', backgroundImage: `url(${photoUrl})`, backgroundSize: 'cover', backgroundPosition: objPos, filter: filterCss, ...imgStyle }} />
    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} />
}

// ─── Event Graphic ────────────────────────────────────────────────

function LogoOrName({ logoUrl, eventName, color, height = 47 }) {
  return logoUrl
    ? <img src={logoUrl} alt="logo" style={{ height, width: 'auto', objectFit: 'contain' }} />
    : <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color }}>{eventName}</div>
}

const STYLES = [
  { key: 'frame',  name: 'Frame',       desc: 'Full photo + border frame' },
  { key: 'split',  name: 'Split',       desc: 'Photo left, color panel right' },
  { key: 'circle', name: 'Circle',      desc: 'Circular photo, text below' },
  { key: 'banner', name: 'Bold Banner', desc: 'Photo top, color strip below' },
  { key: 'badge',  name: 'Badge',       desc: 'Bold ring badge, minimal text' },
]

function EventGraphic({ config, attendee, graphicRef }) {
  const primary = config.primaryColor
  const bg = config.bgColor
  const font = `'${config.fontFamily || 'Inter'}', sans-serif`
  const style = attendee.style || 'frame'
  const px = attendee.photoOffset?.x ?? 50
  const py = attendee.photoOffset?.y ?? 50
  const objPos = `${px}% ${py}%`

  const filterCss = PHOTO_FILTERS[attendee.photoFilter || 'none']

  const logo = (color, height = 47) => <LogoOrName logoUrl={config.logoUrl} eventName={config.eventName} color={color} height={height} />

  const photo = <PhotoImg photoUrl={attendee.photoUrl} objPos={objPos} filterCss={filterCss} />

  const root = { position: 'relative', width: 600, height: 600, overflow: 'hidden', background: bg, fontFamily: font, userSelect: 'none', flexShrink: 0 }

  // ── FRAME ──────────────────────────────────────────────────────────
  if (style === 'frame') return (
    <div ref={graphicRef} style={root}>
      <div style={{ position: 'absolute', inset: 0 }}>{photo}</div>
      {/* Cinematic gradient overlays */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 280, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }} />
      {/* Left accent bar */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 8, background: primary, zIndex: 4 }} />
      {/* Top section */}
      <div style={{ position: 'absolute', top: 32, left: 36, right: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: primary, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{config.date}</div>
        {logo('rgba(255,255,255,0.9)', 40)}
      </div>
      {/* Bottom section */}
      <div style={{ position: 'absolute', bottom: 0, left: 36, right: 36, paddingBottom: 40, zIndex: 6 }}>
        <div style={{ width: 40, height: 3, background: primary, marginBottom: 16 }} />
        <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-1.5px' }}>{config.eventName}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 12, fontWeight: 500, letterSpacing: '0.04em' }}>{config.location}</div>
      </div>
    </div>
  )

  // ── SPLIT ──────────────────────────────────────────────────────────
  if (style === 'split') return (
    <div ref={graphicRef} style={{ ...root, background: primary }}>
      {/* Left photo */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '55%', overflow: 'hidden' }}>
        {photo}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 50%, rgba(0,0,0,0.15) 100%)' }} />
      </div>
      {/* Diagonal divider */}
      <div style={{ position: 'absolute', top: -20, bottom: -20, left: 'calc(55% - 36px)', width: 72, background: primary, transform: 'skewX(-4deg)', zIndex: 1 }} />
      {/* Right panel */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: '52%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 36px 40px 48px', zIndex: 2 }}>
        <div>{logo('#fff', 40)}</div>
        <div>
          <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.5)', marginBottom: 14 }} />
          <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{config.eventName}</div>
          {config.tagline ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 10, fontStyle: 'italic' }}>{config.tagline}</div> : null}
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{config.location}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>{config.date}</div>
        </div>
      </div>
    </div>
  )

  // ── CIRCLE ─────────────────────────────────────────────────────────
  if (style === 'circle') return (
    <div ref={graphicRef} style={root}>
      {/* Atmospheric blurred background */}
      {attendee.photoUrl ? (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${attendee.photoUrl})`, backgroundSize: 'cover', backgroundPosition: objPos, filter: 'blur(32px) brightness(0.18) saturate(0.6)', transform: 'scale(1.2)' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${primary}30 0%, ${bg} 70%)` }} />
      )}
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, transparent 20%, rgba(0,0,0,0.75) 100%)' }} />
      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ marginBottom: 24, zIndex: 2 }}>{logo('rgba(255,255,255,0.85)', 38)}</div>
        {/* Outer decorative ring */}
        <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, marginBottom: 28 }}>
          <div style={{ position: 'absolute', top: -14, left: -14, right: -14, bottom: -14, borderRadius: '50%', border: `1px solid ${primary}45` }} />
          <div style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: '50%', border: `1px solid ${primary}70` }} />
          <div style={{ width: 260, height: 260, borderRadius: '50%', overflow: 'hidden', border: `6px solid ${primary}`, boxShadow: `0 0 0 2px ${bg}, 0 0 40px ${primary}70, 0 0 80px ${primary}30` }}>
            {photo}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '0 52px', zIndex: 2 }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-1px', textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>{config.eventName}</div>
          <div style={{ width: 36, height: 2, background: primary, margin: '14px auto 12px' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{config.location} · {config.date}</div>
        </div>
      </div>
    </div>
  )

  // ── BADGE ──────────────────────────────────────────────────────────
  if (style === 'badge') return (
    <div ref={graphicRef} style={root}>
      {/* Radial glow background */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${primary}20 0%, ${bg} 65%)` }} />
      {/* Decorative concentric rings */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, borderRadius: '50%', border: `1px solid ${primary}18`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 430, height: 430, borderRadius: '50%', border: `1px solid ${primary}30`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 370, height: 370, borderRadius: '50%', border: `1px solid ${primary}50`, pointerEvents: 'none' }} />
      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <div style={{ zIndex: 2 }}>{logo(primary, 38)}</div>
        {/* Main photo ring with glow */}
        <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
          <div style={{ width: 300, height: 300, borderRadius: '50%', overflow: 'hidden', border: `10px solid ${primary}`, boxShadow: `0 0 0 3px ${bg}, 0 0 0 5px ${primary}60, 0 0 60px ${primary}50, 0 20px 60px rgba(0,0,0,0.5)` }}>
            {photo}
          </div>
          {/* Diamond markers */}
          {[
            { top: -9, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
            { bottom: -9, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
            { left: -9, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
            { right: -9, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 14, height: 14, background: primary, boxShadow: `0 0 8px ${primary}`, ...s }} />
          ))}
        </div>
        <div style={{ textAlign: 'center', zIndex: 2 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{config.location} · {config.date}</div>
        </div>
      </div>
    </div>
  )

  // ── BANNER ─────────────────────────────────────────────────────────
  return (
    <div ref={graphicRef} style={root}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380, overflow: 'hidden' }}>
        {photo}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: `linear-gradient(to top, ${primary} 0%, transparent 100%)` }} />
        <div style={{ position: 'absolute', top: 28, left: 32, zIndex: 2 }}>{logo('rgba(255,255,255,0.9)', 40)}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 228, background: primary, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px' }}>
        <div style={{ width: 36, height: 3, background: 'rgba(255,255,255,0.4)', marginBottom: 14 }} />
        <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-1px' }}>{config.eventName}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 12, fontWeight: 500, letterSpacing: '0.04em' }}>{config.location} · {config.date}</div>
      </div>
    </div>
  )
}

// ─── Step 0: Choose Style ─────────────────────────────────────────

function Step0({ config, selectedStyle, onStyle }) {
  const THUMB = 120
  const demo = { photoUrl: null, name: '', badge: 'Attending', photoOffset: { x: 50, y: 50 } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '0 16px' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Choose Your Style</h2>
        <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>Tap a layout to continue</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, width: '100%', maxWidth: 480 }}>
        {STYLES.map(({ key, name, desc }) => {
          const active = selectedStyle === key
          return (
            <button
              key={key}
              onClick={() => onStyle(key, true)}
              style={{
                background: 'transparent',
                border: `2px solid ${active ? config.primaryColor : '#374151'}`,
                borderRadius: 14,
                padding: 10,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s',
                outline: 'none',
                boxShadow: active ? `0 0 0 2px ${config.primaryColor}40` : 'none',
              }}
            >
              <div style={{ width: THUMB, height: THUMB, borderRadius: 8, overflow: 'hidden', pointerEvents: 'none', flexShrink: 0 }}>
                <div style={{ transform: `scale(${THUMB / 600})`, transformOrigin: 'top left', width: 600, height: 600 }}>
                  <EventGraphic config={config} attendee={{ ...demo, style: key }} graphicRef={null} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: active ? config.primaryColor : '#fff', fontWeight: 700, fontSize: 13 }}>{name}</div>
                <div style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 1: Upload ───────────────────────────────────────────────

function Step1({ config, onPhoto }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  function processFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => onPhoto(e.target.result)
    reader.readAsDataURL(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processFile(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', padding: '0 16px', gap: 8 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>Upload Your Photo</h2>
      <p style={{ color: '#9CA3AF', fontSize: 14, margin: '4px 0 24px' }}>JPG, PNG or WebP · No login required</p>

      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          cursor: 'pointer',
          border: `2px dashed ${dragging ? config.primaryColor : '#374151'}`,
          background: dragging ? `${config.primaryColor}10` : 'rgba(255,255,255,0.02)',
          borderRadius: 18,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: '52px 48px',
          width: '100%',
          maxWidth: 400,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: 56 }}>📷</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>Drag & drop your photo here</p>
          <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>or tap to browse</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => processFile(e.target.files[0])} />
    </div>
  )
}

// ─── Step 2: Preview & Edit ───────────────────────────────────────

function Step2({ config, attendee, setAttendee, graphicRef, onNext }) {
  const [localCaption, setLocalCaption] = useState(() => buildCaption(getTemplate(config, attendee.badge), config, attendee.name))
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setLocalCaption(buildCaption(getTemplate(config, attendee.badge), config, attendee.name))
  }, [attendee.badge, attendee.name, config.captionAttending, config.captionSpeaking, config.captionPartner, config.eventName, config.location, config.mention, config.hashtags])

  const charCount = localCaption.length
  const warn = charCount >= 280

  function update(key, val) {
    setAttendee((prev) => ({ ...prev, [key]: val }))
  }

  // Scale factor for preview
  const PREVIEW_W = 300

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 16px', maxWidth: 900, margin: '0 auto', width: '100%', position: 'relative' }}>

      {/* Hidden full-size graphic for capture */}
      <div style={{ position: 'fixed', left: -700, top: 0, width: 600, height: 600, overflow: 'hidden', pointerEvents: 'none' }}>
        <EventGraphic config={config} attendee={attendee} graphicRef={graphicRef} />
      </div>

      {/* Responsive row */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start', justifyContent: 'center' }}>

        {/* Scaled-down preview — no ref */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={styles.label}>Preview</span>
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', width: PREVIEW_W, height: PREVIEW_W }}>
            <div style={{ transform: `scale(${PREVIEW_W / 600})`, transformOrigin: 'top left', width: 600, height: 600 }}>
              <EventGraphic config={config} attendee={attendee} graphicRef={null} />
            </div>
          </div>
          {/* Photo position nudge */}
          {attendee.photoUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <span style={{ ...styles.label, fontSize: 10 }}>Adjust photo position</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                {[
                  [null, [{ dx: 0, dy: -10, icon: '↑' }], null],
                  [{ dx: -10, dy: 0, icon: '←' }, { dx: 0, dy: 0, icon: '⊙', reset: true }, { dx: 10, dy: 0, icon: '→' }],
                  [null, [{ dx: 0, dy: 10, icon: '↓' }], null],
                ].map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', gap: 3 }}>
                    {row.map((cell, ci) => {
                      if (!cell) return <div key={ci} style={{ width: 32 }} />
                      const btn = Array.isArray(cell) ? cell[0] : cell
                      return (
                        <button
                          key={ci}
                          onClick={() => {
                            if (btn.reset) {
                              update('photoOffset', { x: 50, y: 50 })
                            } else {
                              const cur = attendee.photoOffset || { x: 50, y: 50 }
                              update('photoOffset', {
                                x: Math.max(0, Math.min(100, cur.x + btn.dx)),
                                y: Math.max(0, Math.min(100, cur.y + btn.dy)),
                              })
                            }
                          }}
                          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #374151', background: btn.reset ? '#1F2937' : 'transparent', color: '#9CA3AF', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {btn.icon}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={styles.label}>Filter</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['none','Normal'],['bw','B&W'],['warm','Warm'],['fade','Fade'],['vivid','Vivid']].map(([key, label]) => (
                <button key={key} onClick={() => setAttendee(p => ({ ...p, photoFilter: key }))} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: `1.5px solid ${attendee.photoFilter === key ? config.primaryColor : '#374151'}`, background: attendee.photoFilter === key ? config.primaryColor : 'transparent', color: attendee.photoFilter === key ? '#fff' : '#9CA3AF', cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={styles.label}>Your Role</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Attending', 'Speaking', 'Partner'].map((b) => (
                <button
                  key={b}
                  onClick={() => update('badge', b)}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 700,
                    border: `1.5px solid ${attendee.badge === b ? config.primaryColor : '#374151'}`,
                    background: attendee.badge === b ? config.primaryColor : 'transparent',
                    color: attendee.badge === b ? '#fff' : '#9CA3AF',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={styles.label}>LinkedIn Caption</label>
              <span style={{ fontSize: 11, color: '#4B5563', fontWeight: 500 }}>updates with your role ↑</span>
            </div>
            <textarea
              style={{ ...styles.input, resize: 'none', minHeight: 110, borderColor: warn ? '#F59E0B' : '#374151' }}
              value={localCaption}
              onChange={(e) => setLocalCaption(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: warn ? '#F59E0B' : '#6B7280' }}>
                {charCount}{warn ? ' ⚠ over 280' : ''}
              </span>
            </div>
          </div>

          <button
            onClick={async () => {
              setExporting(true)
              let dataUrl = null
              if (graphicRef.current) {
                try {
                  const canvas = await html2canvas(graphicRef.current, {
                    width: 600, height: 600, scale: 1,
                    useCORS: true, allowTaint: true, backgroundColor: null,
                    logging: false,
                  })
                  dataUrl = canvas.toDataURL('image/png')
                } catch { /* ignore capture errors */ }
              }
              setExporting(false)
              onNext(localCaption, dataUrl)
            }}
            disabled={exporting}
            style={{ ...styles.btn(config.primaryColor), opacity: exporting ? 0.7 : 1 }}
          >
            {exporting ? 'Preparing…' : 'Continue to Share →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Share ────────────────────────────────────────────────

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const binary = atob(data)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

function Step3({ config, caption, imageDataUrl, attendee, autoPost, onReset, slug }) {
  const [auth, setAuth] = useState({ loading: true, connected: false, name: null })
  const [postState, setPostState] = useState('idle')
  const [errorMsg, setErrorMsg] = useState(null)
  const [captionCopied, setCaptionCopied] = useState(false)
  const autoPostFired = useRef(false)

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(d => setAuth({ loading: false, connected: d.connected, name: d.name || null }))
      .catch(() => setAuth({ loading: false, connected: false, name: null }))
  }, [])

  // Auto-post as soon as we know we're connected (returning from OAuth)
  useEffect(() => {
    if (!autoPost || autoPostFired.current || auth.loading) return
    if (auth.connected) {
      autoPostFired.current = true
      doPost()
    } else {
      // Auth check failed after OAuth — show error
      setErrorMsg('LinkedIn connection failed. Please try again.')
      setPostState('error')
    }
  }, [autoPost, auth.loading, auth.connected])

  async function doPost() {
    setPostState('posting')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl, caption }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Post failed')
      setPostState('done')
    } catch (e) {
      setErrorMsg(e.message || 'Something went wrong. Please try again.')
      setPostState('error')
    }
  }

  function connectLinkedIn() {
    try {
      sessionStorage.setItem(SS_KEY, JSON.stringify({ imageDataUrl, caption, attendee }))
    } catch {
      // If imageDataUrl is too large, store without it and re-export on return
      try {
        sessionStorage.setItem(SS_KEY, JSON.stringify({ caption, attendee }))
      } catch { /* ignore */ }
    }
    window.location.href = '/api/auth/linkedin'
  }

  async function disconnect() {
    await fetch('/api/auth/disconnect')
    setAuth({ loading: false, connected: false, name: null })
    setPostState('idle')
    setErrorMsg(null)
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(caption)
    setCaptionCopied(true)
    setTimeout(() => setCaptionCopied(false), 2500)
  }

  function downloadPng() {
    if (!imageDataUrl) return
    if (slug) fetch(`/api/track/${slug}?event=download`, { method: 'POST' }).catch(() => {})
    const a = document.createElement('a')
    a.href = imageDataUrl
    a.download = 'event-share.png'
    a.click()
  }

  async function shareNative() {
    if (slug) fetch(`/api/track/${slug}?event=download`, { method: 'POST' }).catch(() => {})
    try {
      if (imageDataUrl && navigator.canShare) {
        const blob = dataUrlToBlob(imageDataUrl)
        const file = new File([blob], 'event-share.png', { type: blob.type })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: caption, title: config.eventName })
          return
        }
      }
      if (navigator.share) {
        await navigator.share({ text: caption, title: config.eventName })
        return
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
    }
    copyCaption()
  }

  const shareUrl = window.location.href
  const encodedCaption = encodeURIComponent(caption)
  const encodedUrl = encodeURIComponent(shareUrl)
  const socialLinks = [
    { key: 'linkedin', label: 'in', name: 'LinkedIn', color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { key: 'x', label: '𝕏', name: 'X / Twitter', color: '#18181B', href: `https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedUrl}` },
    { key: 'whatsapp', label: 'W', name: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodedCaption}%20${encodedUrl}` },
    { key: 'facebook', label: 'f', name: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '0 16px 40px', width: '100%', maxWidth: 480, margin: '0 auto' }}>

      {postState === 'done' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', paddingTop: 24, width: '100%' }}>
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <div style={{ position: 'absolute', inset: -32, borderRadius: '50%', background: `radial-gradient(circle, ${config.primaryColor}50 0%, transparent 70%)`, filter: 'blur(20px)' }} />
            {imageDataUrl && <img src={imageDataUrl} alt="" style={{ position: 'relative', zIndex: 1, width: 180, height: 180, borderRadius: 16, objectFit: 'cover', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }} />}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '8px 0 0', letterSpacing: '-0.5px' }}>Posted to LinkedIn!</h2>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Your graphic is live on your profile.</p>
          {auth.name && <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>Posted as {auth.name} · <button onClick={disconnect} style={{ background: 'none', border: 'none', color: '#374151', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>disconnect</button></p>}
          <button onClick={downloadPng} style={{ width: '100%', background: 'transparent', border: '1.5px solid #2C2C2E', borderRadius: 14, padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Download PNG</span>
          </button>
        </div>

      ) : postState === 'posting' || (autoPost && auth.loading) ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', paddingTop: 64 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${config.primaryColor}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Posting to LinkedIn…</h2>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>

      ) : (
        <>
          {/* Image reveal with glow */}
          {imageDataUrl && (
            <div style={{ position: 'relative', marginTop: 8 }}>
              <div style={{ position: 'absolute', inset: -60, borderRadius: '50%', background: `radial-gradient(circle, ${config.primaryColor}55 0%, transparent 60%)`, filter: 'blur(36px)', zIndex: 0 }} />
              <div style={{ position: 'absolute', inset: -20, borderRadius: 28, background: `radial-gradient(circle, ${config.primaryColor}25 0%, transparent 70%)`, filter: 'blur(16px)', zIndex: 0 }} />
              <img src={imageDataUrl} alt="" style={{ position: 'relative', zIndex: 1, width: 260, height: 260, borderRadius: 22, objectFit: 'cover', boxShadow: `0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 6px ${config.primaryColor}25` }} />
            </div>
          )}

          {/* Headline */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Looking good! 🔥</h2>
            <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Share it and inspire your network</p>
          </div>

          {/* Hero Share Button */}
          <button onClick={shareNative} style={{ width: '100%', background: config.primaryColor, border: 'none', borderRadius: 16, padding: '17px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: `0 6px 32px ${config.primaryColor}55` }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>Share my badge</span>
          </button>

          {/* Platform grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, width: '100%' }}>
            {socialLinks.map(s => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer"
                onClick={() => { if (slug) fetch(`/api/track/${slug}?event=download`, { method: 'POST' }).catch(() => {}) }}
                style={{ background: '#111', border: '1.5px solid #222', borderRadius: 14, padding: '12px 4px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>{s.label}</div>
                <span style={{ color: '#6B7280', fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{s.name}</span>
              </a>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#1F2937' }} />
            <span style={{ color: '#374151', fontSize: 12, fontWeight: 600 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#1F2937' }} />
          </div>

          {/* Download + Caption + Back */}
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button onClick={downloadPng} style={{ flex: 1, background: 'transparent', border: '1.5px solid #2C2C2E', borderRadius: 14, padding: '13px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#fff' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Download</span>
            </button>
            <button onClick={copyCaption} style={{ flex: 1, background: 'transparent', border: '1.5px solid #2C2C2E', borderRadius: 14, padding: '13px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: captionCopied ? '#10B981' : '#fff' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{captionCopied ? 'Copied!' : 'Caption'}</span>
            </button>
            <button onClick={onReset} style={{ background: 'transparent', border: '1.5px solid #2C2C2E', borderRadius: 14, padding: '13px 16px', cursor: 'pointer', color: '#6B7280', fontWeight: 700, fontSize: 16 }}>←</button>
          </div>

          {/* LinkedIn auto-post section */}
          <div style={{ width: '100%', background: '#080F1A', border: '1px solid #0E2340', borderRadius: 18, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Post directly to LinkedIn</div>
                <div style={{ color: '#3B82F6', fontSize: 12, marginTop: 1 }}>{auth.connected ? `Connected as ${auth.name}` : 'One tap — image + caption auto-posted'}</div>
              </div>
            </div>
            {postState === 'error' && <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{errorMsg}</p>}
            <button onClick={auth.connected ? doPost : connectLinkedIn} disabled={auth.loading}
              style={{ width: '100%', background: '#0A66C2', border: 'none', borderRadius: 12, padding: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: auth.loading ? 0.6 : 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{auth.loading ? 'Checking…' : auth.connected ? 'Post to LinkedIn' : 'Connect & Post'}</span>
            </button>
            {auth.connected && <button onClick={disconnect} style={{ background: 'none', border: 'none', color: '#374151', fontSize: 12, cursor: 'pointer', padding: 0, textAlign: 'right' }}>disconnect</button>}
          </div>
        </>
      )}

    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────

function ProgressBar({ step, config }) {
  const steps = ['Style', 'Upload', 'Preview', 'Share']
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px' }}>
      {steps.map((label, i) => {
        const idx = i + 1
        const isActive = step === idx
        const isDone = step > idx
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: isDone ? '#10B981' : isActive ? config.primaryColor : '#1F2937',
                color: isDone || isActive ? '#fff' : '#6B7280',
                transition: 'all 0.2s',
              }}>
                {isDone ? '✓' : idx}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : isDone ? '#10B981' : '#6B7280', display: window.innerWidth < 400 ? 'none' : undefined }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 32, height: 2, background: step > idx ? '#10B981' : '#1F2937', borderRadius: 2, transition: 'all 0.2s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────

const styles = {
  label: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9CA3AF',
  },
  input: {
    background: '#111827',
    border: '1.5px solid #374151',
    borderRadius: 10,
    padding: '9px 12px',
    fontSize: 14,
    color: '#fff',
    outline: 'none',
    width: '100%',
    fontFamily: "'Inter', sans-serif",
  },
  panel: {
    background: '#111827',
    border: '1px solid #1F2937',
    borderRadius: 18,
    padding: 24,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
  },
  btn: (color) => ({
    background: color,
    border: 'none',
    borderRadius: 12,
    padding: '12px 20px',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    fontFamily: "'Inter', sans-serif",
    transition: 'opacity 0.15s',
  }),
}

// ─── Landing Page ─────────────────────────────────────────────────

function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ borderBottom: '1px solid #1F2937', padding: '14px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>EventShare</span>
          <a href="/buy" style={{ background: '#0066FF', color: '#fff', padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Create your page →</a>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', padding: '80px 24px 48px' }}>
        <div style={{ display: 'inline-block', background: '#0066FF22', border: '1px solid #0066FF55', borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: '#60A5FA', letterSpacing: '0.06em', marginBottom: 24, textTransform: 'uppercase' }}>
          For event organizers
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 20px' }}>
          Give every attendee<br />their moment
        </h1>
        <p style={{ fontSize: 18, color: '#9CA3AF', lineHeight: 1.6, margin: '0 auto 36px', maxWidth: 480 }}>
          Branded LinkedIn graphics for your event. Attendees upload their photo — you get the social reach.
        </p>
        <a href="/buy" style={{ display: 'inline-block', background: '#0066FF', color: '#fff', padding: '16px 36px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 32px #0066FF44' }}>
          Create your event page →
        </a>
        <p style={{ color: '#4B5563', fontSize: 13, marginTop: 14 }}>€99 one-time · 5 min setup · No subscription</p>
      </div>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 36 }}>How it works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { n: '1', title: 'You configure', desc: 'Set your event name, colors, logo and caption templates in 5 minutes.' },
            { n: '2', title: 'Attendees upload', desc: 'Share your link. Each attendee uploads their photo and picks a graphic style.' },
            { n: '3', title: 'They post', desc: 'One tap to share a branded graphic to LinkedIn — your event name front and center.' },
          ].map(({ n, title, desc }) => (
            <div key={n} style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 16, padding: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0066FF', color: '#fff', fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{n}</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{title}</div>
              <div style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Buy Page ─────────────────────────────────────────────────────

function BuyPage() {
  const [form, setForm] = useState({ eventName: '', slug: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function slugify(v) {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slug: slugify(form.slug) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Store result and show success inline
      window.location.href = `/success?attendeeUrl=${encodeURIComponent(data.attendeeUrl)}&setupUrl=${encodeURIComponent(data.setupUrl)}&eventName=${encodeURIComponent(data.eventName)}`
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const inp = { width: '100%', boxSizing: 'border-box', background: '#0A0F1E', border: '1.5px solid #374151', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#fff', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480, marginBottom: 24 }}>
        <a href="/" style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none' }}>← Back</a>
      </div>
      <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 480 }}>
        <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>Create your event page</h2>
        <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 28px' }}>Fill in the details below. Your attendee and organizer links will be ready instantly.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Event Name</label>
            <input style={inp} placeholder="Summer Summit 2026" value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Your Event Link <span style={{ color: '#4B5563', fontWeight: 400, textTransform: 'none' }}>— shareevent.vercel.app/e/<strong style={{ color: '#6B7280' }}>your-event-name</strong></span>
            </label>
            <input style={{ ...inp, fontFamily: 'monospace' }} placeholder="summer-summit-2026" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required />
            {form.slug && <div style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>shareevent.vercel.app/e/{slugify(form.slug)}</div>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Your Email</label>
            <input type="email" style={inp} placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          {error && <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ background: '#0066FF', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? 'Creating…' : 'Create event page →'}
          </button>
          <p style={{ color: '#4B5563', fontSize: 12, textAlign: 'center', margin: 0 }}>Secure payment via Stripe · One-time · No subscription</p>
        </form>
      </div>
    </div>
  )
}

// ─── Success Page ─────────────────────────────────────────────────

function SuccessPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Direct flow (no payment): URLs passed as query params
    const attendeeUrl = params.get('attendeeUrl')
    const setupUrl = params.get('setupUrl')
    const eventName = params.get('eventName')
    if (attendeeUrl && setupUrl) {
      setData({ attendeeUrl, setupUrl, eventName: eventName || '' })
      return
    }
    // Stripe flow: look up session
    const sessionId = params.get('session_id')
    if (!sessionId) { setError('No session found.'); return }
    let attempts = 0
    const tryFetch = async () => {
      try {
        const res = await fetch(`/api/stripe/session?id=${sessionId}`)
        const d = await res.json()
        if (!res.ok) {
          if (d.error?.includes('not found yet') && attempts < 6) { attempts++; setTimeout(tryFetch, 2000); return }
          setError(d.error)
          return
        }
        setData(d)
      } catch { setError('Something went wrong loading your event details.') }
    }
    tryFetch()
  }, [])

  async function copy(text, key) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2500)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
        {!data && !error && <p style={{ color: '#9CA3AF', fontSize: 16 }}>Setting up your event page…</p>}
        {error && <p style={{ color: '#F87171', fontSize: 15 }}>{error}</p>}
        {data && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 28, margin: '0 0 8px' }}>Your event page is live!</h2>
            <p style={{ color: '#9CA3AF', fontSize: 15, margin: '0 0 36px' }}>{data.eventName}</p>
            {[
              { key: 'attendee', label: 'Share with attendees', url: data.attendeeUrl, desc: 'Send this to everyone at your event' },
              { key: 'setup', label: 'Your organizer link', url: data.setupUrl, desc: 'Keep this private — it\'s how you edit your config' },
            ].map(({ key, label, url, desc }) => (
              <div key={key} style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#60A5FA', wordBreak: 'break-all', marginBottom: 8 }}>{url}</div>
                <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 12 }}>{desc}</div>
                <button onClick={() => copy(url, key)} style={{ background: '#1F2937', border: 'none', borderRadius: 8, padding: '8px 16px', color: copied === key ? '#10B981' : '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {copied === key ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            ))}
            <a href={data.setupUrl} style={{ display: 'inline-block', marginTop: 8, background: '#0066FF', color: '#fff', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Set up your event now →
            </a>
          </>
        )}
      </div>
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────

const SS_KEY = 'li_share_state'

const _path = window.location.pathname
const _eventMatch = _path.match(/^\/e\/([^/]+)(\/setup)?/)
const EVENT_SLUG = _eventMatch?.[1] || null
const IS_ORGANIZER = !!_eventMatch?.[2]
const _page = !_eventMatch
  ? (_path === '/buy' ? 'buy' : _path === '/success' ? 'success' : _path === '/setup' ? 'old-setup' : 'landing')
  : 'event'

export default function App() {
  if (_page === 'landing') return <LandingPage />
  if (_page === 'buy') return <BuyPage />
  if (_page === 'success') return <SuccessPage />
  if (_page === 'old-setup') return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔗</div>
        <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 24, margin: '0 0 12px' }}>Setup URL has changed</h2>
        <p style={{ color: '#9CA3AF', fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
          Each event now has its own organizer link. Check your email for the link you received after payment — it looks like:
        </p>
        <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 12, padding: '14px 18px', fontFamily: 'monospace', fontSize: 13, color: '#60A5FA', marginBottom: 28, textAlign: 'left', wordBreak: 'break-all' }}>
          shareevent.vercel.app/e/your-slug/setup?key=SECRET
        </div>
        <a href="/buy" style={{ display: 'inline-block', background: '#0066FF', color: '#fff', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
          Create a new event page →
        </a>
      </div>
    </div>
  )
  return <EventApp />
}

function EventApp() {
  const SETUP_KEY = new URLSearchParams(window.location.search).get('key')

  const [config, setConfig] = useState(() => {
    const cached = localStorage.getItem(`event-config:${EVENT_SLUG}`)
    if (cached) try { return { ...DEFAULT_CONFIG, ...JSON.parse(cached) } } catch { /* ignore invalid cache */ }
    return DEFAULT_CONFIG
  })
  const [step, setStep] = useState(1)
  const [attendee, setAttendee] = useState({ photoUrl: null, name: '', titleCompany: '', badge: 'Attending', style: 'frame', photoOffset: { x: 50, y: 50 }, photoFilter: 'none' })
  const [shareCaption, setShareCaption] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [autoPost, setAutoPost] = useState(false)
  const [downloadCount, setDownloadCount] = useState(null)
  const graphicRef = useRef()

  // Fetch config from API on mount — skip overwrite if organizer just saved locally
  useEffect(() => {
    fetch(`/api/config/${EVENT_SLUG}`)
      .then(r => r.json())
      .then(d => {
        if (!d.config) return
        const savedAt = parseInt(sessionStorage.getItem(`cfg-saved:${EVENT_SLUG}`) || '0')
        const recentlySaved = Date.now() - savedAt < 15000
        if (!recentlySaved) {
          setConfig(d.config)
          localStorage.setItem(`event-config:${EVENT_SLUG}`, JSON.stringify(d.config))
        }
      })
      .catch(() => {})
  }, [])

  // Track page view + fetch download count for social proof (attendee only)
  useEffect(() => {
    if (!EVENT_SLUG || IS_ORGANIZER) return
    fetch(`/api/track/${EVENT_SLUG}?event=view`, { method: 'POST' }).catch(() => {})
    fetch(`/api/stats/${EVENT_SLUG}`)
      .then(r => r.json())
      .then(d => { if (typeof d.downloads === 'number') setDownloadCount(d.downloads) })
      .catch(() => {})
  }, [])

  // Return from LinkedIn OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('li_connected') !== '1') return
    window.history.replaceState({}, '', window.location.pathname)
    try {
      const raw = sessionStorage.getItem(SS_KEY)
      sessionStorage.removeItem(SS_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (!saved.caption) return
      if (saved.attendee) setAttendee(saved.attendee)
      setShareCaption(saved.caption)
      setImageDataUrl(saved.imageDataUrl || null)
      setAutoPost(true)
      setStep(4)
    } catch { /* ignore missing/invalid session data */ }
  }, [])

  function handleConfigChange(newCfg) {
    setConfig(newCfg)
    localStorage.setItem(`event-config:${EVENT_SLUG}`, JSON.stringify(newCfg))
    sessionStorage.setItem(`cfg-saved:${EVENT_SLUG}`, Date.now().toString())
    if (EVENT_SLUG && SETUP_KEY) {
      fetch(`/api/config/${EVENT_SLUG}?key=${encodeURIComponent(SETUP_KEY)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newCfg }),
      }).catch(() => {})
    }
  }
  function handleStyle(key, advance) { setAttendee(p => ({ ...p, style: key })); if (advance) setStep(2) }
  function handlePhoto(url) { setAttendee(p => ({ ...p, photoUrl: url })); setStep(3) }
  function handleShare(caption, dataUrl) { setShareCaption(caption); setImageDataUrl(dataUrl); setStep(4) }
  function handleReset() { setAttendee({ photoUrl: null, name: '', titleCompany: '', badge: 'Attending', style: 'frame', photoOffset: { x: 50, y: 50 }, photoFilter: 'none' }); setImageDataUrl(null); setAutoPost(false); setStep(1) }

  return (
    <div style={{ minHeight: '100vh', background: config.bgColor, fontFamily: "'Inter', sans-serif" }}>

      {/* Header — organizer only */}
      {IS_ORGANIZER && (
        <div style={{ borderBottom: '1px solid #1F2937', padding: '12px 16px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {config.logoUrl && <img src={config.logoUrl} alt="logo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />}
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{config.eventName}</span>
              {config.tagline && <span style={{ color: '#6B7280', fontSize: 12 }}>· {config.tagline}</span>}
            </div>
            <span style={{ fontSize: 11, color: config.primaryColor, border: `1px solid ${config.primaryColor}`, borderRadius: 6, padding: '3px 10px', fontWeight: 700, letterSpacing: '0.06em' }}>
              ORGANIZER
            </span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

        {IS_ORGANIZER ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!SETUP_KEY ? (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <p style={{ color: '#F87171', fontSize: 16 }}>Invalid setup link — please use the organizer URL you received after payment.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>Configure Your Event</h2>
                  <a href={`/e/${EVENT_SLUG}`} style={{ fontSize: 13, color: config.primaryColor, fontWeight: 600, textDecoration: 'none', border: `1px solid ${config.primaryColor}`, borderRadius: 8, padding: '6px 14px' }}>
                    Preview attendee view ↗
                  </a>
                </div>
                <StatsPanel slug={EVENT_SLUG} setupKey={SETUP_KEY} primaryColor={config.primaryColor} />
                <OrganizerPanel config={config} onChange={handleConfigChange} onDone={() => { window.location.href = `/e/${EVENT_SLUG}` }} />
              </>
            )}
          </div>

        ) : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 28, paddingTop: 8 }}>
              {config.logoUrl && <img src={config.logoUrl} alt="logo" style={{ height: 64, width: 'auto', objectFit: 'contain', maxWidth: 260 }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1, fontFamily: `'${config.fontFamily || 'Inter'}', sans-serif` }}>
                  {config.eventName}
                </div>
                {config.tagline && <div style={{ fontSize: 14, color: config.primaryColor, fontWeight: 600, marginTop: 4 }}>{config.tagline}</div>}
                {(config.date || config.location) && (
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{[config.date, config.location].filter(Boolean).join(' · ')}</div>
                )}
              </div>
            </div>
            {downloadCount !== null && (
              <div style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
                🔥 <strong style={{ color: '#9CA3AF' }}>{downloadCount.toLocaleString()}</strong> {downloadCount === 1 ? 'person has' : 'people have'} already downloaded this graphic
              </div>
            )}
            <ProgressBar step={step} config={config} />
            {step === 1 && <Step0 config={config} selectedStyle={attendee.style} onStyle={handleStyle} />}
            {step === 2 && <Step1 config={config} onPhoto={handlePhoto} />}
            {step === 3 && <Step2 config={config} attendee={attendee} setAttendee={setAttendee} graphicRef={graphicRef} onNext={handleShare} />}
            {step === 4 && <Step3 config={config} caption={shareCaption} imageDataUrl={imageDataUrl} attendee={attendee} autoPost={autoPost} onReset={handleReset} slug={EVENT_SLUG} />}
          </div>
        )}

      </div>

      <div style={{ borderTop: '1px solid #1F2937', marginTop: 40, padding: '16px 24px', textAlign: 'center' }}>
        <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#4B5563', fontSize: 12, textDecoration: 'none' }}>
          Privacy Policy
        </a>
      </div>
    </div>
  )
}
