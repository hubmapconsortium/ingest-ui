import axios from 'axios';
import { ddLog } from './doglog';

let _axiosDoglog_installed = false;

// shared monitored bases for both scoped and global interceptors
const _monitoredBases = [
  process.env.REACT_APP_UBKG_API_URL,
  process.env.REACT_APP_DATAINGEST_API_URL,
  process.env.REACT_APP_SEARCH_API_URL,
  process.env.REACT_APP_ENTITY_API_URL,
].filter(Boolean);

function redactHeaders(headers){
  if(!headers) return undefined;
  const out = {};
  try{
    Object.keys(headers).forEach((k)=>{
      try{
        if(String(k).toLowerCase() === 'authorization'){
          out[k] = 'REDACTED';
        }else{
          out[k] = headers[k];
        }
      }catch(e){ out[k] = 'ERROR_READING_HEADER'; }
    });
  }catch(e){ return undefined; }
  return out;
}

export function installAxiosDoglog(){
  if(_axiosDoglog_installed) return;
  _axiosDoglog_installed = true;

  const bases = _monitoredBases;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      try{
        const cfg = error && error.config ? error.config : {};

        // build full URL
        let fullUrl = cfg.url;
        try{
          if(cfg.baseURL){
            fullUrl = new URL(cfg.url, cfg.baseURL).href;
          }else if(!/^https?:\/\//.test(fullUrl)){
            fullUrl = new URL(cfg.url, window.location.origin).href;
          }
        }catch(e){ /* ignore, keep cfg.url */ }

        // bail out if URL not in our monitored bases
        const matched = bases.some(b => {
          try{ return fullUrl.startsWith(b); }catch(e){ return false; }
        });
        if(!matched){
          return Promise.reject(error);
        }

        // parse query params
        let query = undefined;
        try{
          const p = new URL(fullUrl);
          query = Object.fromEntries(p.searchParams.entries());
        }catch(e){ /* ignore */ }

        const meta = {
          url: fullUrl,
          method: cfg.method,
          status: error?.response?.status,
          request_headers: redactHeaders(cfg.headers),
          request_query: query,
          request_data: undefined,
          response_data: undefined,
        };
        try{ meta.request_data = cfg.data }catch(e){}
        try{ meta.response_data = error?.response?.data }catch(e){}
        // console.error('%c◉ AXIOS Error Captured', meta);
        // console.error(`message: 'AXIOS Error Captured', meta: ${JSON.stringify(meta)}, stack: ${error?.stack}, error: ${error}`);
        // console.error(`message: ${error?.message || 'axios error'}, ;
        ddLog('error', error?.message || 'axios error', { axios_error: meta, stack: error?.stack });
      }catch(e){
        try{ console.warn('axiosDoglog logging failed', e); }catch(_){}
      }
      return Promise.reject(error);
    }
  );
}

let _axiosGlobalErrorInstalled = false;
export function installGlobalAxiosErrorLogger(){
  if(_axiosGlobalErrorInstalled) return;
  _axiosGlobalErrorInstalled = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      try{
        const cfg = error && error.config ? error.config : {};
        let fullUrl = cfg.url;
        try{
          if(cfg.baseURL){
            fullUrl = new URL(cfg.url, cfg.baseURL).href;
          }else if(!/^https?:\/\//.test(fullUrl)){
            fullUrl = new URL(cfg.url, window.location.origin).href;
          }
        }catch(e){ /* ignore */ }

        // parse query params
        let query = undefined;
        try{
          const p = new URL(fullUrl);
          query = Object.fromEntries(p.searchParams.entries());
        }catch(e){ /* ignore */ }

        const meta = {
          url: fullUrl,
          method: cfg.method,
          status: error?.response?.status,
          timestamp: new Date().toISOString(),
          request_headers: redactHeaders(cfg.headers),
          response_headers: redactHeaders(error?.response?.headers),
          request_query: query,
          request_data: undefined,
          response_data: undefined,
          request_id: undefined,
        };
        try{ meta.request_data = cfg.data }catch(e){}
        try{ meta.response_data = error?.response?.data }catch(e){}
        try{ meta.request_id = error?.response?.headers && (error.response.headers['x-request-id'] || error.response.headers['x-amzn-requestid'] || error.response.headers['x-correlation-id']) }catch(e){}

        // If this request is already handled by the monitored (scoped) interceptor,
        // skip global logging to avoid duplicate entries.
        const matched = _monitoredBases.some(b => {
          try{ return fullUrl.startsWith(b); }catch(e){ return false; }
        });
        if(!matched){
          // Global logging for any axios error with richer metadata
          ddLog('error', error?.message || 'axios global error', { axios_error: meta, stack: error?.stack });
        }
      }catch(e){
        try{ console.warn('global axios error logger failed', e); }catch(_){}
      }
      return Promise.reject(error);
    }
  );
}

export default { installAxiosDoglog, installGlobalAxiosErrorLogger };
