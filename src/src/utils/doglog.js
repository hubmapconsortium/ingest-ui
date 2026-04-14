import { datadogLogs } from '@datadog/browser-logs';

let _globalContext = {};
let _initialized = false;
const DD_SERVICE = process.env.REACT_APP_DD_SERVICE || 'site:ingest_ui';
const DD_ENV =  process.env.REACT_APP_NODE_ENV === 'local' ? 'env:local:galah' : `env:${process.env.REACT_APP_NODE_ENV}`
const DD_VERSION =  process.env.npm_package_version
const DD_HOST = process.env.REACT_APP_DD_HOST || ((typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : undefined);

export function initDoglog(){
  if(_initialized) return;

  // Extra safeguard: if another bundle or HMR already initialized the SDK,
  // detect that (global flag or existing logger) and skip re-initializing.
  try{
    if(typeof window !== 'undefined' && window.__DD_LOGS_INITIALIZED__){
      _initialized = true;
      return;
    }
    if(datadogLogs && datadogLogs.logger && typeof datadogLogs.logger.log === 'function'){
      // SDK appears initialized already elsewhere
      if(typeof window !== 'undefined') window.__DD_LOGS_INITIALIZED__ = true;
      _initialized = true;
      return;
    }
  }catch(e){ /* ignore detection errors and proceed to init */ }

  _initialized = true;

  try{
    datadogLogs.init({
      applicationId: `${process.env.REACT_APP_DATADOG_APP_ID}` ,
      clientToken: `${process.env.REACT_APP_DATADOG_CLIENT_TOKEN}`,
      site: 'datadoghq.com',
      service: DD_SERVICE+":axios",
      env: DD_ENV,
      version: DD_VERSION,
      host:"TESTC",
      sessionSampleRate: 100,
      forwardErrorsToLogs: true,
      trackingConsent: 'granted'
    });
    if(typeof window !== 'undefined') window.__DD_LOGS_INITIALIZED__ = true;
  }catch(e){
    console.warn('Datadog init failed', e);
  }

  // try to seed a minimal user context from localStorage.info
  try{
    const infoRaw = localStorage.getItem('info');
    if(infoRaw){
      const info = JSON.parse(infoRaw);
      const user = {};
      if(info.email) user.email = info.email;
      if(info.uuid) user.id = info.uuid;
      if(Object.keys(user).length>0){
        _globalContext.user = user;
        try{ datadogLogs.logger?.setContext?.({ user }); }catch(e){}
      }
    }
  }catch(e){ /* ignore parse errors */ }

  // preserve originals
  const _consoleError = console.error.bind(console);
  const _consoleWarn = console.warn.bind(console);
  const _consoleInfo = console.info.bind(console);

  const makeArgsSafe = (args) => args.map(a => (a instanceof Error ? {message: a.message, stack: a.stack} : a));

  const firstArgToMessage = (args) => {
    if(!args || args.length===0) return undefined;
    const a0 = args[0];
    if(a0 instanceof Error) return a0.message || String(a0);
    if(typeof a0 === 'string') return a0.split('\n')[0];
    try{
      const s = JSON.stringify(a0);
      return s.length>200 ? s.slice(0,200) + '...' : s;
    }catch(e){ return String(a0); }
  }

  function safeSend(level, message, meta){
    try{
      // Ensure payload is a single object; include full stack and args as JSON string
      const base = Object.assign({}, meta || {});
      if(base.args) {
        try{ base.args_json = JSON.stringify(base.args); }catch(e){ base.args_json = String(base.args); }
        delete base.args;
      }
      // const host = DD_HOST;
      const payload = Object.assign({}, base, { _dd_global: _globalContext, service: DD_SERVICE, env: DD_ENV, version: DD_VERSION, host: "TESTA" });
      if(datadogLogs && datadogLogs.logger && typeof datadogLogs.logger[level] === 'function'){
        datadogLogs.logger[level](message, payload);
      }else if(datadogLogs && datadogLogs.logger && typeof datadogLogs.logger.log === 'function'){
        datadogLogs.logger.log(message, payload);
      }
    }catch(e){
      _consoleWarn('Datadog logging failed', e);
    }
  }

  // wrap console methods
  console.error = (...args) => {
    const msg = firstArgToMessage(args) || 'console.error';
    const safeArgs = makeArgsSafe(args);
    // include full stack if first arg is Error
    const extra = {};
    if(args[0] instanceof Error && args[0].stack){ extra.stack = args[0].stack; }
    safeSend('error', msg, Object.assign({}, { args: safeArgs }, extra));
    _consoleError(...args);
  };
  // Only capture console.error. Leave warn/info as originals to avoid noisy logs.
  console.warn = _consoleWarn;
  console.info = _consoleInfo;

  // uncaught errors
  if(!window.__doglog_onerror_installed){
    window.onerror = (message, source, lineno, colno, error) => {
      safeSend('error', 'window.onerror', { message, source, lineno, colno, stack: error?.stack });
      return false;
    };
    window.__doglog_onerror_installed = true;
  }

  // unhandled promise rejections
  if(!window.__doglog_unhandledrejection_installed){
    window.onunhandledrejection = (event) => {
      const reason = event?.reason;
      safeSend('error', 'unhandledrejection', { reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason });
    };
    window.__doglog_unhandledrejection_installed = true;
  }
}

export function ddLog(level, message, meta){
  try{
    // const host = DD_HOST;
    // datadogLogs.logger.log(<MESSAGE>,<JSON_ATTRIBUTES>,<STATUS>,<ERROR>);
    const payload = Object.assign({}, meta || {}, { _dd_global: _globalContext, service: DD_SERVICE, env: DD_ENV, version: DD_VERSION, host:DD_HOST }); // AXIOS
    if(datadogLogs && datadogLogs.logger && typeof datadogLogs.logger[level] === 'function'){
      datadogLogs.logger[level](message, payload);
    }else if(datadogLogs && datadogLogs.logger && typeof datadogLogs.logger.log === 'function'){
      datadogLogs.logger.log(message, payload);
    }
  }catch(e){
    console.warn('ddLog failed', e);
  }
}

export default { initDoglog, ddLog };
