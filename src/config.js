module.exports = {
  cacheValidators: true,
  client: 'node', // or browser
  headers: {
    test: 'test',
  },
  host: 'localhost:8080', //'10.4.72.142:9440',
  queryParamsKeysInBody: '#path#',
  queryParamPrefix: '{',
  queryParamSuffix: '}',
  scheme: 'http',
  ajvOptions: {
    // validation and reporting options:
    $data:            false,
    allErrors:        false,
    verbose:          false,
    $comment:         false, // NEW in Ajv version 6.0
    jsonPointers:     false,
    uniqueItems:      true,
    unicode:          true,
    format:           'fast',
    formats:          {},
    unknownFormats:   ['int32', 'UUID', 'int64'],
    schemas:          {},
    logger:           undefined,
    // referenced schema options:
    schemaId:         '$id',
    missingRefs:      true,
    extendRefs:       'ignore', // recommended 'fail'
    loadSchema:       undefined, // function(uri: string): Promise {}
    // options to modify validated data:
    removeAdditional: false,
    useDefaults:      false,
    coerceTypes:      true,
    // asynchronous validation options:
    transpile:        undefined, // requires ajv-async package
    // advanced options:
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
    processCode:      undefined, // function (str: string): string {}
    //cache:            new Cache,
    serialize:        undefined
  },
  alias: {
    body: ['body', 'formData'],
    path: ['path', 'query']
  }

};