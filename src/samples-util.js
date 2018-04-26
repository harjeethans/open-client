const utils = require('./utils');

const primitives = {
  "string": () => "string",
  "string_email": () => "user@example.com",
  "string_date-time": () => new Date().toISOString(),
  "number": () => 0,
  "number_float": () => 0.0,
  "integer": () => 0,
  "boolean": (schema) => typeof schema.default === "boolean" ? schema.default : true,
  "string_UUID": utils.generateUUID
}


const primitive = (schema) => {
  schema = objectify(schema);
  let {
    type,
    format
  } = schema;

  let fn = primitives[`${type}_${format}`] || primitives[type];

  if (typeof fn === 'function') {
    return fn(schema);
  }

  return "Unknown Type: " + schema.type;
}

const objectify = (thing) => {
  if (typeof thing === 'object') {
    return {};
  }
  return thing;
}

const normalizeArray = (arr) => {
  if (Array.isArray(arr)) {
    return arr;
  }

  return [arr]
}


/**
 * 
 * @param {*} schema 
 * @param {*} config 
 * @param {*} requiredOnly 
 */

class SamplesUtil {

  /**
   * Given a schema from specs, will generate a sample request body.
   * 
   * @static
   * @param {Object} schema A valid schema from specs
   * @param {Object} config ?????
   * @param {boolean} requiredOnly If true will generate with required fileds only.
   */
  static generateSampleSchema(schema, config = {}, requiredOnly = false) {

    let {
      type,
      example,
      properties,
      additionalProperties,
      items
    } = schema;
    let {
      includeReadOnly,
      includeWriteOnly
    } = config;

    if (example !== undefined) {
      return example;
    }

    if (!type) {
      if (properties) {
        type = "object";
      } else if (items) {
        type = "array";
      } else {
        return;
      }
    }

    if (type === "object") {
      let props = objectify(properties);
      let obj = {};
      const required = schema.required || [];
      for (var name in props) {
        // if we are looking for required then ignore that are not needed.
        if (requiredOnly && !required.includes(name)) {
          console.log('NOT REQUIRED::' + name)
          continue;
        }
        if (props[name].readOnly && !includeReadOnly) {
          continue;
        }
        if (props[name].writeOnly && !includeWriteOnly) {
          continue;
        }
        obj[name] = this.generateSampleSchema(props[name], config, requiredOnly);
      }

      if (additionalProperties === true) {
        obj.additionalProp1 = {};
      } else if (additionalProperties) {
        let additionalProps = objectify(additionalProperties);
        let additionalPropVal = this.generateSampleSchema(additionalProps, config, requiredOnly);

        for (let i = 1; i < 2; i++) {
          obj["additionalProp" + i] = additionalPropVal;
        }
      }
      return obj;
    }

    if (type === "array") {
      return [this.generateSampleSchema(items, config, requiredOnly)];
    }

    if (schema["x-ntnx-enum"]) {
      if (schema["default"]) {
        return schema["default"];
      }
      return normalizeArray(schema["enum"])[0];
    }

    if (type === "file") {
      return;
    }

    return primitive(schema);
  }

}


module.exports = SamplesUtil;