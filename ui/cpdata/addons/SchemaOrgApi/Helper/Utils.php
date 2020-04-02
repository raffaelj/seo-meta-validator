<?php

namespace SchemaOrgApi\Helper;

class Utils extends \Lime\Helper {

    // modified variant from \LimeExtra\Helper\Utils
    public function buildTree(array $elements, $options = [], $parentId = null) {

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
