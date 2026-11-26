window.RafychLang = (function () {
  var SUPPORTED = ['en', 'ru'];

  function norm(code) {
    return code ? String(code).toLowerCase().split('-')[0] : '';
  }

  function detect(fallback) {
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      if (SUPPORTED.indexOf(norm(list[i])) !== -1) return norm(list[i]);
    }
    return SUPPORTED.indexOf(norm(fallback)) !== -1 ? norm(fallback) : 'en';
  }

  function apply(dict, lang) {
    document.documentElement.setAttribute('lang', lang);
    if (dict.title) document.title = dict.title;
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (dict[key] !== undefined) nodes[i].textContent = dict[key];
    }
    nodes = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < nodes.length; j++) {
      var pk = nodes[j].getAttribute('data-i18n-placeholder');
      if (dict[pk] !== undefined) nodes[j].setAttribute('placeholder', dict[pk]);
    }
  }

  function formatDate(iso, lang) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    try {
      return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  return { SUPPORTED_LANGS: SUPPORTED, detect: detect, apply: apply, formatDate: formatDate };
})();
