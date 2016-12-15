const async = require('async');
const ClientkitTask = require('clientkit-task');
const AssetMap = require('clientkit-asset');
const fs = require('fs');
const os = require('os');
const path = require('path');

class InjectRevision extends ClientkitTask {

  constructor(name, options, runner) {
    super(name, options, runner);
    this.assetMap = new AssetMap({ pathToAssetMap: 'test/assetsMap/assets.json' });
  }

  get description() {
    return 'Replace js/css references in your files with their mapped hashed equivalent';
  }

  get defaultOptions() {
    return {
      // path to a json file containing your asset map:
      mappingPath: 'assets.json',
      // regexp for finding the start tag:
      startTag: '<!-- clientkit:(.*?) -->',
      // regex for finding the end tag:
      endTag: '<!-- clientkit:end -->',
      // append this to the start of every file's path:
      uiPath: '/ui/',
      // list of files to process:
      files: ['index.html']
    };
  }

  extractMiddleOfTag(content, startingLine) {
    const lines = [];
    const endRe = new RegExp(`${this.options.endTag}`);
    for (let i = startingLine; i < content.length; i++) {
      const endMatch = endRe.exec(content[i]);
      lines.push(content[i]);
      if (endMatch) {
        return lines;
      }
    }
    return lines;
  }

  getMiddleOfTag(originalValue, mappedValue) {
    if (path.extname(originalValue) === '.js') {
      return `<script type="application/javascript" src="${this.options.uiPath}${mappedValue}">`;
    }
    if (path.extname(originalValue) === '.css') {
      return `<link rel="stylesheet" href="${this.options.uiPath}${mappedValue}">`;
    }
    return originalValue;
  }

  getNewTag(matchTerm, tag, done) {
    this.assetMap.lookupAsset(matchTerm, (err, mappedValue) => {
      if (err) {
        return done(err);
      }
      const newTag = {
        oldTag: tag,
        newTag: [tag[0]]
      };
      newTag.newTag.push(this.getMiddleOfTag(matchTerm, mappedValue));
      newTag.newTag.push(tag[tag.length - 1]);
      return done(null, newTag);
    });
  }

  // replace all entries matching filename with the hashed equivalent
  process(input, output, allDone) {
    async.autoInject({
      buffer: (done) => fs.readFile(input, done),
      content: (buffer, done) => done(null, buffer.toString().split(os.EOL)),
      tags: (content, done) => {
        const startRe = new RegExp(`${this.options.startTag}`);
        const endRe = new RegExp(`${this.options.endTag}`);
        const tags = [];
        let lineCount = 0;
        content.forEach((line) => {
          lineCount++;
          const matchStart = startRe.exec(line);
          const matchEnd = endRe.exec(line);
          if (matchStart && !matchEnd) {
            tags.push([matchStart].concat(this.extractMiddleOfTag(content, lineCount)));
          }
        });
        done(null, tags);
      },
      // each tag is an array: 1st item is the RE match, last item is end tag
      newTags: (tags, done) => async.map(tags, (item, mapDone) => {
        const matchTerm = item[0][1];
        item[0] = item[0][0];
        this.getNewTag(matchTerm, item, mapDone);
      }, done),
      newContents: (content, newTags, done) => {
        let contentString = content.join(os.EOL);
        newTags.forEach((newTag) => {
          contentString = contentString.replace(newTag.oldTag.join(os.EOL), newTag.newTag.join(os.EOL));
        });
        done(null, contentString);
      },
      write: (newContents, done) => this.write(input, newContents, done)
    }, allDone);
  }
}
module.exports = InjectRevision;
