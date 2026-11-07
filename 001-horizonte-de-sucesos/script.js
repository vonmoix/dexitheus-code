// Black hole: a single WebGL fragment shader.
// Rays are bent around the event horizon; the accretion disk is shaded where they cross it.

const canvas = document.getElementById('canvas');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });

if (gl) {
  const vert = `attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

  const frag = `precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_rotationSpeed;
uniform float u_diskIntensity;
uniform float u_starsOnly;
uniform float u_tilt;
uniform float u_rotate;
uniform vec2 u_bhCenter;
uniform float u_bhScale;
uniform float u_chromatic;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float RS = 1.0;
const float ISCO = 3.0;
const float DISK_IN = 2.2;
const float DISK_OUT = 14.0;

float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float gNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
        mix(hash(i), hash(i + vec2(1, 0)), u.x),
        mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x),
        u.y
    );
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
    for (int i = 0; i < 4; i++) {
        v += a * gNoise(p);
        p = rot * p * 2.03 + vec2(47.0, 13.0);
        a *= 0.49;
    }
    return v;
}

float fbmLite(vec2 p) {
    float v = 0.5 * gNoise(p);
    p = mat2(0.866, 0.5, -0.5, 0.866) * p * 2.03 + vec2(47.0, 13.0);
    v += 0.25 * gNoise(p);
    return v;
}

vec3 starField(vec3 rd) {
    float u = atan(rd.z, rd.x) / TAU + 0.5;
    float v = asin(clamp(rd.y, -0.999, 0.999)) / PI + 0.5;
    vec3 col = vec3(0.0);
    {
        vec2 cell = floor(vec2(u, v) * 55.0);
        vec2 f = fract(vec2(u, v) * 55.0);
        vec2 r = vec2(hash(cell), hash(cell + 127.1));
        float d = length(f - r);
        float b = pow(r.x, 10.0) * exp(-d * d * 500.0);
        col += mix(vec3(1.0, 0.65, 0.35), vec3(0.55, 0.75, 1.0), r.y) * b * 4.0;
    }
    {
        vec2 cell = floor(vec2(u, v) * 170.0);
        vec2 f = fract(vec2(u, v) * 170.0);
        vec2 r = vec2(hash(cell + 43.0), hash(cell + 91.0));
        float d = length(f - r);
        float b = pow(r.x, 18.0) * exp(-d * d * 1000.0);
        col += vec3(0.85, 0.88, 1.0) * b * 2.0;
    }
    float n = fbmLite(vec2(u, v) * 3.0) * fbmLite(vec2(u, v) * 5.5 + 10.0);
    col += vec3(0.10, 0.04, 0.14) * pow(n, 3.0);
    return col;
}

vec3 bbColor(float t) {
    t = clamp(t, 0.0, 2.5);
    vec3 lo = vec3(1.0, 0.18, 0.0);
    vec3 mi = vec3(1.0, 0.55, 0.12);
    vec3 hi = vec3(1.0, 0.93, 0.82);
    vec3 hot = vec3(0.65, 0.82, 1.0);
    vec3 c = mix(lo, mi, smoothstep(0.0, 0.3, t));
    c = mix(c, hi, smoothstep(0.3, 0.8, t));
    return mix(c, hot, smoothstep(0.8, 1.8, t));
}

vec4 shadeDisk(vec3 hit, vec3 vel, float time) {
    float r = length(hit.xz);
    if (r < DISK_IN * 0.5 || r > DISK_OUT * 1.05) return vec4(0.0);
    float xr = ISCO / r;
    float tProfile = pow(ISCO / r, 0.75) * pow(max(0.001, 1.0 - sqrt(xr)), 0.25);
    float gRedshift = sqrt(max(0.01, 1.0 - RS / r));
    tProfile *= gRedshift;
    float lr = log2(max(r, 0.1));
    float keplerOmega = sqrt(0.5 * RS / (r * r * r));
    float omega = max(keplerOmega, 0.04) * 10.0;
    float rotAngle = time * omega;
    float ca = cos(rotAngle), sa = sin(rotAngle);
    vec2 rotXZ = vec2(hit.x * ca - hit.z * sa, hit.x * sa + hit.z * ca);
    float turb = fbm(rotXZ * 1.2 + vec2(lr * 3.0));
    turb = 0.25 + 0.75 * turb;
    float timeShift = time * 0.15;
    float detail = gNoise(rotXZ * 3.5 + vec2(100.0 + timeShift, timeShift * 0.7));
    turb *= 0.7 + 0.3 * detail;
    float ringPhase1 = sin(r * 10.0 + rotAngle * r * 0.3) * 0.5 + 0.5;
    float ringPhase2 = sin(r * 20.0 - rotAngle * r * 0.15) * 0.5 + 0.5;
    float rings = ringPhase1 * 0.55 + ringPhase2 * 0.45;
    rings = 0.5 + 0.5 * rings;
    turb *= rings;
    float orbSpeed = sqrt(0.5 * RS / max(r, DISK_IN));
    vec3 orbDir = normalize(vec3(-hit.z, 0.0, hit.x));
    float dopplerFactor = max(0.15, 1.0 + 2.0 * dot(normalize(vel), orbDir) * orbSpeed);
    float dopplerBoost = dopplerFactor * dopplerFactor * dopplerFactor;
    float I = tProfile * turb * 6.0;
    I *= smoothstep(DISK_IN * 0.7, DISK_IN * 1.2, r);
    I *= 0.35 + 0.65 * smoothstep(ISCO * 0.85, ISCO * 1.2, r);
    I *= 1.0 - smoothstep(DISK_OUT * 0.55, DISK_OUT, r);
    float colorTemp = tProfile * pow(dopplerFactor, 1.8) * 1.2;
    vec3 col = bbColor(colorTemp) * I * dopplerBoost;
    if (u_chromatic > 0.01) {
        float hue = ((r - DISK_IN) / (DISK_OUT - DISK_IN)) * 0.8 + ringPhase1 * 0.4;
        vec3 spectrum;
        spectrum.r = (1.0 - smoothstep(0.0, 0.35, hue))
                   + smoothstep(0.25, 0.45, hue) * (1.0 - smoothstep(0.55, 0.7, hue)) * 0.7
                   + smoothstep(0.85, 1.1, hue) * 0.4;
        spectrum.g = smoothstep(0.15, 0.4, hue) * (1.0 - smoothstep(0.7, 0.95, hue));
        spectrum.b = smoothstep(0.5, 0.8, hue) + smoothstep(0.85, 1.1, hue) * 0.3;
        spectrum = max(spectrum, 0.05);
        col = mix(col, spectrum * dot(col, vec3(0.3, 0.5, 0.2)) * 2.0, u_chromatic * 0.75);
    }
    return vec4(col, clamp(I * 1.3, 0.0, 0.96));
}

void main() {
    vec2 fc = gl_FragCoord.xy;
    vec2 ctr = (u_bhScale > 0.0 ? u_bhCenter : vec2(0.5)) * u_res;
    float sc = u_bhScale > 0.0 ? u_bhScale : 1.0;
    vec2 uv = (fc - ctr) * sc / u_res.x;
    float camR = 28.0;
    float orbit = u_time * 0.055 * u_rotationSpeed;
    float tilt = 0.25 + u_tilt;
    vec3 eye = vec3(camR * cos(orbit) * cos(tilt), camR * sin(tilt), camR * sin(orbit) * cos(tilt));
    vec3 fwd = normalize(-eye);
    vec3 rt = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(rt, fwd);
    float cr = cos(u_rotate), sr = sin(u_rotate);
    vec3 rd = normalize(fwd + uv.x * (cr*rt + sr*up) + uv.y * (-sr*rt + cr*up));
    if (u_starsOnly > 0.5) {
        gl_FragColor = vec4(pow(starField(rd), vec3(0.45)), 1.0);
        return;
    }
    vec3 pos = eye, vel = rd;
    float L2 = dot(cross(pos, vel), cross(pos, vel));
    vec4 diskAccum = vec4(0.0);
    vec3 glow = vec3(0.0);
    bool absorbed = false;
    int diskCrossings = 0;
    float minR = 1000.0;
    float gravCoeff = -1.5 * RS * L2;
    for (int i = 0; i < 200; i++) {
        float r = length(pos);
        float h = 0.16 * clamp(r - 0.4 * RS, 0.06, 3.5);
        float r2 = r * r;
        vec3 acc = (gravCoeff / (r2 * r2 * r)) * pos;
        vec3 p1 = pos + vel * h + 0.5 * acc * h * h;
        float r1 = length(p1);
        float r12 = r1 * r1;
        vec3 acc1 = (gravCoeff / (r12 * r12 * r1)) * p1;
        vec3 v1 = vel + 0.5 * (acc + acc1) * h;
        minR = min(minR, r1);
        if (pos.y * p1.y < 0.0 && diskAccum.a < 0.97) {
            vec3 hit = mix(pos, p1, pos.y / (pos.y - p1.y));
            vec4 dc = shadeDisk(hit, vel, u_time * u_rotationSpeed);
            dc.rgb *= u_diskIntensity;
            if (diskCrossings >= 2) { dc.rgb *= 0.15; dc.a *= 0.15; }
            diskAccum.rgb += dc.rgb * dc.a * (1.0 - diskAccum.a);
            diskAccum.a   += dc.a * (1.0 - diskAccum.a);
            glow += dc.rgb * 0.04 * max(dot(dc.rgb, vec3(0.3,0.5,0.2)) * dc.a - 0.3, 0.0);
            diskCrossings++;
        }
        if (r1 < 6.0) {
            float pDist = abs(r1 - 1.5 * RS);
            glow += vec3(0.8,0.6,0.35) * h * 0.001 / ((1.0 + pDist*pDist*20.0) * max(r1*r1,0.2));
            glow += vec3(0.5,0.25,0.08) * max(exp(-(r1 - RS) * 3.5) * h * 0.003, 0.0);
        }
        if (r1 < RS * 0.35) { absorbed = true; break; }
        if (r1 > 25.0 && r1 > r) break;
        if (r1 > 55.0) break;
        pos = p1; vel = v1;
    }
    vec3 col = absorbed ? vec3(0.0) : starField(normalize(vel));
    col = col * (1.0 - diskAccum.a) + diskAccum.rgb;
    float ringDist = abs(minR - 1.5 * RS);
    float baseChroma = 0.1 + 0.5 * u_chromatic;
    float spread = 0.08 + 0.18 * u_chromatic;
    float falloff = 20.0 + 15.0 * (1.0 - u_chromatic);
    col.r += exp(-(ringDist+spread)*(ringDist+spread)*falloff) * 0.3 * baseChroma;
    col.b += exp(-(ringDist-spread)*(ringDist-spread)*falloff) * 0.35 * baseChroma;
    col += glow;
    col *= 1.4;
    vec3 a = col * (col + 0.0245786) - 0.000090537;
    vec3 b = col * (0.983729 * col + 0.4329510) + 0.238081;
    col = pow(max(smoothstep(0.0, 1.0, a / b), 0.0), vec3(0.92));
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

  function makeShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      console.error('Shader error:', gl.getShaderInfoLog(s));
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = {
    time:      gl.getUniformLocation(prog, 'u_time'),
    res:       gl.getUniformLocation(prog, 'u_res'),
    rotSpeed:  gl.getUniformLocation(prog, 'u_rotationSpeed'),
    diskInt:   gl.getUniformLocation(prog, 'u_diskIntensity'),
    starsOnly: gl.getUniformLocation(prog, 'u_starsOnly'),
    tilt:      gl.getUniformLocation(prog, 'u_tilt'),
    rotate:    gl.getUniformLocation(prog, 'u_rotate'),
    bhCenter:  gl.getUniformLocation(prog, 'u_bhCenter'),
    bhScale:   gl.getUniformLocation(prog, 'u_bhScale'),
    chromatic: gl.getUniformLocation(prog, 'u_chromatic'),
  };

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let needsResize = true, running = true;
  let mx = 0.5, my = 0.5, sx = 0.5, sy = 0.5;

  const hint = document.querySelector('.hint');
  window.addEventListener('mousemove', e => {
    mx = e.clientX / window.innerWidth;
    my = e.clientY / window.innerHeight;
    if (hint && !hint.dataset.moved) {
      hint.dataset.moved = '1';
      setTimeout(() => hint.classList.add('is-hidden'), 1500);
    }
  }, { passive: true });
  window.addEventListener('resize', () => { needsResize = true; });

  function resize() {
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.res, w, h);
    }
    needsResize = false;
  }

  function frame(t) {
    if (!running) return;
    if (needsResize) resize();
    sx += (mx - sx) * 0.03;
    sy += (my - sy) * 0.03;
    gl.uniform1f(u.time,      reducedMotion ? 0 : t * 0.001);
    gl.uniform1f(u.rotSpeed,  0.3);
    gl.uniform1f(u.diskInt,   1.0);
    gl.uniform1f(u.starsOnly, 0.0);
    gl.uniform1f(u.tilt,      0.15 + (sy - 0.5) * 0.12);
    gl.uniform1f(u.rotate,    0.10 + (sx - 0.5) * 0.12);
    gl.uniform2f(u.bhCenter,  0.5, 0.5);
    // Zoom in on portrait screens so the hole keeps its size
    gl.uniform1f(u.bhScale,   1.6 * Math.min(1, canvas.width / canvas.height / 0.75));
    gl.uniform1f(u.chromatic, 0.12);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);

  // Pause while the tab is hidden or the canvas is off screen
  let onScreen = true;
  function setRunning() {
    const next = !document.hidden && onScreen;
    if (next && !running) { running = true; requestAnimationFrame(frame); }
    else if (!next) { running = false; }
  }
  document.addEventListener('visibilitychange', setRunning);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting;
      setRunning();
    }).observe(canvas);
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { needsResize = true; }).observe(canvas);
  }
}
