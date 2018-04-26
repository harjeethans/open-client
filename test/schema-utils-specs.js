const debug = require('debug')('schema-utils-specs');

const mocha  = require('mocha');
const chai   = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const specs = require('../samples/specs/petstore-swagger.json');
const petstoreTest = require('../samples/petstore-test.json');

const SchemaUtils = require('../src/schema-utils');
const NuClient = require('../src/nu-client');
const pet_post = {path: '/pet', method: 'post'};
const pet_get = {path: '/pet/findByStatus', method: 'get'};

let derefedSpecs = null;

describe('SchemaUtils', () => {

  describe('initialize', () => {

    it('should be initialized and ready to use', () => {
      const client = new NuClient({
        specs,
        env: 'node'
      }, {});
      client.initialize().then((result) => {
        expect(result).to.be.true;
      });
      expect(client).to.have.property('specs');
      expect(client).to.have.property('drefedSpecs');
      // we grab derefedSpecs here to avoid future de-referencing.
      derefedSpecs = client.getDrefedSpecs();
    });
  });

  describe('simple validation', () => {
    it('should fail in validation', () => {
      const schemaUtils = new SchemaUtils({});
      const schema = {
        "additionalProperties": true,
        "properties": {
          "foo": { "type": "number" },
          "bar": {
            "additionalProperties": { "type": "number" },
            "properties": {
              "baz": { "type": "string" }
            }
          }
        }
      }
      const data = {
        "foo": '0s',
        "additional1": 1, // will be removed; `additionalProperties` == false
        "bar": {
          "baz": "abc",
          "additional2": 2 // will NOT be removed; `additionalProperties` != false
        },
      }
      
      const validator = schemaUtils.getValidator(schema);
      const result = validator(data);
      expect(result).to.be.false;
    });
  });

  describe('add additional custom validation', () => {
    it('should fail in validation', () => {

      const client = new NuClient({
        specs,
        derefedSpecs
      }, {});

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
      //const schema = client.getRequestSchema(pet_get);
      //const validate = schemaUtils.getValidationEngine().compile(schema);
      //console.log(schema)      
      //expect(result).to.be.false;
    });
  });

});