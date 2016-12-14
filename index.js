const fs = require('fs');
const path = require('path');
const ClientkitTask = require('clientkit-task');

class InjectRevision extends ClientkitTask{

  constructor(assetMap, options, done) {
    this.assetMap = assetMap;
  }

  // replace all entries matching filename with the hashed equivalent
  process(input, output, done) {
    return done();
  }

module.exports = InjectRevision;
