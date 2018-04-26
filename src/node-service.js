const qs = require('qs');

const debug = require('debug')('node-service');

const Service = require('./service');

const fetch = require('node-fetch');

const rp = require('request-promise-native');
const request = require('request');

/**
 * @TODO harjeet.singh@nutanix.com
 * FormData needs t be added as a dependency in case we are using an endpoint to upload
 * some files to a server.
 */
class NodeService extends Service {

  /**
   * @param {string} host api host like http://example.com/api/v3
   * @param {Object} fetch underlying fetch ionplementation to use.
   * @param {boolean} isMockMode running in mock mode.
   */
  constructor(host, configuration, isMockMode = false, debugEnabled = true) {

    super(host, configuration, isMockMode, debugEnabled);
    this.fetch = fetch;
    if(!debugEnabled){
      debug.disable();
    }
  }

  static async fetch(options) {
    const fetchArgs = {
      method: options.method,
      headers: options.headers,
      uri: options.path
    } 
    const result = await rp(options.path);

    return JSON.parse(result);
  }

  abortInvocation(endpoint) {
    debug('** have ', Object.keys(this.inFlight).length, ' in flight aborting now.');
    Object.keys(this.inFlight).forEach((key) => {
      if(this.inFlight[key] && this.inFlight[key].cancel){
        this.inFlight[key].cancel();
      }
    });
    this.inFlight = {};
  }

  /**
   * 
   * @param {Object} endpoint attrs are path and method
   * @param {Object} headers headers we need to add the to request
   * @param {Object} payload payload aka body we need to send.
   */

  async invoke(endpoint, headers, body = {}) {

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
        credentials: 'include'
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
          data.append('files',body);
          fetchArgs.body = data;
        }
        else {
          fetchArgs.body = (body) ? JSON.stringify(body) : null;
        }
      }

      fetchArgs['uri'] = url;
      fetchArgs['resolveWithFullResponse'] = true;

      const result = await rp(fetchArgs);


      const contentType = result.headers["content-type"];
      if (contentType && contentType.indexOf("application/json") !== -1) {
        // successful cross-domain connect/ability
        const resp = result.toJSON();

        return {endpoint, resp, json: JSON.parse(resp.body)};
      }
      else if (result.statusCode===200 && contentType && contentType.indexOf("text/plain")!== -1) {
        const resp = result.text();
        return {endpoint, json: resp, statusCode: result.statusCode,  _fetchRes: result};
      }
      else {
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
    }
  }

}

module.exports = NodeService;