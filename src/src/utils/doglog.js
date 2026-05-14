import { datadogLogs } from '@datadog/browser-logs';

let _globalContext = {};
let _initialized = false;
const DD_SERVICE = process.env.REACT_APP_DD_SERVICE || 'site:ingest_ui';
const DD_ENV =  process.env.REACT_APP_NODE_ENV === 'local' ? 'env:local:galah' : `env:${process.env.REACT_APP_NODE_ENV}`
const DD_VERSION =  process.env.npm_package_version
const DD_HOST = process.env.REACT_APP_DD_HOST || ((typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : undefined);
const DOGLOG_SCHEMA_VERSION = 'v2';
// marker property used to avoid duplicate logging of the same Error/object
const LOGGED_FLAG = '__ddlog_logged__';

const _consoleWarnOriginal = console.warn.bind(console);

function normalizeLevel(level){
  return ['debug', 'info', 'warn', 'error'].includes(level) ? level : 'info';
}

function safeOneLineMessage(message){
  const raw = (typeof message === 'string' ? message : String(message || ''));
  const msg = raw.replace(/\r?\n+/g, ' ').trim();
  return msg || 'Log event';
}

function trimText(value, max = 5000){
  const s = String(value);
  return s.length > max ? `${s.slice(0, max)}…[truncated]` : s;
}

function serializeAny(value, maxLen = 2000){
  if(value === null || value === undefined) return value;
  if(value instanceof Error){
    return {
      kind: value.name || 'Error',
      message: trimText(value.message || String(value), 1000),
      stack: value.stack ? trimText(value.stack, 8000) : undefined,
    };
  }
  const t = typeof value;
  if(t === 'string') return trimText(value, maxLen);
  if(t === 'number' || t === 'boolean') return value;
  if(t === 'function') return `[Function:${value.name || 'anonymous'}]`;
  if(t === 'symbol') return String(value);

  try{
    const seen = new WeakSet();
    const raw = JSON.stringify(value, (k, v) => {
      if(v instanceof Error){
        return { kind: v.name || 'Error', message: v.message, stack: v.stack };
      }
      if(typeof v === 'function') return `[Function:${v.name || 'anonymous'}]`;
      if(typeof v === 'symbol') return String(v);
      if(typeof v === 'bigint') return v.toString();
      if(v && typeof v === 'object'){
        if(seen.has(v)) return '[Circular]';
        seen.add(v);
      }
      return v;
    });
    return raw && raw.length > maxLen ? `${raw.slice(0, maxLen)}…[truncated]` : raw;
  }catch(e){
    return trimText(String(value), maxLen);
  }
}

function extractFirstError(args = []){
  for(const a of args){
    if(a instanceof Error) return a;
  }
  return undefined;
}

function summarizeArgs(args = [], limit = 6){
  return args.slice(0, limit).map((a, i) => ({ index: i, type: a instanceof Error ? 'Error' : typeof a, value: serializeAny(a) }));
}

// Filter helpers: ignore noisy React Router Future Flag warnings
function isReactRouterFutureFlagWarning(value){
  try{
    if(!value) return false;
    if(typeof value === 'string') return /React Router Future Flag Warning/i.test(value);
    if(value instanceof Error && typeof value.message === 'string') return /React Router Future Flag Warning/i.test(value.message);
    // if it's a JSON/stringified thing, stringify and test
    const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /React Router Future Flag Warning/i.test(s);
  }catch(e){
    return false;
  }
}

function shouldIgnoreMessage(level, message, meta){
  const lv = normalizeLevel(level);
  if(lv !== 'warn') return false;
  if(isReactRouterFutureFlagWarning(message)) return true;
  if(meta && Array.isArray(meta.args)){
    for(const a of meta.args){
      if(isReactRouterFutureFlagWarning(a)) return true;
    }
  }
  // also inspect meta.message or meta.msg if present
  if(meta && (isReactRouterFutureFlagWarning(meta.message) || isReactRouterFutureFlagWarning(meta.msg))) return true;
  return false;
}

function isAlreadyLogged(obj){
  try{
    return !!(obj && typeof obj === 'object' && obj[LOGGED_FLAG]);
  }catch(e){
    return false;
  }
}

function markAsLogged(obj, marker = true){
  try{
    if(!obj || typeof obj !== 'object') return false;
    if(Object.isExtensible && !Object.isExtensible(obj)) return false;
    try{
      Object.defineProperty(obj, LOGGED_FLAG, { value: marker, configurable: true, enumerable: false, writable: true });
      return true;
    }catch(e){
      // fallback to direct assignment if defineProperty fails
      try{ obj[LOGGED_FLAG] = marker; return true; }catch(e2){ return false; }
    }
  }catch(e){ return false; }
}

function buildStructuredPayload({ level, message, source, meta, args, error }){
  const payload = {
    schema_version: DOGLOG_SCHEMA_VERSION,
    event_type: 'frontend_log',
    log: {
      level: normalizeLevel(level),
      source: source || 'app',
      logger: 'doglog',
      ts: new Date().toISOString(),
    },
    app: {
      service: DD_SERVICE,
      env: DD_ENV,
      version: DD_VERSION,
      host: DD_HOST,
    },
    message: safeOneLineMessage(message),
    message_full: serializeAny(message, 8000),
    _dd_global: _globalContext,
  };

  if(args && args.length){
    payload.console = {
      args_count: args.length,
      args_preview: summarizeArgs(args),
    };
  }

  if(error instanceof Error){
    payload.error = serializeAny(error, 8000);
  }

  if(meta && typeof meta === 'object'){
    // Copy meta shallowly to avoid mutating caller objects when normalizing
    payload.meta = Object.assign({}, meta);
    // Normalize non-object meta.error to structured object
    try{
      if(payload.meta.error && typeof payload.meta.error !== 'object'){
        payload.meta.error = { message: serializeAny(payload.meta.error, 2000) };
      }
      // If axios_error is present, prefer setting kind to 'axios'
      if(payload.meta.axios_error && (!payload.meta.error || !payload.meta.error.kind)){
        payload.meta.error = Object.assign({}, payload.meta.error || {}, { kind: 'axios' });
      }
      // If api_alert meta exists, mark its kind
      if(payload.meta.api_alert && (!payload.meta.error || !payload.meta.error.kind)){
        payload.meta.error = Object.assign({}, payload.meta.error || {}, { kind: 'api_alert' });
      }
      // If source is set and error.kind still missing, use source hint
      if(payload.meta.source && payload.meta.error && !payload.meta.error.kind){
        payload.meta.error.kind = String(payload.meta.source).replace(/[^a-zA-Z0-9_\-]/g,'_');
      }
      // If meta.reason present (from unhandledrejection), normalize
      if(payload.meta.reason && !payload.meta.error){
        payload.meta.error = typeof payload.meta.reason === 'object' ? payload.meta.reason : { message: serializeAny(payload.meta.reason, 2000) };
      }
    }catch(e){ /* ignore normalization errors */ }
  }

  // Ensure any error objects include an `kind` field for consistent Datadog querying.
  try{
    // Normalize kind fields: prefer explicit kinds from meta, then error objects, then fallbacks.
    const metaErr = payload.meta && typeof payload.meta.error === 'object' ? payload.meta.error : undefined;
    if(metaErr && metaErr.kind){
      // Promote meta.error.kind into payload.error for easier querying in Datadog
      if(!payload.error || typeof payload.error !== 'object') payload.error = {};
      payload.error.kind = metaErr.kind;
      if(!payload.error.message && metaErr.message) payload.error.message = metaErr.message;
      if(!payload.error.stack && metaErr.stack) payload.error.stack = metaErr.stack;
    }
    if(payload.error && typeof payload.error === 'object' && !payload.error.kind){
      payload.error.kind = payload.error.name || payload.error.type || 'unknown_error';
    }
    if(payload.meta && payload.meta.error && typeof payload.meta.error === 'object' && !payload.meta.error.kind){
      payload.meta.error.kind = payload.meta.error.name || payload.meta.error.type || 'unknown_error';
    }
    // Also populate `error.type` for Datadog field/tag compatibility when missing.
    if(payload.error && typeof payload.error === 'object' && !payload.error.type){
      payload.error.type = payload.error.kind || payload.error.name || 'error';
    }
    if(payload.meta && payload.meta.error && typeof payload.meta.error === 'object' && !payload.meta.error.type){
      payload.meta.error.type = payload.meta.error.kind || payload.meta.error.name || 'error';
    }
    // Add a top-level error_kind field for easier Datadog facets / queries
    try{
      if(payload.error && payload.error.kind){
        payload.error_kind = String(payload.error.kind);
      } else if(payload.meta && payload.meta.error && payload.meta.error.kind){
        payload.error_kind = String(payload.meta.error.kind);
      }
    }catch(e){}
  }catch(e){/* ignore */}

  return payload;
}

function sendToDatadog(level, message, payload, errorObj){
  const ddLevel = normalizeLevel(level);
  const safeMessage = safeOneLineMessage(message);
  try{
    // Temporary local dump: prints the full structured payload to the browser console
    // when `window.__DOGLOG_LOCAL_DUMP__` is truthy or the env var REACT_APP_DOGLOG_LOCAL_DUMP is set to '1'.
    try{
      const runtimeDump = (typeof window !== 'undefined' && (window.__DOGLOG_LOCAL_DUMP__ || String(process.env.REACT_APP_DOGLOG_LOCAL_DUMP) === '1'));
      if(runtimeDump){
        try{
          if(console.groupCollapsed) console.groupCollapsed(`[DOGLOG DUMP] ${ddLevel} - ${safeMessage}`);
          console.log('DOGLOG_PAYLOAD', payload);
          if(errorObj) console.log('DOGLOG_ERROR_OBJ', errorObj);
          if(console.groupEnd) console.groupEnd();
        }catch(e){ /* swallow debug dump errors */ }
      }
    }catch(e){ /* ignore dump gating errors */ }
    if(datadogLogs && datadogLogs.logger){
      const fn = datadogLogs.logger[ddLevel];
      if(typeof fn === 'function'){
        // Browser Logs SDK supports optional Error as the third parameter.
        fn.call(datadogLogs.logger, safeMessage, payload, errorObj instanceof Error ? errorObj : undefined);
        if(errorObj && typeof errorObj === 'object') markAsLogged(errorObj, 'datadog');
        return;
      }
      if(typeof datadogLogs.logger.log === 'function'){
        datadogLogs.logger.log(safeMessage, payload, ddLevel, errorObj instanceof Error ? errorObj : undefined);
        if(errorObj && typeof errorObj === 'object') markAsLogged(errorObj, 'datadog');
      }
    }
  }catch(e){
    _consoleWarnOriginal('Datadog logging failed', e);
  }
}

export function initDoglog(){
  // Only run this initializer once per page lifecycle.
  if(_initialized) return;
  _initialized = true;

  // Detect true SDK initialization status (the logger API object exists pre-init).
  let sdkInitialized = false;
  try{
    if(typeof window !== 'undefined' && window.__DD_LOGS_INITIALIZED__){
      sdkInitialized = true;
    }else if(datadogLogs && typeof datadogLogs.getInitConfiguration === 'function'){
      const cfg = datadogLogs.getInitConfiguration();
      sdkInitialized = !!cfg;
    }
  }catch(e){ /* ignore detection errors */ }

  if(!sdkInitialized){
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
  }else if(typeof window !== 'undefined'){
    window.__DD_LOGS_INITIALIZED__ = true;
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
    if(typeof a0 === 'string'){
      const s = a0.replace(/\r?\n+/g, ' ');
      return s.length>200 ? s.slice(0,200) + '...' : s;
    }
    try{
      const s = JSON.stringify(a0);
      return s.length>200 ? s.slice(0,200) + '...' : s;
    }catch(e){ return String(a0); }
  }

  function safeSend(level, message, meta){
    if(shouldIgnoreMessage(level, message, meta)) return;
    const maybeError = meta && meta.error instanceof Error ? meta.error : undefined;
    // ensure errors include a kind when possible
    try{ if(maybeError && !maybeError.kind){ maybeError.kind = meta?.source || 'error'; } }catch(e){}
    if(maybeError && isAlreadyLogged(maybeError)) return;
    const payload = buildStructuredPayload({ level, message, source: meta?.source || 'app', meta, args: meta?.args || [], error: maybeError });
    // Mark error as logged before sending to prevent other wrappers from duplicating the event
    if(maybeError) markAsLogged(maybeError, meta?.source || 'doglog');
    sendToDatadog(level, message, payload, maybeError);
  }

  // Avoid double-wrapping console methods (HMR / re-entry safety).
  if(typeof window !== 'undefined' && window.__DOGLOG_CONSOLE_WRAPPED__){
    return;
  }
  if(typeof window !== 'undefined'){
    window.__DOGLOG_CONSOLE_WRAPPED__ = true;
  }

  // wrap console methods
  console.error = (...args) => {
    const msg = firstArgToMessage(args) || 'console.error';
    const errorObj = extractFirstError(args);
    safeSend('error', msg, {
      source: 'console.error',
      args: makeArgsSafe(args),
      error: errorObj,
      arg_types: args.map((a) => (a instanceof Error ? 'Error' : typeof a)),
    });
    _consoleError(...args);
  };
  // Capture warn as well with compact structured context.
  console.warn = (...args) => {
    const msg = firstArgToMessage(args) || 'console.warn';
    const errorObj = extractFirstError(args);
    safeSend('warn', msg, {
      source: 'console.warn',
      args: makeArgsSafe(args),
      error: errorObj,
      arg_types: args.map((a) => (a instanceof Error ? 'Error' : typeof a)),
    });
    _consoleWarn(...args);
  };
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
    const safeLevel = normalizeLevel(level);
    if(shouldIgnoreMessage(safeLevel, message, meta)) return;
    const maybeError = meta && meta.error instanceof Error ? meta.error : undefined;
    try{ if(maybeError && !maybeError.kind){ maybeError.kind = meta?.source || 'error'; } }catch(e){}
    if(maybeError && isAlreadyLogged(maybeError)) return;
    const payload = buildStructuredPayload({
      level: safeLevel,
      message,
      source: meta?.source || 'ddLog',
      meta,
      args: meta?.args || [],
      error: maybeError,
    });
    if(maybeError) markAsLogged(maybeError, meta?.source || 'ddLog');
    sendToDatadog(safeLevel, message, payload, maybeError);
  }catch(e){
    _consoleWarnOriginal('ddLog failed', e);
  }
}

export default { initDoglog, ddLog };
