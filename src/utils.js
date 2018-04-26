

class Utils {

  /**
   * Generate json path for parameters on specs file for an endpoint.
   * @param {Object} endpoint
   * @returns {string} json path to parameters for the endpoint.
   * @example <caption>An endpoint</caption>
   * const path = '/pet'; // valid path supported by schema.
   * const method = 'post'; // valid method/operation for a given path like get/post/put/delete etc.
   * const anEndpoint = {path, method}
   */
  static parameters(endpoint) {
    const {path, method} = endpoint;
    return `paths.${path}.${method}.parameters`;
  }

  /**
   * Generate json path for responses on specs file for a given endpoint.
   * @param {Object} endpoint
   */
   static responses(endpoint) {
    const {path, method} = endpoint;
    return `paths.${path}.${method}.responses`;
  }

  /**
   * 
   * @param {string} basePath 
   * @param {string} url 
   */
  static normalizeUrl(basePath, url) {
    return `${basePath}${url}`;
  }

  /**
   * @returns {string} a valid uuid
   */
  static generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
  }

}

module.exports = Utils;