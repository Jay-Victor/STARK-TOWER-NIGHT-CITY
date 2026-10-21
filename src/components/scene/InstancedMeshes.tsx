import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { Color, FrontSide, Object3D, StaticDrawUsage, type InstancedMesh } from 'three'
import type { BoxTransform } from '../../types'
import type { WindowDatum } from './towerData'

interface InstancedBoxesProps {
  items: BoxTransform[]
  castShadow?: boolean
  receiveShadow?: boolean
  children: ReactNode
}

/**
 * One draw call for any number of repeated boxes. Matrices are written once per
 * array identity, which is exactly what the procedurally rebuilt tower needs.
 */
export function InstancedBoxes({
  items,
  castShadow = false,
  receiveShadow = false,
  children,
}: InstancedBoxesProps) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    items.forEach((item, index) => {
      dummy.position.set(item.position[0], item.position[1], item.position[2])
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]))
      dummy.scale.set(item.scale[0], item.scale[1], item.scale[2])
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.count = items.length
    mesh.current.computeBoundingSphere()
  }, [items])

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, Math.max(1, items.length)]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      visible={items.length > 0}
    >
      <boxGeometry args={[1, 1, 1]} />
      {children}
    </instancedMesh>
  )
}

interface WindowFieldProps {
  windows: WindowDatum[]
  brightness?: number
}

/**
 * The entire facade — every lit aperture on all four sides — is one instanced
 * draw call. Per-instance colours carry the cool/warm window rhythm.
 */
export function WindowField({ windows, brightness = 1 }: WindowFieldProps) {
  const mesh = useRef<InstancedMesh>(null)
  const materialColor = useMemo(
    () => new Color(brightness, brightness, brightness),
    [brightness],
  )

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    const color = new Color()
    windows.forEach((window, index) => {
      dummy.position.set(window.position[0], window.position[1], window.position[2])
      dummy.rotation.set(0, window.rotationY, 0)
      dummy.scale.set(window.scale[0], window.scale[1], 1)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
      color.setRGB(window.color[0], window.color[1], window.color[2])
      mesh.current?.setColorAt(index, color)
    })
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.count = windows.length
    mesh.current.computeBoundingSphere()
  }, [windows])

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, Math.max(1, windows.length)]}
      visible={windows.length > 0}
      frustumCulled
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={materialColor} toneMapped={false} side={FrontSide} />
    </instancedMesh>
  )
}
