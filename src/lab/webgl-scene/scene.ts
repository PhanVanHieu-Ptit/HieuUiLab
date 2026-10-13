import { multiply, perspective, rotationX, rotationY, translation } from './mat4'

const VERTEX_SHADER = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uViewProjection;
out vec3 vNormal;
void main() {
  vNormal = mat3(uModel) * aNormal;
  gl_Position = uViewProjection * uModel * vec4(aPosition, 1.0);
}`

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec3 vNormal;
uniform vec3 uColor;
uniform vec3 uLight;
out vec4 outColor;
void main() {
  float diffuse = max(dot(normalize(vNormal), normalize(uLight)), 0.0);
  outColor = vec4(uColor * (0.35 + 0.65 * diffuse), 1.0);
}`

// One face per entry: outward normal plus the two axes spanning it.
const FACES = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
] as const

function cubeGeometry() {
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  FACES.forEach(({ n, u, v }, face) => {
    for (const [su, sv] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      positions.push(
        0.5 * (n[0] + su * u[0] + sv * v[0]),
        0.5 * (n[1] + su * u[1] + sv * v[1]),
        0.5 * (n[2] + su * u[2] + sv * v[2]),
      )
      normals.push(...n)
    }
    const base = face * 4
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  })
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  }
}

function compile(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export type Rgb = readonly [r: number, g: number, b: number]

export interface Scene {
  /** Draw the cube at `angle` radians of rotation. */
  render: (angle: number) => void
  setColor: (color: Rgb) => void
  dispose: () => void
}

interface SceneOptions {
  /** Called if the GPU drops the context, e.g. after a driver reset. */
  onContextLost: () => void
}

/** Set up a lit cube on `canvas`; returns null when WebGL2 is unavailable. */
export function createScene(
  canvas: HTMLCanvasElement,
  { onContextLost }: SceneOptions,
): Scene | null {
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true })
  if (!context) return null
  // Re-bound so the narrowing survives inside the hoisted helpers below.
  const gl: WebGL2RenderingContext = context

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  const program = gl.createProgram()
  if (!vertex || !fragment) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    return null
  }

  const geometry = cubeGeometry()
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const buffers = [
    { name: 'aPosition', data: geometry.positions },
    { name: 'aNormal', data: geometry.normals },
  ].map(({ name, data }) => {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const location = gl.getAttribLocation(program, name)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0)
    return buffer
  })
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW)

  const uniforms = {
    model: gl.getUniformLocation(program, 'uModel'),
    viewProjection: gl.getUniformLocation(program, 'uViewProjection'),
    color: gl.getUniformLocation(program, 'uColor'),
    light: gl.getUniformLocation(program, 'uLight'),
  }

  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.uniform3f(uniforms.light, 0.6, 0.8, 1)

  let color: Rgb = [0.35, 0.4, 0.9]
  let lastAngle = 0

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio))
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
  }

  function render(angle: number) {
    if (gl.isContextLost()) return
    lastAngle = angle
    resize()
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    const aspect = canvas.width / canvas.height
    const viewProjection = multiply(
      perspective(Math.PI / 4, aspect, 0.1, 100),
      translation(0, 0, -3.2),
    )
    const model = multiply(rotationY(angle), rotationX(angle * 0.6 + 0.5))
    gl.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection)
    gl.uniformMatrix4fv(uniforms.model, false, model)
    gl.uniform3f(uniforms.color, color[0], color[1], color[2])
    gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0)
  }

  const observer = new ResizeObserver(() => {
    render(lastAngle)
  })
  observer.observe(canvas)

  function handleContextLost(event: Event) {
    event.preventDefault()
    onContextLost()
  }
  canvas.addEventListener('webglcontextlost', handleContextLost)

  return {
    render,
    setColor(next) {
      color = next
      render(lastAngle)
    },
    dispose() {
      observer.disconnect()
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      buffers.forEach((buffer) => {
        gl.deleteBuffer(buffer)
      })
      gl.deleteBuffer(indexBuffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    },
  }
}

/**
 * Resolve a CSS colour (including oklch tokens) to sRGB in [0, 1] by painting it
 * on a 1×1 canvas. Returns null when 2D canvas or the colour syntax is unsupported.
 */
export function cssColorToRgb(cssColor: string): Rgb | null {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  // An unsupported colour is ignored by the canvas, leaving the sentinel in place.
  const sentinel = '#010203'
  context.fillStyle = sentinel
  context.fillStyle = cssColor
  if (context.fillStyle === sentinel) return null
  context.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}
