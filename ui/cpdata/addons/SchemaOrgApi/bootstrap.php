<?php

$this->helpers['schemasutils'] = 'SchemaOrgApi\\Helper\\Utils';

$this->module('schemaorgapi')->extend([

    'schemaKeys' => [
        'type' => [
            'id',
            'label',
            'comment',
            'subClassOf', // subTypeOf in csv releases
            'enumerationtype',
            'equivalentClass',
            'properties',
            'subClasses', // subTypes in csv releases
            'supersedes',
            'supersededBy',
            'isPartOf',
            'source',
            'type', // custom key
            'ext', // custom key
        ],
        'property' => [
            'id',
            'label',
            'comment',
            'subPropertyOf',
            'equivalentProperty',
            'subproperties',
            'domainIncludes',
            'rangeIncludes',
            'inverseOf',
            'supersedes',
            'supersededBy',
            'isPartOf',
            'source',
            'type', // custom key
            'ext', // custom key
        ],
    ],

    'import' => function($fileName = 'all-layers.jsonld') {

        $collection = 'all_layers';
        
        $_schemas = $this->parseAllLayersFromJsonld($fileName);

        $return = [];

        // save all types and properties in 'all_layers' collection
        $schemas = [];
        foreach ($_schemas as $s) {
            foreach ($s as $schema) {
                $schemas[] = $schema;
            }
        }

        $return[$collection] = $this->app->module('collections')->save($collection, $schemas);

        return $return;

    },

    'parseAllLayersFromJsonld' => function($fileName = 'all-layers.jsonld') {

        $path = $this->app->path("#uploads:schemas/$fileName");

        if (!$path) return ['error' => "File $fileName not found."];

        $json = \json_decode(\file_get_contents($path), true);
        $graphs = $json['@graph'];

        $_types = [];
        $_properties = [];

        $schemaUrl = 'http://schema.org/';

        $mappings = [
            // 'subClassOf' => 'subTypeOf',
        ];

        $stripUrl = [
            'domainIncludes',
            'rangeIncludes',
            'subClassOf',
            'supersededBy',
            'inverseOf',
            'subPropertyOf',
        ];

        $ignore = [
            'http://schema.org/category',
            'http://www.w3.org/2004/02/skos/core#exactMatch',
            'http://www.w3.org/2004/02/skos/core#closeMatch',
        ];

        foreach ($graphs as $g) {

            $entry = [];
            $isProperty = $isType = false;

            foreach ($g as $k => $v) {

                if (\in_array($k, $ignore)) continue;

                if ($k == '@id') $entry['id'] = $v;

                else if ($k == '@type') {
                    if (\is_string($v)) $v = [$v];

                    foreach ($v as $t) {
                        if ($t == 'rdfs:Class')   $isType = true;
                        if ($t == 'rdf:Property') $isProperty = true;
                        if (\strpos($t, $schemaUrl) === 0) {
                            $parts = \explode('/', $t);
                            $name = \end($parts);
                            $entry['enumerationtype'][] = $name;

                            // To do: seems to be wrong...
                            // addressed in Admin::getParentsTree()
                            // $entry['subClassOf'][] = $name;
                            if ($name != 'DataType') $entry['subClassOf'][] = $name;

                            $isType = true;
                        }
                    }
                }

                else if ($k == 'rdfs:label') {
                    if (\is_string($v)) $entry['label'] = $v;
                    else if (\is_array($v) && isset($v['@value'])) $entry['label'] = $v['@value'];
                }

                else if ($k == 'rdfs:comment') {
                    // $entry['comment'] = $v;

                    // fix relative urls in comments
                    $entry['comment'] = \preg_replace_callback(
                        '/(?:href=")(\/.*)"/m',
                        function ($matches) {
                            return \str_replace($matches[1], 'https://schema.org' . $matches[1], $matches[0]);
                        },
                        $v
                    );
                }

                else if (\preg_match("#^{$schemaUrl}|rdfs:#", $k, $match)) {

                    $delim = $match[0] == $schemaUrl ? '/' : ':';
                    $parts = \explode($delim, $k);
                    $key   = \end($parts);

                    $newKey = $mappings[$key] ?? $key;

                    $current = $v;

                    if (!is_array($current)) {
                        $entry['unknown'][] = [$k => $v];
                        continue;
                    }

                    if (isset($current['@id'])) $current = [$current];

                    foreach ($current as $prop) {
                        if (isset($prop['@id'])) {
                            if (in_array($key, $stripUrl)) {
                                $entry[$newKey][] = \preg_replace("#^{$schemaUrl}|rdfs:#", '', $prop['@id']);
                            }
                            else $entry[$newKey][] = $prop['@id'];

                            // extension, e. g.: pending, attic
                            if ($newKey == 'isPartOf') {
                                \preg_match('/(?:http:\/\/)(.*)(?:\.schema\.org.*)/', $prop['@id'], $matches);
                                $entry['ext'] = $matches[1];
                            }
                        }
                    }
                }

                else if ($k == 'http://purl.org/dc/terms/source') {
                    $entry['source'] = isset($v['@id']) ? [$v['@id']] : array_map(function($e) {if (isset($e['@id'])) return $e['@id'];}, $v);
                }

                else if ($k == 'http://www.w3.org/2002/07/owl#equivalentClass') {
                    if (isset($v['@id'])) $v = [$v];
                    foreach ($v as $prop) {
                        if (isset($prop['@id']) && !\preg_match('#^rdf:#', $prop['@id'])) {
                            $entry['equivalentClass'][] = $prop['@id'];
                        }
                    }
                }

                else if ($k == 'http://www.w3.org/2002/07/owl#equivalentProperty') {
                    if (isset($v['@id'])) $v = [$v];
                    foreach ($v as $prop) {
                        if (isset($prop['@id']) && !\preg_match('#^rdf:#', $prop['@id'])) {
                            $entry['equivalentProperty'][] = $prop['@id'];
                        }
                    }
                }

                else {
                    // put all unmatched properties into 'unknown'
                    $entry['unknown'][] = [$k => $v];
                }

            }

            if ($isProperty) {
                $entry['type'] = 'property';
                // $entry['subClassOf'][] = 'Property';
                $_properties[$entry['label']] = $entry;
            }
            elseif ($isType) {
                $entry['type'] = 'type';
                $_types[$entry['label']] = $entry;
            }

        }

        ksort($_types);
        ksort($_properties);

        foreach ($_properties as $v) {

            // add properties to types
            if (isset($v['domainIncludes'])) {
                foreach ($v['domainIncludes'] as $d) {

                    // skip pending properties
                    // if (!isset($_types[$d]['pending'])) {
                        // if (isset($_types[$d])) $_types[$d]['properties'][] = $v['label'];
                    // }
                    if (!isset($v['ext']) || $v['ext'] != 'pending') {
                        if (isset($_types[$d])) $_types[$d]['properties'][] = $v['label'];
                    }
                }
            }

            // add subproperties to properties
            if (isset($v['subPropertyOf'])) {
                foreach ($v['subPropertyOf'] as $d) {
                    if (isset($_properties[$d])) $_properties[$d]['subproperties'][] = $v['label'];
                }
            }
        }

        // add subClasses to types
        foreach ($_types as $v) {
            $parents = \array_unique(\array_merge(
                $v['subClassOf'] ?? [],
                $v['enumerationtype'] ?? []
            ));
            foreach ($parents as $s) {
                $_types[$s]['subClasses'][] = $v['label'];
            }
        }

        $types = $properties = $unknown = [];

        foreach ($_types as $v)      $types[] = $v;
        foreach ($_properties as $v) $properties[] = $v;

        return compact('types', 'properties');

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

    'downloadSchemas' => function() {

        $uploadPath = $this->app->path('#uploads:schemas');

        if (!$uploadPath) {
            $this->app->helper('fs')->mkdir('#uploads:schemas');
        }

        $dataUrl = 'https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases';
        $version = '7.01';

        $srcUrl = "{$dataUrl}/{$version}/";

        $fileNames = [
            'all-layers.jsonld',
            // 'all-layers-types.csv',
            // 'all-layers-properties.csv',
            // 'schema-types.csv',
            // 'schema-properties.csv',
            // 'ext-pending-types.csv',
            // 'ext-pending-properties.csv'
        ];

        $ret = [];

        foreach ($fileNames as $fileName) {

            $content = file_get_contents($srcUrl . $fileName);

            if ($content) {
                $ret[$fileName] = $this->app->helper('fs')->write('#uploads:schemas/' . $fileName, $content);
            }

        }

        return $ret;

    },

    'getInheritedProperties' => function($parent) {

        // recursive

        $collection = 'all_layers';

        $subClassOf = 'subClassOf';

        if (is_string($parent)) {
            $parent = $this->app->module('collections')->findOne($collection, ['label' => $parent]);
        }

        if (!$parent) return false;

        $props = [];

        if (isset($parent[$subClassOf]) && is_array($parent[$subClassOf])) {

            foreach ($parent[$subClassOf] as $subType) {

                $options = [
                    'filter' => [
                        'label' => $subType
                    ],
                ];

                $entries = $this->app->module('collections')->find($collection, $options);

                if (!$entries) continue;

                foreach ($entries as $entry) {

                    $props[$entry['label']] = $entry['properties'];

                    if (isset($entry[$subClassOf]) && is_array($entry[$subClassOf])) {
                        
                        $subProps = $this->getInheritedProperties($entry);

                        foreach ($subProps as $k => $v) {
                            $props[$k] = $v;
                        }
                    }

                }

            }

        }

        return $props;

    },

    'getParentsTree' => function ($entry, $options = null) {

        $collection = 'all_layers';

        if (is_string($entry)) {
            $entry = $this->app->module('collections')->findOne($collection, ['label' => $entry]);
        }

        if (!$entry) return false;

        $isType = $entry['type'] == 'type';

        $subClassOf = $isType ? 'subClassOf' : 'subPropertyOf';

        $parents = [];
        $_parents = $this->getParents($entry);

        foreach ($_parents as $e) {
            if (!is_array($e[$subClassOf] ?? null) && !is_array($e['enumerationtype'] ?? null)) {
                $parents[] = [
                    'label' => $e['label'],
                    'parent' => ''
                ];
                continue;
            }
            if (is_array($e[$subClassOf] ?? null)) {
                foreach ($e[$subClassOf] as $s) {
                    $parents[] = [
                        'label' => $e['label'],
                        'parent' => $s
                    ];
                }
            }
            if (is_array($e['enumerationtype'] ?? null)) {
                foreach ($e['enumerationtype'] as $s) {
                    $parents[] = [
                        'label' => $e['label'],
                        'parent' => $s
                    ];
                }
            }
        }

        $tree = $this->app->helper('schemasutils')->buildTree($parents,[
            'parent_id_column_name' => 'parent',
            'id_column_name' => 'label'
        ]);

        return $tree;

    },

    'getParents' => function($entry, $iteration = 0) {

        // recursive

        $collection = 'all_layers';

        if (is_string($entry)) {
            $entry = $this->app->module('collections')->findOne($collection, ['label' => $entry]);
        }

        if (!$entry) return false;

        $isType = $entry['type'] == 'type';

        $subClassOf = $isType ? 'subClassOf' : 'subPropertyOf';
        $subClasses = $isType ? 'subClasses' : 'subproperties';

        $name = $entry['label'];

        $parents = [];

        $isSubClass = isset($entry[$subClassOf]) && \is_array($entry[$subClassOf]);

        $hasEnumerationType = !$isSubClass && isset($entry['enumerationtype']) && \is_array($entry['enumerationtype']);

        $isDataType = $hasEnumerationType && \in_array('DataType', $entry['enumerationtype']);

        // add current item to parents, otherwise it is possible to miss a branch
        // e. g.: Dentist is a child of 'LocalBusiness' and of 'MedicalBusiness',
        // but 'MedicalBusiness' is a child of 'LocalBusiness', too. Without the current
        // item 'Dentist', the tree 'Thing > Organization > LocalBusiness > Dentist'
        // would get lost
        if ($iteration === 0) {
            $current = [
                'label' => $entry['label']
            ];
            if ($isSubClass) $current[$subClassOf] = $entry[$subClassOf];
            if ($hasEnumerationType) $current['enumerationtype'] = $entry['enumerationtype'];

            // add Property class as parent manually
            // to do: more generic solution
            if (!$isType && !$isSubClass && !$hasEnumerationType) {
                $current[$subClassOf] = ['Property'];
                $parents[] = ['label' => 'Property', $subClassOf => ['Thing']];
                $parents[] = ['label' => 'Thing'];
            }

            $parents[] = $current;
        }

        if ($isDataType) {
            // add DataType parent manually and skip finding it's parents
            // It works fine without skipping, but it leads to a path
            // 'Thing > Intangible > Class > DataType > Number'
            // to do: more generic solution
            $parents[] = ['label' => 'DataType'];
        }

        if (!$isDataType && ($isSubClass || $hasEnumerationType)) {

            $options = [
                'filter' => [],
                'fields' => [
                    'label' => true,
                    'type' => true,
                    $subClassOf => true,
                    'enumerationtype' => true,
                    '_id' => false,
                ],
            ];

            $filter = [];
            if ($isSubClass) {
                $filter[] = [
                    $subClasses => [
                        '$has' => $name
                    ],
                ];
            }
            if ($hasEnumerationType) {
                $filter[] = [
                    'label' => [
                        '$in' => $entry['enumerationtype']
                    ],
                ];
            }

            if ($isSubClass && $hasEnumerationType) {
                $filter = [
                    '$or' => $filter,
                ];
            }
            else {
                $filter = $filter[0];
            }

            $options['filter'] = $filter;

            foreach ($this->app->module('collections')->find($collection, $options) as $e) {

                if ($isType) $parents[] = $e;
                else {
                    // add Property class as parent manually
                    // to do: more generic solution
                    $current = $e;
                    if (!is_array($current[$subClassOf] ?? null)) {
                        $current[$subClassOf] = ['Property'];
                    }
                    $parents[] = $current;
                    $parents[] = ['label' => 'Property', $subClassOf => ['Thing']];
                    $parents[] = ['label' => 'Thing'];
                }

                $isSubClass = isset($e[$subClassOf]) && \is_array($e[$subClassOf]);
                $hasEnumerationType = isset($e['enumerationtype']) && \is_array($e['enumerationtype']);

                if ($isSubClass || $hasEnumerationType) {

                    $grandParents = $this->getParents($e, ++$iteration);

                    if ($grandParents) {
                        foreach($grandParents as $g) {
                            $parents[] = $g;
                        }
                    }
                }
            }
        }

        // remove duplicates
        return array_map('unserialize', array_unique(array_map('serialize', $parents)));

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

