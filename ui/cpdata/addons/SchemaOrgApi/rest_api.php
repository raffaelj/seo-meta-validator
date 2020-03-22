<?php

/**
 * api shortcuts - If you want to use filters, you have to use the collections api
 *
 * /api/schema/schemaName         @return Object  single schema
 * /api/property/propertyName     @return Object  single property
 * /api/schemas                   @return Object  all schemas
 * /api/properties                @return Object  all properties
 *
 */
$app->on('cockpit.rest.init', function($routes) {

    $routes['schemaorg'] = 'SchemaOrgApi\\Controller\\RestApi';

    $routes['schema'] = function($schema = '') {

        return $this->invoke('SchemaOrgApi\\Controller\\RestApi', 'schema', [$schema]);

    };

    $routes['property'] = function($schema = '') {

        return $this->invoke('SchemaOrgApi\\Controller\\RestApi', 'property', [$schema]);

    };

    $routes['schemas'] = function() {

        return $this->invoke('SchemaOrgApi\\Controller\\RestApi', 'schemas');

    };

    $routes['properties'] = function() {

        return $this->invoke('SchemaOrgApi\\Controller\\RestApi', 'properties');

    };

    $routes['all'] = function() {

        return $this->invoke('SchemaOrgApi\\Controller\\RestApi', 'all');

    };

    $routes['fetch'] = function() {

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

    };

});

// allow public access to schema shortcuts
$app->on('cockpit.api.authenticate', function($data) {

    if ($data['user'] || !in_array($data['resource'], ['schema', 'property', 'schemas', 'properties', 'schemaorg', 'all', 'fetch'])) return;

    $data['authenticated'] = true;
    $data['user'] = ['_id' => null, 'group' => 'public'];

});