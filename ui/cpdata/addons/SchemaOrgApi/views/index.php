<script>
    window.__schemaGroups = {{ json_encode($schemaGroups) }};
</script>

<div>
    <ul class="uk-breadcrumb">
        <li class="uk-active"><span>@lang('Schemas')</span></li>
    </ul>
</div>

<div riot-view>

    <div class="uk-container-center">

        <nav class="uk-nav uk-navbar">

            <ul class="uk-navbar-nav">
                <li each="{ schemas, char in schemaGroups }">
                    <a href="#schema-toc-{ char }">
                        <span class="uk-text-bold">{ char }</span>
                        <span class="uk-text-muted uk-text-small">{ schemas.length }</span>
                    </a>
                </li>
            </ul>

        </nav>

        <div class="uk-grid" data-uk-grid-margin>

            <div each="{ schemas, char in schemaGroups }" class="uk-width-small-1-2 uk-width-medium-1-3 uk-width-large-1-4 uk-width-xlarge-1-5">

                <h3 class="uk-text-bold" id="schema-toc-{ char }">{ char }</h3>

                <ul class="uk-list">
                    <li each="{ schema in schemas }">
                        <a href="@route('/schemas/schema/'){schema}">{ schema }</a>
                    </li>
                </ul>

            </div>

        </div>

    </div>

    <script type="view/script">

        this.schemaGroups = window.__schemaGroups;

    </script>

</div>
