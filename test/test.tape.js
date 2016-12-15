'use strict';
const InjectRevisions = require('../index.js');
const test = require('tape');
const async = require('async');
const fs = require('fs');

test('can load the class', (t) => {
  t.plan(1);
  const task = new InjectRevisions('revisions', {});
  t.deepEqual(task.options, {
    mappingPath: 'assets.json',
    startTag: '<!-- clientkit:(.*?) -->',
    endTag: '<!-- clientkit:end -->',
    uiPath: '',
    files: []
  });
});

const file = 'test/fixtures/index1.html';
const oneOutput = fs.readFileSync('test/expected/oneOutput.html');
const secondOutput = fs.readFileSync('test/expected/secondOutput.html');
test('can replace the references in a file reference', (t) => {
  t.plan(3);
  async.autoInject({
    task: (done) => {
      const task = new InjectRevisions('revisions', {
        files: [file]
      });
      task.execute(done);
    },
    verifyFirstOutput: (task, done) => {
      const content = fs.readFileSync(file).toString();
      t.equal(content.indexOf('<link rel="stylesheet" href="common-abcdefg.css">', oneOutput) > -1, true);
      done();
    },
    task2: (verifyFirstOutput, done) => {
      const task = new InjectRevisions('revisions', {
        files: [file]
      });
      task.execute(done);
    },
    verifySecondOutput: (task2, done) => {
      const content = fs.readFileSync(file).toString();
      t.equal(content.indexOf('<link rel="stylesheet" href="common-abcdefg.css">', secondOutput) > -1, true);
      done();
    },
    // restore back to original version for future tests:
    restore: (verifySecondOutput, done) => {
      const original = fs.readFileSync('test/fixtures/original.html').toString();
      fs.writeFile(file, original, done);
    }
  }, (err) => {
    t.equal(err, null);
  });
});
