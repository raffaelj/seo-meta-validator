<?php

namespace SchemaOrgApi\Controller;

class RestApi extends \LimeExtra\Controller {

    protected function before() {
        $this->app->response->mime = 'json';
    }

    public function schema($schema = '') {

        if (empty($schema)) return ['error' => 'Schema not specified'];

        $entry = $this->module('collections')->findOne('schema_types', ['id' => $schema]);

        if (!$entry) return ['error' => 'Schema not found'];

        unset ($entry['_modified'], $entry['_created'], $entry['_id']);

        return $entry;

    }

    public function property($schema = '') {

        if (empty($schema)) return ['error' => 'Schema not specified'];

        $entry = $this->module('collections')->findOne('schema_properties', ['id' => $schema]);

        if (!$entry) return ['error' => 'Schema not found'];

        unset ($entry['_modified'], $entry['_created'], $entry['_id']);

        return $entry;

    }

    public function schemas() {

        $schemas  = [];
        $options  = [];
        $_schemas = $this->module('collections')->find('schema_types', $options);

        foreach ($_schemas as &$entry) {

            unset ($entry['_modified'], $entry['_created'], $entry['_id']);

            $schemas[$entry['label']] = $entry;

        }

        return $schemas;

    }

    public function properties() {

        $schemas  = [];
        $options  = [];
        $_schemas = $this->module('collections')->find('schema_properties', $options);

        foreach ($_schemas as &$entry) {

            unset ($entry['_modified'], $entry['_created'], $entry['_id']);

            $schemas[$entry['label']] = $entry;

        }

        return $schemas;

    }

    public function all() {

        return [
            'schemas'    => $this->schemas(),
            'properties' => $this->properties()
        ];

    }

}
