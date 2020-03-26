

<div riot-view>

    <div>
        <a class="uk-float-right uk-button uk-button-outline uk-text-warning" onclick="{showEntryObject}">@lang('Show json')</a>

        <ul class="uk-breadcrumb">
            <li class=""><a href="{ App.route('/schemas') }">@lang('Schemas')</a></li>
            <li class=""><span>{ type == 'property' ? App.i18n.get('Property') : App.i18n.get('Type') }</span></li>
            <li class="uk-active"><span>{ entry.label }</span></li>
        </ul>
    </div>

    <div class="uk-width-medium-1-3 uk-viewport-height-1-2 uk-container-center uk-text-center uk-flex uk-flex-center uk-flex-middle" if="{ loading }">

        <div class="uk-animation-fade uk-text-center">

            <cp-preloader class="uk-container-center"></cp-preloader>

        </div>

    </div>

    <div class="uk-container-center uk-width-xlarge-3-4" if="{ !loading }">

        <schema-card entry="{ entry }" type="{ type }"></schema-card>

    </div>

    <cp-inspectobject ref="inspect"></cp-inspectobject>

    <script type="view/script">

        var $this = this;

        this.type = '{{ $type }}';
        this.entry = {{ json_encode($entry) }};
        this.loading = true;

        this.on('mount', function(){

            window.addEventListener('popstate', function(e) {
                $this.initState();
            });

            this.initState();
        });

        initState() {

            var parts = window.location.pathname.split('/').slice(-2);

            if (this.type && this.entry && parts[0] == this.type && parts[1] == this.entry.label) {
                this.loading = false;
                this.update();
            }

            else {
                this.load(...parts);
            }

        }

        load(type, name) {

            if (!type || !name) return;

            this.loading = true;

            App.request('/schemas/' + type + '/' + name).then(function(data) {

                if (data && data.type) {

                    $this.type  = data.type;
                    $this.entry = data.entry;
                    $this.pendingProperties = data.pendingProperties || null;

                    $this.update();

                    window.history.pushState(null, null, App.route('/schemas/' + type + '/' + name));

                    $this.loading = false;

                    $this.update();

                }

                else {
                    $this.loading = false;
                    App.ui.notify('unexpected failure, see console output for more information', 'danger');
                    console.log('unexpected failure', type, name, data); // to do...
                }

            }).catch(function(e) {
                $this.loading = false;
                App.ui.notify(e.message, 'danger');
            });

        }

        showEntryObject() {
            $this.refs.inspect.show($this.entry);
            $this.update();
        }

    </script>

</div>
