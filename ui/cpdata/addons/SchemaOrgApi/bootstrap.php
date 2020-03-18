<?php

$this->module('schemaorgapi')->extend([

    'import' => function() {

        $return = [];
        
        $return[] = $this->importCSV('schema_types', 'schema-types.csv');
        $return[] = $this->importCSV('schema_types', 'ext-pending-types.csv', true);

        $return[] = $this->importCSV('schema_properties', 'schema-properties.csv');
        $return[] = $this->importCSV('schema_properties', 'ext-pending-properties.csv', true);

        return $return;

    },

    'convert' => function() {

        $return = [];

        $return[] = $this->convertToLinkedSchemasCollection();
        $return[] = $this->convertToLinkedPropertiesCollection();

        return $return;

    },

    'importCSV' => function($collection, $file_name, $pending = false) {

        $time = time();
        
        if (($handle = fopen(__DIR__.'/csv/'.$file_name, 'r')) !== false) {

            $headers = fgetcsv($handle, 0, ',');

            $line = 1;

            $error = null;

            while (($data = fgetcsv($handle, 0, ',')) !== false) {

                $entry = [];

                foreach($headers as $k => $field) {

                    if ($k == 'id') {
                        $entry[$field] = str_replace('http://schema.org/', '', $data[$k]);
                    }

                    elseif (in_array($field, ['label', 'comment'])) {
                        $entry[$field] = $data[$k];
                    }

                    else {

                        if (isset($data[$k]) && strlen(trim($data[$k]))) {

                            $arr = explode(',', $data[$k]);
                            foreach ($arr as &$v) {
                                $v = trim($v);
                                $v = str_replace('http://schema.org/', '', $v);
                            }

                            $entry[$field] = $arr;

                        }

                    }

                }

                $entry['pending'] = $pending;

                if ($this->app->module('collections')->save($collection, $entry)) {
                    $line++;
                }
                else {
                    $error = ['error' => "failed on $line"];
                    break;
                }

            }

            fclose($handle);

            $seconds = time() - $time;
            $lines   = $line - 1;

            return $error ? $error : ['message' => "imported $lines lines from $file_name to $collection in $seconds seconds"];

        }

        return ['error' => "failed importing $file_name in $collection"];

    },

    'convertToLinkedSchemasCollection' => function() {

        $time = time();

        $collection = 'schema_types';

        $options = [
            // 'limit' => 5,
        ];

        foreach ($this->app->module('collections')->find($collection, $options) as &$entry) {

            unset($entry['_id']);

            $this->app->module('collections')->save($collection . '_linked', $entry);

        }

        foreach ($this->app->module('collections')->find($collection . '_linked') as &$entry) {

            if (isset($entry['subTypes']) && is_array($entry['subTypes'])) {

                $newLinkedSubTypes = [];

                foreach ($entry['subTypes'] as $subType) {

                    $filter = [
                        'id' => $subType,
                    ];

                    $linkedEntry = $this->app->module('collections')->findOne($collection . '_linked', $filter);
                    
                    if ($linkedEntry) {

                        $newLinkedSubTypes[] = [
                            '_id'     => $linkedEntry['_id'],
                            'link'    => $collection . '_linked',
                            'display' => $linkedEntry['id'],
                        ];

                    }

                }

                $entry['subTypes'] = $newLinkedSubTypes;

            }

            $this->app->module('collections')->save($collection . '_linked', $entry);

        }

        $seconds = time() - $time;

        return ['message' => "converted schmema_types to linked collection in $seconds seconds"];

    },

    'convertToLinkedPropertiesCollection' => function() {

        $time = time();

        $collection = 'schema_properties';

        $options = [
            // 'limit' => 5,
        ];

        foreach ($this->app->module('collections')->find($collection, $options) as &$entry) {

            unset($entry['_id']);

            $this->app->module('collections')->save($collection . '_linked', $entry);

        }

        foreach ($this->app->module('collections')->find($collection . '_linked') as &$entry) {

            // link to schema types
            foreach (['domainIncludes', 'rangeIncludes'] as $fieldName) {

                if (isset($entry[$fieldName]) && is_array($entry[$fieldName])) {

                    $newLinkedSubTypes = [];

                    foreach ($entry[$fieldName] as $subType) {

                        $filter = [
                            'id' => $subType,
                        ];

                        $linkedEntry = $this->app->module('collections')->findOne('schema_types_linked', $filter);
                        
                        if ($linkedEntry) {

                            $newLinkedSubTypes[] = [
                                '_id'     => $linkedEntry['_id'],
                                'link'    => 'schema_types_linked',
                                'display' => $linkedEntry['id'],
                            ];

                        }

                    }

                    $entry[$fieldName] = $newLinkedSubTypes;

                }

            }

            // link to schema properties
            foreach (['subproperties', 'subPropertyOf'] as $fieldName) {

                if (isset($entry[$fieldName]) && is_array($entry[$fieldName])) {

                    $newLinkedSubTypes = [];

                    foreach ($entry[$fieldName] as $subType) {

                        $filter = [
                            'id' => $subType,
                        ];

                        $linkedEntry = $this->app->module('collections')->findOne('schema_properties_linked', $filter);
                        
                        if ($linkedEntry) {

                            $newLinkedSubTypes[] = [
                                '_id'     => $linkedEntry['_id'],
                                'link'    => 'schema_properties_linked',
                                'display' => $linkedEntry['id'],
                            ];

                        }

                    }

                    $entry[$fieldName] = $newLinkedSubTypes;

                }

            }

            $this->app->module('collections')->save($collection . '_linked', $entry);

        }

        $seconds = time() - $time;

        return ['message' => "converted schmema_types to linked collection in $seconds seconds"];

    },

]);

// ADMIN
if (COCKPIT_ADMIN_CP) {
    include(__DIR__ . '/admin.php');
}

// REST
if (COCKPIT_API_REQUEST) {
    include(__DIR__ . '/rest_api.php');
}
