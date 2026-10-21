import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { LevaPanel } from 'leva'
import { Scene } from './components/scene/Scene'
import { Hud } from './components/ui/Hud'
import { levaTheme } from './components/ui/levaTheme'
import { SceneErrorBoundary } from './components/ui/SceneErrorBoundary'
import { useSceneControls } from './hooks/useSceneControls'

export default function App() {
  const { settings, store } = useSceneControls()
  const [ready, setReady] = useState(false)

  return (
    <main className="app">
      <SceneErrorBoundary>
        <Canvas
          shadows="soft"
          dpr={[1, 1.75]}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          camera={{
            position: [82, 57, 116],
            fov: 43,
            near: 0.1,
            far: 1200,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#02040a')
            setReady(true)
          }}
        >
          <Suspense fallback={null}>
            <Scene settings={settings} />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>

      <Hud settings={settings} ready={ready} />

      <div className="leva-shell">
        <LevaPanel
          store={store}
          theme={levaTheme}
          titleBar={{ title: 'STARK // CONTROL', filter: false }}
          hideCopyButton
          oneLineLabels={false}
          flat={false}
          neverHide
        />
      </div>

      <div className="boot" aria-hidden="true">
        <div className="boot__grid" />
        <div className="boot__content">
          <div className="boot__eyebrow">STARK INDUSTRIES // ARC OS 9.4</div>
          <div className="boot__title">
            STARK <span>TOWER</span>
          </div>
          <div className="boot__rule">
            <i />
          </div>
          <div className="boot__status">
            <span>INITIALIZING NEURAL FACADE</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </main>
  )
}
