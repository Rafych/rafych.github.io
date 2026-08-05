window.RafychBlog = (function () {
  function fetchAllPosts() {
    return fetch('/search.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) return [];
        return res.json();
      })
      .then(function (data) {
        return Array.isArray(data) ? data.map(function (p) { return { name: p.title, url: p.url }; }) : [];
      })
      .catch(function () {
        return [];
      });
  }

  function createListController(opts) {
    var listEl = opts.listEl;
    var pagEl = opts.pagEl;
    var pageSize = opts.pageSize || 10;
    var defaultLimit = opts.defaultLimit || null;
    var excludeUrl = opts.excludeUrl || null;
    var getDict = opts.dict;

    var posts = [];
    var query = '';
    var page = 0;

    function itemHtml(p) {
      return '<a class="blog-item" href="' + p.url + '"><span class="blog-item-title">' + p.name + '</span></a>';
    }

    function render() {
      var d = getDict();
      var pool = excludeUrl ? posts.filter(function (p) { return p.url !== excludeUrl; }) : posts;
      var q = query.toLowerCase();
      var filtered = q ? pool.filter(function (p) { return p.name.toLowerCase().includes(q); }) : pool;

      if (!filtered.length) {
        listEl.innerHTML = '<div class="blog-empty">' + (q ? d.noResults : d.empty) + '</div>';
        if (pagEl) { pagEl.style.display = 'none'; pagEl.innerHTML = ''; }
        return;
      }

      var items, showPagination;
      if (!q && defaultLimit) {
        items = filtered.slice(0, defaultLimit);
        showPagination = false;
      } else {
        var start = page * pageSize;
        items = filtered.slice(start, start + pageSize);
        showPagination = true;
      }

      listEl.innerHTML = items.map(itemHtml).join('');

      if (!pagEl) return;
      if (!showPagination) {
        pagEl.style.display = 'none';
        pagEl.innerHTML = '';
        return;
      }

      var start2 = page * pageSize;
      var hasPrev = page > 0;
      var hasNext = start2 + pageSize < filtered.length;
      var html = '';
      if (hasPrev) html += '<button id="search-prev-btn">' + d.prevBtn + '</button>';
      if (hasNext) html += '<button id="search-next-btn">' + d.nextBtn + '</button>';
      pagEl.innerHTML = html;
      pagEl.style.display = html ? 'flex' : 'none';

      if (hasPrev) document.getElementById('search-prev-btn').addEventListener('click', function () { page--; render(); });
      if (hasNext) document.getElementById('search-next-btn').addEventListener('click', function () { page++; render(); });
    }

    return {
      load: function () {
        var d = getDict();
        listEl.innerHTML = '<div class="blog-empty">' + d.loading + '</div>';
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

  return {
    fetchAllPosts: fetchAllPosts,
    createListController: createListController
  };
})();
