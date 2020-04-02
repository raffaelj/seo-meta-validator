
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

        <schema-card entry="{ entry }"></schema-card>

    </div>

    <cp-inspectobject ref="inspect"></cp-inspectobject>

    <script type="view/script">

        var $this = this, cache = {};

        this.entry = {{ json_encode($entry) }};
        this.type = this.entry.type;
        this.loading = true;

        this.on('mount', function(){

            window.addEventListener('popstate', function(e) {
                $this.initState();
            });

            this.initState();
        });

        initState() {

            var name = window.location.pathname.split('/').slice(-1)[0];

            if (name == this.entry.label) {
                cache[this.entry.label] = this.entry;
                this.loading = false;
                this.update();
            }

            else {
                this.load(name);
            }

        }

        load(name) {

            if (!name) return;

            this.loading = true;
            
            if (cache[name]) {

                this.type = cache[name].type;
                this.entry = cache[name];
                this.update();

                window.history.pushState(null, null, App.route('/schemas/schema/' + name));
                document.title = `Schemas » ${App.Utils.ucfirst(this.type)} » ${name}`;
                this.loading = false;
                this.update();

                return;
            }

            App.request('/schemas/schema/' + name).then(function(data) {

                if (data && data.entry) {

                    $this.type  = data.entry.type;
                    $this.entry = data.entry;

                    cache[data.entry.label] = data.entry;

                    $this.update();

                    window.history.pushState(null, null, App.route('/schemas/schema/' + name));

                    document.title = `Schemas » ${App.Utils.ucfirst($this.type)} » ${name}`;

                    $this.loading = false;

                    $this.update();

                }

                else {
                    $this.loading = false;
                    App.ui.notify('unexpected failure, see console output for more information', 'danger');

                    console.log('unexpected failure', name, data); // to do...
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
