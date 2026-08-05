window.RafychCache = (function () {
  function read(store, key, ttlMs) {
    try {
      var raw = store.getItem(key);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (ttlMs && Date.now() - entry.t > ttlMs) return null;
      return entry.v;
    } catch (e) {
      return null;
    }
  }

  function write(store, key, value) {
    try {
      store.setItem(key, JSON.stringify({ t: Date.now(), v: value }));
    } catch (e) {}
  }

  function withCache(store, key, ttlMs, fetcher) {
    var cached = read(store, key, ttlMs);
    if (cached !== null) return Promise.resolve(cached);
    return fetcher().then(function (value) {
      write(store, key, value);
      return value;
    });
  }

  return {
    session: window.sessionStorage,
    local: window.localStorage,
    withCache: withCache
  };
})();
