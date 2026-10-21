import { formatClock, getTimeLabel } from '../../lib/palette'
import type { SceneSettings } from '../../types'
import { TOWER_WINDOW_COUNT } from '../scene/towerData'

interface HudProps {
  settings: SceneSettings
  ready: boolean
}

function ReadoutRow({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="readout__row">
      <span className="readout__label">{label}</span>
      <span className={`readout__value ${accent ? 'readout__value--accent' : ''}`}>{value}</span>
    </div>
  )
}

function StarkMark() {
  return (
    <svg viewBox="0 0 80 80" role="presentation" aria-hidden="true">
      <path d="M40 5 72 23v34L40 75 8 57V23Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M40 15 62 27.5v25L40 65 18 52.5v-25Z" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
      <path d="M29 27h22v6H36v6h12v6H36v12h-7Z" fill="currentColor" />
      <circle cx="58" cy="30" r="3.2" fill="#ff2bd6" />
    </svg>
  )
}

export function Hud({ settings, ready }: HudProps) {
  const clock = formatClock(settings.timeOfDay)
  const phase = getTimeLabel(settings.timeOfDay)
  const fog = `${(settings.fogDensity * 1000).toFixed(1)}ρ`
  const rainLabel = settings.rain ? `${Math.round(settings.rainIntensity * 100)}%` : 'CLEAR'
  const orbitLabel = settings.autoRotate ? `${settings.autoRotateSpeed.toFixed(2)}×` : 'MANUAL'
  const wetness = Math.round(settings.wetness * 100)
  const bloom = `${settings.bloomIntensity.toFixed(1)} / ${settings.bloomThreshold.toFixed(2)}`

  return (
    <div className={`hud ${ready ? 'is-ready' : ''}`} aria-label="Stark Tower live interface">
      <div className="hud__wash" />
      <div className="hud__scanlines" />
      <div className="hud__frame" aria-hidden="true">
        <span className="hud__corner hud__corner--tl" />
        <span className="hud__corner hud__corner--tr" />
        <span className="hud__corner hud__corner--bl" />
        <span className="hud__corner hud__corner--br" />
      </div>

      <header className="brand">
        <div className="brand__mark">
          <StarkMark />
        </div>
        <div className="brand__content">
          <div className="brand__eyebrow">
            <span>STARK INDUSTRIES</span>
            <span className="brand__slash">/</span>
            <span>STRUCTURAL DIVISION</span>
            <span className="brand__id">NYC—07</span>
          </div>
          <h1 className="brand__title">
            <span className="brand__title-fill">STARK</span>
            <span className="brand__title-outline">TOWER</span>
          </h1>
          <div className="brand__meta">
            <span className="brand__line" />
            <span>ARC REACTOR INTEGRATED</span>
            <span className="brand__dot">·</span>
            <span>赛博朋克城市地标</span>
          </div>
        </div>
      </header>

      <div className="live-badge">
        <span className="live-badge__dot" />
        <span>LIVE SIMULATION</span>
        <span className="live-badge__divider" />
        <span>{phase}</span>
      </div>

      <div className="side-label" aria-hidden="true">
        <span>TOWER 01</span>
        <i />
        <span>MCMXCIV</span>
      </div>

      <aside className="panel panel--environment">
        <div className="panel__header">
          <span>ENVIRONMENT / E—01</span>
          <span className="panel__signal">
            <i />
            ONLINE
          </span>
        </div>
        <div className="clock-lockup">
          <span className="clock-lockup__value">{clock}</span>
          <div className="clock-lockup__meta">
            <span>{phase}</span>
            <small>LOCAL TIME</small>
          </div>
        </div>
        <div className="readout__rows">
          <ReadoutRow label="FOG DENSITY" value={fog} />
          <ReadoutRow label="PRECIPITATION" value={rainLabel} accent={settings.rain} />
          <ReadoutRow label="GROUND WETNESS" value={`${wetness}%`} />
          <ReadoutRow label="BLOOM" value={bloom} accent={settings.bloomIntensity > 0.1} />
          <ReadoutRow label="AUTO ORBIT" value={orbitLabel} />
        </div>
      </aside>

      <aside className="panel panel--structure">
        <div className="panel__header">
          <span>FACADE / S—01</span>
          <span className="panel__index">ARC.09</span>
        </div>
        <div className="facade-stat">
          <strong>{TOWER_WINDOW_COUNT.toLocaleString('en-US')}</strong>
          <span>INSTANCED APERTURES</span>
        </div>
        <div className="meter">
          <span style={{ width: `${Math.round(34 + settings.masterLight * 28)}%` }} />
          <span style={{ width: `${Math.round(42 + settings.bloomIntensity * 12)}%` }} />
          <span style={{ width: `${Math.round(20 + settings.wetness * 24)}%` }} />
        </div>
        <div className="structure-grid">
          <div>
            <span>DRAW CALLS</span>
            <strong>OPTIMIZED</strong>
          </div>
          <div>
            <span>WINDOW BATCH</span>
            <strong>INSTANCED</strong>
          </div>
          <div>
            <span>REFLECTION</span>
            <strong>{settings.wetness > 0.65 ? 'MIRROR' : 'DIFFUSE'}</strong>
          </div>
          <div>
            <span>RAIN LAYER</span>
            <strong>{settings.rain ? 'ACTIVE' : 'STANDBY'}</strong>
          </div>
        </div>
        <div className="node-row" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <span
              key={index}
              className={index % 5 === 0 ? 'is-hot' : index % 3 === 0 ? 'is-warm' : ''}
            />
          ))}
        </div>
      </aside>

      <div className="reticle" aria-hidden="true">
        <span />
        <span />
        <i />
      </div>

      <footer className="hud-footer">
        <div className="control-hints">
          <span className="control-hint">
            <b>DRAG</b> ORBIT
          </span>
          <span className="control-hint">
            <b>SCROLL</b> ZOOM
          </span>
          <span className="control-hint">
            <b>LEVA</b> SYSTEMS
          </span>
        </div>
        <div className="coordinates">
          <span>40.7484° N</span>
          <span>73.9857° W</span>
          <i />
          <span>NIGHT CITY // SECTOR 07</span>
        </div>
      </footer>
    </div>
  )
}
