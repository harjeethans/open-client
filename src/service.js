const debug = require('debug')('service');
const qs = require('qs');

class Service {

  /**
   * @param {string} host api host like http://example.com/api/v3
   * @param {Object} fetch underlying fetch ionplementation to use.
   * @param {boolean} isMockMode running in mock mode.
   */
  constructor(host, configuration, isMockMode = false, debugEnabled = true) {

    this.configuration = configuration;
    this.host = host;
    this.isMockMode = isMockMode;
    if(!debugEnabled){
      debug.disable();
    }

    this.inFlight = {};
  }

  logRequest(endpoint, headers, body) {
    debug('---------- START ----------');
    debug('---------- ENDPOINT Mock info for endpoint invovation ----------');
    debug('---------- ENDPOINT METHOD :: ' +  endpoint.method);
    
    if(endpoint.method.toLocaleLowerCase()==='get'){
      if(typeof body === 'object'){
        debug('---------- ENDPOINT URL :: ' +  endpoint.path + '?' + qs.stringify(body));
      } else {
        debug('---------- ENDPOINT URL :: ' +  endpoint.path + '?' + body);
      }

    } else {
      debug('---------- ENDPOINT URL :: ' +  endpoint.path);
    }
    
    debug('---------- ENDPOINT BODY :: ' +  JSON.stringify(body));
    debug('---------- START ----------');
  }

  /**
   * If the path has something like /{foo} ir will be replaced with body['#path#]['foo'] to
   * construct a url. What prefix/suffix that is used for like {} is supplied as part of configuration
   * to NuClient, defaults to {} for intentful.
   * 
   * @param {string} path 
   * @param {object} body 
   */
  addQueryParamaters(path, body) {
    const { queryParamsKeysInBody='#path#', queryParamPrefix='', queryParamSuffix='' } = this.configuration;
    const params = body[queryParamsKeysInBody] || {};
    Object.keys(params).forEach((param) => {
      if(path.indexOf(`${queryParamPrefix}${param}${queryParamSuffix}`) > -1){
        path = path.replace(`${queryParamPrefix}${param}${queryParamSuffix}`, params[param]);
      }
    });

    if(path.split(queryParamPrefix).length > 1){
      debug('** we have missing query params ** ', path);
    }

    return path;
  }

  /**
   * 
   * @param {Object} endpoint attrs are path and method
   * @param {Object} headers headers we need to add the to request
   * @param {Object} body payload aka body we need to send.
   * @returns {Object} response for server.
   */

  invoke(endpoint, headers, body) {
    return {};
  }

  /**
   * Add to inflight hash
   * @param {object} endpoint an enpoint
   */
  addToInFlight(endpoint, flight){
    const {path, method} = endpoint;
    this.inFlight[`${endpoint.path}#${endpoint.method}`] = flight;
    debug('** in flight request count is :: ', Object.keys(this.inFlight).length);
  }

  /**
   * Remove from inflight hash
   * @param {object} endpoint an enpoint
   */
  removeFromInFlight(endpoint) {
    const {path, method} = endpoint;
    const hash = `${path}#${method}`;
    if(this.inFlight[hash]){
      delete this.inFlight[hash];
    }

  }

  /**
   * Override to implement abort process will be different for node/browser.
   * @param {*} endpoint 
   */
  abortInvokation(endpoint) { 
  }
}

module.exports = Service;