# SEO Meta Validator

**Work in progress - alpha release!**

I need a html test suite and I wasn't able to find a good one (without relying on third party services), so I rewrote [npm/structured-data-testing-tool][4] and [npm/web-auto-extractor][5] to a less resource hungry package, that also works in a web browser.

It is basically a rewrite of the [structured-data-testing-tool][1] by Iain Collins and it isn't fully implemented, yet.

## Goals

* [ ] extract meta data from website
  * [x] metatags
    * [ ] grouped by twitter, og, og:image...
  * [x] jsonld
  * [x] microdata
  * [x] rdfa
  * [ ] some more ???
* [ ] validate data
  * [ ] for SEO best practices
  * [ ] valid properties
    * [ ] match schema.org
    * [ ] valid data types
* [ ] multiple usage options
  * [ ] browser based ui
  * [ ] limited ui via bookmarklet
  * [ ] cli
  * [ ] js/node api
* [ ] connect with a (self hosted) nu validator instance

## Usage

### mini ui in browser

Save this repo in `/path/to/xampp/htdocs/seo-meta-validator`, run Apache and open your browser `http://localhost/seo-meta-validator`.

It works for testing websites on localhost, but not with external urls due to CORS.

You have to install Cockpit CMS manually. I don't want to redistribute the whole thing (>10MB) with this repo. Navigate in your shell to `/path/to/seo-meta-validator` and clone Cockpit with

`git clone https://github.com/agentejo/cockpit.git ui/lib/cockpit`

or download [Cockpit CMS][3] and unzip it into `/path/to/seo-meta-validator/ui/lib/cockpit`.

If you downloaded Cockpit and you want to login, navigate to `http://localhost/seo-meta-validator/ui` in your browser (user: admin, password: admin).

Now you have to setup the schema api.

Navigate to `path/to/seo-meta-validator/ui`

```bash
# download latest csv files from schema.org github repo
# they will be stored in /ui/cpdata/storage/uploads/schemas
./cp schemaorgapi/download

# import csv files
./cp schemaorgapi/import
```

If you want to use the linked collections (nice for exploring the schemas), you have to do some more steps:

```bash
# copy the collections
./cp schemaorgapi/copy --collection schema_types
./cp schemaorgapi/copy --collection schema_properties

# convert both collections, so they have linked entries
./cp schemaorgapi/convert --types --properties
```

### browser bookmarklet

Create a browser bookmark and copy the content from `dist/bookmarklet.js` in the location field.

Open a external website. Click on the bookmark and it loads the script `metavalidator.min.js` with a simple overlay to run tests.

It may fail due to CORS.

The built bookmarklet has a hard coded url to `http://localhost/seo-meta-validator/dist/metavalidator.min.js`. Change the url if your host url differs.

### CLI

Not fully implemented yet. Run `node bin/cli.js --url https://example.com` to see a very limited cli output.

## Build

* `npm run build` and `npm run watch` to rebuild js an css files
* `npm run build:js:dev` and `npm run watch:js:dev` to rebuild js files without minifying (for debugging)
* `npm run build:bookmarklet` ...
* see `package.json` for more build scripts

## To do

### meta

* [ ] How to deal with mixed licensed content? I publish everything under MIT, sdtt is ISC licensed and the browserified jmespath is Apache 2.0 licensed.
* [ ] collaboration or new project?
  * collaborate with Iain Collins and merge my rewrite to his tool or
  * create my own project
* [ ] split project into multiple packages/repos, e. g. "test suite" and "meta-extractor"...?

### general/bugs

* [ ] SEO preset
  * [x] length checks for title, description
  * [x] length checks for og:title, og:description
  * [x] length checks for twitter:title, twitter:description
  * [] ...
* [ ] validate schemas
  * [ ] allowed properties (fails for strings that should be parsed as object, e. g. `"author": "A. Smith"` should be parsed as `"author": {"@type":"Thing","name":"A. Smith"}`)
  * [ ] invalid properties (data type validation) - partially implemented
  * [ ] ...
* [ ] microdata/rdfa parser schould match spec
* [ ] check for valid url
* [x] avoid running the same preset tests multiple times (e. g. preset "Default" & "Google")
* [x] entry point with different DOMParser for node/cli usage
* [ ] babel, polyfills...
* [ ] metatags should be grouped (e. g. og with multiple og images)
* [ ] performance tests/optimization
* [ ] catch error if url is not parsable
* [ ] self tests
* [x] single tests should have conditionals (currently only presets have conditionals)
* [ ] presets should have multiple conditionals (currently only one conditional test is possible) - some data has multiple fallbacks, e.g. if no `twitter:title` is present, Twitter will fallback to `og:title`

### mini browser ui

* [ ] Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource --> use optional api proxi with server side url fetching

### bookmarklet

* [ ] bookmarklet fails sometimes through Content Security Policy
* [ ] more explicit styles because it shares it's styles with the tested website

### sdtt behaviour

* [ ] cli
* [ ] groups
* [.] multiple schema instances
* [ ] number of tests doesn't match
* [ ] load schemas
* [ ] auto detected tests are disabled

## Copyright and License

Copyright 2020 Raffael Jesche under the MIT license.

See [LICENSE](LICENSE) for more information.

## Credits and third party resources

* A lot of the code is copied and modified from [structured-data-testing-tool][1], (c) Iain Collins, ISC License.
* The parsers are rewritten variants from [web-auto-extractor][2], (c) Dayan Adeeb, MIT License.
* Some internal js helpers are from [Cockpit CMS (App.js)][3], (c) Artur Heinze, MIT License
* The built script for browser usage contains the browserified [jmespath][6], (c) James Saryerwinnie, [Apache 2.0 License][7]

[1]: https://github.com/glitchdigital/structured-data-testing-tool
[2]: https://github.com/indix/web-auto-extractor
[3]: https://github.com/agentejo/cockpit/
[4]: https://www.npmjs.com/package/structured-data-testing-tool
[5]: https://www.npmjs.com/package/web-auto-extractor
[6]: https://github.com/jmespath/jmespath.js
[7]: https://raw.githubusercontent.com/jmespath/jmespath.js/master/LICENSE
