import log from 'xac-loglevel';
import axios from "axios";
const globalToken = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")).groups_token : null;

export const logger = {
  getBrowserInfo: () => {
    const ua = navigator.userAgent;
    let browserName = "Unknown Browser";
    let version = "Unknown Version";

    // Order matters here due to how browsers spoof user agent strings
    if (ua.indexOf("Firefox") > -1) {
      browserName = "Mozilla Firefox";
      version = ua.match(/Firefox\/([0-9.]+)/)[1];
    } else if (ua.indexOf("SamsungBrowser") > -1) {
      browserName = "Samsung Internet";
      version = ua.match(/SamsungBrowser\/([0-9.]+)/)[1];
    } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
      browserName = "Opera";
      version = ua.match(/(?:Opera|OPR)\/([0-9.]+)/)[1];
    } else if (ua.indexOf("Trident") > -1) {
      browserName = "Internet Explorer";
      version = ua.match(/rv:([0-9.]+)/)[1];
    } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
      browserName = "Microsoft Edge";
      version = ua.match(/(?:Edge|Edg)\/([0-9.]+)/)[1];
    } else if (ua.indexOf("Chrome") > -1) {
      browserName = "Google Chrome";
      version = ua.match(/Chrome\/([0-9.]+)/)[1];
    } else if (ua.indexOf("Safari") > -1) {
      browserName = "Apple Safari";
      version = ua.match(/Version\/([0-9.]+)/)[1];
    }

    return { name: browserName, version: version, meta: navigator.userAgent };
  },

  toIngest: (level, data) => {
    const body = { ...data, timestamp: (new Date()).getTime(), log_level: level, browser_info: logger.getBrowserInfo() };
    const options = {
      headers: {
        Authorization: "Bearer " + globalToken,
        "Content-Type": "application/json",
      },
    };
    let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/ingest-ui-client-logs`;
    return axios.post(url, body, options);
  },

  setLevel: (level) => {
    log.setLevel(level)
  },
  
  _all: (level, data, ...msg) => {
    if (msg[0]) {
        log[level](...msg)
      } else {
        log[level](data)
      }
      logger.toIngest(level, data)
  },

  all: {
    error: (data, ...msg) => {
      logger._all('error', data, ...msg)
    }
  },

  /**
   * Print based on console.trace
   * @param  {...any} msg
   */
  trace: (...msg) => {
    log.trace(...msg);
  },

  /**
   * Print based on console.log
   * @param  {...any} msg
   */
  debug: (...msg) => {
    log.debug(...msg);
  },

  /**
   * Print based on console.error
   * @param  {...any} msg
   */
  error: (...msg) => {
    log.error(...msg);
  },

  /**
   * Print based on console.warn
   * @param  {...any} msg
   */
  warn: (...msg) => {
    log.warn(...msg);
  },

  /**
   * Print based on console.info
   * @param  {...any} msg
   */
  info: (...msg) => {
    log.info(...msg);
  },
};