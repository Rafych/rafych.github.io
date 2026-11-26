window.RafychBlog = (function () {
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  var request = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  }

  function fetchAllPosts() {
    if (!request) {
      request = fetch('/search.json', { cache: 'no-cache' })
        .then(function (res) { return res.ok ? res.json() : []; })
        .then(function (data) {
          return Array.isArray(data) ? data.map(function (p) { return { name: p.title || '', url: p.url, date: p.date || '' }; }) : [];
        })
        .catch(function () { return []; });
    }
    return request;
  }

  function createListController(o) {
    var pageSize = o.pageSize || 10;
    var posts = null;
    var query = '';
    var page = 0;

    function itemHtml(p) {
      return '<a class="blog-item" href="' + esc(p.url) + '">' +
        '<span class="blog-item-title">' + esc(p.name) + '</span>' +
        (p.date ? '<span class="blog-item-date">' + esc(p.date) + '</span>' : '') +
      '</a>';
    }

    function pagButton(label, delta) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', function () {
        page += delta;
        render();
      });
      return b;
    }

    function render() {
      var d = o.dict();
      if (!posts) {
        o.listEl.innerHTML = '<div class="blog-empty">' + esc(d.loading) + '</div>';
        return;
      }
      var q = query.toLowerCase();
      var pool = o.excludeUrl ? posts.filter(function (p) { return p.url !== o.excludeUrl; }) : posts;
      var list = q ? pool.filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1; }) : pool;
      var paginate = !!q || !o.defaultLimit;

      if (o.pagEl) {
        o.pagEl.innerHTML = '';
        o.pagEl.style.display = 'none';
      }

      if (!list.length) {
        o.listEl.innerHTML = '<div class="blog-empty">' + esc(q ? d.noResults : d.empty) + '</div>';
        return;
      }

      var start = paginate ? page * pageSize : 0;
      var items = list.slice(start, start + (paginate ? pageSize : o.defaultLimit));
      o.listEl.innerHTML = items.map(itemHtml).join('');

      if (!paginate || !o.pagEl) return;
      if (page > 0) o.pagEl.appendChild(pagButton(d.prevBtn, -1));
      if (start + pageSize < list.length) o.pagEl.appendChild(pagButton(d.nextBtn, 1));
      if (o.pagEl.firstChild) o.pagEl.style.display = '';
    }

    return {
      load: function () {
        render();
        return fetchAllPosts().then(function (data) {
          posts = data;
          page = 0;
          render();
        });
      },
      setQuery: function (q) {
        query = q;
        page = 0;
        render();
      },
      render: render
    };
  }

  return { fetchAllPosts: fetchAllPosts, createListController: createListController };
})();
