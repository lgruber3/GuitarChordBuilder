import { useEffect, useMemo, useState } from 'react'
import './App.css'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const STRING_LABELS = ['E', 'B', 'G', 'D', 'A', 'E']
const STRING_TUNINGS = [4, 11, 7, 2, 9, 4] 
const STRING_TUNINGS_MIDI = [64, 59, 55, 50, 45, 40] // midi-ish refs for bass detection high -> low
const FRETS = Array.from({ length: 13 }, (_, i) => i) 

const INTERVAL_DEFS = [
  { name: 'Unison', short: 'P1', semitones: 0 },
  { name: 'Minor 2nd', short: 'm2', semitones: 1 },
  { name: 'Major 2nd', short: 'M2', semitones: 2 },
  { name: 'Minor 3rd', short: 'm3', semitones: 3 },
  { name: 'Major 3rd', short: 'M3', semitones: 4 },
  { name: 'Perfect 4th', short: 'P4', semitones: 5 },
  { name: 'Tritone', short: 'TT', semitones: 6 }, 
  { name: 'Perfect 5th', short: 'P5', semitones: 7 },
  { name: 'Minor 6th', short: 'm6', semitones: 8 },
  { name: 'Major 6th', short: 'M6', semitones: 9 },
  { name: 'Minor 7th', short: 'm7', semitones: 10 },
  { name: 'Major 7th', short: 'M7', semitones: 11 },
  { name: 'Octave', short: 'P8', semitones: 12 },
  { name: 'Minor 9th', short: 'm9', semitones: 13 },
  { name: 'Major 9th', short: 'M9', semitones: 14 },
  { name: 'Augmented 9th', short: '#9', semitones: 15 },
  { name: 'Perfect 11th', short: 'P11', semitones: 17 },
  { name: 'Augmented 11th', short: '#11', semitones: 18 },
  { name: 'Minor 13th', short: 'm13', semitones: 20 },
  { name: 'Major 13th', short: 'M13', semitones: 21 },
  { name: 'Double Octave', short: 'P15', semitones: 24 },
]

const TRIADS = [
  { name: 'Major', suffix: '', intervals: [0, 4, 7] },
  { name: 'Minor', suffix: 'm', intervals: [0, 3, 7] },
  { name: 'Diminished', suffix: 'dim', intervals: [0, 3, 6] },
  { name: 'Augmented', suffix: 'aug', intervals: [0, 4, 8] },
  { name: 'Suspended 2', suffix: 'sus2', intervals: [0, 2, 7] },
  { name: 'Suspended 4', suffix: 'sus4', intervals: [0, 5, 7] },
  { name: 'Power Chord', suffix: '5', intervals: [0, 7] },
]

const SEVENTHS = [
  { name: 'Dominant 7', suffix: '7', intervals: [0, 4, 7, 10] },
  { name: 'Major 7', suffix: 'maj7', intervals: [0, 4, 7, 11] },
  { name: 'Minor 7', suffix: 'm7', intervals: [0, 3, 7, 10] },
  { name: 'Half-Diminished', suffix: 'm7b5', intervals: [0, 3, 6, 10] },
  { name: 'Fully Diminished', suffix: 'dim7', intervals: [0, 3, 6, 9] },
  { name: 'Minor Major 7', suffix: 'mMaj7', intervals: [0, 3, 7, 11] },
  { name: 'Augmented 7', suffix: 'aug7', intervals: [0, 4, 8, 10] },
]

const EXTENSIONS = [
  { name: 'Major 9', suffix: 'maj9', intervals: [0, 4, 7, 11, 14] },
  { name: 'Minor 9', suffix: 'm9', intervals: [0, 3, 7, 10, 14] },
  { name: 'Dominant 9', suffix: '9', intervals: [0, 4, 7, 10, 14] },
  { name: 'Major 11', suffix: 'maj11', intervals: [0, 4, 7, 11, 14, 17] },
  { name: 'Minor 11', suffix: 'm11', intervals: [0, 3, 7, 10, 14, 17] },
  { name: 'Dominant 11', suffix: '11', intervals: [0, 4, 7, 10, 14, 17] },
  { name: 'Major 13', suffix: 'maj13', intervals: [0, 4, 7, 11, 14, 17, 21] },
  { name: 'Minor 13', suffix: 'm13', intervals: [0, 3, 7, 10, 14, 17, 21] },
  { name: 'Dominant 13', suffix: '13', intervals: [0, 4, 7, 10, 14, 17, 21] },
]

const ALTERED = [
  { name: '7b5', suffix: '7b5', intervals: [0, 4, 6, 10] },
  { name: '7#5', suffix: '7#5', intervals: [0, 4, 8, 10] },
  { name: '7b9', suffix: '7b9', intervals: [0, 4, 7, 10, 13] },
  { name: '7#9', suffix: '7#9', intervals: [0, 4, 7, 10, 15] },
  { name: '9b5', suffix: '9b5', intervals: [0, 4, 6, 10, 14] },
  { name: '9#5', suffix: '9#5', intervals: [0, 4, 8, 10, 14] },
  { name: '13b9', suffix: '13b9', intervals: [0, 4, 7, 10, 13, 17, 21] },
  { name: '13#11', suffix: '13#11', intervals: [0, 4, 7, 10, 14, 18, 21] },
]

const ADDED = [
  { name: 'Add 9', suffix: 'add9', intervals: [0, 4, 7, 14] },
  { name: 'Minor Add 9', suffix: 'madd9', intervals: [0, 3, 7, 14] },
  { name: 'Add 11', suffix: 'add11', intervals: [0, 4, 7, 17] },
  { name: 'Add 13', suffix: 'add13', intervals: [0, 4, 7, 21] },
]

const MODERN = [
  { name: 'Quartal', suffix: 'quartal', intervals: [0, 5, 10] },
  { name: 'Cluster', suffix: 'cluster', intervals: [0, 1, 2] },
]

const CHORD_PATTERNS = [...TRIADS, ...SEVENTHS, ...EXTENSIONS, ...ALTERED, ...ADDED, ...MODERN]

const keyFor = (stringIndex, fret) => `${stringIndex}-${fret}`

const intervalLookup = Object.fromEntries(INTERVAL_DEFS.map((i) => [i.semitones, i]))

function intervalName(semitones) {
  return intervalLookup[semitones]?.name ?? `${semitones} semitones`
}

const wrapInterval = (semitones) => {
  let n = semitones
  while (n < 0) n += 12
  while (n > 24) n -= 12
  return n
}

function detectChord(notes, bassPc) {
  if (!notes.length) return null

  const uniquePcs = [...new Set(notes.map((n) => n.pc))]
  if (uniquePcs.length === 1) {
    return {
      label: NOTE_NAMES[uniquePcs[0]],
      detail: notes.length > 1 ? 'Octaves' : 'Single note',
      rootPc: uniquePcs[0],
      pattern: null,
    }
  }

  let best = null

  uniquePcs.forEach((rootPc) => {
    const currentIntervals = uniquePcs
      .map((pc) => (pc - rootPc + 12) % 12)
      .sort((a, b) => a - b)

    CHORD_PATTERNS.forEach((pattern) => {
      const patternIntervals = new Set(pattern.intervals.map((i) => i % 12))

      const inputHasExtras = currentIntervals.some((i) => !patternIntervals.has(i))
      if (inputHasExtras) return

      const matchedCount = currentIntervals.length
      const totalInPattern = patternIntervals.size
      const isExactMatch = matchedCount === totalInPattern
      const rootIsBass = rootPc === bassPc

      let score = matchedCount * 10
      if (rootIsBass) score += 5
      if (isExactMatch) score += 2
      score -= (totalInPattern - matchedCount)

      if (!best || score > best.score) {
        best = {
          rootPc,
          pattern,
          score,
        }
      }
    })
  })

  if (uniquePcs.length === 2) {
    const isPowerChord = best && best.pattern.suffix === '5'

    if (!isPowerChord) {
      const sortedByPitch = notes.slice().sort((a, b) => a.pitch - b.pitch)
      const root = sortedByPitch[0]
      const top = sortedByPitch[sortedByPitch.length - 1]
      
      const dist = top.pitch - root.pitch
      const name = intervalName(wrapInterval(dist)) || intervalName(dist % 12)

      return {
        label: `${NOTE_NAMES[root.pc]}–${NOTE_NAMES[top.pc]}`,
        detail: `Interval: ${name}`,
        rootPc: root.pc,
        pattern: null,
      }
    }
  }

  if (best) {
    const slash = bassPc != null && bassPc !== best.rootPc ? `/${NOTE_NAMES[bassPc]}` : ''
    return {
      label: `${NOTE_NAMES[best.rootPc]}${best.pattern.suffix}${slash}`,
      detail: `${best.pattern.name} built on ${NOTE_NAMES[best.rootPc]}${slash ? ` over ${NOTE_NAMES[bassPc]}` : ''}`,
      rootPc: best.rootPc,
      pattern: best.pattern,
    }
  }

  return null
}

const normalizeInterval = (interval) => {
  const wrapped = interval % 12
  return wrapped < 0 ? wrapped + 12 : wrapped
}

function generateVoicings(rootPc, intervals) {
  const allowedPcs = new Set(intervals.map((i) => (rootPc + normalizeInterval(i)) % 12))
  const thirdPcs = intervals
    .filter((i) => {
      const n = normalizeInterval(i)
      return n === 3 || n === 4
    })
    .map((i) => (rootPc + normalizeInterval(i)) % 12)

  const optionsPerString = STRING_TUNINGS.map((openPc) => {
    const matches = []
    for (let fret = 0; fret <= 12; fret += 1) {
      const pc = (openPc + fret) % 12
      if (allowedPcs.has(pc)) {
        matches.push(fret)
      }
    }
    return matches.slice(0, 4) // keep closest matches to limit explosion
  })

  const results = new Map()
  const windowSpan = 5

  const dfs = (stringIndex, current, minFret, maxFret) => {
    if (stringIndex === STRING_TUNINGS.length) {
      const soundingFrets = current.filter((f) => f != null)
      if (soundingFrets.length < 3) return

      const pcs = new Set()
      let hasRoot = false
      let hasThird = thirdPcs.length === 0

      current.forEach((fret, idx) => {
        if (fret == null) return
        const pc = (STRING_TUNINGS[idx] + fret) % 12
        pcs.add(pc)
        if (pc === rootPc) hasRoot = true
        if (thirdPcs.includes(pc)) hasThird = true
      })

      if (!hasRoot || !hasThird) return
      if (!pcs.size || pcs.size < Math.min(allowedPcs.size, 3)) return

      const span = maxFret - minFret
      if (span > windowSpan) return

      const key = current.map((f) => (f == null ? 'x' : f)).join('-')
      if (results.has(key)) return

      const score = pcs.size * 5 + soundingFrets.length - span
      results.set(key, {
        frets: [...current],
        span,
        uniquePcs: pcs.size,
        score,
      })
      return
    }

    const options = [null, ...optionsPerString[stringIndex]]
    for (const fret of options) {
      const nextMin = fret == null ? minFret : Math.min(minFret, fret)
      const nextMax = fret == null ? maxFret : Math.max(maxFret, fret)
      if (nextMin !== Infinity && nextMax - nextMin > windowSpan) continue
      dfs(stringIndex + 1, [...current, fret], nextMin, nextMax)
    }
  }

  dfs(0, [], Infinity, -Infinity)

  return Array.from(results.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
}

function App() {
  const [marks, setMarks] = useState(() => new Set())
  const [showNotes, setShowNotes] = useState(false)
  const [voicingOverlayOpen, setVoicingOverlayOpen] = useState(false)
  const [activeVoicingIndex, setActiveVoicingIndex] = useState(0)

  const toggleMark = (stringIndex, fret) => {
    setMarks((prev) => {
      const next = new Set(prev)
      const key = keyFor(stringIndex, fret)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.forEach((existingKey) => {
          const [existingStringIndex] = existingKey.split('-').map(Number)
          if (existingStringIndex === stringIndex) {
            next.delete(existingKey)
          }
        })
        next.add(key)
      }
      return next
    })
  }

  const clearMarks = () => setMarks(new Set())

  const applyVoicing = (voicing) => {
    if (!voicing) return
    setMarks(() => {
      const next = new Set()
      voicing.frets.forEach((fret, stringIndex) => {
        if (fret == null) return
        next.add(keyFor(stringIndex, fret))
      })
      return next
    })
  }

  const pitchData = useMemo(() => {
    const notes = []
    marks.forEach((key) => {
      const [stringIndex, fret] = key.split('-').map(Number)
      const pc = (STRING_TUNINGS[stringIndex] + fret) % 12
      const pitch = STRING_TUNINGS_MIDI[stringIndex] + fret
      notes.push({ pc, pitch })
    })
    return notes
  }, [marks])

  const bassPc = useMemo(() => {
    if (!pitchData.length) return null
    const minPitch = Math.min(...pitchData.map((n) => n.pitch))
    return ((minPitch % 12) + 12) % 12
  }, [pitchData])

  const markedNotes = useMemo(() => {
    const ordered = [...new Set(pitchData.map((n) => n.pc))].sort((a, b) => a - b)
    return ordered.map((pc) => NOTE_NAMES[pc])
  }, [pitchData])

  const chord = useMemo(() => detectChord(pitchData, bassPc), [pitchData, bassPc])

  const voicings = useMemo(() => {
    if (!chord || chord.rootPc == null || !chord.pattern) return []
    return generateVoicings(chord.rootPc, chord.pattern.intervals)
  }, [chord])

  useEffect(() => {
    setActiveVoicingIndex(0)
    if (!chord) {
      setVoicingOverlayOpen(false)
    }
  }, [chord?.label])

  const activeVoicing = voicings[activeVoicingIndex] ?? null
  const hasVoicings = chord && voicings.length > 0

  return (
    <div className="page">
      <div className="bg-orbs" aria-hidden>
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="app">
        <header className="hero">
          <div className="hero-text">
            <div className="chip">Guitar chord builder</div>
            <h1>
              Paint the fretboard
              <span className="accent"> in motion</span>
            </h1>
            <p className="lede">
              Tap frets to sculpt voicings. Everything animates—interval colors, subtle glow,
              and springy buttons—so exploring harmony feels playful.
            </p>
            <div className="hero-actions">
              <button className="primary" onClick={clearMarks}>
                Reset canvas
              </button>
              <div className="ghost">Try toggling notes to reveal names</div>
            </div>
          </div>

          <div className="hero-card">
            <div className="card-title">
              <span className="dot-live" /> Live chord readout
            </div>
            <p className="hero-chord">{chord ? chord.label : 'Not sure yet'}</p>
            <p className="hero-sub">{chord ? chord.detail : 'Add more notes to help us out.'}</p>
            <div className="hero-badges">
              <span className="pill">Marked notes</span>
              <span className="pill pill-soft">
                {markedNotes.length ? markedNotes.join(' • ') : 'None yet'}
              </span>
            </div>
            <button
              className="secondary ghost-button"
              onClick={() => setVoicingOverlayOpen(true)}
              disabled={!hasVoicings}
            >
              {hasVoicings ? 'Show alternate voicings' : 'Add a full chord to see shapes'}
            </button>
          </div>
        </header>

        <section className="card fretboard-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Interactive fretboard</p>
              <h2>Tap a position to drop a note</h2>
              <p className="subtext">Open string counts as fret 0 • One note per string</p>
            </div>
            <div className="controls">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showNotes}
                  onChange={(e) => setShowNotes(e.target.checked)}
                />
                <span className="slider" aria-hidden />
                <span className="toggle-label">Show note names</span>
              </label>
              <button className="secondary" onClick={clearMarks} aria-label="Clear markings">
                Clear all
              </button>
            </div>
          </div>

          <div className="fretboard">
            <div className="fret-numbers">
              <div className="string-label spacer">String</div>
              {FRETS.map((fret) => (
                <div key={fret} className={`fret-number ${fret === 0 ? 'nut' : ''}`}>
                  {fret}
                </div>
              ))}
            </div>

            {STRING_TUNINGS.map((openPc, stringIndex) => (
              <div key={stringIndex} className="string-row">
                <div className="string-label">{STRING_LABELS[stringIndex]}</div>
                {FRETS.map((fret) => {
                  const key = keyFor(stringIndex, fret)
                  const selected = marks.has(key)
                  const noteName = NOTE_NAMES[(openPc + fret) % 12]
                  const displayNote = showNotes ? noteName : selected ? '•' : ''
                  const dotMode = !showNotes && selected

                  return (
                    <button
                      key={key}
                      className={`fret ${selected ? 'selected' : ''} ${fret === 0 ? 'nut' : ''}`}
                      onClick={() => toggleMark(stringIndex, fret)}
                      aria-pressed={selected}
                      aria-label={`${STRING_LABELS[stringIndex]} string fret ${fret} (${noteName})`}
                    >
                      <span className={`note ${dotMode ? 'dot' : ''}`}>{displayNote}</span>
                      <span className="pulse" aria-hidden />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="summary-grid">
          <div className="card summary-card chord-card">
            <div className="card-title">
              <span className="pill">Detected chord</span>
            </div>
            <p className="chord-name">{chord ? chord.label : 'Not sure yet'}</p>
            <p className="chord-detail">{chord ? chord.detail : 'Add more notes to help us out.'}</p>
          </div>

          <div className="card summary-card notes-card">
            <div className="card-title">
              <span className="pill pill-soft">Marked notes</span>
            </div>
            <p className="notes">{markedNotes.length ? markedNotes.join(' • ') : 'None yet'}</p>
            <div className="note-hint">Tip: clicking the same string moves the note.</div>
          </div>
        </section>

        {voicingOverlayOpen && hasVoicings && (
          <div className="voicing-overlay" role="dialog" aria-modal="true">
            <div className="overlay-backdrop" onClick={() => setVoicingOverlayOpen(false)} />
            <div className="overlay-panel">
              <div className="overlay-header">
                <div>
                  <p className="eyebrow">Alternate shapes</p>
                  <h3>{chord?.label}</h3>
                  <p className="subtext">
                    Tap a shape to apply it to the main fretboard. Each card shows a compact
                    5-fret window.
                  </p>
                </div>
                <button className="secondary" onClick={() => setVoicingOverlayOpen(false)}>
                  Close
                </button>
              </div>

              <div className="voicing-grid">
                {voicings.map((voicing, idx) => {
                  const soundingFrets = voicing.frets.filter((f) => f != null)
                  const minFret = soundingFrets.length ? Math.min(...soundingFrets) : 0
                  const windowStart = Math.max(0, minFret - 1)
                  const windowFrets = Array.from({ length: 5 }, (_, i) => windowStart + i)

                  return (
                    <button
                      key={idx}
                      className={`voicing-card ${idx === activeVoicingIndex ? 'active' : ''}`}
                      onClick={() => {
                        setActiveVoicingIndex(idx)
                        applyVoicing(voicing)
                      }}
                    >
                      <div className="voicing-card-head">
                        <span className="pill pill-soft">Shape {idx + 1}</span>
                        <span className="pill pill-soft">{voicing.span} fret span</span>
                      </div>
                      <div className="mini-grid">
                        <div className="mini-fret-numbers">
                          <span className="mini-string-label spacer"> </span>
                          {windowFrets.map((fret) => (
                            <span key={fret} className="mini-fret-number">
                              {fret}
                            </span>
                          ))}
                        </div>
                        {STRING_TUNINGS.map((openPc, stringIndex) => (
                          <div key={stringIndex} className="mini-row">
                            <span className="mini-string-label">{STRING_LABELS[stringIndex]}</span>
                            {windowFrets.map((fret) => {
                              const isActive = voicing.frets[stringIndex] === fret
                              const noteName = NOTE_NAMES[(openPc + fret) % 12]
                              return (
                                <span
                                  key={fret}
                                  className={`mini-fret ${isActive ? 'active' : ''}`}
                                  aria-label={isActive ? `${noteName} at fret ${fret}` : undefined}
                                >
                                  {isActive && <span className="mini-dot">{noteName}</span>}
                                </span>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                      <div className="voicing-meta">
                        <span className="pill pill-soft">{voicing.uniquePcs} chord tones</span>
                        <span className="pill pill-soft">
                          {voicing.frets.filter((f) => f != null).length} strings
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
