
module.exports = {

    parse: function (html, options) {

        var parser = new DOMParser();

        return parser.parseFromString(html, 'text/html');

    },

};
