<?php

namespace SchemaOrgApi\Controller;


class Admin extends \Cockpit\AuthController {

    public function before() {

        $this->app->helper('admin')->addAssets('schemaorgapi:assets/components/schema-card.tag');

    }

    public function index() {

        $schemaGroups  = [];

        $options  = [
            'fields' => [
                'label' => true,
                '_id' => false,
            ],
            'sort' => [
                'label' => 1
            ],
        ];
        $_schemas = $this->module('collections')->find('schema_types', $options);

        foreach ($_schemas as &$entry) {

            $schemaGroups[substr($entry['label'], 0, 1)][] = $entry['label'];

        }

        return $this->render('schemaorgapi:views/index.php', compact('schemaGroups'));

    }

    public function type($name) {

        $type = 'type';

        $entry = $this->module('collections')->findOne('schema_types', ['label' => $name]);

        if (!$entry) return false;

        $options = [
            'filter' => [
                'pending' => true,
                'domainIncludes' => $name
            ],
            'fields' => [
                'label' => true,
                '_id' => false,
            ],
        ];

        $pendingProperties = $this->module('collections')->find('schema_properties', $options);

        if ($pendingProperties) {
            $pendingProperties = array_map(function($e) { return $e['label']; }, $pendingProperties);
        }

        $entry['_meta']['properties']['pending'] = $pendingProperties;

        $inheritedProperties = $this->getInheritedProperties($entry);
        $entry['_meta']['properties']['inherited'] = $inheritedProperties;

        $entry['_meta']['parents'] = $this->getParentsTree($entry);

        if ($this->app->request->is('ajax')) {
            return compact('type', 'entry');
        }

        return $this->render('schemaorgapi:views/schema.php', compact('type', 'entry'));

    }

    public function property($name) {

        $type = 'property';

        $entry = $this->module('collections')->findOne('schema_properties', ['label' => $name]);

        if (!$entry) return false;

        $options = [
            'filter' => [
                'pending' => true,
                'subPropertyOf' => $name
            ],
            'fields' => [
                'label' => true,
                '_id' => false,
            ],
        ];

        $pendingProperties = $this->module('collections')->find('schema_properties', $options);

        if ($pendingProperties) {
            $pendingProperties = array_map(function($e) { return $e['label']; }, $pendingProperties);
        }

        $entry['_meta']['subproperties']['pending'] = $pendingProperties;

        if ($this->app->request->is('ajax')) {
            return compact('type', 'entry');
        }

        return $this->render('schemaorgapi:views/schema.php', compact('type', 'entry'));

    }

    public function getInheritedProperties($parent) {

        // recursive

        if (is_string($parent)) {
            $parent = $this->module('collections')->findOne('schema_types', ['label' => $parent]);
        }

        if (!$parent) return false;

        $props = [];

        if (isset($parent['subTypeOf']) && is_array($parent['subTypeOf'])) {

            foreach ($parent['subTypeOf'] as $subType) {

                $options = [
                    'filter' => [
                        'label' => $subType
                    ],
                ];

                $entries = $this->module('collections')->find('schema_types', $options);

                if (!$entries) continue;

                foreach ($entries as $entry) {

                    $props[$entry['label']] = $entry['properties'];

                    if (isset($entry['subTypeOf']) && is_array($entry['subTypeOf'])) {
                        
                        $subProps = $this->getInheritedProperties($entry);

                        foreach ($subProps as $k => $v) {
                            $props[$k] = $v;
                        }
                    }

                }

            }

        }

        return $props;

    }

    public function getParentsTree($entry, $options = null) {

        $collection = $options['collection'] ?? 'schema_types';

        if (is_string($entry)) {
            $entry = $this->module('collections')->findOne($collection, ['label' => $entry]);
        }

        if (!$entry) return false;

        $parents = [];
        $_parents = $this->getParents($entry);

        foreach ($_parents as $e) {
            if (!is_array($e['subTypeOf'])) {
                $parents[] = $e;
                continue;
            }
            foreach ($e['subTypeOf'] as $s) {
                $parents[] = [
                    'label' => $e['label'],
                    'subTypeOf' => $s
                ];
            }
        }

        $tree = $this->buildTree($parents,[
            'parent_id_column_name' => 'subTypeOf',
            'id_column_name' => 'label'
        ]);

        return $tree;

    }

    public function getParents($entry, $options = null) {

        $collection = $options['collection'] ?? 'schema_types';

        if (is_string($entry)) {
            $entry = $this->module('collections')->findOne($collection, ['label' => $entry]);
        }

        if (!$entry) return false;

        $name = $entry['label'];

        $parents = [];

        if (isset($entry['subTypeOf']) && is_array($entry['subTypeOf'])) {

            $options = [
                'filter' => [
                    'subTypes' => [
                        '$has' => $name
                    ],
                ],
                'fields' => [
                    'label' => true,
                    'subTypeOf' => true,
                    '_id' => false,
                ],
            ];

            foreach ($this->module('collections')->find($collection, $options) as $e) {

                $parents[] = $e;

                if (isset($e['subTypeOf']) && is_array($e['subTypeOf'])) {

                    $grandParents = $this->getParents($e);

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

    }

    // modified variant from \LimeExtra\Utils
    protected function buildTree(array $elements, $options = [], $parentId = null) {

        $options = \array_merge([
            'parent_id_column_name' => '_pid',
            'children_key_name' => 'children',
            'id_column_name' => '_id',
            'sort_column_name' => null
        ], $options);

        $branch = [];

        foreach ($elements as $element) {

            $pid = isset($element[$options['parent_id_column_name']]) ? $element[$options['parent_id_column_name']] : null;

            if ($pid == $parentId) {

                $children = $this->buildTree($elements, $options, $element[$options['id_column_name']]);

                if ($children) {
                    $element[$options['children_key_name']] = $children;
                }

                unset($element[$options['parent_id_column_name']]);

                $branch[] = $element;
            }
        }

        if ($options['sort_column_name']) {

            \usort($branch, function ($a, $b) use($options) {

                $_a = isset($a[$options['sort_column_name']]) ? $a[$options['sort_column_name']] : null;
                $_b = isset($b[$options['sort_column_name']]) ? $b[$options['sort_column_name']] : null;

                if ($_a == $_b) {
                    return 0;
                }

                return ($_a < $_b) ? -1 : 1;
            });
        }

        return $branch;
    }

}
