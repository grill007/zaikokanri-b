// Version: github-pages-b-2026-06-26-01

window.ZAIKO_B_CONFIG = {
  appName: '在庫管理B',
  appVersion: 'github-pages-b-2026-06-26-01',

  // GAS（zaikokanri_b）のウェブアプリURL（/execで終わるURL）を設定してください。
  // 例: https://script.google.com/macros/s/AKfycb.../exec
  gasWebAppUrl: 'https://script.google.com/macros/s/AKfycbxKVDWvmuwnAdMmNlDgfT8e3EdRf0hx061TxUw7cl5W54uJXvGE5m2i78AoXC3WZucc/exec,

  // GAS側 gas_jsonp_extension.gs の API_TOKEN と同じ値を設定します。不要なら空文字。
  // JSONPはGETのため、トークンはURLに含まれます（強い秘匿性はありません）。
  apiToken: '',

  // JSONP通信の制約により、1回の発行で返せるPDFサイズに上限があります。
  // この枚数を超える場合はユーザーに分割発行を促します。
  // PHPサーバー中継版を使う場合はこの制限は不要です（0にすると無効）。
  jsonpMaxQtyPerBatch: 20,
};