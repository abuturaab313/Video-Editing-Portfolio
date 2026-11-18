/**
 * ABUTURAAB.SYS — holographic core
 * A small hand-written WebGL scene (no 3D library): a lat/long wireframe
 * sphere, ambient dust, orbital rings and a glowing nucleus.
 * Returns null when WebGL is unavailable so the CSS fallback can take over.
 */

const VERT = `
attribute vec3 aPos;
attribute vec3 aColor;
attribute float aSize;
attribute float aSeed;

uniform float uTime;
uniform vec2 uPointer;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float angleY = uTime * 0.14 + uPointer.x * 0.5;
  float angleX = uPointer.y * 0.38;

  float cy = cos(angleY);
  float sy = sin(angleY);
  vec3 p = vec3(aPos.x * cy - aPos.z * sy, aPos.y, aPos.x * sy + aPos.z * cy);

  float cx = cos(angleX);
  float sx = sin(angleX);
  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);

  float persp = 2.9 / (2.9 - p.z * 0.62);
  gl_Position = vec4(p.x * persp / 1.0, p.y * persp, 0.0, 1.0);
  gl_PointSize = aSize * uPixelRatio * persp * (0.8 + 0.35 * sin(uTime * 1.6 + aSeed * 6.283));

  float depth = smoothstep(-1.0, 1.1, p.z);
  vColor = aColor;
  vAlpha = 0.3 + depth * 0.7;
}
`;

const FRAG = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.02, d);
  gl_FragColor = vec4(vColor, a * vAlpha);
}
`;

const LINE_VERT = `
attribute vec3 aPos;
attribute vec3 aColor;

uniform float uTime;
uniform vec2 uPointer;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float angleY = uTime * 0.14 + uPointer.x * 0.5;
  float angleX = uPointer.y * 0.38;

  float cy = cos(angleY);
  float sy = sin(angleY);
  vec3 p = vec3(aPos.x * cy - aPos.z * sy, aPos.y, aPos.x * sy + aPos.z * cy);

  float cx = cos(angleX);
  float sx = sin(angleX);
  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);

  float persp = 2.9 / (2.9 - p.z * 0.62);
  gl_Position = vec4(p.x * persp, p.y * persp, 0.0, 1.0);
  vColor = aColor;
  vAlpha = 0.18 + smoothstep(-1.0, 1.0, p.z) * 0.55;
}
`;

const LINE_FRAG = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(vColor, vAlpha);
}
`;

const CYAN = [0.0, 0.9, 1.0];
const BLUE = [0.21, 0.48, 1.0];
const VIOLET = [0.58, 0.4, 1.0];
const MAGENTA = [1.0, 0.24, 0.66];

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[holo] shader compile failed", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vert, frag) {
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[holo] program link failed", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function createHologram(canvas, { reducedMotion = false } = {}) {
  let gl = null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: false,
      powerPreference: "low-power",
    });
  } catch (error) {
    gl = null;
  }
  if (!gl) {
    console.warn("[holo] WebGL context unavailable");
    return null;
  }

  const pointProgram = createProgram(gl, VERT, FRAG);
  const lineProgram = createProgram(gl, LINE_VERT, LINE_FRAG);
  if (!pointProgram || !lineProgram) return null;

  /* ---------- geometry ---------- */
  const positions = [];
  const colors = [];
  const sizes = [];
  const seeds = [];

  const pushPoint = (x, y, z, color, size, seed) => {
    positions.push(x, y, z);
    colors.push(color[0], color[1], color[2]);
    sizes.push(size);
    seeds.push(seed);
  };

  // Wireframe globe sampled on latitude / longitude bands.
  const LATS = 31;
  const LONS = 58;
  for (let i = 0; i < LATS; i += 1) {
    const phi = (i / (LATS - 1)) * Math.PI;
    for (let j = 0; j < LONS; j += 1) {
      const theta = (j / LONS) * Math.PI * 2;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      const color = i % 9 === 0 ? MAGENTA : i % 6 === 0 ? VIOLET : i % 3 === 0 ? BLUE : CYAN;
      const weight = i % 3 === 0 ? 2.6 : 2.1;
      pushPoint(x * 0.94, y * 0.94, z * 0.94, color, weight, (i * 0.13 + j * 0.07) % 1);
    }
  }

  // Ambient dust shell.
  for (let i = 0; i < 120; i += 1) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const radius = 1.16 + Math.random() * 0.72;
    const color = Math.random() > 0.72 ? VIOLET : CYAN;
    pushPoint(
      Math.sin(phi) * Math.cos(theta) * radius,
      Math.cos(phi) * radius * 0.72,
      Math.sin(phi) * Math.sin(theta) * radius,
      color,
      1.1 + Math.random() * 0.6,
      Math.random()
    );
  }

  // Nucleus glow.
  pushPoint(0, 0, 0, [0.85, 0.98, 1.0], 92, 0.2);
  pushPoint(0, 0, 0, [0.0, 0.9, 1.0], 54, 0.6);
  pushPoint(0, 0, 0, [1.0, 1.0, 1.0], 20, 0.9);

  // Orbital rings, drawn as dashed line loops.
  const linePositions = [];
  const lineColors = [];
  const ring = (tiltX, tiltZ, radius, color, dash = 3) => {
    const segments = 132;
    for (let i = 0; i < segments; i += 1) {
      if (dash && i % dash === 0) continue;
      const a = (i / segments) * Math.PI * 2;
      const b = ((i + 1) / segments) * Math.PI * 2;
      const p1 = [Math.cos(a) * radius, 0, Math.sin(a) * radius];
      const p2 = [Math.cos(b) * radius, 0, Math.sin(b) * radius];
      const apply = (p) => {
        const cx = Math.cos(tiltX);
        const sx = Math.sin(tiltX);
        const y1 = p[1] * cx - p[2] * sx;
        const z1 = p[1] * sx + p[2] * cx;
        const cz = Math.cos(tiltZ);
        const sz = Math.sin(tiltZ);
        return [p[0] * cz - y1 * sz, p[0] * sz + y1 * cz, z1];
      };
      const q1 = apply(p1);
      const q2 = apply(p2);
      linePositions.push(q1[0], q1[1], q1[2], q2[0], q2[1], q2[2]);
      lineColors.push(color[0], color[1], color[2], color[0], color[1], color[2]);
    }
  };

  ring(0.35, 0.2, 1.24, CYAN);
  ring(-0.75, 0.5, 1.5, MAGENTA, 4);
  ring(1.15, -0.35, 1.36, VIOLET, 5);

  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const sizeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);

  const seedBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(seeds), gl.STATIC_DRAW);

  const lineBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(linePositions), gl.STATIC_DRAW);

  const lineColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColors), gl.STATIC_DRAW);

  const pointCount = sizes.length;
  const lineCount = linePositions.length / 3;

  /* ---------- uniforms ---------- */
  const pAttr = {
    pos: gl.getAttribLocation(pointProgram, "aPos"),
    color: gl.getAttribLocation(pointProgram, "aColor"),
    size: gl.getAttribLocation(pointProgram, "aSize"),
    seed: gl.getAttribLocation(pointProgram, "aSeed"),
  };
  const pUni = {
    time: gl.getUniformLocation(pointProgram, "uTime"),
    pointer: gl.getUniformLocation(pointProgram, "uPointer"),
    dpr: gl.getUniformLocation(pointProgram, "uPixelRatio"),
  };
  const lAttr = {
    pos: gl.getAttribLocation(lineProgram, "aPos"),
    color: gl.getAttribLocation(lineProgram, "aColor"),
  };
  const lUni = {
    time: gl.getUniformLocation(lineProgram, "uTime"),
    pointer: gl.getUniformLocation(lineProgram, "uPointer"),
  };

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  let dpr = 1;
  let width = 0;
  let height = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (w === width && h === height) return;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  };

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let time = 0;
  let raf = 0;
  let running = false;
  let visible = true;
  let last = performance.now();

  const draw = () => {
    if (!width || !height) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    pointer.x += (pointer.tx - pointer.x) * 0.055;
    pointer.y += (pointer.ty - pointer.y) * 0.055;

    // Lines
    gl.useProgram(lineProgram);
    gl.uniform1f(lUni.time, time);
    gl.uniform2f(lUni.pointer, pointer.x, pointer.y);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.enableVertexAttribArray(lAttr.pos);
    gl.vertexAttribPointer(lAttr.pos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
    gl.enableVertexAttribArray(lAttr.color);
    gl.vertexAttribPointer(lAttr.color, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, lineCount);

    // Points
    gl.useProgram(pointProgram);
    gl.uniform1f(pUni.time, time);
    gl.uniform2f(pUni.pointer, pointer.x, pointer.y);
    gl.uniform1f(pUni.dpr, dpr);

    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.enableVertexAttribArray(pAttr.pos);
    gl.vertexAttribPointer(pAttr.pos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(pAttr.color);
    gl.vertexAttribPointer(pAttr.color, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.enableVertexAttribArray(pAttr.size);
    gl.vertexAttribPointer(pAttr.size, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
    gl.enableVertexAttribArray(pAttr.seed);
    gl.vertexAttribPointer(pAttr.seed, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, pointCount);
  };

  const loop = (now) => {
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += delta;
    draw();
    raf = window.requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || reducedMotion) return;
    running = true;
    last = performance.now();
    raf = window.requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    window.cancelAnimationFrame(raf);
  };

  const onPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  window.addEventListener("pointermove", onPointer, { passive: true });

  const onVisibility = () => {
    if (document.hidden) stop();
    else if (visible) start();
  };
  document.addEventListener("visibilitychange", onVisibility);

  let observer = null;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);
  }

  resize();
  draw();
  if (!reducedMotion) start();

  const onResize = () => {
    resize();
    draw();
  };
  window.addEventListener("resize", onResize, { passive: true });

  return {
    destroy() {
      stop();
      observer?.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
