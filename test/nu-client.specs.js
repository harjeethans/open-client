'use strict'

const mocha  = require('mocha');
const chai   = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const NuClient = require('../src//nu-client');

const specs = require('../samples/specs/petstore-swagger.json');
const petstoreTest = require('../samples/petstore-test.json');

let derefedSpecs = null;
const pet_post = {path: '/pet', method: 'post'};

describe('nuClient', () => {

  describe('Constructor', () => {

    it('should be created with three properties: specs, drefedSpecs', () => {
      const client = new NuClient({
        specs: {},
        drefedSpecs: {},
        env: 'node'
      }, {});
      expect(client).to.have.property('specs');
      expect(client).to.have.property('drefedSpecs');
    });

  });

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

  describe('get schema for pet-post', () => {

    it('should have a schema for pet-post', () => {
      const client = new NuClient({
        specs,
        derefedSpecs,
        env: 'node'
      }, {});
      client.initialize().then((result) => {
        expect(result).to.be.true;
        const pet_post = {path: '/pet', method: 'post'};
        const schema = client.getRequestSchema(pet_post);
        expect(schema).to.exist;
        expect(schema).to.be.an('object');
        expect(schema).to.have.a.property('body');
      });
    });
  });

  describe('get params for pet-post', () => {

    it('should have params and length should be 1', () => {
      const client = new NuClient({
        specs,
        derefedSpecs,
        env: 'node'
      }, {});
      client.initialize().then((result) => {
        const params = client.getRequestParameters(pet_post);
        assert.lengthOf(params, 1, 'params`s value has a length of 1');
      });
    });
  });

  describe('should validate payload against schema', () => {

    it('should be true as we have a valid payload', () => {
      const client = new NuClient({
        specs,
        derefedSpecs,
        env: 'node'
      }, {});
      client.initialize().then((result) => {
        expect(client.validate(pet_post, petstoreTest['pet-post-good'])).to.be.true;
      });
    });

    it('should be false as we have a invalid payload', () => {
      const client = new NuClient({
        specs,
        derefedSpecs,
        env: 'node'
      }, {});
      client.initialize().then((result) => {
        const validity = client.validate(pet_post, petstoreTest['pet-post-bad']);
        expect(validity).to.exist;
        expect(validity.valid).to.be.false;
        expect(validity.errors).to.be.exist;
        expect(validity.errors.length).to.be.greaterThan(0);
      });
    });

  });

});