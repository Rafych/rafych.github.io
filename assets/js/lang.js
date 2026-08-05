window.RafychLang = (function () {
  var SUPPORTED_LANGS = ['en', 'ru'];

  function detect(fallbackLang) {
    try {
      var saved = localStorage.getItem('lang');
      if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (e) {}
    var browserLangs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ''];
    for (var i = 0; i < browserLangs.length; i++) {
      var bl = browserLangs[i];
      if (!bl) continue;
      var code = bl.toLowerCase().split('-')[0];
      if (SUPPORTED_LANGS.includes(code)) return code;
    }
    if (fallbackLang) {
      var fbCode = fallbackLang.toLowerCase().split('-')[0];
      if (SUPPORTED_LANGS.includes(fbCode)) return fbCode;
    }
    return 'en';
  }

  function apply(dict, lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    if (dict.title) document.title = dict.title;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.placeholder = dict[key];
    });
  }

  function formatDate(iso, lang) {
    var d = new Date(iso);
    return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return {
    SUPPORTED_LANGS: SUPPORTED_LANGS,
    detect: detect,
    apply: apply,
    formatDate: formatDate
  };
})();
