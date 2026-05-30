import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import './index.css'

const STORAGE_KEY = 'event-share-config'

const DEFAULT_CONFIG = {
  eventName: 'ARCTIC15',
  tagline: '15th Anniversary Edition',
  date: 'June 11–12, 2026',
  location: 'Helsinki, Finland',
  hashtags: '#ARCTIC15 #Helsinki #Startup',
  mention: '@ARCTIC15',
  logoUrl: null,
  captionAttending:
    "Excited to be joining {eventName} in {location}. If you're building something ambitious, this is where I'll be. {mention} {hashtags}",
  captionSpeaking:
    "Excited to be speaking at {eventName} in {location}. Come find me there — let's talk. {mention} {hashtags}",
  captionPartner:
    "Proud to be a partner at {eventName} in {location}. See you there! {mention} {hashtags}",
  primaryColor: '#0066FF',
  bgColor: '#0A0F1E',
  fontFamily: 'Inter',
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_CONFIG
}

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
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
        {f('Event Name', 'eventName', 'ARCTIC15')}
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
      <div style={styles.grid2}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={styles.label}>Primary Color</label>
          <div style={{ ...styles.input, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={config.primaryColor}
              style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              onChange={(e) => onChange({ ...config, primaryColor: e.target.value })}
            />
            <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#D1D5DB' }}>{config.primaryColor}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={styles.label}>Background Color</label>
          <div style={{ ...styles.input, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={config.bgColor}
              style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              onChange={(e) => onChange({ ...config, bgColor: e.target.value })}
            />
            <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#D1D5DB' }}>{config.bgColor}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onDone}
        style={{ ...styles.btn(config.primaryColor), marginTop: 4 }}
      >
        Done — Launch Attendee View →
      </button>
    </div>
  )
}

// ─── Event Graphic ────────────────────────────────────────────────

function EventGraphic({ config, attendee, graphicRef }) {
  const primary = config.primaryColor
  const bg = config.bgColor

  const badgeLabel =
    attendee.badge === 'Speaking' ? `Speaking at`
    : attendee.badge === 'Partner' ? `Partner at`
    : `Attending`

  return (
    <div
      ref={graphicRef}
      style={{
        position: 'relative', width: 600, height: 600,
        overflow: 'hidden', background: bg,
        fontFamily: `'${config.fontFamily || 'Inter'}', sans-serif`, userSelect: 'none', flexShrink: 0,
      }}
    >
      {/* Full-bleed photo background */}
      <div style={{ position: 'absolute', inset: 0, background: '#111' }}>
        {attendee.photoUrl && (
          <img src={attendee.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
      </div>

      {/* Dark gradient overlay — top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)' }} />

      {/* Dark gradient overlay — bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)' }} />

      {/* Thick accent border frame */}
      <div style={{ position: 'absolute', inset: 0, border: `10px solid ${primary}`, pointerEvents: 'none', zIndex: 4 }} />

      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 10, left: 10, width: 28, height: 28, background: primary, zIndex: 5 }} />
      <div style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, background: primary, zIndex: 5 }} />
      <div style={{ position: 'absolute', bottom: 10, left: 10, width: 28, height: 28, background: primary, zIndex: 5 }} />
      <div style={{ position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, background: primary, zIndex: 5 }} />

      {/* Top row: date left, logo right */}
      <div style={{ position: 'absolute', top: 26, left: 50, zIndex: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
          {config.date}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 20, right: 50, zIndex: 6 }}>
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="logo" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        ) : (
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: primary }}>
            {config.eventName}
          </div>
        )}
      </div>

      {/* Bottom text block */}
      <div style={{ position: 'absolute', bottom: 30, left: 50, right: 50, zIndex: 6 }}>
        {/* Badge label */}
        <div style={{
          display: 'inline-block', background: primary, color: '#fff',
          fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 4,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
        }}>
          {attendee.badge}
        </div>

        {/* Main headline */}
        <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-1px' }}>
          {badgeLabel}<br />{config.eventName}
        </div>

        {/* Location line */}
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, fontWeight: 500, letterSpacing: '0.03em' }}>
          {config.location}
        </div>
      </div>

      {/* No photo placeholder */}
      {!attendee.photoUrl && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', border: `3px dashed ${primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 40, color: '#4a5568' }}>?</span>
          </div>
        </div>
      )}
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

      {/* Hidden full-size graphic for capture — NOT inside scale() */}
      <div style={{ position: 'absolute', left: -700, top: 0, width: 600, height: 600, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
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
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={styles.label}>Badge</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Attending', 'Speaking', 'Partner'].map((b) => (
                <button
                  key={b}
                  onClick={() => update('badge', b)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 600,
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
            <label style={styles.label}>LinkedIn Caption</label>
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
                } catch {}
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

function Step3({ config, caption, imageDataUrl, attendee, autoPost, onReset }) {
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
    } catch (e) {
      // If imageDataUrl is too large, store without it and re-export on return
      try {
        sessionStorage.setItem(SS_KEY, JSON.stringify({ caption, attendee }))
      } catch {}
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
    const a = document.createElement('a')
    a.href = imageDataUrl
    a.download = 'event-share.png'
    a.click()
  }

  const panel = { background: '#1C1C1E', border: '1px solid #2C2C2E', borderRadius: 16, padding: '20px 20px', width: '100%', maxWidth: 420 }
  const stepNum = (n) => (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3A3A3C', color: '#9CA3AF', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '0 16px 32px', width: '100%', maxWidth: 900, margin: '0 auto' }}>

      {postState === 'done' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', paddingTop: 32 }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Posted to LinkedIn!</h2>
          <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>Your graphic and caption are live on your profile.</p>
          {auth.name && <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>Posted as {auth.name} · <button onClick={disconnect} style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>disconnect</button></p>}
          {imageDataUrl && <img src={imageDataUrl} alt="" style={{ width: 220, height: 220, borderRadius: 12, objectFit: 'cover', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }} />}
          <button onClick={downloadPng} style={{ ...panel, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: '1px solid #2C2C2E' }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Download PNG</span>
          </button>
        </div>

      ) : postState === 'posting' || (autoPost && auth.loading) ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', paddingTop: 48 }}>
          <div style={{ fontSize: 40 }}>⏳</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Posting to LinkedIn…</h2>
        </div>

      ) : (
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>

          {/* Image preview */}
          {imageDataUrl && (
            <img src={imageDataUrl} alt="Your graphic" style={{ width: 260, height: 260, borderRadius: 14, objectFit: 'cover', boxShadow: '0 16px 48px rgba(0,0,0,0.7)', flexShrink: 0 }} />
          )}

          {/* Download & Share panel */}
          <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Download & Share</span>
              </div>
              <button onClick={onReset} style={{ background: 'none', border: '1px solid #3A3A3C', borderRadius: 8, color: '#9CA3AF', fontSize: 13, fontWeight: 600, padding: '5px 14px', cursor: 'pointer' }}>Back</button>
            </div>

            {/* Step 1: Download */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20, borderBottom: '1px solid #2C2C2E' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {stepNum(1)}
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Download your image</span>
              </div>
              <button onClick={downloadPng} style={{ width: '100%', background: '#F5F5F0', border: 'none', borderRadius: 12, padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="18" height="18" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span style={{ color: '#111', fontWeight: 700, fontSize: 15 }}>Download PNG</span>
              </button>
            </div>

            {/* Step 2: Caption */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 20, paddingBottom: 20, borderBottom: '1px solid #2C2C2E' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {stepNum(2)}
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Copy a caption</span>
              </div>
              <div style={{ background: '#2C2C2E', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, maxHeight: 90, overflowY: 'auto', wordBreak: 'break-word' }}>
                {caption}
              </div>
              <button onClick={copyCaption} style={{ width: '100%', background: '#2C2C2E', border: 'none', borderRadius: 12, padding: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" fill="none" stroke={captionCopied ? '#10B981' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span style={{ color: captionCopied ? '#10B981' : '#fff', fontWeight: 700, fontSize: 14 }}>{captionCopied ? 'Copied!' : 'Copy Caption'}</span>
              </button>
            </div>

            {/* Step 3: Post on LinkedIn */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {stepNum(3)}
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Post on LinkedIn</div>
                  <div style={{ color: '#6B7280', fontSize: 12 }}>
                    {auth.connected ? `Connected as ${auth.name}` : 'Post with image & caption directly'}
                  </div>
                </div>
              </div>
              {postState === 'error' && <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{errorMsg}</p>}
              <button
                onClick={auth.connected ? doPost : connectLinkedIn}
                disabled={auth.loading}
                style={{ width: '100%', background: '#0A66C2', border: 'none', borderRadius: 12, padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: auth.loading ? 0.6 : 1 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                  {auth.loading ? 'Checking…' : auth.connected ? 'Post to LinkedIn' : 'Connect & Post'}
                </span>
              </button>
              {auth.connected && <button onClick={disconnect} style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: 12, cursor: 'pointer', padding: 0, textAlign: 'right' }}>disconnect LinkedIn</button>}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────

function ProgressBar({ step, config }) {
  const steps = ['Upload', 'Preview', 'Share']
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

// ─── App Root ─────────────────────────────────────────────────────

const SS_KEY = 'li_share_state'

// Organizer mode: visit shareevent.vercel.app/setup
// Attendee mode:  visit shareevent.vercel.app
const IS_ORGANIZER = window.location.pathname.startsWith('/setup')

export default function App() {
  const [config, setConfig] = useState(loadConfig)
  const [step, setStep] = useState(1)
  const [attendee, setAttendee] = useState({ photoUrl: null, name: '', titleCompany: '', badge: 'Attending' })
  const [shareCaption, setShareCaption] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [autoPost, setAutoPost] = useState(false)
  const graphicRef = useRef()

  // On mount: returning from LinkedIn OAuth → restore state and auto-post
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
      setStep(3)
    } catch {}
  }, [])

  function handleConfigChange(newCfg) { setConfig(newCfg); saveConfig(newCfg) }
  function handlePhoto(url) { setAttendee(p => ({ ...p, photoUrl: url })); setStep(2) }
  function handleShare(caption, dataUrl) { setShareCaption(caption); setImageDataUrl(dataUrl); setStep(3) }
  function handleReset() { setAttendee({ photoUrl: null, name: '', titleCompany: '', badge: 'Attending' }); setImageDataUrl(null); setAutoPost(false); setStep(1) }

  return (
    <div style={{ minHeight: '100vh', background: config.bgColor, fontFamily: "'Inter', sans-serif" }}>

      {/* Header — organizer only */}
      {IS_ORGANIZER && (
        <div style={{ borderBottom: '1px solid #1F2937', padding: '12px 16px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {config.logoUrl && (
                <img src={config.logoUrl} alt="logo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
              )}
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
          /* ── Organizer setup page ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>Configure Your Event</h2>
              <a
                href="/"
                target="_blank"
                rel="noopener"
                style={{ fontSize: 13, color: config.primaryColor, fontWeight: 600, textDecoration: 'none', border: `1px solid ${config.primaryColor}`, borderRadius: 8, padding: '6px 14px' }}
              >
                Preview attendee view ↗
              </a>
            </div>
            <OrganizerPanel config={config} onChange={handleConfigChange} onDone={() => {}} />
          </div>

        ) : (
          /* ── Attendee flow ── */
          <div>
            {/* Event hero branding */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 28, paddingTop: 8 }}>
              {config.logoUrl && (
                <img src={config.logoUrl} alt="logo" style={{ height: 64, width: 'auto', objectFit: 'contain', maxWidth: 260 }} />
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1, fontFamily: `'${config.fontFamily || 'Inter'}', sans-serif` }}>
                  {config.eventName}
                </div>
                {config.tagline && (
                  <div style={{ fontSize: 14, color: config.primaryColor, fontWeight: 600, marginTop: 4, letterSpacing: '0.03em' }}>
                    {config.tagline}
                  </div>
                )}
                {(config.date || config.location) && (
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                    {[config.date, config.location].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
            <ProgressBar step={step} config={config} />
            {step === 1 && <Step1 config={config} onPhoto={handlePhoto} />}
            {step === 2 && (
              <Step2
                config={config}
                attendee={attendee}
                setAttendee={setAttendee}
                graphicRef={graphicRef}
                onNext={handleShare}
              />
            )}
            {step === 3 && (
              <Step3
                config={config}
                caption={shareCaption}
                imageDataUrl={imageDataUrl}
                attendee={attendee}
                autoPost={autoPost}
                onReset={handleReset}
              />
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1F2937', marginTop: 40, padding: '16px 24px', textAlign: 'center' }}>
        <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#4B5563', fontSize: 12, textDecoration: 'none', fontFamily: "'Inter', sans-serif" }}>
          Privacy Policy
        </a>
      </div>
    </div>
  )
}
