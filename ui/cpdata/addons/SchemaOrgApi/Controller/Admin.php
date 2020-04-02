<?php

namespace SchemaOrgApi\Controller;


class Admin extends \Cockpit\AuthController {

    public function before() {

        $this->app->helper('admin')->addAssets('schemaorgapi:assets/components/schema-card.tag');

    }

    public function index() {

        $collection = 'all_layers';

        $schemaGroups  = [];

        $options  = [
            'filter' => [
                'type' => 'type'
            ],
            'fields' => [
                'label' => true,
                '_id' => false,
            ],
            'sort' => [
                'label' => 1
            ],
        ];

        $_schemas = $this->module('collections')->find($collection, $options);

        // group by first character
        foreach ($_schemas as &$entry) {
            $schemaGroups[\substr($entry['label'], 0, 1)][] = $entry['label'];
        }

        return $this->render('schemaorgapi:views/index.php', compact('schemaGroups'));

    }

    public function schema($name) {

        $collection = 'all_layers';

        $entry = $this->module('collections')->findOne($collection, ['label' => $name]);

        if (!$entry) return false;

        $pendingPropOptions = [
            'filter' => [
                'type' => 'property',
                'ext' => 'pending',
                'domainIncludes' => $name
            ],
            'fields' => [
                'label' => true,
                '_id' => false,
            ],
        ];

        $pendingProperties = $this->module('collections')->find($collection, $pendingPropOptions);

        if ($pendingProperties) {
            $pendingProperties = array_map(function($e) { return $e['label']; }, $pendingProperties);
        }

        $entry['_meta']['properties']['pending'] = $pendingProperties;

        $_inheritedProperties = $this->module('schemaorgapi')->getInheritedProperties($entry);

        $inheritedProperties = array_filter($_inheritedProperties, function($v) {return !empty($v);});
        $entry['_meta']['properties']['inherited'] = $inheritedProperties;

        $entry['_meta']['parents'] = $this->module('schemaorgapi')->getParentsTree($entry);

        // remove empty values
        $meta = $entry['_meta'];
        $entry = array_filter($entry, function($v, $k) use ($meta) {
            if (!empty($v)) return true;
            if (!empty($meta[$k])) return true;
        }, ARRAY_FILTER_USE_BOTH);

        if ($this->app->request->is('ajax')) {
            return compact('entry');
        }

        return $this->render('schemaorgapi:views/schema.php', compact('entry'));

    }

    public function getParentsTree($entry, $options = null) {

        return $this->module('schemaorgapi')->getParentsTree($entry, $options);

    }

}
