window.RafychFX = (function () {
  var ASCII_LOGO = [
    '██████╗  █████╗ ███████╗██╗   ██╗ ██████╗██╗  ██╗',
    '██╔══██╗██╔══██╗██╔════╝╚██╗ ██╔╝██╔════╝██║  ██║',
    '██████╔╝███████║█████╗   ╚████╔╝ ██║     ███████║',
    '██╔══██╗██╔══██║██╔══╝    ╚██╔╝  ██║     ██╔══██║',
    '██║  ██║██║  ██║██║        ██║   ╚██████╗██║  ██║',
    '╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝    ╚═════╝╚═╝  ╚═╝'
  ];

  var GLYPHS = ' .:-=+*#%@';
  var COLORS = ['#5ce1e6', '#4f8cff', '#a78bfa', '#f5b951'];
  var MODES = ['particles', 'ascii', 'off'];
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    }, 2000);
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
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var barFill = el.querySelector('.rf-loader-bar-fill');
    var pctEl = el.querySelector('.rf-loader-pct');
    var statusEl = el.querySelector('.rf-loader-status');

    var cols = ASCII_LOGO[0].length;
    var rows = ASCII_LOGO.length;
    var cell = Math.max(4, Math.min(11, Math.floor((w * 0.78) / cols)));
    var startX = (w - cols * cell) / 2;
    var startY = (h - rows * cell) / 2 - 28;

    var particles = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var ch = ASCII_LOGO[r][c];
        if (ch !== ' ') {
          var angle = Math.random() * Math.PI * 2;
          var dist = Math.max(w, h) * (0.35 + Math.random() * 0.45);
          particles.push({
            x: w / 2 + Math.cos(angle) * dist,
            y: h / 2 + Math.sin(angle) * dist,
            tx: startX + c * cell + cell * 0.5,
            ty: startY + r * cell + cell * 0.5,
            vx: 0,
            vy: 0,
            ch: ch,
            size: Math.max(1.6, cell * 0.34),
            color: COLORS[(c + r * 3) % COLORS.length],
            phase: Math.random() * Math.PI * 2
          });
        }
      }
    }

    var startTime = performance.now();
    var duration = 1550;
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

    var statusSteps = [
      'CONVERGING PARTICLES',
      'DECRYPTING // RAFYCH',
      'LINK ESTABLISHED'
    ];

    function frame(now) {
      if (finished) return;
      var elapsed = now - startTime;
      var p = Math.min(1, elapsed / duration);

      ctx.fillStyle = 'rgba(7, 8, 13, 0.28)';
      ctx.fillRect(0, 0, w, h);

      var pct = Math.min(100, Math.floor(p * 100));
      if (barFill) barFill.style.width = pct + '%';
      if (pctEl) pctEl.textContent = (pct < 10 ? '0' : '') + pct + '%';
      if (statusEl) {
        statusEl.textContent = p < 0.45 ? statusSteps[0] : (p < 0.85 ? statusSteps[1] : statusSteps[2]);
      }

      var burst = p > 0.82 ? (p - 0.82) / 0.18 : 0;

      for (var i = 0; i < particles.length; i++) {
        var pt = particles[i];
        if (burst === 0) {
          pt.x += (pt.tx - pt.x) * 0.13;
          pt.y += (pt.ty - pt.y) * 0.13;
        } else {
          var dx = pt.tx - w / 2;
          var dy = pt.ty - h / 2;
          pt.x += dx * 0.065 * (1 + burst * 2);
          pt.y += dy * 0.065 * (1 + burst * 2);
        }

        var alpha = burst > 0 ? Math.max(0, 1 - burst * 1.15) : Math.min(1, 0.35 + p * 0.8);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;

        if (p > 0.42 && p < 0.86 && cell >= 6) {
          ctx.font = '700 ' + Math.round(cell * 1.05) + 'px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          var glyph = p < 0.62 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : pt.ch;
          ctx.fillText(glyph, pt.x, pt.y);
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (burst > 0) {
        ctx.globalAlpha = (1 - burst) * 0.35;
        ctx.strokeStyle = '#5ce1e6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 20, burst * Math.max(w, h) * 0.5, 0, Math.PI * 2);
        ctx.stroke();
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

  function initBackground() {
    var canvas = document.getElementById('rf-bg-canvas');
    if (!canvas) return { cycleMode: function () {} };

    var mode = 'particles';
    try {
      var saved = localStorage.getItem('rf:fxMode');
      if (saved && MODES.indexOf(saved) !== -1) mode = saved;
    } catch (e) {}
    if (prefersReduced) mode = 'off';

    var ctx = canvas.getContext('2d');
    var w = 0;
    var h = 0;
    var dpr = 1;
    var pointer = { x: -9999, y: -9999, active: false };
    var ripples = [];
    var nodes = [];
    var bursts = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var targetCount = Math.min(68, Math.max(24, Math.floor((w * h) / 22000)));
      nodes = [];
      for (var i = 0; i < targetCount; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.42,
          vy: (Math.random() - 0.5) * 0.42,
          r: 1.2 + Math.random() * 1.9,
          color: COLORS[i % COLORS.length]
        });
      }
    }

    function updateModeUI() {
      document.body.classList.toggle('rf-fx-off', mode === 'off');
      var labels = { particles: 'FX: LIGHT', ascii: 'FX: ASCII', off: 'FX: OFF' };
      document.querySelectorAll('[data-fx-toggle]').forEach(function (btn) {
        btn.textContent = labels[mode];
      });
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });

    window.addEventListener('pointerleave', function () {
      pointer.active = false;
    });

    window.addEventListener('pointerdown', function (e) {
      if (mode === 'off') return;
      ripples.push({ x: e.clientX, y: e.clientY, r: 0, alpha: 1 });
      if (ripples.length > 5) ripples.shift();
      for (var i = 0; i < 10; i++) {
        var a = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
        var sp = 1.4 + Math.random() * 2.4;
        bursts.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          color: COLORS[i % COLORS.length]
        });
      }
    }, { passive: true });

    resize();
    updateModeUI();

    function drawParticles() {
      ctx.clearRect(0, 0, w, h);
      var maxDist = w < 640 ? 95 : 135;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        if (pointer.active) {
          var dxp = pointer.x - n.x;
          var dyp = pointer.y - n.y;
          var dp = Math.hypot(dxp, dyp);
          if (dp < 170) {
            ctx.strokeStyle = 'rgba(92, 225, 230, ' + ((1 - dp / 170) * 0.24).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }

        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < maxDist) {
            ctx.strokeStyle = 'rgba(125, 162, 255, ' + ((1 - d / maxDist) * 0.16).toFixed(3) + ')';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.72;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (var b = bursts.length - 1; b >= 0; b--) {
        var bp = bursts[b];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.vx *= 0.96;
        bp.vy *= 0.96;
        bp.life -= 0.03;
        if (bp.life <= 0) {
          bursts.splice(b, 1);
          continue;
        }
        ctx.globalAlpha = bp.life;
        ctx.fillStyle = bp.color;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawAscii(time) {
      ctx.clearRect(0, 0, w, h);
      var step = w < 640 ? 28 : 24;
      var t = time * 0.0014;
      ctx.font = '600 12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (var r = ripples.length - 1; r >= 0; r--) {
        ripples[r].r += 6.5;
        ripples[r].alpha *= 0.96;
        if (ripples[r].alpha < 0.03) ripples.splice(r, 1);
      }

      for (var y = step / 2; y < h; y += step) {
        for (var x = step / 2; x < w; x += step) {
          var wave = Math.sin(x * 0.012 + t) * Math.cos(y * 0.012 - t * 0.8);
          var intensity = (wave + 1) * 0.28;

          if (pointer.active) {
            var dp = Math.hypot(x - pointer.x, y - pointer.y);
            if (dp < 180) {
              intensity += (1 - dp / 180) * 0.75;
            }
          }

          for (var k = 0; k < ripples.length; k++) {
            var rp = ripples[k];
            var dr = Math.abs(Math.hypot(x - rp.x, y - rp.y) - rp.r);
            if (dr < 36) {
              intensity += (1 - dr / 36) * rp.alpha * 0.9;
            }
          }

          intensity = Math.min(1, Math.max(0, intensity));
          if (intensity < 0.14) continue;

          var idx = Math.min(GLYPHS.length - 1, Math.floor(intensity * (GLYPHS.length - 1)));
          var ch = GLYPHS[idx];
          if (ch === ' ') continue;

          ctx.fillStyle = intensity > 0.7 ? '#5ce1e6' : (intensity > 0.45 ? '#7c8cff' : '#3a4261');
          ctx.globalAlpha = Math.min(0.65, intensity * 0.62);
          ctx.fillText(ch, x, y);
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop(time) {
      if (mode === 'particles') {
        drawParticles();
      } else if (mode === 'ascii') {
        drawAscii(time);
      }
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    function cycleMode() {
      var idx = (MODES.indexOf(mode) + 1) % MODES.length;
      mode = MODES[idx];
      try {
        localStorage.setItem('rf:fxMode', mode);
      } catch (e) {}
      if (mode === 'off') ctx.clearRect(0, 0, w, h);
      updateModeUI();
      showToast('Mode: ' + mode.toUpperCase());
    }

    document.querySelectorAll('[data-fx-toggle]').forEach(function (btn) {
      btn.addEventListener('click', cycleMode);
    });

    return { cycleMode: cycleMode };
  }

  function initSpotlight() {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest('.rf-card');
      if (!card) return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    }, { passive: true });
  }

  function initReveal() {
    var els = document.querySelectorAll('.rf-reveal');
    if (!els.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
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
    var output = document.getElementById('rf-term-output');
    var input = document.getElementById('rf-term-input');
    if (!output || !input) return;

    function appendLine(html) {
      var div = document.createElement('div');
      div.className = 'rf-term-line';
      div.innerHTML = html;
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
    }

    function runCommand(raw) {
      var cmd = raw.trim().toLowerCase();
      if (!cmd) return;
      var ru = getLang && getLang() === 'ru';
      appendLine('<span class="rf-term-prompt">rafych@dev</span>:<span class="rf-term-path">~</span>$ ' + raw.replace(/</g, '&lt;'));

      if (cmd === 'help') {
        appendLine('<span class="rf-term-accent">commands:</span> whoami, stack, ascii, fx, contact, clear');
      } else if (cmd === 'whoami') {
        appendLine(ru ? 'Данил (@Rafych) — full-stack, сети, Linux, AI' : 'Danil (@Rafych) — full-stack, networking, Linux, AI');
      } else if (cmd === 'stack') {
        appendLine('HTML · CSS · JavaScript · PHP · Linux · Networking');
      } else if (cmd === 'ascii') {
        appendLine('<pre class="rf-term-ascii" style="margin:4px 0;">  ____        __            _\n |  _ \\ __ _ / _|_   _  ___| |__\n | |_) / _` | |_| | | |/ __| \'_ \\\n |  _ < (_| |  _| |_| | (__| | | |\n |_| \\_\\__,_|_|  \\__, |\\___|_| |_|\n                 |___/</pre>');
      } else if (cmd === 'fx') {
        var fxBtn = document.querySelector('[data-fx-toggle]');
        if (fxBtn) fxBtn.click();
        appendLine('<span class="rf-term-comment"># toggled background FX mode</span>');
      } else if (cmd === 'contact') {
        appendLine('GitHub: @Rafych | Email: danilrafailovicivanov@proton.me');
      } else if (cmd === 'clear') {
        output.innerHTML = '';
      } else {
        appendLine('<span class="rf-term-comment">bash: ' + cmd.replace(/</g, '&lt;') + ': command not found (try "help")</span>');
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
        var text = btn.getAttribute('data-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            showToast('Copied: ' + text);
          });
        }
      });
    });
  }

  return {
    init: function (opts) {
      opts = opts || {};
      initNav();
      initBackground();
      initSpotlight();
      initReveal();
      initCopyButtons();
      if (opts.terminal) initTerminal(opts.getLang);
      if (opts.loader) runLoader(false);
    },
    runLoader: runLoader,
    showToast: showToast
  };
})();
