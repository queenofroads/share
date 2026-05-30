import { useState, useEffect, useRef } from 'react'
import domtoimage from 'dom-to-image-more'
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
  const badgeColor =
    attendee.badge === 'Speaking' ? '#F59E0B'
    : attendee.badge === 'Partner' ? '#10B981'
    : config.primaryColor

  return (
    <div
      ref={graphicRef}
      style={{
        position: 'relative',
        width: 600,
        height: 600,
        overflow: 'hidden',
        background: config.bgColor,
        fontFamily: "'Inter', sans-serif",
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: config.primaryColor }} />

      {/* Logo */}
      {config.logoUrl && (
        <div style={{ position: 'absolute', top: 22, left: 24, background: 'transparent' }}>
          <img src={config.logoUrl} alt="logo" style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
        </div>
      )}
      {!config.logoUrl && (
        <div style={{ position: 'absolute', top: 24, left: 24, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: config.primaryColor, background: 'transparent' }}>
          {config.eventName}
        </div>
      )}

      {/* Photo circle */}
      <div style={{ position: 'absolute', top: 68, left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, background: 'transparent' }}>
        <div style={{ width: 180, height: 180, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${config.primaryColor}`, background: '#1a2035' }}>
          {attendee.photoUrl ? (
            <img src={attendee.photoUrl} alt="attendee" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: 48, background: '#1a2035' }}>?</div>
          )}
        </div>
        {/* Badge */}
        <div style={{ position: 'absolute', top: 10, right: -10, background: badgeColor, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          {attendee.badge}
        </div>
      </div>

      {/* Event name */}
      <div style={{ position: 'absolute', top: 300, left: 20, right: 20, textAlign: 'center', background: 'transparent' }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1.5px', background: 'transparent' }}>{config.eventName}</div>
        {config.tagline && (
          <div style={{ fontSize: 11, color: '#718096', marginTop: 5, fontWeight: 500, letterSpacing: '0.03em', background: 'transparent' }}>{config.tagline}</div>
        )}
      </div>

      {/* Date + location */}
      <div style={{ position: 'absolute', top: 378, left: 20, right: 20, textAlign: 'center', background: 'transparent' }}>
        <div style={{ fontSize: 14, color: '#CBD5E0', fontWeight: 500, background: 'transparent' }}>{config.date} · {config.location}</div>
      </div>

      {/* Bottom hashtag bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 58, background: config.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.92)', textAlign: 'center', letterSpacing: '0.04em' }}>{config.hashtags}</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 16px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {/* Responsive row */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start', justifyContent: 'center' }}>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={styles.label}>Preview</span>
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', width: PREVIEW_W, height: PREVIEW_W }}>
            <div style={{ transform: `scale(${PREVIEW_W / 600})`, transformOrigin: 'top left', width: 600, height: 600 }}>
              <EventGraphic config={config} attendee={attendee} graphicRef={graphicRef} />
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
                  dataUrl = await domtoimage.toPng(graphicRef.current, { width: 600, height: 600 })
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

function Step3({ config, caption, imageDataUrl, onReset }) {
  const [auth, setAuth] = useState({ loading: true, connected: false, name: null })
  const [postState, setPostState] = useState('idle') // idle | posting | done | error
  const [errorMsg, setErrorMsg] = useState(null)
  const [captionCopied, setCaptionCopied] = useState(false)

  // Check LinkedIn connection status on mount
  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(d => setAuth({ loading: false, connected: d.connected, name: d.name || null }))
      .catch(() => setAuth({ loading: false, connected: false, name: null }))

    // Listen for popup OAuth success
    function onMsg(e) {
      if (e.data?.type === 'li_connected') {
        setAuth({ loading: false, connected: true, name: e.data.name || null })
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  function connectLinkedIn() {
    window.open('/api/auth/linkedin', 'li_oauth', 'width=600,height=700,scrollbars=yes')
  }

  async function disconnect() {
    await fetch('/api/auth/disconnect')
    setAuth({ loading: false, connected: false, name: null })
    setPostState('idle')
  }

  async function postToLinkedIn() {
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
      setErrorMsg(e.message || 'Something went wrong')
      setPostState('error')
    }
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(caption)
    setCaptionCopied(true)
    setTimeout(() => setCaptionCopied(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: 20, textAlign: 'center', padding: '0 16px' }}>

      {/* Thumbnail */}
      {imageDataUrl && (
        <img
          src={imageDataUrl}
          alt="Your event graphic"
          style={{ width: 180, height: 180, borderRadius: 14, objectFit: 'cover', border: `2px solid ${config.primaryColor}`, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
        />
      )}

      {postState === 'done' ? (
        <>
          <div style={{ fontSize: 52 }}>🎉</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Posted to LinkedIn!</h2>
          <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>Your graphic is live on your profile.</p>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Ready to share!</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
            {auth.loading ? (
              <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Checking LinkedIn connection…</p>
            ) : !auth.connected ? (
              <>
                <button onClick={connectLinkedIn} style={styles.btn('#0A66C2')}>
                  Connect LinkedIn to Post
                </button>
                <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
                  A popup will open — log in and allow access. Your post will include the image automatically.
                </p>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ color: '#9CA3AF', fontSize: 13 }}>
                    Connected as <strong style={{ color: '#fff' }}>{auth.name}</strong>
                  </span>
                  <button onClick={disconnect} style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                    (disconnect)
                  </button>
                </div>

                <button
                  onClick={postToLinkedIn}
                  disabled={postState === 'posting'}
                  style={{ ...styles.btn('#0A66C2'), opacity: postState === 'posting' ? 0.7 : 1 }}
                >
                  {postState === 'posting' ? 'Posting…' : '📤 Post to LinkedIn'}
                </button>

                {postState === 'error' && (
                  <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{errorMsg}</p>
                )}
              </>
            )}

            <button onClick={copyCaption} style={styles.btn(captionCopied ? '#10B981' : '#1F2937')}>
              {captionCopied ? 'Caption Copied ✓' : 'Copy Caption'}
            </button>
          </div>
        </>
      )}

      <button onClick={onReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 14, marginTop: 4 }}>
        ← Start over
      </button>
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

export default function App() {
  const [config, setConfig] = useState(loadConfig)
  const [showOrganizer, setShowOrganizer] = useState(() => {
    try { return !localStorage.getItem(STORAGE_KEY) } catch { return true }
  })
  const [step, setStep] = useState(1)
  const [attendee, setAttendee] = useState({ photoUrl: null, name: '', titleCompany: '', badge: 'Attending' })
  const [shareCaption, setShareCaption] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const graphicRef = useRef()

  function handleConfigChange(newCfg) {
    setConfig(newCfg)
    saveConfig(newCfg)
  }

  function handlePhoto(url) {
    setAttendee((prev) => ({ ...prev, photoUrl: url }))
    setStep(2)
  }

  function handleShare(caption, dataUrl) {
    setShareCaption(caption)
    setImageDataUrl(dataUrl)
    setStep(3)
  }

  function handleReset() {
    setAttendee({ photoUrl: null, name: '', titleCompany: '', badge: 'Attending' })
    setImageDataUrl(null)
    setStep(1)
  }

  return (
    <div style={{ minHeight: '100vh', background: config.bgColor, fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1F2937', padding: '12px 16px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {config.logoUrl && (
              <img src={config.logoUrl} alt="logo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
            )}
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '0.01em' }}>{config.eventName}</span>
            {config.tagline && (
              <span style={{ color: '#6B7280', fontSize: 12, display: window.innerWidth < 500 ? 'none' : undefined }}>· {config.tagline}</span>
            )}
          </div>
          <button
            onClick={() => setShowOrganizer((v) => !v)}
            style={{ fontSize: 12, color: '#9CA3AF', border: '1px solid #374151', borderRadius: 8, padding: '6px 12px', background: 'transparent', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
          >
            {showOrganizer ? 'Hide Setup ↑' : '⚙ Organizer Setup'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Organizer Panel */}
        {showOrganizer && (
          <div>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 0 14px' }}>Configure Your Event</h2>
            <OrganizerPanel config={config} onChange={handleConfigChange} onDone={() => setShowOrganizer(false)} />
          </div>
        )}

        {/* Attendee Flow */}
        {!showOrganizer && (
          <div>
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
