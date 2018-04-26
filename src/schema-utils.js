const debug = require('debug')('spec-utils');

const get = require('lodash/get');

const Ajv = require('ajv');

const baseConfig = require('./config');
const utils = require('./utils');

const ajvKeywords = require('./ajv-keywords');

class SchemaUtils {

  /**
   * We use AJV for validating specs. Check it out at {@link https://github.com/epoberezkin/ajv GitHub (AJV)}
   * @param {Object} configuration json configuration that we pass to validator.
   * @example
   * 
   {
    $data:            false,
    allErrors:        false,
    verbose:          false,
    $comment:         false,
    jsonPointers:     false,
    uniqueItems:      true,
    unicode:          true,
    format:           'fast',
    formats:          {},
    unknownFormats:   ['int32', 'UUID', 'int64'],
    schemas:          {},
    logger:           undefined,
    schemaId:         '$id',
    missingRefs:      true,
    extendRefs:       'ignore',
    removeAdditional: false,
    useDefaults:      false,
    coerceTypes:      false,
    meta:             true,
    validateSchema:   true,
    addUsedSchema:    true,
    inlineRefs:       true,
    passContext:      false,
    loopRequired:     Infinity,
    ownProperties:    false,
    multipleOfPrecision: false,
    messages:         true,
    sourceCode:       false,
    processCode:      undefined,
    serialize:        undefined
  }
   * 
   */
  constructor(configuration, debugEnabled = true) {
    this.configuration = Object.assign(baseConfig.ajvOptions, configuration);
    this.ajv = new Ajv(this.configuration);
    if(!debugEnabled){
      debug.disable();
    }
    
    //@TODO harjeet add our custom validators if needed.
    Object.keys(ajvKeywords).forEach((key) => {
      //this.ajv.addKeyword(key, ajvKeywords[key]);
    });
    
    debug('running in mode cacheValidators ::', this.configuration.cacheValidators || false);
  }

  /**
   * Get a validator for a given schema.
   * @param {Object} schema valid schema in the specs json. 
   */
  getValidator(schema) {
    return this.ajv.compile(schema);
  }

  /**
   * Get configuration that is being used.
   * @returns {Object} configuration json object
   */
  getConfiguration() {
    return this.configuration;
  }

  /**
   * Get the validation engine that is used. Handle to ajv in our case.
   * @returns {Object} ajv instance in use.
   */
  getValidationEngine() {
    return this.ajv;
  }

  
}


module.exports = SchemaUtils;