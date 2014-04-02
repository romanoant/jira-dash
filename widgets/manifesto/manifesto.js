widget = {
    //runs when we receive data from the job
    onData: function(el, data) {
        var $container = $(".content", el).empty();
        
        _.each(data, function (environment) {
            $container.append(
                createEnvironment(environment)
            );
        });

        $('.content', el).removeClass('hidden').addClass('show');
        $('.spinner', el).remove();

        function createEnvironment(environment) {
            var $env = $("<div class='environment'></div>")
                            .addClass(environment.color || "")
                            .append(
                                $("<h2>").text(environment.environment)
                            );

            _.each(createProducts(environment.products), function (product) {
                $env.append(product);
            });

            return $env;
        }

        function createProducts(products) {
            var productArray = [];
            _.each(products, function (product) {
                var $productRow = $("<div class='product'></div>")
                    .append(
                        $("<span class='name'>").text(product.name)
                    )
                    .append(
                        $("<span class='version'>").text(product.version)
                    );

                _.each(createPlugins(product.plugins), function (plugin) {
                    $productRow.append(plugin);
                });

                productArray.push($productRow);
            });
            return productArray;
        }

        function createPlugins(plugins) {
            var pluginArray = [];
            _.each(plugins, function (plugin) {
                var $pluginRow = $("<div class='plugin'></div>")
                    .append(
                        $("<span class='name'>").text(plugin.name)
                    )
                    .append(
                        $("<span class='version'>").text(plugin.version)
                    );
                pluginArray.push($pluginRow);
            });
            console.log(pluginArray);
            return pluginArray;
        }
    }
};