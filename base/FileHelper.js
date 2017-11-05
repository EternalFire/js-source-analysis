const path = require('path');
const fs = require('fs');

class FileHelper extends Object {
  constructor() {
    super();

    this.dir = '.';
    this.encoding = 'utf8';
  }

  getPath(dir, fileName) {
    dir = dir || this.dir;
    return path.join(dir, fileName);
  }

  /**
   * get files array in dir and sub dir
   * @param  {string} dir directory
   * @return {array}     array with file relatice path
   *
   * @usage
   *   fileHelper.getFiles(dir).then(files => {
   *     console.log('files.length: ', files.length);
   *     console.log('main: ', JSON.stringify(files, null, '  '));
   *   });
   */
  async getFiles(dir) {
    return new Promise((resolve, reject) => {
      let list = [];

      const readdirCallback = async (err, files) => {
        if (err) {
          return reject(err);
        }

        for (let i = 0; i < files.length; i++) {
          let filePath = files[i];
          let sFilePath = this.getPath(dir, filePath);

          const stats = fs.statSync(sFilePath);
          if (stats.isDirectory()) {
            let subDirList = [];
            subDirList = await this.getFiles(sFilePath);
            list = list.concat(subDirList);
          }
          else {
            list.push(sFilePath);
          }
        }

        resolve(list);
      };

      dir = dir || this.dir;
      let encoding = this.encoding;
      fs.readdir(dir, encoding, readdirCallback);
    });
  }

  mkdirs(dirpath, mode, callback) {
    let dirnames = [];
    let temp = dirpath;

    while(temp != '.') {
      dirnames.splice(0, 0, temp);
      temp = path.dirname(temp);
    }

    dirnames.forEach((d) => {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d);
      }
    });

    return fs.existsSync(dirpath);
  }
};

module.exports = FileHelper;