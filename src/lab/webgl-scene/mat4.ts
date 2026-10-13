/** 4×4 matrices in column-major order, as WebGL expects. */
export type Mat4 = Float32Array

export function identity(): Mat4 {
  const out = new Float32Array(16)
  out[0] = out[5] = out[10] = out[15] = 1
  return out
}

/** `a × b`: applies `b` first, then `a`. */
export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0
      for (let k = 0; k < 4; k++) sum += (a[k * 4 + row] ?? 0) * (b[col * 4 + k] ?? 0)
      out[col * 4 + row] = sum
    }
  }
  return out
}

/** Right-handed perspective projection mapping depth to clip space [-1, 1]. */
export function perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2)
  const out = new Float32Array(16)
  out[0] = f / aspect
  out[5] = f
  out[10] = (far + near) / (near - far)
  out[11] = -1
  out[14] = (2 * far * near) / (near - far)
  return out
}

export function translation(x: number, y: number, z: number): Mat4 {
  const out = identity()
  out[12] = x
  out[13] = y
  out[14] = z
  return out
}

export function rotationX(radians: number): Mat4 {
  const c = Math.cos(radians)
  const s = Math.sin(radians)
  const out = identity()
  out[5] = c
  out[6] = s
  out[9] = -s
  out[10] = c
  return out
}

export function rotationY(radians: number): Mat4 {
  const c = Math.cos(radians)
  const s = Math.sin(radians)
  const out = identity()
  out[0] = c
  out[2] = -s
  out[8] = s
  out[10] = c
  return out
}

/** Transform a point (w = 1) and return x, y, z after the perspective divide. */
export function transformPoint(m: Mat4, [x, y, z]: readonly [number, number, number]) {
  const at = (i: number) => m[i] ?? 0
  const w = at(3) * x + at(7) * y + at(11) * z + at(15)
  return [
    (at(0) * x + at(4) * y + at(8) * z + at(12)) / w,
    (at(1) * x + at(5) * y + at(9) * z + at(13)) / w,
    (at(2) * x + at(6) * y + at(10) * z + at(14)) / w,
  ] as const
}
