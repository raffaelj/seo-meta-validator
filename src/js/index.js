
var MetaValidator = require('./MetaValidatorBrowser.js');

var temporaryBrowserUI = require('./temporaryBrowserUI.js');

// modify instance here, e. g. call a function on finish event...
MetaValidator.on('finished', temporaryBrowserUI);

module.exports = MetaValidator;
