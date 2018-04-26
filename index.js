#! /usr/bin/env DEBUG=*,-json-schema* CLIENT_MODE=node node 


const debug = require('debug')('indexjs');

const NuClient = require('./src/nu-client');

const petstoreTest = require('./samples/petstore-test.json');
//debug('env is  %o', process.env);

//const client = new NuClient({specs: 'http://127.0.0.1:8080/specs/petstore-swagger.json'}, fetch);
const client = new NuClient({specs: 'http://localhost:8080/api-docs', env: 'node'});

//const client = new NuClient({specs: 'http://127.0.0.1:8080/specs/intent-swagger-v3.json'}, fetch);

const bootstrap = async () => {
  const result = await client.initialize();
  if(result){
    debug('Done bootstrapping!');
    return client;
  } else {
    console.error('Snapped1');
  }
}

async function runPetStore(){

  const _client = await bootstrap();
  const pet_post = {path: '/pet', method: 'post'};
  const pet_get = {path: '/pet/findByStatus', method: 'get'};
  const params = _client.getRequestParameters(pet_post);

  const pet_get_by_tag = {path: '/pet/findByTags', method: 'get'};


  //debug('OK %o', params);
  //debug(JSON.stringify(client.getResponses({path: '/pet', method: 'post'}), null , ' '));
  //const schema = _client.getRequestSchema(pet_post);
  const schema = _client.getRequestSchema(pet_get);
  debug(JSON.stringify(schema, null , ' '));
  //debug('isValid :: ', client.validate(pet_post, petstoreTest['pet-post-good']));
  //debug('isValid /o ', client.validate(pet_post, petstoreTest['pet-post-bad']));
  try {

    debug('isValid /o ', client.validate(pet_get, null, {status: 'sold,available'}));
    
    /*
    const resp = await client.execute(pet_get, {}, {status: 'sold'});    
    debug('response from server for pet-get %0', resp);
    const resp1 = await client.execute(pet_get_by_tag, {}, {tags: 'aeiou'});
    debug('response from server for pet-get-by-tag %0', resp1);
    */

    const batch = [];
    batch.push({endpoint: pet_get, headers: {}, body: {status: 'sold,available'}});
    batch.push({endpoint: pet_get_by_tag, headers: {}, body: {tags: 'aeiou'}});
    
    const respBatch = await client.executeBatch(batch);
    if(respBatch && respBatch.length){
      respBatch.forEach((item) => {
        debug('***endpoint*** %o', item.endpoint);
        debug('resp-batch %0', item.json);
      });
    }

    //debug('response from server for batch %0', respBatch[0].json);

    //try batch execute

  } catch(e) {
    debug(e);
  }
}


runPetStore();