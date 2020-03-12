
// to do: yargs, change instanceUrl

const Terser = require('terser');
const fs     = require('fs');

var result = fs.readFileSync('./src/js/bookmarklet.js', 'utf8');

var code = Terser.minify(result).code;

code = 'javascript:(function(){' + code.replace(/ /g, '%20') + '})()';

fs.writeFileSync('./dist/bookmarklet.js', code, 'utf8');
