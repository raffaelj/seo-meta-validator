# SEO Meta Validator

**Work in progress - alpha release!**

I need a html test suite and I wasn't able to find a good one (without relying on third party services), so I rewrote [npm/structured-data-testing-tool][4] and [npm/web-auto-extractor][5] to a less resource hungry package, that also works in a web browser.

It is basically a rewrite of the structured-data-testing-tool by Iain Collins and it isn't fully implemented, yet.

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

### browser bookmarklet

Create a browser bookmark and copy the content from `dist/bookmarklet.js` in the location field.

Open a external website. Click on the bookmark and it loads the script `metavalidator.min.js` with a simple overlay to run tests.

It may fail due to CORS.

The built bookmarklet has a hard coded url to `http://localhost/seo-meta-validator/dist/metavalidator.min.js`. Change the url if your host url differs.

### CLI

Not fully implemented yet. Run `node bin/cli.js --url https://example.com` to see a very limited cli output.

## Build

* `npm run build` and `npm run watch` to rebuild js an css files
* `npm run build:bookmarklet` ...
* see `package.json` for more build scripts

## To do

### meta

* [ ] How to deal with mixed licensed content (ISC, MIT)?
* [ ] collaboration or new project?
  * collaborate with Iain Collins and merge my rewrite to his tool or
  * create my own project
* [ ] split project into multiple packages/repos, e. g. "test suite" and "meta-extractor"...?

### general/bugs

* [ ] SEO preset
* [ ] validate schemas
* [ ] microdata/rdfa parser schould match spec
* [ ] check for valid url
* [ ] avoid running the same test multiple times (e. g. preset "Default" & "Google" or "SocialMedia" & Twitter)
* [x] entry point with differnt DOMParser for node/cli usage
* [ ] babel, polyfills...
* [ ] metatags should be grouped (e. g. og with multiple og images)
* [ ] performance tests/optimization
* [ ] catch error if url is not parsable
* [ ] self tests

### mini browser ui

* [ ] Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource

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

A lot of the code is copied and modified from [structured-data-testing-tool][1], (c) Iain Collins, ISC License.
The parsers are rewritten variants from [web-auto-extractor][2], (c) Dayan Adeeb, MIT License.
Some internal js helpers are from [Cockpit CMS (App.js)][3], (c) Artur Heinze, MIT License

[1]: https://github.com/glitchdigital/structured-data-testing-tool
[2]: https://github.com/indix/web-auto-extractor
[3]: https://github.com/agentejo/cockpit/
[4]: https://www.npmjs.com/package/structured-data-testing-tool
[5]: https://www.npmjs.com/package/web-auto-extractor
