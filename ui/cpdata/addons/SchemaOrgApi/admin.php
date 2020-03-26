<?php

$this->on('admin.init', function() {

    $this->bindClass('SchemaOrgApi\\Controller\\Admin', 'schemas');

    // add to modules menu
    $this->helper('admin')->addMenuItem('modules', [
        'label' => 'Schemas',
        'icon'  => 'assets:app/media/icons/play-cubis.svg',
        'route' => '/schemas',
        'active' => strpos($this['route'], '/schemas') === 0
    ]);

    // listen to app search
    $this->on('cockpit.search', function($search, $list) {

        $options = [
            'filter' => [
                'label' => ['$regex' => $search]
            ]
        ];

        foreach ($this->module('collections')->find('schema_types', $options) as $entry) {

            $list[] = [
                'icon'  => 'angle-right',
                'title' => $entry['label'],
                'url'   => $this->routeUrl('/schemas/type/'.$entry['label'])
            ];

        }

        foreach ($this->module('collections')->find('schema_properties', $options) as $entry) {

            $list[] = [
                'icon'  => 'angle-down',
                'title' => $entry['label'],
                'url'   => $this->routeUrl('/schemas/property/'.$entry['label'])
            ];

        }

    });

});
