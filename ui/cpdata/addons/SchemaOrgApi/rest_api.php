<?php

$app->on('cockpit.rest.init', function($routes) {

    $routes['schemas'] = 'SchemaOrgApi\\Controller\\RestApi';

});

// allow public access to schema routes
$app->on('cockpit.api.authenticate', function($data) {

    if ($data['user'] || $data['resource'] != 'schemas') return;

    $data['authenticated'] = true;
    $data['user'] = ['_id' => null, 'group' => 'public'];

});
