window.RafychCache = (function () {
  function probe(name) {
    try {
      var s = window[name];
      s.setItem('__rf', '1');
      s.removeItem('__rf');
      return s;
    } catch (e) {
      return null;
    }
  }

  var session = probe('sessionStorage');
  var local = probe('localStorage');

  function read(store, key, ttlMs) {
    if (!store) return null;
    try {
      var entry = JSON.parse(store.getItem(key));
      if (!entry || (ttlMs && Date.now() - entry.t > ttlMs)) return null;
      return entry.v;
    } catch (e) {
      return null;
    }
  }

  function write(store, key, value) {
    if (!store) return;
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

  return { session: session, local: local, withCache: withCache };
})();
