var vowFs = require('vow-fs');

if (process.env.ENB_FILE_LIMIT) {
    vowFs.options({
        openFileLimit: parseInt(process.env.ENB_FILE_LIMIT, 10)
    });
}

module.exports = vowFs;
