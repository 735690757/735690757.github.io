/**
 * WebGL2 Rain Drop Banner — self-contained module
 * Usage: initRainBanner('canvas-id', { backgroundUrl: '...' })
 */
window.initRainBanner = function (canvasId, opts) {
  opts = opts || {};
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;

  var vsSource = '#version 300 es\n' +
    'in vec4 aPosition;\n' +
    'out vec2 vUv;\n' +
    'void main() {\n' +
    '    vUv = aPosition.xy * 0.5 + 0.5;\n' +
    '    gl_Position = aPosition;\n' +
    '}';

  var fsSource = '#version 300 es\n' +
    'precision highp float;\n' +
    'out vec4 fragColor;\n' +
    'uniform vec3 iResolution;\n' +
    'uniform float iTime;\n' +
    'uniform vec4 iMouse;\n' +
    'uniform sampler2D iChannel0;\n' +
    'uniform sampler2D iChannel1;\n' +
    'uniform float u_crossfade;\n' +
    'uniform vec2 u_bgScale;\n' +
    '#define S(a, b, t) smoothstep(a, b, t)\n' +
    'vec3 N13(float p) {\n' +
    '   vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));\n' +
    '   p3 += dot(p3, p3.yzx + 19.19);\n' +
    '   return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));\n' +
    '}\n' +
    'float N(float t) { return fract(sin(t*12345.564)*7658.76); }\n' +
    'float Saw(float b, float t) { return S(0., b, t)*S(1., b, t); }\n' +
    'vec2 DropLayer2(vec2 uv, float t) {\n' +
    '    vec2 UV = uv;\n' +
    '    uv.y += t*0.75;\n' +
    '    vec2 a = vec2(6., 1.);\n' +
    '    vec2 grid = a*2.;\n' +
    '    vec2 id = floor(uv*grid);\n' +
    '    float colShift = N(id.x);\n' +
    '    uv.y += colShift;\n' +
    '    id = floor(uv*grid);\n' +
    '    vec3 n = N13(id.x*35.2+id.y*2376.1);\n' +
    '    vec2 st = fract(uv*grid)-vec2(.5, 0.0);\n' +
    '    float x = n.x-.5;\n' +
    '    float y = UV.y*20.;\n' +
    '    float wiggle = sin(y+sin(y));\n' +
    '    x += wiggle*(.5-abs(x))*(n.z-.5);\n' +
    '    x *= .7;\n' +
    '    float ti = fract(t+n.z);\n' +
    '    y = (Saw(.85, ti)-.5)*.9+.5;\n' +
    '    vec2 p = vec2(x, y);\n' +
    '    float d = length((st-p)*a.yx);\n' +
    '    float mainDrop = S(.4, .0, d);\n' +
    '    float r = sqrt(S(1., y, st.y));\n' +
    '    float cd = abs(st.x-x);\n' +
    '    float trail = S(.23*r, .15*r*r, cd);\n' +
    '    float trailFront = S(-.02, .02, st.y-y);\n' +
    '    trail *= trailFront*r*r;\n' +
    '    y = UV.y;\n' +
    '    float trail2 = S(.2*r, .0, cd);\n' +
    '    float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;\n' +
    '    y = fract(y*10.)+(st.y-.5);\n' +
    '    float dd = length(st-vec2(x, y));\n' +
    '    droplets = S(.3, 0., dd);\n' +
    '    float m = mainDrop+droplets*r*trailFront;\n' +
    '    return vec2(m, trail);\n' +
    '}\n' +
    'float StaticDrops(vec2 uv, float t) {\n' +
    '    uv *= 40.;\n' +
    '    vec2 id = floor(uv);\n' +
    '    uv = fract(uv)-.5;\n' +
    '    vec3 n = N13(id.x*107.45+id.y*3543.654);\n' +
    '    vec2 p = (n.xy-.5)*.7;\n' +
    '    float d = length(uv-p);\n' +
    '    float fade = Saw(.025, fract(t+n.z));\n' +
    '    float c = S(.3, 0., d)*fract(n.z*10.)*fade;\n' +
    '    return c;\n' +
    '}\n' +
    'vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {\n' +
    '    float s = StaticDrops(uv, t)*l0;\n' +
    '    vec2 m1 = DropLayer2(uv, t)*l1;\n' +
    '    vec2 m2 = DropLayer2(uv*1.85, t)*l2;\n' +
    '    float c = s+m1.x+m2.x;\n' +
    '    c = S(.3, 1., c);\n' +
    '    return vec2(c, max(m1.y*l0, m2.y*l1));\n' +
    '}\n' +
    'void main() {\n' +
    '    vec2 fragCoord = gl_FragCoord.xy;\n' +
    '    vec2 uv = (fragCoord.xy-.5*iResolution.xy) / iResolution.y;\n' +
    '    vec2 UV = fragCoord.xy/iResolution.xy;\n' +
    '    vec3 M = iMouse.xyz/iResolution.xyz;\n' +
    '    float T = iTime + M.x*2.0;\n' +
    '    float t = T * 0.2;\n' +
    '    float zoom = -cos(T*.2);\n' +
    '    uv *= .7+zoom*.3;\n' +
    '    float rainAmount = iMouse.z>0. ? M.y : sin(T*.05)*.3+.7;\n' +
    '    float maxBlur = mix(3., 6., rainAmount);\n' +
    '    float minBlur = 2.;\n' +
    '    UV = (UV-.5)*(.9+zoom*.1)+.5;\n' +
    '    float staticDrops = S(-.5, 1., rainAmount)*2.;\n' +
    '    float layer1 = S(.25, .75, rainAmount);\n' +
    '    float layer2 = S(.0, .5, rainAmount);\n' +
    '    vec2 c = Drops(uv, t, staticDrops, layer1, layer2);\n' +
    '    vec2 e = vec2(.001, 0.);\n' +
    '    float cx = Drops(uv+e, t, staticDrops, layer1, layer2).x;\n' +
    '    float cy = Drops(uv+e.yx, t, staticDrops, layer1, layer2).x;\n' +
    '    vec2 n = vec2(cx-c.x, cy-c.x);\n' +
    '    float focus = mix(maxBlur-c.y, minBlur, S(.1, .2, c.x));\n' +
    '    vec2 bgUV = UV * u_bgScale + (1.0 - u_bgScale) * 0.5;\n' +
    '    vec3 col = textureLod(iChannel0, bgUV+n, focus).rgb;\n' +
    '    float pt = (T+3.)*.5;\n' +
    '    float colFade = sin(pt*.2)*.5+.5;\n' +
    '    col *= mix(vec3(1.), vec3(.8, .9, 1.3), colFade);\n' +
    '    float vignette = 1.-dot(UV-=.5, UV);\n' +
    '    col *= vignette;\n' +
    '    vec3 col2 = textureLod(iChannel1, bgUV+n, focus).rgb;\n' +
    '    col2 *= mix(vec3(1.), vec3(.8, .9, 1.3), colFade) * vignette;\n' +
    '    col = mix(col, col2, u_crossfade);\n' +
    '    fragColor = vec4(col, 1.0);\n' +
    '}';

  // --- WebGL2 Setup ---
  var gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
  if (!gl) return;

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('RainBanner shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vertexShader || !fragmentShader) return;

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('RainBanner link error:', gl.getProgramInfoLog(program));
    return;
  }

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0, -1.0, 1.0, 1.0
  ]), gl.STATIC_DRAW);

  var posLoc = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  var locResolution = gl.getUniformLocation(program, 'iResolution');
  var locTime = gl.getUniformLocation(program, 'iTime');
  var locMouse = gl.getUniformLocation(program, 'iMouse');
  var locChannel0 = gl.getUniformLocation(program, 'iChannel0');
  var locChannel1 = gl.getUniformLocation(program, 'iChannel1');
  var locCrossfade = gl.getUniformLocation(program, 'u_crossfade');
  var locBgScale = gl.getUniformLocation(program, 'u_bgScale');

  function createTexture() {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  var texture0 = createTexture();
  var texture1 = createTexture();

  function createDefaultTexture() {
    var c = document.createElement('canvas');
    c.width = 1024; c.height = 1024;
    var ctx = c.getContext('2d');
    var grd = ctx.createLinearGradient(0, 0, 1024, 1024);
    grd.addColorStop(0, '#1a0b2e');
    grd.addColorStop(0.5, '#3a1a4e');
    grd.addColorStop(1, '#1a2a3e');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.filter = 'blur(70px)';
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < 8; i++) {
      ctx.beginPath();
      var x = Math.random() * 1024;
      var y = Math.random() * 1024;
      var r = Math.random() * 200 + 150;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + (Math.random() * 60 + 240) + ', 60%, 50%, 0.45)';
      ctx.fill();
    }
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'overlay';
    var imgData = ctx.getImageData(0, 0, 1024, 1024);
    var data = imgData.data;
    for (var i = 0; i < data.length; i += 4) {
      var noise = (Math.random() - 0.5) * 35;
      data[i] += noise;
      data[i + 1] += noise;
      data[i + 2] += noise;
    }
    ctx.putImageData(imgData, 0, 0);
    return c;
  }

  function updateTexture(tex, source) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  updateTexture(texture0, createDefaultTexture());
  updateTexture(texture1, createDefaultTexture());

  var currentBgUrl = null;
  var activeTex = 0;
  var crossfade = 0.0;
  var crossfadeTarget = 0.0;
  var crossfadeSpeed = 0.015;
  var bgScale = [1.0, 1.0];
  var bgImageW = 1024, bgImageH = 1024;

  function updateBgScale() {
    var scaleX = canvas.width / bgImageW;
    var scaleY = canvas.height / bgImageH;
    var cover = Math.max(scaleX, scaleY);
    bgScale[0] = Math.max(scaleX / cover, 0.001);
    bgScale[1] = Math.max(scaleY / cover, 0.001);
  }

  function loadBgTexture(url) {
    if (!url || url === currentBgUrl) return;
    currentBgUrl = url;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    var targetTex = activeTex === 0 ? texture1 : texture0;
    img.onload = function () {
      updateTexture(targetTex, img);
      activeTex = activeTex === 0 ? 1 : 0;
      crossfade = 0.0;
      crossfadeTarget = 1.0;
      if (img.naturalWidth && img.naturalHeight) {
        bgImageW = img.naturalWidth;
        bgImageH = img.naturalHeight;
        updateBgScale();
      }
    };
    img.onerror = function () { /* keep current */ };
    img.src = url;
  }

  window.updateRainBannerBg = loadBgTexture;

  if (opts.backgroundUrl) {
    loadBgTexture(opts.backgroundUrl);
  }

  // --- Resize ---
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    updateBgScale();
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Mouse ---
  var mouse = { x: 0, y: 0, z: 0, w: 0 };
  canvas.addEventListener('mousedown', function (e) {
    mouse.z = 1;
    mouse.x = e.clientX * (window.devicePixelRatio || 1);
    mouse.y = canvas.height - (e.clientY * (window.devicePixelRatio || 1));
  });
  window.addEventListener('mouseup', function () { mouse.z = 0; });
  window.addEventListener('mousemove', function (e) {
    if (mouse.z > 0) {
      mouse.x = e.clientX * (window.devicePixelRatio || 1);
      mouse.y = canvas.height - (e.clientY * (window.devicePixelRatio || 1));
    }
  });

  // --- Render Loop ---
  var startTime = performance.now();
  function render(time) {
    if (!program) return;

    // Animate crossfade
    if (crossfade < crossfadeTarget) {
      crossfade = Math.min(crossfade + crossfadeSpeed, crossfadeTarget);
    } else if (crossfade > crossfadeTarget) {
      crossfade = Math.max(crossfade - crossfadeSpeed, crossfadeTarget);
    }

    gl.useProgram(program);
    var t = (time - startTime) * 0.001;
    gl.uniform1f(locTime, t);
    gl.uniform3f(locResolution, canvas.width, canvas.height, 1.0);
    gl.uniform4f(locMouse, mouse.x, mouse.y, mouse.z, mouse.w);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.uniform1i(locChannel0, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(locChannel1, 1);

    gl.uniform1f(locCrossfade, activeTex === 1 ? crossfade : (1.0 - crossfade));
    gl.uniform2f(locBgScale, bgScale[0], bgScale[1]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
};
