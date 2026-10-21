import { Component, type ErrorInfo, type ReactNode } from 'react'

interface SceneErrorBoundaryProps {
  children: ReactNode
}

interface SceneErrorBoundaryState {
  error: Error | null
}

/**
 * WebGL can fail on machines with disabled hardware acceleration or an
 * outdated browser. Keep the interface alive and offer a clear recovery path
 * instead of leaving the visitor with a black page.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    return { error }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The fallback already surfaces the actionable message. The browser still
    // logs the original stack for debugging.
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="scene-fallback" role="alert">
        <div className="scene-fallback__glow" aria-hidden="true" />
        <div className="scene-fallback__panel">
          <div className="scene-fallback__code">RENDERER / OFFLINE</div>
          <h2>WEBGL LINK FAILED</h2>
          <p>
            无法初始化 3D 渲染器。请确认浏览器已开启硬件加速，并使用最新版
            Chrome、Edge 或 Firefox 访问。
          </p>
          <p className="scene-fallback__detail">{error.message}</p>
          <button type="button" onClick={() => window.location.reload()}>
            RELOAD EXPERIENCE
          </button>
        </div>
      </div>
    )
  }
}
