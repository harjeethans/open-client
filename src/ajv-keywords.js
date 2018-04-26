/** 
 * We can add our custom valiadtors here. Follow
 * https://github.com/epoberezkin/ajv/blob/master/CUSTOM.md
 * for how to write a custom validator.
*/
module.exports = {
  collectionFormat: {
    type: 'string',
    compile() {
      return (data, dataPath, parentData, parentDataProperty) => {
        parentData[parentDataProperty] = data.split(',');
        console.log('XXXXXXX harjeet XXXXXXX');
        return true;
      };
    },
    metaSchema: {
      enum: [ 'csv' ]
    }
  }
};