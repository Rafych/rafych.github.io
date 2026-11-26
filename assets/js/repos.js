window.RafychRepos = (function () {
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  var ICONS = {
    javascript: ['#f7df1e', '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M10 9v5.5a1.5 1.5 0 0 1-3 0"/><path d="M17 10.5c0-.9-.7-1.5-1.6-1.5s-1.5.5-1.5 1.3c0 1.8 3.2 1.1 3.2 3.1 0 .9-.8 1.6-1.8 1.6s-1.7-.6-1.8-1.5"/>'],
    typescript: ['#38bdf8', '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7.5 9h5"/><path d="M10 9v6.5"/><path d="M17.5 10.5c0-.9-.7-1.5-1.6-1.5s-1.5.5-1.5 1.3c0 1.8 3.2 1.1 3.2 3.1 0 .9-.8 1.6-1.8 1.6s-1.7-.6-1.8-1.5"/>'],
    html: ['#fb923c', '<polyline points="8 7 3 12 8 17"/><polyline points="16 7 21 12 16 17"/><line x1="14" y1="5" x2="10" y2="19"/>'],
    css: ['#38bdf8', '<path d="M12 3 3 7.5 12 12l9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5 12 21l9-4.5"/>'],
    scss: ['#f472b6', '<path d="M17 7c-1.5-2-5.5-2.2-7.5-.5-1.8 1.5-1.2 4 1.5 4.8 3.2 1 4.2 3.2 2.2 5-2 1.8-6 1.5-7.7-.5"/><circle cx="17.5" cy="16.5" r="1.5"/>'],
    sass: ['#f472b6', '<path d="M17 7c-1.5-2-5.5-2.2-7.5-.5-1.8 1.5-1.2 4 1.5 4.8 3.2 1 4.2 3.2 2.2 5-2 1.8-6 1.5-7.7-.5"/><circle cx="17.5" cy="16.5" r="1.5"/>'],
    php: ['#818cf8', '<ellipse cx="12" cy="12" rx="9" ry="5.5"/><path d="M7.5 14v-4h1.6a1.1 1.1 0 0 1 0 2.2H7.5"/><path d="M11.5 14v-4"/><path d="M11.5 11.5h2v2.5"/><path d="M15.5 14v-4h1.6a1.1 1.1 0 0 1 0 2.2h-1.6"/>'],
    python: ['#60a5fa', '<path d="M12 3h2.5A2.5 2.5 0 0 1 17 5.5V9a2 2 0 0 1-2 2H9a2 2 0 0 0-2 2v3.5A2.5 2.5 0 0 0 9.5 19H12"/><path d="M12 21h-2.5A2.5 2.5 0 0 1 7 18.5V15"/><path d="M12 3H9.5A2.5 2.5 0 0 0 7 5.5V8"/><circle cx="10" cy="6" r=".8" fill="currentColor"/><circle cx="14" cy="18" r=".8" fill="currentColor"/>'],
    c: ['#93c5fd', '<polygon points="12 2.5 20 7.2 20 16.8 12 21.5 4 16.8 4 7.2"/><path d="M15 9.5a4 4 0 1 0 0 5"/>'],
    'c++': ['#60a5fa', '<path d="M11.5 8a4.5 4.5 0 1 0 0 8"/><path d="M14.5 12h3"/><path d="M16 10.5v3"/><path d="M19 12h3"/><path d="M20.5 10.5v3"/>'],
    'c#': ['#c084fc', '<path d="M11.5 8a4.5 4.5 0 1 0 0 8"/><path d="M15.5 9.5 14.5 14.5"/><path d="M19 9.5 18 14.5"/><path d="M14 11h6"/><path d="M13.5 13h6"/>'],
    java: ['#fb923c', '<path d="M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5v-4z"/><path d="M16 11h2a2 2 0 0 1 0 4h-2"/><path d="M8.5 7c0-1.5 1.5-1.5 1.5-3"/><path d="M12.5 7c0-1.5 1.5-1.5 1.5-3"/>'],
    kotlin: ['#a78bfa', '<polygon points="4 4 20 4 12 12 20 20 4 20"/>'],
    swift: ['#fb7185', '<path d="M4 17c4.5 3.5 11.5 3 15-1.5 1.2-1.5 1.5-4 .5-6.5-1.5 2.5-4 3.5-6.5 3C15.5 10 17 7 16 4c-1.5 2.5-4.5 4.5-8 5 2 1.2 4 2.8 5 4.5-3 0-6.2-1.2-9-3.5 1.2 3 2.5 5 0 7z"/>'],
    go: ['#22d3ee', '<line x1="3" y1="9" x2="8" y2="9"/><line x1="4" y1="12" x2="7.5" y2="12"/><line x1="3" y1="15" x2="8" y2="15"/><path d="M14.5 9.5a3.5 3.5 0 1 0 .5 5h-2.5"/><circle cx="19" cy="12" r="2.8"/>'],
    rust: ['#f97316', '<circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>'],
    ruby: ['#f43f5e', '<polygon points="6 4 18 4 21 9 12 20 3 9"/><line x1="3" y1="9" x2="21" y2="9"/><polyline points="8 4 12 9 16 4"/><line x1="12" y1="9" x2="12" y2="20"/>'],
    dart: ['#2dd4bf', '<polygon points="4 12 12 4 20 12 12 20"/><polyline points="12 4 12 12 20 12"/>'],
    shell: ['#4ade80', '<rect x="3" y="4" width="18" height="16" rx="2"/><polyline points="7 9 10.5 12 7 15"/><line x1="12.5" y1="15" x2="17" y2="15"/>'],
    bash: ['#4ade80', '<rect x="3" y="4" width="18" height="16" rx="2"/><polyline points="7 9 10.5 12 7 15"/><line x1="12.5" y1="15" x2="17" y2="15"/>'],
    powershell: ['#60a5fa', '<polygon points="5 4 21 4 19 20 3 20"/><polyline points="8 9 12 12 8 15"/><line x1="13" y1="15" x2="16.5" y2="15"/>'],
    sql: ['#fbbf24', '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13"/><path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>'],
    plpgsql: ['#fbbf24', '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13"/><path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>'],
    lua: ['#818cf8', '<circle cx="11" cy="13" r="7"/><circle cx="13.5" cy="10.5" r="1.8" fill="currentColor"/><circle cx="18.5" cy="5.5" r="1.5"/>'],
    perl: ['#7dd3fc', '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'],
    r: ['#60a5fa', '<line x1="4" y1="19" x2="20" y2="19"/><rect x="6" y="12" width="3" height="7"/><rect x="11" y="8" width="3" height="11"/><rect x="16" y="5" width="3" height="14"/>'],
    scala: ['#f87171', '<polygon points="5 6 19 4 19 8 5 10"/><polygon points="5 12 19 10 19 14 5 16"/><polygon points="5 18 19 16 19 20 5 22"/>'],
    elixir: ['#c084fc', '<path d="M12 3C8.5 8 6 11.5 6 14.5a6 6 0 0 0 12 0C18 11.5 15.5 8 12 3z"/><path d="M10 15.5a2 2 0 0 0 2 2"/>'],
    haskell: ['#a78bfa', '<polyline points="4 6 9 12 4 18"/><polyline points="9 6 14 12 9 18"/><line x1="14" y1="12" x2="20" y2="18"/><line x1="16" y1="10" x2="20" y2="10"/><line x1="17.5" y1="13" x2="20" y2="13"/>'],
    zig: ['#f59e0b', '<polyline points="5 6 19 6 5 18 19 18"/><polyline points="4 9 7 6"/><polyline points="17 18 20 15"/>'],
    assembly: ['#cbd5e1', '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>'],
    dockerfile: ['#38bdf8', '<rect x="4" y="11" width="4" height="3.5"/><rect x="9" y="11" width="4" height="3.5"/><rect x="14" y="11" width="4" height="3.5"/><rect x="9" y="7" width="4" height="3.5"/><path d="M3 15.5h18c-.5 3-3 4.5-8 4.5s-8.5-1.5-10-4.5z"/>'],
    makefile: ['#e5b567', '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3-3a5 5 0 0 1-6.4 6.4l-6.6 6.6a2 2 0 0 1-2.8-2.8l6.6-6.6a5 5 0 0 1 6.4-6.4l-3.2 2.8z"/>'],
    vue: ['#34d399', '<polygon points="3 5 12 20 21 5 17 5 12 13.5 7 5"/><polyline points="7 5 12 13.5 17 5"/>'],
    svelte: ['#fb923c', '<path d="M16 5.5c-2.5-1.5-6-1-7.5 1.2-1.2 1.8-.6 4.2 1.5 5l4 1.6c2.1.8 2.7 3.2 1.5 5-1.5 2.2-5 2.7-7.5 1.2"/>'],
    nix: ['#7dd3fc', '<line x1="12" y1="3" x2="12" y2="21"/><line x1="4.2" y1="7.5" x2="19.8" y2="16.5"/><line x1="19.8" y1="7.5" x2="4.2" y2="16.5"/><circle cx="12" cy="12" r="3"/>'],
    'jupyter notebook': ['#fb923c', '<ellipse cx="12" cy="12" rx="8.5" ry="3.5"/><ellipse cx="12" cy="12" rx="8.5" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="8.5" ry="3.5" transform="rotate(-60 12 12)"/>'],
    solidity: ['#94a3b8', '<polygon points="12 2.5 18 11.5 12 15 6 11.5"/><polyline points="6 14 12 21.5 18 14"/>'],
    'objective-c': ['#60a5fa', '<circle cx="10.5" cy="12" r="5.5"/><path d="M19.5 9a4 4 0 1 0 0 6"/>'],
    julia: ['#c084fc', '<circle cx="12" cy="7" r="2.6"/><circle cx="7.5" cy="16" r="2.6"/><circle cx="16.5" cy="16" r="2.6"/>'],
    markdown: ['#a8adb9', '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M6.5 15V9l2.5 3 2.5-3v6"/><path d="M16 9v6"/><polyline points="14 13 16 15 18 13"/>']
  };

  var FALLBACK_NONE = ['#9ea3ad', '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3z"/><polyline points="4 7.5 12 12 20 7.5"/><line x1="12" y1="12" x2="12" y2="21"/>'];
  var FALLBACK_OTHER = ['#e5b567', '<path d="M8 4H6a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2"/>'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  }

  function langIcon(lang) {
    var key = lang ? String(lang).toLowerCase() : '';
    var spec = key ? (ICONS[key] || FALLBACK_OTHER) : FALLBACK_NONE;
    return '<span class="repo-icon" style="color:' + spec[0] + '" title="' + esc(lang || 'Repository') + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + spec[1] + '</svg>' +
    '</span>';
  }

  function slim(r) {
    return {
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count || 0,
      updated: r.updated_at,
      url: r.html_url,
      fork: !!r.fork
    };
  }

  function createController(o) {
    var exclude = (o.excludeNames || []).map(function (n) { return n.toLowerCase(); });
    var pageSize = o.pageSize || 6;
    var visible = pageSize;
    var repos = null;
    var failed = false;

    function card(r) {
      var d = o.dict();
      return '<article class="project-card">' +
        '<div class="repo-top">' + langIcon(r.language) +
        '<span class="stars">★ ' + (r.stars | 0) + '</span></div>' +
        '<h3>' + esc(r.name) + '</h3>' +
        '<p>' + esc(r.description || d['proj-nodesc']) + '</p>' +
        '<div class="tag-row">' +
          (r.language ? '<span class="tag">' + esc(r.language) + '</span>' : '') +
          '<span class="tag">' + esc(d['proj-updated']) + ': ' + esc(RafychLang.formatDate(r.updated, o.lang())) + '</span>' +
        '</div>' +
        '<a class="repo-link" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">GitHub -&gt;</a>' +
      '</article>';
    }

    function status(text, isError) {
      o.statusEl.textContent = text || '';
      o.statusEl.className = 'projects-status' + (isError ? ' is-error' : '');
      o.statusEl.style.display = text ? '' : 'none';
    }

    function render() {
      var d = o.dict();
      if (failed) return status(d['proj-error'], true);
      if (!repos) return status(d['proj-loading']);
      if (!repos.length) {
        status(d['proj-empty']);
        o.gridEl.innerHTML = '';
        o.moreBtnEl.style.display = 'none';
        return;
      }
      status('');
      o.gridEl.innerHTML = repos.slice(0, visible).map(card).join('');
      o.moreBtnEl.textContent = d['proj-more'];
      o.moreBtnEl.style.display = visible < repos.length ? '' : 'none';
    }

    o.moreBtnEl.addEventListener('click', function () {
      visible += pageSize;
      render();
    });

    function load() {
      return RafychCache.withCache(RafychCache.local, 'rafych:repos:v2:' + o.username, 600000, function () {
        return fetch('https://api.github.com/users/' + o.username + '/repos?sort=updated&per_page=100')
          .then(function (res) {
            if (!res.ok) throw new Error(res.status);
            return res.json();
          })
          .then(function (data) { return data.map(slim); });
      })
        .then(function (data) {
          repos = data
            .filter(function (r) { return !r.fork && exclude.indexOf(String(r.name).toLowerCase()) === -1; })
            .sort(function (a, b) { return b.stars - a.stars; });
          render();
        })
        .catch(function () {
          failed = true;
          render();
        });
    }

    return { load: load, render: render };
  }

  return { createController: createController };
})();
