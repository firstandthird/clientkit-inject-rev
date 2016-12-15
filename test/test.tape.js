'use strict';
const InjectRevisions = require('../index.js');
const test = require('tape');
const async = require('async');
const fs = require('fs');

test('can load the class', (t) => {
  t.plan(1);
  const task = new InjectRevisions();
  t.deepEqual(task.options, {
    mappingPath: 'assets.json',
    startTag: '<!-- clientkit:(.*?) -->',
    endTag: '<!-- clientkit:end -->',
    uiPath: '/ui/',
    files: ['index.html']
  });
});

const file = 'test/fixtures/index1.html';

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
      t.equal(content.indexOf('<link rel="stylesheet" href="/ui/common-abcdefg.css">', `<head>
    <!-- clientkit:common.css -->
    <link rel="stylesheet" href="/ui/common-abcdefg.css">
    <!-- clientkit:end -->
    <!-- clientkit:script.js -->
    <script type="application/javascript" src="/ui/script-abcdefg.js">
    <!-- clientkit:end -->
    </head>`) > -1, true);
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
      t.equal(content.indexOf('<link rel="stylesheet" href="/ui/common-abcdefg.css">', `<head>
    <!-- clientkit:common.css -->
    <link rel="stylesheet" href="/ui/common-abcdefg.css">
    <!-- clientkit:end -->
    <!-- clientkit:script.js -->
    <script type="application/javascript" src="/ui/script-abcdefg.js">
    <!-- clientkit:end -->
    </head>`) > -1, true);
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
  //   const assetMap = new InjectRevisions({ assetMap: { 'file1.js': 'file2.js' } });
  //   assetMap.lookupAsset('file1.js', (err, output) => {
  //     t.equal(output, 'file2.js');
  //   });
  // });
  //
  // test('can InjectRevisions a mapped file when pathToAssetMap is given as a string and cache is true', (t) => {
  //   t.plan(4);
  //   const assetMap = new InjectRevisions({ pathToAssetMap: 'test/assetsMap/assets.json', cache: true });
  //   assetMap.lookupAsset('file1.js', (err, output) => {
  //     t.equal(err, null);
  //     t.equal(output, 'file2.js');
  //   });
  //   assetMap.lookupAsset('filea.js', (err, output) => {
  //     t.equal(err, null);
  //     t.equal(output, 'fileb.js');
  //   });
  // });
  //
  // test('can InjectRevisions a mapped file immediately when readOnLoad is true', (t) => {
  //   t.plan(4);
  //   const assetMap = new InjectRevisions({ pathToAssetMap: 'test/assetsMap/assets.json', readOnLoad: true }, (err, result) => {
  //     t.equal(err, null);
  //     t.equal(result['file1.js'], 'file2.js');
  //     assetMap.lookupAsset('filea.js', (err2, output) => {
  //       t.equal(err2, null);
  //       t.equal(output, 'fileb.js');
  //     });
  //   });
  // });
  //
  // test('will reprocess on each call when cache is false', (t) => {
  //   t.plan(3);
  //   const pathToAssetMap = 'test/assetsMap/assets2.json';
  //   const assetMap = new InjectRevisions({ pathToAssetMap, cache: false });
  //   async.autoInject({
  //     firstLookup: (done) => assetMap.lookupAsset('optionA.js', done),
  //     alter: (firstLookup, done) => {
  //       fs.writeFile(pathToAssetMap, JSON.stringify({ 'optionA.js': 'optionC.js' }), 'utf-8', done);
  //     },
  //     secondLookup: (alter, done) => assetMap.lookupAsset('optionA.js', done),
  //     restore: (secondLookup, done) => {
  //       fs.writeFile(pathToAssetMap, JSON.stringify({ 'optionA.js': 'optionB.js' }), 'utf-8', done);
  //     },
  //     confirm: (firstLookup, secondLookup, restore, done) => {
  //       t.equal(firstLookup, 'optionB.js');
  //       t.equal(secondLookup, 'optionC.js');
  //       done();
  //     }
  //   }, (err) => {
  //     t.equal(err, null);
  //   });
  // });
