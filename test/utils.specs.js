'use strict'

const mocha  = require('mocha');
const chai   = require('chai');
const expect = chai.expect;
const assert = chai.assert;

const Utils = require('../src/utils');

const pet_post = {path: '/pet', method: 'post'};

describe('Utils', () => {

  describe('get parameters json path for pet-post', () => {
    it('should have valid json path for pet-post parameters in specs', () => {
      expect(Utils.parameters(pet_post)).to.exist;
      expect(Utils.parameters(pet_post)).to.eq('paths./pet.post.parameters');
    });
  });

  describe('get responses json path for pet-post', () => {
    it('should have valid json path for pet-post responses in specs', () => {
      expect(Utils.responses(pet_post)).to.exist;
      expect(Utils.responses(pet_post)).to.eq('paths./pet.post.responses');
    });
  });

  describe('get normalized url', () => {
    it('should have normalized urls', () => {
      expect(Utils.normalizeUrl('http://foo.com/', 'bar')).eq('http://foo.com/bar');
    });
  });

  describe('get random uuid', () => {
    it('should generate random uuid', () => {
      const regex = new RegExp('[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[34][0-9a-fA-F]{3}-[89ab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}');
      expect(Utils.generateUUID()).to.exist;
      expect(regex.test(Utils.generateUUID())).to.be.true;
    });
  });

});