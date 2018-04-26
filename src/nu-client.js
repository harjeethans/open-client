const debug = require('debug')('nu-client');
//const error = debug('nu-api-client:error');

const SwaggerParser = require('swagger-parser');

const cloneDeep = require('lodash/cloneDeep');
const get = require('lodash/get');

const baseConfig = require('./config');
const Utils = require('./utils');

const SchemaUtils = require('./schema-utils');

let Service;

//const Service = require('./service');


class NuClient {

  /**
   * @param {object} configuration Is an object that consists of specs and drefedSpecs.
   * specs - can be a url to fetch swagger specs or specs json.
   * drefedSpecs - are derererened specs , if not passed these are generated form specs.
   * @param {object} fetch to use, browser OR node, fetch client. we can use clients that are fetch api compliant.
   * @example <caption>For node runtime something like</caption>
   * const NuClient = require('nu-client');
   * const specsUrl = config.specsUrl; // url for specs 'http://someurl/specs/petstore-swagger.json'
   * let host = `${config.hostname}:${config.port}`; //a host where intent apis are hosted.
   * 
   * const client = new NuClient({specs: specsUrl, env: 'browser', host});
   * // we need go bootstarp it after we are done to be able to use it.
   * // bootstraping take time as we need to fetch api specs and then dereference the same hence and async operation.
   * const bootstrap = async () => {
   * const result = await client.initialize();
   * if(result){
   *  debug('Done bootstrapping!');
   *  return client;
   *  } else {
   *   console.error('Snapped1');
   *  }
   * }
   * // here is the code that does somethign with it.
   * async function runPetStore(){
   *
   *  const _client = await bootstrap();
   *  const pet_post = {path: '/pet', method: 'post'};
   *  const params = _client.getRequestParameters(pet_post);
   *  const schema = _client.getRequestSchema(pet_post);
   *  console.log(JSON.stringify(schema, null , ' '));
   *  console.log('isValid :: ' + client.validate(pet_post, 'pet-post-good'));
   *  console.log('isValid :: ' + client.validate(pet_post, petstoreTest['pet-post-bad']));
   * }
   */

  constructor(configuration, debugEnabled = true) {
    this.configuration = Object.assign(baseConfig, configuration);
    this.specs = null;
    this.drefedSpecs = null;
    this.schemaUtils = null;
    this.debugEnabled = debugEnabled;

    if (this.configuration.env === 'browser') {
      debug('*** Using browser-service ***')
      Service = require('./browser-service');
    } else {
      debug('*** Using node-service ***')
      Service = require('./node-service');

    }

    if(!this.debugEnabled){
      debug.disable();
    }

    //debug(JSON.stringify(this.configuration));
  }

  /**
   * Before we can run client we need to call initialize on it so that the client is setup for use.
   * @async
   * @return {Promise<boolean>} true if client is setup properly false otherwise.
   * 
   */
  async initialize() {
    const { specs, drefedSpecs } = this.configuration;

    if (typeof specs === 'string') {
      debug('Call fetch on specs ::' + specs);
      //const response = await Service.fetch(specs);
      //const specs = await Service.fetch({path: specs, method: 'get', headers: {} });
      this.specs = await Service.fetch({path: specs, method: 'get', headers: {} });
      //debug('Fetched specs : %o', this.specs);
    } else {
      this.specs = specs;
    }

    if(!this.drefedSpecs){
      //debug('Called  createDereferencedSpecs on specs : %o', this.drefedSpecs);
      this.drefedSpecs = await this.createDereferencedSpecs(cloneDeep(this.specs));
    }
    
    debug('Freezing the specs and derefed specs!');
    this.specs = Object.freeze(this.specs);
    this.drefedSpecs = Object.freeze(this.drefedSpecs);

    debug('Successfully fetch specs for schema %s', specs);
    
    //@TODO harjeet we should allow users to pass ajv config?
    this.schemaUtils = new SchemaUtils({});
    const schemeIdx = (this.specs.schemes.indexOf(this.scheme) === -1) ? 0 : this.specs.schemes.indexOf(this.scheme);
    const scheme = this.specs.schemes[schemeIdx];
    const basePath = this.specs.basePath;
    const host = this.specs.host || this.configuration.host;
    this.apiHost = `${scheme}://${host}${basePath}`;
    
    debug('Resolved host for api calls is %s', this.apiHost);
    this.service = new Service(this.apiHost, this.configuration, true, this.debugEnabled);

    return true;

  }

  async createDereferencedSpecs(specs) {
    try {
      const result = await SwaggerParser.dereference(specs);
      return result;
    } catch (e) {
      debug('*** Error while trying to resolve references ', e);
    }
  }

  /**
   * Returnes the parsed api specs just in case.
   * @returns {Object} Parsed json schema.
   */
  getSpecs() {
    return this.specs;
  }

  /**
   * Returnes the parsed api specs that are dereference meaning all the references local and remote are resolved.
   * @returns {Object} Parsed json schema that has references resolved.
   */
  getDrefedSpecs() {
    return this.drefedSpecs;
  }

  /**
   * Schema for a given endpoint. The schema has all the references resolved.
   * @param {Object} endpoint
   * @returns {Object} json schema for the endpoint.
   * @example <caption>An endpoint</caption>
   * const path = '/pet'; // valid path supported by schema.
   * const method = 'post'; // valid method/operation for a given path like get/post/put/delete etc.
   * const anEndpoint = {path, method}
   */
  getRequestSchema(endpoint) {
    let query = {type: 'object', parameters: []};
    let body;

    const parameters = this.getRequestParameters(endpoint);
    const alaisBody = this.configuration.alias.body || ['body'];
    const aliasPath = this.configuration.alias.path || ['path'];
    const isBody = (param) => (alaisBody.indexOf(param.in) > -1);
    const isPath = (param) => (aliasPath.indexOf(param.in) > -1);
    if(parameters.length === 1 && isBody(parameters[0])){
      body = parameters[0].schema;
    } else {
      parameters.forEach(parameter => {
        if(isBody(parameter)){
          body = parameter.schema;
        } else if(isPath(parameter)) {
          query.parameters.push(parameter);
        }
      });
    }
    const _rs = {};
    if(body){
      _rs['body'] = body;
    }
    if(query && query.parameters.length > 0){
      _rs['query'] = query;
    }
    return _rs;

    //return this.getRequestParameters(endpoint).filter( param => param.in === 'body' || param.name === 'body')[0].schema;
  }

  /**
   * Parameters we need to invoke a given endpoint.
   * @param {Object} endpoint See {@link NuClient#getRequestSchema}
   */
  getRequestParameters(endpoint) {
    return get(this.drefedSpecs, Utils.parameters(endpoint)) || [];
  }

  /**
   * Response types we can expect from a given endpoint.
   * @param {Object} endpoint See {@link NuClient#getRequestSchema}
   * @return {Array} of response types.
   * @example ['405', '202', '402', 'default']  
   */
  getResponseTypes(endpoint){
    return Object.keys( this.getResponses(endpoint) || {});
  }

  /**
   * Response types we can expect from a given endpoint.
   * @param {Object} endpoint See {@link NuClient#getRequestSchema}
   * @return {Object} of response types as specified in teh specs for an endpoint.
   * @example ['405', '202', '402', 'default']  
   */
  getResponses(endpoint) {
    return get(this.drefedSpecs, Utils.responses(endpoint));
  }

  /**
   * 
   * @param {Object} An endpoint consists of path and method corresponding to specs
   * @param {Object} headers http headers to go along with request.
   * @param {Object} body body of the request.
   * If the path does not have and query parameters body is matched the schema computed from specs.
   * For all http get calls the body is added as the part of the query, for all other http methods body
   * is handlled the way one would expect. Exception to that rule is when we have url parameters
   * combined with the body. Meaning we have a path like /apps/{uuid}/actions/{action_uuid}/run and
   * http method is NOT get, the body under these conditions will have to have a additional attribute
   * #path# that is an object having query param, after these are subsituted in the path, these will be
   * discarded from the actual body payload sent to server. Also the mechanism to identify a path/url
   * parameter {uuid} can be configured by passing queryParamPrefix and queryParamSuffix, entry #path# can
   * be configured by supplying queryParamsKeysInBody in configuration.
   * Here is an example of how to configure query params for post etc.
   * @example
   * path is /apps/{uuid}/actions/{action_uuid}/run
   * configuration supplied
   * configuration = {
   *  ...
   *  queryParamsKeysInBody: '#path#',
   *  queryParamPrefix: '{',
   *  queryParamSuffix: '}',
   *  ...
   * }
   * body has to be (notice #path# matching with query params.)
   * {
   *  "spec": {},
   *  "api_version": "string",
   *  "metadata": {
   *    "kind": "app"
   *  },
   *  "#path#": {
   *    "uuid": "todo",
   *    "action_uuid": "todo"
   *  }
   * }
   */

  async execute(endpoint, headers, body, validate = true) {
    if(validate){
      const validation = this.validate(endpoint, body);
      if(validation !== true){
        return validation;
      }
    }

    const response = await this.service.invoke(endpoint, headers, body);
    
    return response;
  }

  /**
   * A batch is an array of objects having endpoint, headers, payload.
   * @param {Object} batch consists of path and method corresponding to specs
   * @param {boolean} sequential if th ebatch is to be executed in a sequential or parallel manner.
   * @param {boolean} abandonOnError
   * @example
   * [
   *  {
   *    endpoint: {},
   *    headers: {},
   *    payload: {}
   *  },
   *  ...
   * ]
   */

  async executeBatch(batch = [], sequential = false, abandonOnError = false) {
    const responses = await Promise.all(batch.map(item => {
      const {endpoint, headers, body} = item;
      return this.execute(endpoint, headers, body);
    }));
    
    return responses;
  }

  /**
   * Abort execution of a given endpoint.
   * @param {Object} endpoint See {@link NuClient#getRequestSchema}
   * @return {boolean} true if successfully aborted
   */
  abortEndpoint(endpoint) {
    debug('Aborted endpoint ', endpoint);
    return true;
  }

  /**
   * Abort execution of multiple endpoints.
   * @param {Array} endpoints An array of endpoints See {@link NuClient#getRequestSchema}
   * @return {boolean} true if successfully aborted
   */
  abortEndpoints(endpoints = []) {
    debug('Aborted endpoints ', endpoint);
    return true;
  }

  /**
   * Validates a body for a given schema.
   * @param {Object} endpoint See {@link NuClient#getRequestSchema}
   * @param {Object} body JSON body that needs to ne validated against the schema.
   * @return {Object} json object that has validation status and optional errors if failed.
   */
  validate(endpoint, body, query) {
    let valid = false;
    const schema = this.getRequestSchema(endpoint);
    if(!schema){
      debug('No need to validate as we schema does not exist!!!');
      return true;
    }
    const querySchema = schema.query;
    const bodySchema = schema.body;

    if(bodySchema) {
      const validator = this.schemaUtils.getValidator(bodySchema);
      valid = validator(body);
      if (!valid) {
        debug('We have an invalid body for schema ', this.schemaUtils.getValidationEngine().errorsText(validator.errors));
        return {valid, errors: validator.errors};
      }
    }

    // @TODO harjeet will cut our query validation for now, will add it later.
    // as query params are mostly strings in teh form of uuid
    let _s, _n, qvalidator;
    if(false && querySchema){
      for (let parameter of querySchema.parameters) {
        _n = parameter.name;
        try {
          delete parameter.required;
          qvalidator = this.schemaUtils.getValidator(parameter);
          valid = qvalidator(query);
        if (!valid) {
          debug('Schema is %O', parameter);
          debug('We have an invalid body for query ', this.schemaUtils.getValidationEngine().errorsText(qvalidator.errors));
          return {valid, errors: qvalidator.errors};
        }
        } catch (e) {
          debug('Failed to get validator %o', e);
          debug('Schema is %O', parameter);
        }    
        
      }

    } else {
      valid = true;
    }
    
    return valid;
  }

}


module.exports = NuClient;