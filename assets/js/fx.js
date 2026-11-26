window.RafychFX = (function () {
  var ASCII_LOGO = [
    '██████╗  █████╗ ███████╗██╗   ██╗ ██████╗██╗  ██╗',
    '██╔══██╗██╔══██╗██╔════╝╚██╗ ██╔╝██╔════╝██║  ██║',
    '██████╔╝███████║█████╗   ╚████╔╝ ██║     ███████║',
    '██╔══██╗██╔══██║██╔══╝    ╚██╔╝  ██║     ██╔══██║',
    '██║  ██║██║  ██║██║        ██║   ╚██████╗██║  ██║',
    '╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝    ╚═════╝╚═╝  ╚═╝'
  ];

  var RAMP = ' .:-=+*#%@';
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heroController = null;

  function showToast(text) {
    var toast = document.getElementById('rf-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'rf-toast';
      toast.className = 'rf-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('is-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toast.classList.remove('is-show');
    }, 1600);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        showToast('Copied: ' + text);
      }).catch(function () {
        fallbackCopy(text);
      });
    }
    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Copied: ' + text);
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function runLoader(force) {
    var el = document.getElementById('rf-loader');
    var canvas = document.getElementById('rf-loader-canvas');
    if (!el || !canvas) return;
    if (prefersReduced) {
      el.classList.add('is-done');
      return;
    }

    var seen = false;
    try {
      seen = sessionStorage.getItem('rf:introSeen') === '1';
    } catch (e) {}
    if (seen && !force) {
      el.classList.add('is-done');
      return;
    }

    el.classList.remove('is-done');
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      el.classList.add('is-done');
      return;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var barFill = el.querySelector('.rf-loader-bar-fill');
    var pctEl = el.querySelector('.rf-loader-pct');

    var cols = ASCII_LOGO[0].length;
    var rows = ASCII_LOGO.length;
    var cell = Math.max(4, Math.min(10, Math.floor((w * 0.78) / cols)));
    var startX = (w - cols * cell) / 2;
    var startY = (h - rows * cell) / 2 - 20;

    var pts = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var ch = ASCII_LOGO[r][c];
        if (ch !== ' ') {
          var ang = Math.random() * Math.PI * 2;
          var dist = Math.max(w, h) * (0.25 + Math.random() * 0.35);
          pts.push({
            x: w / 2 + Math.cos(ang) * dist,
            y: h / 2 + Math.sin(ang) * dist,
            tx: startX + c * cell + cell * 0.5,
            ty: startY + r * cell + cell * 0.5,
            ch: ch,
            accent: (c + r) % 7 === 0
          });
        }
      }
    }

    var startTime = performance.now();
    var duration = 1050;
    var finished = false;
    var rafId = 0;

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(rafId);
      try {
        sessionStorage.setItem('rf:introSeen', '1');
      } catch (e) {}
      el.classList.add('is-done');
    }

    el.onclick = finish;
    function onKey() {
      finish();
      window.removeEventListener('keydown', onKey);
    }
    window.addEventListener('keydown', onKey);

    function frame(now) {
      if (finished) return;
      var p = Math.min(1, (now - startTime) / duration);
      ctx.fillStyle = 'rgba(8, 9, 11, 0.42)';
      ctx.fillRect(0, 0, w, h);

      var pct = Math.min(100, Math.floor(p * 100));
      if (barFill) barFill.style.width = pct + '%';
      if (pctEl) pctEl.textContent = (pct < 10 ? '0' : '') + pct + '%';

      var dissolve = p > 0.82 ? (p - 0.82) / 0.18 : 0;
      ctx.font = '600 ' + Math.round(cell * 1.05) + 'px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i];
        if (dissolve === 0) {
          pt.x += (pt.tx - pt.x) * 0.19;
          pt.y += (pt.ty - pt.y) * 0.19;
        } else {
          pt.y -= dissolve * 1.8;
        }
        ctx.globalAlpha = dissolve > 0 ? Math.max(0, 1 - dissolve * 1.2) : Math.min(1, 0.3 + p * 0.9);
        ctx.fillStyle = pt.accent ? '#e5b567' : '#f0f0ec';
        var g = p < 0.5 ? RAMP[Math.floor(Math.random() * RAMP.length)] : pt.ch;
        ctx.fillText(g, pt.x, pt.y);
      }
      ctx.globalAlpha = 1;

      if (p < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        window.removeEventListener('keydown', onKey);
        finish();
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  function initAsciiStage() {
    var canvas = document.getElementById('rf-ascii-canvas');
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var mode = 'torus';
    var w = 0;
    var h = 0;
    var dpr = 1;
    var pointer = { x: -999, y: -999, active: false };
    var ripples = [];
    var paused = false;
    var portraitGrid = null;
    var portraitCols = 0;
    var portraitRows = 0;

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      samplePortrait();
    };
    img.src = '/icon.png';

    function samplePortrait() {
      if (!img.complete || !img.naturalWidth || w === 0 || h === 0) return;
      var stepX = 8;
      var stepY = 12;
      portraitCols = Math.max(20, Math.floor(w / stepX));
      portraitRows = Math.max(14, Math.floor(h / stepY));
      var off = document.createElement('canvas');
      off.width = portraitCols;
      off.height = portraitRows;
      var octx = off.getContext('2d');
      if (!octx) return;

      var imgAspect = img.naturalWidth / img.naturalHeight;
      var gridAspect = (portraitCols * stepX) / (portraitRows * stepY);
      var sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (gridAspect > imgAspect) {
        sh = img.naturalWidth / gridAspect;
        sy = (img.naturalHeight - sh) * 0.3;
      } else {
        sw = img.naturalHeight * gridAspect;
        sx = (img.naturalWidth - sw) * 0.5;
      }
      octx.drawImage(img, sx, sy, sw, sh, 0, 0, portraitCols, portraitRows);
      try {
        portraitGrid = octx.getImageData(0, 0, portraitCols, portraitRows).data;
      } catch (e) {
        portraitGrid = null;
      }
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(200, Math.floor(rect.width));
      h = Math.max(240, Math.floor(rect.height - 34));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      samplePortrait();
    }

    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
    });

    window.addEventListener('resize', resize);

    canvas.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }, { passive: true });

    canvas.addEventListener('pointerleave', function () {
      pointer.active = false;
    });

    canvas.addEventListener('pointerdown', function (e) {
      var rect = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, r: 0, alpha: 1 });
      if (ripples.length > 4) ripples.shift();
    }, { passive: true });

    function setMode(next) {
      if (next !== 'torus' && next !== 'portrait' && next !== 'wave') return;
      mode = next;
      document.querySelectorAll('[data-ascii-mode]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-ascii-mode') === mode);
      });
    }

    document.querySelectorAll('[data-ascii-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.getAttribute('data-ascii-mode'));
      });
    });

    function dist2d(ax, ay, bx, by) {
      var dx = ax - bx;
      var dy = ay - by;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function drawTorus(time) {
      ctx.fillStyle = '#060709';
      ctx.fillRect(0, 0, w, h);

      var cellW = 8;
      var cellH = 13;
      var cols = Math.floor(w / cellW);
      var rows = Math.floor(h / cellH);
      var size = cols * rows;
      var zbuf = new Float32Array(size);
      var lbuf = new Float32Array(size);

      var t = prefersReduced ? 0.8 : time * 0.001;
      var A = t * 0.9 + (pointer.active ? (pointer.y / h - 0.5) * 1.4 : 0);
      var B = t * 0.55 + (pointer.active ? (pointer.x / w - 0.5) * 1.4 : 0);
      var cosA = Math.cos(A), sinA = Math.sin(A);
      var cosB = Math.cos(B), sinB = Math.sin(B);

      var scaleX = Math.min(cols, rows * 1.65) * 0.55;
      var scaleY = scaleX * 0.58;

      for (var theta = 0; theta < 6.28; theta += 0.09) {
        var ct = Math.cos(theta), st = Math.sin(theta);
        for (var phi = 0; phi < 6.28; phi += 0.035) {
          var cp = Math.cos(phi), sp = Math.sin(phi);
          var cx = 2 + 0.92 * ct;
          var cy = 0.92 * st;

          var x = cx * (cosB * cp + sinA * sinB * sp) - cy * cosA * sinB;
          var y = cx * (sinB * cp - sinA * cosB * sp) + cy * cosA * cosB;
          var z = 5.2 + cosA * cx * sp + cy * sinA;
          var ooz = 1 / z;

          var xp = Math.floor(cols / 2 + scaleX * ooz * x);
          var yp = Math.floor(rows / 2 - scaleY * ooz * y);

          var L = cp * ct * sinB - cosA * ct * sp - sinA * st + cosB * (cosA * st - ct * sinA * sp);
          if (xp >= 0 && xp < cols && yp >= 0 && yp < rows) {
            var idx = xp + yp * cols;
            if (ooz > zbuf[idx]) {
              zbuf[idx] = ooz;
              lbuf[idx] = L > 0 ? L : 0.05;
            }
          }
        }
      }

      ctx.font = '600 11.5px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var id = c + r * cols;
          var lum = lbuf[id];
          if (lum <= 0) continue;
          var norm = Math.min(1, lum / 1.35);
          var ch = RAMP[Math.min(RAMP.length - 1, Math.floor(norm * (RAMP.length - 1)))];
          if (ch === ' ') continue;
          ctx.fillStyle = norm > 0.72 ? '#e5b567' : (norm > 0.4 ? '#d8dce3' : '#585e6a');
          ctx.fillText(ch, c * cellW + cellW * 0.5, r * cellH + cellH * 0.5);
        }
      }
    }

    function drawPortrait(time) {
      ctx.fillStyle = '#060709';
      ctx.fillRect(0, 0, w, h);
      if (!portraitGrid) {
        drawWave(time);
        return;
      }

      var stepX = w / portraitCols;
      var stepY = h / portraitRows;
      var t = prefersReduced ? 0 : time * 0.002;
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (var r = 0; r < portraitRows; r++) {
        for (var c = 0; c < portraitCols; c++) {
          var off = (r * portraitCols + c) * 4;
          var lum = (0.299 * portraitGrid[off] + 0.587 * portraitGrid[off + 1] + 0.114 * portraitGrid[off + 2]) / 255;
          var x = (c + 0.5) * stepX;
          var y = (r + 0.5) * stepY;

          var boost = 0;
          if (pointer.active) {
            var d = dist2d(x, y, pointer.x, pointer.y);
            if (d < 110) boost = (1 - d / 110) * 0.45;
          }
          var shimmer = Math.sin(c * 0.25 + r * 0.15 - t) * 0.04;
          var v = Math.min(1, Math.max(0, lum * 1.12 + boost + shimmer));
          var idx = Math.floor(v * (RAMP.length - 1));
          var ch = RAMP[idx];
          if (ch === ' ') continue;

          ctx.fillStyle = boost > 0.14 ? '#e5b567' : (v > 0.65 ? '#ecece8' : (v > 0.36 ? '#8f95a0' : '#434852'));
          ctx.fillText(ch, x, y);
        }
      }
    }

    function drawWave(time) {
      ctx.fillStyle = '#060709';
      ctx.fillRect(0, 0, w, h);

      var stepX = 11;
      var stepY = 15;
      var t = prefersReduced ? 0 : time * 0.0018;
      ctx.font = '600 11.5px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (var k = ripples.length - 1; k >= 0; k--) {
        ripples[k].r += 4.5;
        ripples[k].alpha *= 0.95;
        if (ripples[k].alpha < 0.03) ripples.splice(k, 1);
      }

      for (var y = stepY / 2; y < h; y += stepY) {
        for (var x = stepX / 2; x < w; x += stepX) {
          var v = (Math.sin(x * 0.025 + t) + Math.cos(y * 0.028 - t * 0.85) + Math.sin((x + y) * 0.015 + t * 0.6)) / 6 + 0.42;
          var highlight = false;

          if (pointer.active) {
            var dp = dist2d(x, y, pointer.x, pointer.y);
            if (dp < 120) {
              v += (1 - dp / 120) * 0.65;
              if (dp < 70) highlight = true;
            }
          }

          for (var i = 0; i < ripples.length; i++) {
            var rp = ripples[i];
            var dr = Math.abs(dist2d(x, y, rp.x, rp.y) - rp.r);
            if (dr < 24) {
              v += (1 - dr / 24) * rp.alpha * 0.8;
              highlight = true;
            }
          }

          v = Math.min(1, Math.max(0, v));
          var ch = RAMP[Math.floor(v * (RAMP.length - 1))];
          if (ch === ' ') continue;
          ctx.fillStyle = highlight || v > 0.82 ? '#e5b567' : (v > 0.52 ? '#cfd4dc' : '#4a505c');
          ctx.fillText(ch, x, y);
        }
      }
    }

    function loop(time) {
      if (!paused) {
        if (mode === 'torus') drawTorus(time);
        else if (mode === 'portrait') drawPortrait(time);
        else drawWave(time);
      }
      requestAnimationFrame(loop);
    }

    resize();
    setMode(mode);
    requestAnimationFrame(loop);

    return { setMode: setMode };
  }

  function initNav() {
    var toggle = document.getElementById('rf-menu-toggle');
    var drawer = document.getElementById('rf-mobile-drawer');
    if (toggle && drawer) {
      toggle.addEventListener('click', function () {
        var open = drawer.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      drawer.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          drawer.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    document.querySelectorAll('[data-replay-intro]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        runLoader(true);
      });
    });
  }

  function initTerminal(getLang) {
    var output = document.getElementById('rf-cli-out');
    var input = document.getElementById('rf-cli-input');
    if (!output || !input) return;

    function appendLine(html) {
      var div = document.createElement('div');
      div.className = 'rf-cli-line';
      div.innerHTML = html;
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
    }

    function runCommand(raw) {
      var cmd = raw.trim().toLowerCase();
      if (!cmd) return;
      var ru = getLang && getLang() === 'ru';
      appendLine('<span class="rf-cli-prompt">rafych@dev</span>:<span class="rf-cli-path">~</span>$ ' + raw.replace(/</g, '&lt;'));

      if (cmd === 'help') {
        appendLine('torus | portrait | wave | ascii | whoami | stack | intro | clear');
      } else if (cmd === 'torus' || cmd === 'portrait' || cmd === 'wave') {
        if (heroController) heroController.setMode(cmd);
        appendLine('<span class="rf-cli-dim"># canvas -> ' + cmd + '</span>');
      } else if (cmd === 'whoami') {
        appendLine(ru ? 'Данил (@Rafych) — full-stack, сети, Linux, AI' : 'Danil (@Rafych) — full-stack, networking, Linux, AI');
      } else if (cmd === 'stack') {
        appendLine('HTML 100% · JS 90% · CSS 85% · PHP 80% · Linux 70% · Network 50%');
      } else if (cmd === 'ascii') {
        appendLine('<pre class="rf-cli-ascii">  ____        __            _\n |  _ \\ __ _ / _|_   _  ___| |__\n | |_) / _` | |_| | | |/ __| \'_ \\\n |  _ < (_| |  _| |_| | (__| | | |\n |_| \\_\\__,_|_|  \\__, |\\___|_| |_|\n                 |___/</pre>');
      } else if (cmd === 'intro') {
        runLoader(true);
      } else if (cmd === 'clear') {
        output.innerHTML = '';
      } else {
        appendLine('<span class="rf-cli-dim">command not found: ' + cmd.replace(/</g, '&lt;') + ' (type "help")</span>');
      }
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        runCommand(input.value);
        input.value = '';
      }
    });

    document.querySelectorAll('[data-term-cmd]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        runCommand(chip.getAttribute('data-term-cmd'));
      });
    });
  }

  function initCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        copyText(btn.getAttribute('data-copy'));
      });
    });
  }

  return {
    init: function (opts) {
      opts = opts || {};
      initNav();
      initCopyButtons();
      if (opts.asciiStage) heroController = initAsciiStage();
      if (opts.terminal) initTerminal(opts.getLang);
      if (opts.loader) runLoader(false);
    },
    runLoader: runLoader
  };
})();
