import { OrbitControls } from '@react-three/drei'

interface CameraRigProps {
  autoRotate: boolean
  autoRotateSpeed: number
}

export function CameraRig({ autoRotate, autoRotateSpeed }: CameraRigProps) {
  return (
    <OrbitControls
      makeDefault
      target={[0, 37, 0]}
      enableDamping
      dampingFactor={0.055}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={30}
      maxDistance={260}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI / 2 - 0.025}
      enablePan={false}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
    />
  )
}
