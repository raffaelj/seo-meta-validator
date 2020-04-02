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

        $collection = 'all_layers';

        $options = [
            'filter' => [
                'label' => ['$regex' => $search]
            ]
        ];

        foreach ($this->module('collections')->find($collection, $options) as $entry) {

            $list[] = [
                'icon'  => 'angle-' . ($entry['type'] == 'type' ? 'right' : 'down'),
                'title' => $entry['label'],
                'url'   => $this->routeUrl('/schemas/schema/'.$entry['label'])
            ];

        }

    });

});
