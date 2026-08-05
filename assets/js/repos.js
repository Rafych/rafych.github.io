window.RafychRepos = (function () {
  var TAG_PALETTE = ['blue-tag', 'green-tag', 'orange-tag', 'pink-tag', 'purple-tag', 'yellow-tag'];
  var LANG_ICONS = {
    JavaScript: '🟨', TypeScript: '🔷', HTML: '🧱', CSS: '🎨', PHP: '🐘',
    Python: '🐍', Shell: '🐚', C: '🔩', 'C++': '🔩', 'C#': '🎯', Java: '☕',
    Kotlin: '🟣', Swift: '🐦', Go: '🐹', Rust: '🦀', Ruby: '💎', Dart: '🎯',
    Vue: '🌿', React: '⚛️', Lua: '🌙', Perl: '🐪', Scala: '🔺', Elixir: '💧',
    Haskell: 'λ', R: '📊', 'Objective-C': '🍎', Assembly: '⚙️', Dockerfile: '🐳',
    Makefile: '🛠️', Vim: '📗', Nix: '❄️', Zig: '⚡', Julia: '🔮', Solidity: '🪙',
    SCSS: '🎀', Jupyter: '📓', MATLAB: '🧮', PowerShell: '💠'
  };
  var FALLBACK_EMOJIS = ['📦', '🧩', '🚀', '🛰️', '🧠', '🔧', '🗂️', '🧵', '🎛️', '🪐', '🧭', '🔬', '🎯', '🧱', '📡', '🌱'];

  function hashString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  function emojiFor(repo) {
    if (repo.language && LANG_ICONS[repo.language]) return LANG_ICONS[repo.language];
    var key = repo.language || repo.name;
    return FALLBACK_EMOJIS[hashString(key) % FALLBACK_EMOJIS.length];
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function createController(opts) {
    var gridEl = opts.gridEl;
    var statusEl = opts.statusEl;
    var moreBtnEl = opts.moreBtnEl;
    var username = opts.username;
    var excludeNames = (opts.excludeNames || []).map(function (n) { return n.toLowerCase(); });
    var pageSize = opts.pageSize || 6;
    var getDict = opts.dict;
    var getLang = opts.lang;

    var cachedRepos = null;
    var visibleCount = pageSize;

    function cardHtml(repo, index) {
      var d = getDict();
      var tagClass = TAG_PALETTE[index % TAG_PALETTE.length];
      var icon = emojiFor(repo);
      var desc = escapeHtml(repo.description ? repo.description : d['proj-nodesc']);
      var lang = repo.language ? '<span class="tag">' + escapeHtml(repo.language) + '</span>' : '';
      return (
        '<div class="project-card">' +
          '<div class="repo-top">' +
            '<div class="icon-tag ' + tagClass + '">' + icon + '</div>' +
            '<span class="stars">★ ' + repo.stargazers_count + '</span>' +
          '</div>' +
          '<h3>' + escapeHtml(repo.name) + '</h3>' +
          '<p>' + desc + '</p>' +
          '<div class="tag-row">' +
            lang +
            '<span class="tag">' + d['proj-updated'] + ': ' + window.RafychLang.formatDate(repo.updated_at, getLang()) + '</span>' +
          '</div>' +
          '<a class="repo-link" href="' + repo.html_url + '" target="_blank" rel="noopener noreferrer">GitHub →</a>' +
        '</div>'
      );
    }

    function render(repos) {
      var d = getDict();
      if (!repos.length) {
        statusEl.textContent = d['proj-empty'];
        statusEl.classList.remove('is-error');
        statusEl.style.display = 'block';
        gridEl.innerHTML = '';
        moreBtnEl.style.display = 'none';
        return;
      }
      statusEl.style.display = 'none';
      var visible = repos.slice(0, visibleCount);
      moreBtnEl.textContent = d['proj-more'];
      moreBtnEl.style.display = visibleCount < repos.length ? 'inline-block' : 'none';
      gridEl.innerHTML = visible.map(cardHtml).join('');
    }

    moreBtnEl.addEventListener('click', function () {
      visibleCount += pageSize;
      if (cachedRepos) render(cachedRepos);
    });

    return {
      load: function () {
        var cacheKey = 'rafych:repos:' + username;
        var cacheTtlMs = 10 * 60 * 1000;
        return RafychCache.withCache(RafychCache.local, cacheKey, cacheTtlMs, function () {
          return fetch('https://api.github.com/users/' + username + '/repos?sort=updated&per_page=100')
            .then(function (res) {
              if (!res.ok) throw new Error('GitHub API error: ' + res.status);
              return res.json();
            });
        })
          .then(function (data) {
            var repos = data
              .filter(function (r) { return !r.fork; })
              .filter(function (r) { return excludeNames.indexOf(r.name.toLowerCase()) === -1; })
              .sort(function (a, b) { return b.stargazers_count - a.stargazers_count; });
            cachedRepos = repos;
            render(repos);
          })
          .catch(function () {
            var d = getDict();
            statusEl.textContent = d['proj-error'];
            statusEl.classList.add('is-error');
            statusEl.style.display = 'block';
          });
      },
      render: function () { if (cachedRepos) render(cachedRepos); }
    };
  }

  return { createController: createController };
})();
