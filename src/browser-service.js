require('whatwg-fetch');
const qs = require('qs');
const Service = require('./service');
const debug = require('debug')('browser-service');
//const fetch = require('node-fetch');
class BrowserService extends Service {

  /**
   * @param {string} host api host like http://example.com/api/v3
   * @param {Object} fetch underlying fetch ionplementation to use.
   * @param {boolean} isMockMode running in mock mode.
   */
  constructor(host, configuration, isMockMode = false, debugEnabled = true) {

    super(host, configuration, isMockMode, debugEnabled);

    // In case we need to support abort.
    if(configuration.env !== 'browser'){
      if(window && window.AbortController){
        this.controller = new AbortController();
        this.signal = this.controller.signal;
      }
    }

    if(!debugEnabled){
      debug.disable();
    }
  }

  /**
   * Abort invocation of an endpoint. All inflight requests are aborted.
   * @param {object} endpoint 
   */
  abortInvocation(endpoint) {
    debug('** have ', Object.keys(this.inFlight).length, ' in flight aborting now.');
    this.controller.signal;
    this.inFlight = {};
  }

  /**
   * @returns {object} handle to native fetch.
   */
  static async fetch(options) {
    const fetchArgs = {
      method: options.method,
      headers: options.headers
    } 
    const result = await fetch(options.path, fetchArgs);

    return await result.json();
  }

  /**
   * 
   * @param {Object} endpoint attrs are path and method
   * @param {Object} headers headers we need to add the to request
   * @param {Object} body body we need to send.
   */

  async invoke(endpoint, headers, body) {

    this.logRequest(endpoint, headers, body);

    if(this.isMocked){
      const timeout = function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      
      await timeout(1000);

      return {json: {isMocked}, statusCode:200};
    }

    try {
      const fetchArgs = {
        method: endpoint.method,
        headers,
        redirect: 'manual',
        credentials: 'include',
        signal: this.signal
      }

      const {queryParamsKeysInBody, queryParamPrefix} = this.configuration;
      let path = endpoint.path;
      if(path.split(queryParamPrefix).length > 1){
        path = this.addQueryParamaters(endpoint.path, body);
        delete body[this.configuration.queryParamsKeysInBody];
      }

      let url = this.host + path;

      if(endpoint.method.toLocaleLowerCase()==='get'){
         url = url + '?' + qs.stringify(body);
      } else {
        if(headers['Content-Type']==='multipart/form-data') {
          delete fetchArgs.headers['Content-Type'];
          const data = new FormData();
          data.append('files', body);
          fetchArgs.body = data;
        } else {
          fetchArgs.body = (body) ? JSON.stringify(body) : null;
        }
      }

      const result = await fetch(url, fetchArgs);
      // add request to inFlight for future abort.
      this.addToInFlight(endpoint, result);
      
      const contentType = result.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        // successful cross-domain connect/ability
        const resp = await result.json();

        return {endpoint, json: resp, statusCode: result.status, _fetchRes: result};
      }
      else if (result.status===200 && contentType && contentType.indexOf("text/plain")!== -1) {
        const resp = await result.text();
        return {endpoint, resp};
      }
      else {
        if(result && result.type && result.type === 'opaqueredirect') {
          return {
            json: {
              endpoint,
              error_code: "RECEIVED_LOGIN_REDIRECT",
              details: "Your session expired. Please refresh the page.",
              severity: "error"
            }
          }
        }
        return {
          json: {
            endpoint,
            error_code: "INVALID_SERVER_RESPONSE",
            details: "Either server not authenticated or error on server",
            severity: "error"
          }
        };
      }
    } catch(e) {
      console.error("Error in fetching on url " + endpoint.url);
      console.error(e);
      return {
        json: {
          endpoint,
          error_code: "FETCH_COMMUNICATION_ERROR",
          details: "Error in connecting to server " + e,
          severity: "error"
        }
      };
    } finally {
      this.removeFromInFlight(endpoint);
    }
  }

}

module.exports = BrowserService;