import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  FrontSide,
  Object3D,
  Quaternion,
  StaticDrawUsage,
  Vector3,
  type InstancedMesh,
} from 'three'
import type { BoxTransform, Vec3 } from '../../types'
import { createChamferBoxGeometry } from '../../lib/geometry'
import type { WindowDatum } from './facade'

interface InstancedBoxesProps {
  items: BoxTransform[]
  colors?: Vec3[]
  castShadow?: boolean
  receiveShadow?: boolean
  children: ReactNode
  renderOrder?: number
}

/**
 * One draw call for any number of repeated boxes. Matrices are written once per
 * array identity, which is exactly what the procedurally rebuilt tower needs.
 */
export function InstancedBoxes({
  items,
  colors,
  castShadow = false,
  receiveShadow = false,
  children,
  renderOrder,
}: InstancedBoxesProps) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    const color = new Color()
    items.forEach((item, index) => {
      dummy.position.set(item.position[0], item.position[1], item.position[2])
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]))
      dummy.scale.set(item.scale[0], item.scale[1], item.scale[2])
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
      if (colors) {
        const tint = colors[index] ?? [1, 1, 1]
        color.setRGB(tint[0], tint[1], tint[2])
        mesh.current?.setColorAt(index, color)
      }
    })
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.count = items.length
    mesh.current.computeBoundingSphere()
  }, [items, colors])

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, Math.max(1, items.length)]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      visible={items.length > 0}
      renderOrder={renderOrder}
    >
      <boxGeometry args={[1, 1, 1]} />
      {children}
    </instancedMesh>
  )
}

const CHAMFER_GEOMETRY = createChamferBoxGeometry(0.022)

/**
 * The chamfered workhorse. Architectural masses keep their hard silhouette,
 * but every edge carries a single narrow bevel that reads as a machined arris
 * in the cel light instead of a soft, toy-like round.
 */
export function InstancedChamferBoxes({
  items,
  colors,
  castShadow = false,
  receiveShadow = false,
  children,
}: InstancedBoxesProps) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    const color = new Color()
    items.forEach((item, index) => {
      dummy.position.set(item.position[0], item.position[1], item.position[2])
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]))
      dummy.scale.set(item.scale[0], item.scale[1], item.scale[2])
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
      if (colors) {
        const tint = colors[index] ?? [1, 1, 1]
        color.setRGB(tint[0], tint[1], tint[2])
        mesh.current?.setColorAt(index, color)
      }
    })
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.count = items.length
    mesh.current.computeBoundingSphere()
  }, [items, colors])

  return (
    <instancedMesh
      ref={mesh}
      args={[CHAMFER_GEOMETRY, undefined, Math.max(1, items.length)]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      visible={items.length > 0}
    >
      {children}
    </instancedMesh>
  )
}

// The unit cylinder is built once per module; instancing supplies radius/height.
const CYLINDER_GEOMETRY = new CylinderGeometry(1, 1, 1, 28, 1, false)

// Four flat facets: un-index so computeVertexNormals keeps the crown prisms crisp.
const PRISM_GEOMETRY = new CylinderGeometry(0.55, 1, 1, 4, 1, false).toNonIndexed()
PRISM_GEOMETRY.rotateY(Math.PI / 4)
PRISM_GEOMETRY.computeVertexNormals()
PRISM_GEOMETRY.computeBoundingSphere()

// Pointed square pyramid for water-tank caps and small spires.
const CONE_GEOMETRY = new CylinderGeometry(0, 1, 1, 4, 1, false).toNonIndexed()
CONE_GEOMETRY.rotateY(Math.PI / 4)
CONE_GEOMETRY.computeVertexNormals()
CONE_GEOMETRY.computeBoundingSphere()

/** Tall cylinders for columns, tanks, drums and masts. Smooth on purpose. */
export function InstancedCylinders({
  items,
  colors,
  castShadow = false,
  receiveShadow = false,
  children,
}: InstancedBoxesProps) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    const color = new Color()
    items.forEach((item, index) => {
      dummy.position.set(item.position[0], item.position[1], item.position[2])
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]))
      dummy.scale.set(item.scale[0], item.scale[1], item.scale[2])
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
      if (colors) {
        const tint = colors[index] ?? [1, 1, 1]
        color.setRGB(tint[0], tint[1], tint[2])
        mesh.current?.setColorAt(index, color)
      }
    })
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.count = items.length
    mesh.current.computeBoundingSphere()
  }, [items, colors])

  return (
    <instancedMesh
      ref={mesh}
      args={[CYLINDER_GEOMETRY, undefined, Math.max(1, items.length)]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      visible={items.length > 0}
    >
      {children}
    </instancedMesh>
  )
}

/** Four-sided tapered prisms for art-deco crowns, pylons and spires. */
export function InstancedPrisms({
  items,
  colors,
  castShadow = false,
  receiveShadow = false,
  children,
}: InstancedBoxesProps) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    const color = new Color()
    items.forEach((item, index) => {
      dummy.position.set(item.position[0], item.position[1], item.position[2])
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]))
      dummy.scale.set(item.scale[0], item.scale[1], item.scale[2])
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
      if (colors) {
        const tint = colors[index] ?? [1, 1, 1]
        color.setRGB(tint[0], tint[1], tint[2])
        mesh.current?.setColorAt(index, color)
      }
    })
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.count = items.length
    mesh.current.computeBoundingSphere()
  }, [items, colors])

  return (
    <instancedMesh
      ref={mesh}
      args={[PRISM_GEOMETRY, undefined, Math.max(1, items.length)]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      visible={items.length > 0}
    >
      {children}
    </instancedMesh>
  )
}


/** Square pyramids for tank roofs — pointed, so they never read as saucers. */
export function InstancedCones({
  items,
  colors,
  castShadow = false,
  receiveShadow = false,
  children,
}: InstancedBoxesProps) {
  const mesh = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    const color = new Color()
    items.forEach((item, index) => {
      dummy.position.set(item.position[0], item.position[1], item.position[2])
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]))
      dummy.scale.set(item.scale[0], item.scale[1], item.scale[2])
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
      if (colors) {
        const tint = colors[index] ?? [1, 1, 1]
        color.setRGB(tint[0], tint[1], tint[2])
        mesh.current?.setColorAt(index, color)
      }
    })
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.count = items.length
    mesh.current.computeBoundingSphere()
  }, [items, colors])

  return (
    <instancedMesh
      ref={mesh}
      args={[CONE_GEOMETRY, undefined, Math.max(1, items.length)]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      visible={items.length > 0}
    >
      {children}
    </instancedMesh>
  )
}

interface EdgeLinesProps {
  items: BoxTransform[]
  color?: string
  opacity?: number
}

const CORNERS: [number, number, number][] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, -1, 1],
  [-1, -1, 1],
  [-1, 1, -1],
  [1, 1, -1],
  [1, 1, 1],
  [-1, 1, 1],
]
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

/**
 * Ink lines on the volumes that define the silhouette. This is the "2D" half of
 * 三渲二: the shading supplies flat tonal blocks, these lines supply the drawing.
 */
export function EdgeLines({ items, color = '#02060b', opacity = 0.68 }: EdgeLinesProps) {
  const geometry = useMemo(() => {
    const positions: number[] = []
    const corner = new Vector3()
    const quaternion = new Quaternion()
    const euler = new Euler()
    items.forEach((item) => {
      euler.set(...(item.rotation ?? [0, 0, 0]))
      quaternion.setFromEuler(euler)
      const points = CORNERS.map(([x, y, z]) => {
        corner
          .set((x * item.scale[0]) / 2, (y * item.scale[1]) / 2, (z * item.scale[2]) / 2)
          .applyQuaternion(quaternion)
          .add(new Vector3(...item.position))
        return [corner.x, corner.y, corner.z] as [number, number, number]
      })
      for (const [a, b] of EDGES) {
        positions.push(...points[a], ...points[b])
      }
    })
    const next = new BufferGeometry()
    next.setAttribute('position', new Float32BufferAttribute(positions, 3))
    next.computeBoundingSphere()
    return next
  }, [items])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry} frustumCulled>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </lineSegments>
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