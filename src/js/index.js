
var MetaValidator = require('./MetaValidator.js');

var temporaryBrowserUI = require('./MetaValidatorUI.js');

// modify instance here, e. g. call a function on finish event...
MetaValidator.on('finished', temporaryBrowserUI);

module.exports = MetaValidator;
