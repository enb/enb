var vowFs = require('vow-fs');

if (process.env.ENB_FILE_LIMIT) {
    vowFs.options({
        openFileLimit: parseInt(process.env.ENB_FILE_LIMIT)
    });
}

module.exports = vowFs;
