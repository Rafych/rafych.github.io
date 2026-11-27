window.RafychFX = (function () {
  var RAMP = ' .,:;i1tfLCG08@';
  var TOP = RAMP.length - 1;
  var FONT = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
  var BG = '#060709';
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (cb) { return setTimeout(cb, 16); };
  var caf = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : clearTimeout;
  var EV = window.PointerEvent ? ['pointermove', 'pointerleave'] : ['mousemove', 'mouseleave'];

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  function prepare(canvas, w, h, fontPx) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '700 ' + fontPx + 'px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    return ctx;
  }

  function toast(text) {
    var el = document.getElementById('rf-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rf-toast';
      el.className = 'rf-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('is-show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('is-show'); }, 1600);
  }

  function copy(text) {
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        if (document.execCommand('copy')) toast('Copied: ' + text);
      } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied: ' + text); }, legacy);
    } else {
      legacy();
    }
  }

  function clamp255(v) {
    return v < 0 ? 0 : v > 255 ? 255 : (v | 0);
  }

  function initPortrait() {
    var canvas = document.getElementById('rf-ascii-canvas');
    if (!canvas || !canvas.getContext) return;

    var viewport = canvas.parentNode;
    var ctx = null;
    var w = 0;
    var h = 0;
    var cols = 0;
    var rows = 0;
    var cw = 6;
    var ch = 9;
    var cells = null;
    var rafId = 0;
    var ptr = { tx: 0, ty: 0, x: 0, y: 0, targetAlpha: 0, alpha: 0 };

    var img = new Image();
    img.onload = function () {
      sample();
      draw();
    };
    img.src = '/icon.png';

    function sample() {
      if (!img.naturalWidth || !w || !h) return;
      cols = Math.max(1, Math.floor(w / cw));
      rows = Math.max(1, Math.floor(h / ch));
      var off = document.createElement('canvas');
      off.width = cols;
      off.height = rows;
      var octx = off.getContext('2d');
      var gridAspect = (cols * cw) / (rows * ch);
      var imgAspect = img.naturalWidth / img.naturalHeight;
      var sx = 0;
      var sy = 0;
      var sw = img.naturalWidth;
      var sh = img.naturalHeight;
      if (gridAspect > imgAspect) {
        sh = sw / gridAspect;
        sy = (img.naturalHeight - sh) * 0.24;
      } else {
        sw = sh * gridAspect;
        sx = (img.naturalWidth - sw) / 2;
      }
      octx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);

      try {
        var px = octx.getImageData(0, 0, cols, rows).data;
        var ox = (w - cols * cw) / 2 + cw / 2;
        var oy = (h - rows * ch) / 2 + ch / 2;
        cells = new Array(cols * rows);
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var idx = r * cols + c;
            var p4 = idx * 4;
            var R = px[p4];
            var G = px[p4 + 1];
            var B = px[p4 + 2];
            var lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
            var contrastLum = Math.pow(lum, 0.86);
            var gi = Math.min(TOP, Math.max(1, Math.floor(contrastLum * TOP)));
            var avg = (R + G + B) / 3;
            var sat = 1.24;
            var lift = 1.12;
            var br = clamp255((avg + (R - avg) * sat) * lift);
            var bg = clamp255((avg + (G - avg) * sat) * lift);
            var bb = clamp255((avg + (B - avg) * sat) * lift);
            cells[idx] = {
              x: ox + c * cw,
              y: oy + r * ch,
              ch: RAMP.charAt(gi),
              r: br,
              g: bg,
              b: bb,
              base: 'rgb(' + br + ',' + bg + ',' + bb + ')'
            };
          }
        }
      } catch (e) {
        cells = null;
      }
    }

    function draw() {
      if (!ctx || !cells) return;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      var a = ptr.alpha;
      var rad = 115;
      var radSq = rad * rad;

      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        if (a > 0.01) {
          var dx = cell.x - ptr.x;
          var dy = cell.y - ptr.y;
          var dSq = dx * dx + dy * dy;
          if (dSq < radSq) {
            var t = 1 - Math.sqrt(dSq) / rad;
            var smooth = t * t * (3 - 2 * t) * a;
            var gain = 1 + smooth * 0.22;
            var rr = clamp255(cell.r * gain + smooth * 10);
            var gg = clamp255(cell.g * gain + smooth * 8);
            var bb = clamp255(cell.b * gain + smooth * 5);
            ctx.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')';
            ctx.fillText(cell.ch, cell.x, cell.y);
            continue;
          }
        }
        ctx.fillStyle = cell.base;
        ctx.fillText(cell.ch, cell.x, cell.y);
      }
    }

    function tick() {
      rafId = 0;
      ptr.x += (ptr.tx - ptr.x) * 0.2;
      ptr.y += (ptr.ty - ptr.y) * 0.2;
      ptr.alpha += (ptr.targetAlpha - ptr.alpha) * 0.16;
      draw();
      var moving = Math.abs(ptr.tx - ptr.x) > 0.4 || Math.abs(ptr.ty - ptr.y) > 0.4 || Math.abs(ptr.targetAlpha - ptr.alpha) > 0.008;
      if (moving && !document.hidden) {
        rafId = raf(tick);
      } else {
        ptr.x = ptr.tx;
        ptr.y = ptr.ty;
        ptr.alpha = ptr.targetAlpha;
        draw();
      }
    }

    function wake() {
      if (reduced) {
        ptr.x = ptr.tx;
        ptr.y = ptr.ty;
        ptr.alpha = ptr.targetAlpha;
        draw();
        return;
      }
      if (!rafId) rafId = raf(tick);
    }

    function resize() {
      var nw = viewport.clientWidth;
      var nh = viewport.clientHeight;
      if (!nw || !nh || (nw === w && nh === h)) return;
      w = nw;
      h = nh;
      ctx = prepare(canvas, w, h, 8.5);
      sample();
      draw();
    }

    canvas.addEventListener(EV[0], function (e) {
      var rect = canvas.getBoundingClientRect();
      var nx = e.clientX - rect.left;
      var ny = e.clientY - rect.top;
      if (ptr.alpha < 0.01) {
        ptr.x = nx;
        ptr.y = ny;
      }
      ptr.tx = nx;
      ptr.ty = ny;
      ptr.targetAlpha = 1;
      wake();
    }, { passive: true });

    canvas.addEventListener(EV[1], function () {
      ptr.targetAlpha = 0;
      wake();
    });

    canvas.addEventListener('pointercancel', function () {
      ptr.targetAlpha = 0;
      wake();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && rafId) {
        caf(rafId);
        rafId = 0;
      }
    });

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(viewport);
    } else {
      window.addEventListener('resize', resize);
    }

    resize();
  }

  function initPost(opts) {
    var root = document.querySelector('.post-content');
    if (!root) return;

    Array.prototype.forEach.call(root.querySelectorAll('table'), function (table) {
      if (table.parentNode && table.parentNode.classList && table.parentNode.classList.contains('rf-table-wrap')) return;
      var wrap = document.createElement('div');
      wrap.className = 'rf-table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    Array.prototype.forEach.call(root.querySelectorAll('pre'), function (pre) {
      if (pre.parentNode && pre.parentNode.classList && pre.parentNode.classList.contains('rf-code-wrap')) return;
      var wrap = document.createElement('div');
      wrap.className = 'rf-code-wrap';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rf-code-copy';
      btn.textContent = 'COPY';
      btn.addEventListener('click', function () {
        var code = pre.querySelector('code');
        copy((code ? code.textContent : pre.textContent).replace(/\n$/, ''));
      });
      wrap.appendChild(btn);
    });

    Array.prototype.forEach.call(root.querySelectorAll('a[href]'), function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.charAt(0) === '/') return;
      try {
        var u = new URL(href, location.href);
        if (u.origin !== location.origin) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
      } catch (e) {}
    });

    Array.prototype.forEach.call(root.querySelectorAll('img'), function (img) {
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
    });

    var toc = document.getElementById('rf-toc');
    if (toc) {
      var heads = root.querySelectorAll('h2[id], h3[id]');
      if (heads.length >= 3) {
        var ul = document.createElement('ul');
        ul.className = 'rf-toc-list';
        for (var i = 0; i < heads.length; i++) {
          var h = heads[i];
          var li = document.createElement('li');
          if (h.tagName === 'H3') li.className = 'rf-toc-sub';
          var link = document.createElement('a');
          link.href = '#' + h.id;
          link.textContent = h.textContent;
          li.appendChild(link);
          ul.appendChild(li);
        }
        var title = document.createElement('p');
        title.className = 'rf-toc-title';
        title.setAttribute('data-i18n', 'tocTitle');
        title.textContent = opts && opts.tocTitle ? opts.tocTitle : 'Contents';
        toc.innerHTML = '';
        toc.appendChild(title);
        toc.appendChild(ul);
        toc.hidden = false;
      }
    }
  }

  function initCopy() {
    each('[data-copy]', function (btn) {
      btn.addEventListener('click', function () { copy(btn.getAttribute('data-copy')); });
    });
  }

  return {
    init: function (opts) {
      opts = opts || {};
      initPost(opts);
      initCopy();
      if (opts.portrait) initPortrait();
    }
  };
})();
