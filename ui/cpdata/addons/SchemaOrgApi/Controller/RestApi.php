<?php

namespace SchemaOrgApi\Controller;

class RestApi extends \LimeExtra\Controller {

    public function schema($schema = '') {

        if (empty($schema)) return ['error' => 'Schema not specified'];

        $entry = $this->module('collections')->findOne('schema_types', ['id' => $schema]);

        if (!$entry) return ['error' => 'Schema not found'];

        // remove cockpit specific fields from output
        unset ($entry['_modified'], $entry['_created'], $entry['_id']);

        return $entry;

    }

    public function property($schema = '') {

        if (empty($schema)) return ['error' => 'Schema not specified'];

        $entry = $this->module('collections')->findOne('schema_properties', ['id' => $schema]);

        if (!$entry) return ['error' => 'Schema not found'];

        // remove cockpit specific fields from output
        unset ($entry['_modified'], $entry['_created'], $entry['_id']);

        return $entry;

    }

    public function schemas($subset = false) {

        $schemas = [];
        $options = [
            'sort' => [
                'label' => 1
            ],
        ];

        if ($subset) {
            $options['fields'] = [
                'id' => false,
                'comment' => false,
            ];
        }

        $_schemas = $this->module('collections')->find('schema_types', $options);

        foreach ($_schemas as &$entry) {

            $label = $entry['label'];

            // remove cockpit specific fields from output
            unset ($entry['_modified'], $entry['_created'], $entry['_id']);

            if ($subset) {
                if (!$entry['pending']) {
                    unset($entry['pending']);
                }
                unset($entry['label']);
            }

            $schemas[$label] = $entry;

        }

        return $schemas;

    }

    public function properties($subset = false) {

        $schemas = [];
        $options = [
            'sort' => [
                'label' => 1
            ],
        ];

        if ($subset) {
            $options['fields'] = [
                'id' => false,
                'comment' => false,
            ];
        }

        $_schemas = $this->module('collections')->find('schema_properties', $options);

        foreach ($_schemas as &$entry) {

            $label = $entry['label'];

            // remove cockpit specific fields from output
            unset ($entry['_modified'], $entry['_created'], $entry['_id']);

            if ($subset) {
                if (!$entry['pending']) {
                    unset($entry['pending']);
                }
                unset($entry['label']);
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
            'schemas'    => $this->schemas(true),
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
