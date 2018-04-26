#! /usr/bin/env DEBUG=*,-json-schema* CLIENT_MODE=node node 

const debug = require('debug')('ajv-validator');
const specs = require('./samples/specs/petstore-swagger.json');
const petstoreTest = require('./samples/petstore-test.json');

const SchemaUtils = require('./src/schema-utils');
const NuClient = require('./src/nu-client');
const pet_post = {path: '/pet', method: 'post'};
const pet_get = {path: '/pet/findByStatus', method: 'get'};

let derefedSpecs = null;


const bootstrap = async () => {
  let client = new NuClient({
    specs
  }, {});
  const result = await client.initialize();
  if(result){
    debug('Done bootstrapping!');
    return client;
  } else {
    console.error('Snapped1');
  }
}

async function runCustomValidation(){

  const client = await bootstrap();

  const schemaUtils = new SchemaUtils({});
  
  schemaUtils.getValidationEngine().addKeyword('collectionFormat', {
    type: 'string',
    statements: true,
    validate: function() {
      console.log(arguments);
      return true;
    },
    metaSchema: {
      enum: [ 'csv' ],
    },
  });
    
  schemaUtils.getValidationEngine().addKeyword('log', {
    schema: false,
    validate: data => (console.log('***', data), true)
  })
  
  const schema = client.getRequestSchema(pet_get);

  const validate = schemaUtils.getValidationEngine().compile(schema.query.parameters[0]);

  const result = await validate(['foo','bar','baz']);
  debug('*** %o', schema);
  debug('result ***** ', result);


};
  
runCustomValidation();