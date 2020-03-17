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

});

// allow access to public collections
$app->on('cockpit.api.authenticate', function($data) {

    if ($data['user'] || !in_array($data['resource'], ['schema', 'property', 'schemas', 'properties', 'schemaorg'])) return;

    $collection = $this->module('collections')->collection('schema_types');

    if ($collection && isset($collection['acl']['public'])) {
        $data['authenticated'] = true;
        $data['user'] = ['_id' => null, 'group' => 'public'];
    }

    $collection = $this->module('collections')->collection('schema_properties');

    if ($collection && isset($collection['acl']['public'])) {
        $data['authenticated'] = true;
        $data['user'] = ['_id' => null, 'group' => 'public'];
    }

});