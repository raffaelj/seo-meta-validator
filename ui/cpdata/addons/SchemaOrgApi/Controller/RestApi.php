<?php

namespace SchemaOrgApi\Controller;

class RestApi extends \LimeExtra\Controller {

    public function schema($schema = '') {

        if (empty($schema)) return ['error' => 'Schema not specified'];

        $collection = 'all_layers';

        $_entry = $this->module('collections')->findOne($collection, ['label' => $schema]);

        if (!$_entry) return ['error' => 'Schema not found'];

        $entry = [];

        // return only type/property specific keys
        $keys = $this->module('schemaorgapi')->schemaKeys[$_entry['type']];
        foreach ($keys as $k) {
            if (isset($_entry[$k])) $entry[$k] = $_entry[$k];
        }

        return $entry;

    }

    public function types($subset = false) {

        $collection = 'all_layers';

        $schemas = [];
        $options = [
            'filter' => [
                'type' => 'type',
            ],
            'sort' => [
                'label' => 1
            ],
        ];

        $keys = $this->module('schemaorgapi')->schemaKeys['type'];
        foreach ($keys as $k) {
            $options['fields'][$k] = true;
        }

        if ($subset) {
            $options['fields'] = \array_replace($options['fields'], [
                'id' => false,
                'comment' => false,
                'type' => false,
                'equivalentClass' => false,
                'supersedes' => false,
                'supersededBy' => false,
                'isPartOf' => false,
                'source' => false,
            ]);
        }

        $_schemas = $this->module('collections')->find($collection, $options);

        foreach ($_schemas as &$entry) {

            $label = $entry['label'];

            // remove cockpit specific fields from output
            unset ($entry['_modified'], $entry['_created'], $entry['_id']);

            // replace subTypeOf/subTypes until I'll have changed that in the js validator
            $entry['subTypeOf'] = $entry['subClassOf'];
            $entry['subTypes'] = $entry['subClasses'];
            unset ($entry['subClassOf'], $entry['subClasses']);

            if ($subset) {
                unset($entry['label']);
                if (empty($entry['ext'])) unset($entry['ext']);
            }

            $schemas[$label] = $entry;

        }

        return $schemas;

    }

    public function properties($subset = false) {

        $collection = 'all_layers';

        $schemas = [];
        $options = [
            'filter' => [
                'type' => 'property',
            ],
            'sort' => [
                'label' => 1
            ],
        ];

        $keys = $this->module('schemaorgapi')->schemaKeys['property'];
        foreach ($keys as $k) {
            $options['fields'][$k] = true;
        }

        if ($subset) {
            $options['fields'] = \array_replace($options['fields'], [
                'id' => false,
                'comment' => false,
                'type' => false,
                'equivalentProperty' => false,
                'inverseOf' => false,
                'supersedes' => false,
                'supersededBy' => false,
                'isPartOf' => false,
                'source' => false,
            ]);
        }

        $_schemas = $this->module('collections')->find($collection, $options);

        foreach ($_schemas as &$entry) {

            $label = $entry['label'];

            // remove cockpit specific fields from output
            unset ($entry['_modified'], $entry['_created'], $entry['_id']);

            if ($subset) {
                unset($entry['label']);
                if (empty($entry['ext'])) unset($entry['ext']);
            }

            $schemas[$label] = $entry;

        }

        return $schemas;

    }

    public function all() {

        return [
            'schemas'    => $this->schemas(),
            'properties' => $this->properties()
        ];

    }

    public function subset() {

        return [
            'schemas'    => $this->types(true),
            'properties' => $this->properties(true)
        ];

    }

    public function fetch() {

        // very simple scraper

        $url = $this->param('url', null);

        $error = null;
        $html = null;
        $headers = null;

        if (!$url) return ['error' => 'Url parameter missing'];

        $_url = \parse_url($url);

        if (!isset($_url['scheme']) || !in_array($_url['scheme'], ['http', 'https'])) {
            return ['error' => 'Url must be absolute and start with http(s)://'];
        }

        $headers = @\get_headers($url, 1);

        if ($headers && is_array($headers)) {
            $_headers = [];

            for ($i = 0; isset($headers[$i]); $i++) {

                $_headers[$i] = [
                    '_response_code' => (int) substr($headers[$i], 9, 3),
                    '_protocol' => substr($headers[$i], 0, 8),
                ];

                foreach($headers as $k => $v) {
                    if (is_numeric($k)) continue;

                    if (is_string($v) && $i === 0) {
                        $_headers[$i][$k] = $v;
                    }
                    else if (is_array($v) && isset($v[$i])) {
                        $_headers[$i][$k] = $v[$i];
                    }
                }
            }
            $headers = $_headers;
        }

        try {
            $html = @\file_get_contents($url);
            if ($html === false) $error = \error_get_last();
        }
        catch (\Exception $e) {
            $error = $e->getMessage();
        }

        return compact('error', 'headers', 'html');

    }

}
