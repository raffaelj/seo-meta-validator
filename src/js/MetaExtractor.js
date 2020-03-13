
module.exports = {

    html: null,

    /**
     * Extract meta data from HTMLDocument
     * 
     * @param   Object html     HTMLDocument
     * @param   Object options  not implemented yet
     * @return  Object          Extracted metadata
     */
    extract: function (html, options) {

        this.html = html || this.html;

        // to do: check, if instanceof HTMLDocument or jsdom document
        if (!this.html) {
            throw new Error ('Invalid input for MetaExtractor. Expected: HTMLDocument.');
        }

        // to do: common stuff like title....

        return {
            metatags:  this.metatagParser(),
            microdata: this.microRdfaParser(null, 'microdata'),
            rdfa:      this.microRdfaParser(null, 'rdfa'),
            jsonld:    this.jsonldParser(),
            htmltags:  this.htmltagParser() // experimental
        };

    },

    // inspired by https://github.com/indix/web-auto-extractor/blob/master/src/parsers/metatag-parser.js
    metatagParser: function (html) {

        html = html || this.html;

        var metaTags  = {},
            _metaTags = html.querySelectorAll('meta'),
            keyNames  = ['name', 'property', 'itemprop', 'http-equiv'];

        _metaTags.forEach(item => {

            var attr = Array.from(item.attributes).find(attr => {
                return keyNames.indexOf(attr.name) != -1;
            });

            if (!attr || !attr.value) return;

            if (!metaTags[attr.value]) {
                metaTags[attr.value] = [];
            }
            metaTags[attr.value].push(item.content);

        });

        return metaTags;

    },

    htmltagParser: function (html) {

        html = html || this.html;

        var htmlTags = {},
            _htmlTags = html.querySelectorAll('title, h1');

        _htmlTags.forEach(item => {

            if (!htmlTags[item.localName]) {
                htmlTags[item.localName] = [];
            }
            htmlTags[item.localName].push(item.innerText);

        });

        return htmlTags;

    },

    // inspired by https://github.com/indix/web-auto-extractor/blob/master/src/parsers/jsonld-parser.js
    jsonldParser: function (html) {

        html = html || this.html;

        var jsonld  = {},
            _jsonld = html.querySelectorAll('script[type="application/ld+json"]');

        _jsonld.forEach(item => {

            try {
                var parsedJSON = JSON.parse(item.innerHTML);
                if (!Array.isArray(parsedJSON)) {
                    parsedJSON = [parsedJSON];
                }
                parsedJSON.forEach(function (obj) {
                    var type = obj['@type'];
                    jsonld[type] = jsonld[type] || [];
                    jsonld[type].push(obj);
                });
            } catch(e) {
                console.log(e);
            }

        });

        return jsonld;

    },

/* 
    microRdfaParserQWE: function (html, specName) {

        // not recursive, but matches spec
        
        html = html || this.html;

        // https://stackoverflow.com/a/30201828
        var result = {};
        var items = [];
        html.querySelectorAll("[itemscope]")
          .forEach(function(el, i) {
            var item = {
              "type": [el.getAttribute("itemtype")],
              "properties": {}
            };
            var props = el.querySelectorAll("[itemprop]");
            props.forEach(function(prop) {
              item.properties[prop.getAttribute("itemprop")] = [
                prop.content || prop.textContent || prop.src
              ];
              if (prop.matches("[itemscope]") && prop.matches("[itemprop]")) {
                var _item = {
                  "type": [prop.getAttribute("itemtype")],
                  "properties": {}
                };
                prop.querySelectorAll("[itemprop]")
                  .forEach(function(_prop) {
                    _item.properties[_prop.getAttribute("itemprop")] = [
                      _prop.content || _prop.textContent || _prop.src
                    ];
                  });
                item.properties[prop.getAttribute("itemprop")] = [_item];
              }
            });
            items.push(item);
          });

        result.items = items;

console.log(result);
        
        return [];

    },
*/
    
    microRdfaParser: function (html, spec) {

        // recuresive, doesn't match spec, matches sdtt/WAE format

        if (['microdata','rdfa'].indexOf(spec) == -1) {
            throw new Error('Unsupported spec: use either microdata or rdfa');
        }

        html = html || this.html;

        var $this = this;

        
        var _result = this.microdataIterator(html, spec) || [],
            result = {};

        if (!Array.isArray(_result)) _result = [_result];

        // reformat array of objects to object containing objects with arrays
        // to match sdtt/WAE format
        _result.forEach((res, i) => {

            var key = Object.keys(res)[0];

            if (!result[key]) result[key] = [];
            result[key].push(res[key]);

        });

        return result;

    },

    microdataIterator: function(html, spec) {

        // recursive, doesn't match spec, matches sdtt/WAE format
        // inspired by: https://stackoverflow.com/a/30201828
        // spec: https://html.spec.whatwg.org/multipage/microdata.html#converting-html-to-other-formats
        // inspired by https://github.com/indix/web-auto-extractor/blob/master/src/parsers/micro-rdfa-parser.js

        var $this = this;

        var items = [];

        var SCOPE = spec == 'microdata' ? 'itemscope' : 'vocab',
            TYPE  = spec == 'microdata' ? 'itemtype'  : 'typeof',
            PROP  = spec == 'microdata' ? 'itemprop'  : 'property';

        // select all scopes, including child scopes
        var _scopes = html.querySelectorAll(`[${SCOPE}]`),
            scopes  = Array.from(_scopes);

        // remove child scopes - they will be selected later
        _scopes.forEach(scope => {
            var i = scopes.length;
            while (i--) {
                if (scopes[i] !== scope && scope.contains(scopes[i])) {
                    scopes.splice(i, 1);
                }
            }
        });

        scopes.forEach((el, i) => {

            var typeString = el.getAttribute(`${TYPE}`);
            if (spec == 'microdata') {
                var match   = /(.*\/)(\w+)/g.exec(typeString);
                var context = match && match[1] ? match[1] : undefined;
                var type    = match && match[2] ? match[2] : typeString;
            } else {
                var context = el.getAttribute(`${SCOPE}`);
                var type    = typeString;
            }

            var item = {
                [type]: {
                    '@context': context,
                    '@type': type
                }
            };

            var _props = el.querySelectorAll(`[${PROP}]`),
                props  = Array.from(_props);

            _props.forEach((prop) => {
                var i = props.length;
                while (i--) {
                    if (props[i] !== prop && prop.contains(props[i])) {
                        props.splice(i, 1);
                    }
                }
            });

            props.forEach((prop) => {

                var itemProp = prop.getAttribute(`${PROP}`);

                if (prop.matches(`[${SCOPE}][${PROP}]`)) {

                    var ptypeString = [prop.getAttribute(`${TYPE}`)];
                    if (spec == 'microdata') {
                        var pmatch   = /(.*\/)(\w+)/g.exec(ptypeString);
                        var pcontext = pmatch && pmatch[1] ? pmatch[1] : undefined;
                        var ptype    = pmatch && pmatch[2] ? pmatch[2] : ptypeString;
                    } else {
                        var pcontext = prop.getAttribute(`${SCOPE}`);
                        var ptype    = ptypeString;
                    }

                    // recursive iterator
                    var _item = this.microdataIterator(prop.parentElement, spec);

                    // if white space than split and duplicate contents
                    if (itemProp.indexOf(' ') != -1) {
                        itemProp.split(' ').forEach(itemPropPart => {
                            item[type][itemPropPart] = _item[ptype] || _item;
                        });
                    } else {
                        item[type][itemProp] = _item[ptype] || _item;
                    }

                }

                else {

                    // to do: check for possible attributes by tag name...
                    var propContent = prop.content || prop.textContent || prop.src || prop.href;

                    // if white space than split and duplicate contents
                    if (itemProp.indexOf(' ') != -1) {
                        itemProp.split(' ').forEach(itemPropPart => {
                            item[type][itemPropPart] = propContent;
                        });
                    } else {
                        item[type][itemProp] = propContent;
                    }

                }

            });

            items.push(item);

        });

        return items.length > 1 ? items : items[0];

    },

};
