# Schema.org REST API addon for Cockpit CMS

work in progress

## Setup

Open your command line and navigate to your Cockpit root. In the case of the seo-meta-validator, navigate to `path/to/seo-meta-validator/ui`.

```bash
# download latest csv files from schema.org github repo - they will be stored in /storage/uploads/schemas
./cp schemaorgapi/download

# import csv files in collections
./cp schemaorgapi/import
```

## REST API endpoints

All api endpoints are public! I'll change that later...

```
/**
 * api shortcuts - If you want to use filters, you have to use the collections api
 *
 * /api/schemas/schema/schemaName         @return Object  single schema or property
 * /api/schemas/schemas                   @return Object  all schemas
 * /api/schemas/schemas/1                 @return Object  subset of all schemas
 * /api/schemas/properties                @return Object  all properties
 * /api/schemas/properties/1              @return Object  subset of all properties
 * /api/schemas/all                       @return Object  schemas + properties
 * /api/schemas/subset                    @return Object  subset of schemas + properties
 * /api/schemas/fetch   @param String url @return Object  headers and html
 *
 */
```

## Schema.org csv files

Run the cli command `./cp schemaorgapi/download` to download the latest schema file. It is then stored in `/path/to/cockpit/storage/uploads/schemas`.

The schema file is downloaded from https://github.com/schemaorg/schemaorg/tree/master/data/releases/7.01, [Apache 2.0 licensed](https://github.com/schemaorg/schemaorg/blob/master/LICENSE)

[all-layers.jsonld](https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/7.01/all-layers.jsonld)
