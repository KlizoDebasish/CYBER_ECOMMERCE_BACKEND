const multer = require('multer');

const storage = multer.memoryStorage();

const multipleUpload = multer({ storage }).array('files', 5); // Up to 5 files can be uploaded

module.exports = multipleUpload;