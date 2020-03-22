# Schema.org REST API addon for Cockpit CMS

work in progress

to do:

* [ ] docs
* [ ] ui

## Setup

Open your command line and navigate to your Cockpit root. In the case of the seo-meta-validator, navigate to `path/to/seo-meta-validator/ui`

```bash
# download latest csv files from schema.org github repo - they will be stored in /storage/uploads/schemas
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

## Schema.org csv files

Run the cli command `./cp schemaorgapi/download` to download the latest schema csv files. They are stored in `/uploads/schemas`.

The CSV files are downloaded from https://github.com/schemaorg/schemaorg/tree/master/data/releases/7.0, [Apache 2.0 licensed](https://github.com/schemaorg/schemaorg/blob/master/LICENSE)

* [schema-types.csv](https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/7.0/schema-types.csv)
* [schema-properties](https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/7.0/schema-properties.csv)
* [ext-pending-types.csv](https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/7.0/ext-pending-types.csv)
* [ext-pending-properties.csv](https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/7.0/ext-pending-properties.csv)
