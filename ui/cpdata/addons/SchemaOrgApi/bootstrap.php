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

    'importCSV' => function($collection, $file_name, $pending = false) {

        $time = time();

        if (($handle = fopen($this->app->path('#uploads:schemas').'/'.$file_name, 'r')) !== false) {

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

    'dropCollection' => function($collection) {

        // drop collection without deleting the field definition file
        $collection = $this->app->module('collections')->collection($collection);
        $name = $collection['name'];
        if ($collection) {
            $this->app->storage->dropCollection("collections/{$collection['_id']}");
            
            return ['message' => "Dropped $name"];
        }

        return ['message' => "I wanted to drop $name, but it doesn't exist."];

    },

    'copyCollection' => function($collection) {

        $time = time();

        // copy collection to linked collection
        foreach ($this->app->module('collections')->find($collection) as &$entry) {

            unset($entry['_id']);

            $this->app->module('collections')->save($collection . '_linked', $entry);

        }

        $seconds = time() - $time;

        return ['message' => "Copied $collection to linked collection in $seconds seconds"];

    },

    'downloadSchemas' => function() {

        $uploadPath = $this->app->path('#uploads:schemas');
        if (!$uploadPath) {
            $this('fs')->mkdir('#uploads:schemas');
        }

        $srcUrl = 'https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/7.0/';

        $fileNames = [
            'schema-types.csv',
            'schema-properties.csv',
            'ext-pending-types.csv',
            'ext-pending-properties.csv'
        ];

        $ret = [];

        foreach ($fileNames as $file) {

            $content = file_get_contents($srcUrl . $file);

            if ($content) {
                $ret[$file] = $this('fs')->write('#uploads:schemas/' . $file, $content);
            }

        }

        return $ret;

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

// CLI
if (COCKPIT_CLI) {
    $this->path('#cli', __DIR__.'/cli');
}

