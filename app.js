// Version: github-pages-b-2026-06-26-01
//
// GitHub Pages（静的ホスティング）からGAS Web APIを呼ぶための共通スクリプト。
// 静的サイトはサーバー中継ができず、GAS /exec はCORS応答を返さないため、
// <script>タグによる JSONP（GET）でやり取りします。
//
// 元のGASフロントの google.script.run.xxx(args) をそのまま動かすため、
// JSONPトランスポート上に google.script.run 互換シムを用意します。

(function () {
  'use strict';

  const CONFIG = window.ZAIKO_B_CONFIG || {};
  const APP_VERSION = CONFIG.appVersion || 'github-pages-b-2026-06-26-01';
  let jsonpSeq = 0;

  function requireGasUrl() {
    const url = String(CONFIG.gasWebAppUrl || '').trim();
    if (!url || url.includes('REPLACE_WITH_DEPLOYMENT_ID')) {
      throw new Error('config.js の gasWebAppUrl を設定してください。');
    }
    return url;
  }

  // 1回のJSONP呼び出し。api=関数名, params=フラットなクエリ。
  function jsonp(api, params) {
    return new Promise((resolve, reject) => {
      let gasUrl;
      try { gasUrl = requireGasUrl(); } catch (e) { reject(e); return; }

      const callbackName = '__zaikoBJsonp' + Date.now() + '_' + (++jsonpSeq);
      const script = document.createElement('script');
      // QR発行PDFは生成に時間がかかるため長めに。
      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('GAS APIの応答がタイムアウトしました。'));
      }, 90000);

      function cleanup() {
        window.clearTimeout(timeoutId);
        try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = (data) => { cleanup(); resolve(data); };

      const url = new URL(gasUrl);
      url.searchParams.set('api', api);
      url.searchParams.set('callback', callbackName);
      url.searchParams.set('token', CONFIG.apiToken || '');
      if (params) {
        Object.keys(params).forEach((k) => {
          const v = params[k];
          if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        });
      }

      script.onerror = () => { cleanup(); reject(new Error('GAS APIを読み込めませんでした。')); };
      script.src = url.toString();
      document.body.appendChild(script);
    });
  }

  // 位置引数 → JSONP用フラットparamsへの変換。
  const ARG_MAP = {
    validateWorkerCode: (a) => ({ worker_code: a[0] }),
    getAssetStatus: (a) => ({ qr_value: a[0] }),
    recordMovement: (a) => (a[0] && typeof a[0] === 'object' ? a[0] : {}),
    getItemMasterForQr: () => ({}),
    getAppSettingsForClient: () => ({}),
    issueQrPdf: (a) => (a[0] && typeof a[0] === 'object' ? a[0] : {}),
    getStockViewData: () => ({}),
    cancelMovementLog: (a) => ({ log_id: a[0], worker_code: a[1], reason: a[2] }),
  };

  function makeRunner() {
    const handlers = { success: null, failure: null };
    const proxy = {
      withSuccessHandler: function (fn) { handlers.success = fn; return proxy; },
      withFailureHandler: function (fn) { handlers.failure = fn; return proxy; },
    };

    Object.keys(ARG_MAP).forEach(function (name) {
      proxy[name] = function () {
        const args = Array.prototype.slice.call(arguments);
        jsonp(name, ARG_MAP[name](args))
          .then(function (res) { if (handlers.success) handlers.success(res); })
          .catch(function (err) {
            if (handlers.failure) handlers.failure(err);
            else throw err;
          });
      };
    });

    return proxy;
  }

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  Object.defineProperty(window.google.script, 'run', {
    get: makeRunner,
    configurable: true,
  });

  // 画面遷移ヘルパー。GitHub Pagesでは各画面が別HTMLファイル。
  //   index → index.html / main → main.html / qr → qr.html / stock → stock.html
  window.navTo = function (page, params) {
    const file = (page && page !== 'index') ? page + '.html' : 'index.html';
    const url = new URL(file, window.location.href);
    if (params) {
      Object.keys(params).forEach(function (k) { url.searchParams.set(k, params[k]); });
    }
    window.location.href = url.toString();
  };

  // バージョン表示・タイトルの自動反映（要素があれば）。
  document.addEventListener('DOMContentLoaded', function () {
    const label = document.getElementById('versionLabel');
    if (label) label.textContent = APP_VERSION;
  });

  window.ZAIKO_B = { jsonp: jsonp, version: APP_VERSION, config: CONFIG };
})();
