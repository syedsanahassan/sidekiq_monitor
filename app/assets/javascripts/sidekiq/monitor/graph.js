(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    SidekiqMonitor.Graph = (function() {
        function Graph() {
            this.object_values = __bind(this.object_values, this);
            this.array_difference = __bind(this.array_difference, this);
            this.standardize_graphs_config = __bind(this.standardize_graphs_config, this);
            this.render_graph = __bind(this.render_graph, this);
            this.render = __bind(this.render, this);
            this.start_polling = __bind(this.start_polling, this);
            this.initialize = __bind(this.initialize, this);
            var options;
            options = {
                selector: '.graph',
                poll_interval: SidekiqMonitor.settings.poll_interval
            };
            this.initialize(options);
        }

        Graph.prototype.initialize = function(options) {
            var colors;
            this.options = options;
            this.width = 960;
            this.height = 580;
            this.padding = [120, 50, 30, 20];
            if (!$(options.selector).length) {
                return null;
            }
            colors = ['lightblue', 'blue', 'green', 'red', 'gray', 'purple', 'yellow'];
            this.color_scale = d3.scale.ordinal().range(colors);
            this.x_scale = d3.scale.ordinal().rangeRoundBands([0, this.width - this.padding[1] - this.padding[3]]);
            this.y_scale = d3.scale.linear().range([0, this.height - this.padding[0] - this.padding[2]]);
            this.z_scale = d3.scale.ordinal().range(colors);
            this.render();
            return this.start_polling();
        };

        Graph.prototype.start_polling = function() {
            return setInterval((function(_this) {
                return function() {
                    if (document.hasFocus()) {
                        return _this.render();
                    }
                };
            })(this), this.options.poll_interval);
        };

        Graph.prototype.render = function() {
            return d3.json(SidekiqMonitor.settings.api_url('jobs/graph'), (function(_this) {
                return function(data) {
                    var graph_config, graphs_config, index, queues, _results;
                    $(_this.options.selector).text('');
                    queues = data.queues_status_counts.map(function(queues_status_count) {
                        return queues_status_count.queue;
                    });
                    graphs_config = SidekiqMonitor.settings.graphs || {
                        'ALL': null
                    };
                    graphs_config = _this.standardize_graphs_config(graphs_config, queues);
                    _results = [];
                    for (index in graphs_config) {
                        graph_config = graphs_config[index];
                        if (index === '0') {
                            graph_config['show_legend'] = true;
                        }
                        _results.push(_this.render_graph(data, graph_config));
                    }
                    return _results;
                };
            })(this));
        };

        Graph.prototype.render_graph = function(data, graph_config) {
            var label, legend, legend_box_height, legend_box_width, legend_x, legend_y, queue, queue_status_counts, queues, queues_status_counts, rect, rule, statuses, _i, _len, _ref;
            this.svg = d3.select(this.options.selector).append('svg:svg').attr('width', this.width).attr('height', this.height).append('svg:g').attr('transform', 'translate(' + this.padding[3] + ',' + (this.height - this.padding[2]) + ')');
            statuses = data.statuses;
            queues_status_counts = [];
            _ref = data.queues_status_counts;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                queue_status_counts = _ref[_i];
                if (graph_config['queues'].indexOf(queue_status_counts.queue) > -1) {
                    queues_status_counts.push(queue_status_counts);
                }
            }
            data = queues_status_counts;
            this.color_scale.domain(statuses);
            queues = d3.layout.stack()(statuses.map((function(_this) {
                return function(queue) {
                    var d, layers, _j, _len1;
                    layers = [];
                    for (_j = 0, _len1 = data.length; _j < _len1; _j++) {
                        d = data[_j];
                        if (d[queue] != null) {
                            layers.push({
                                x: d.queue,
                                y: d[queue] + 0
                            });
                        } else {
                            layers.push({
                                x: d.queue,
                                y: 0
                            });
                        }
                    }
                    return layers;
                };
            })(this)));
            this.x_scale.domain(queues[0].map((function(_this) {
                return function(d) {
                    return d.x;
                };
            })(this)));
            this.y_scale.domain([
                0, d3.max(queues[queues.length - 1], (function(_this) {
                    return function(d) {
                        return d.y0 + d.y;
                    };
                })(this))
            ]);
            queue = this.svg.selectAll('g.queue').data(queues).enter().append('svg:g').attr('class', 'queue').style('fill', (function(_this) {
                return function(d, i) {
                    return _this.z_scale(i);
                };
            })(this)).style('stroke', (function(_this) {
                return function(d, i) {
                    return d3.rgb(_this.z_scale(i)).darker();
                };
            })(this));
            rect = queue.selectAll('rect').data(Object).enter().append('svg:rect').attr('x', (function(_this) {
                return function(d) {
                    return _this.x_scale(d.x);
                };
            })(this)).attr('y', (function(_this) {
                return function(d) {
                    return -_this.y_scale(d.y0) - _this.y_scale(d.y);
                };
            })(this)).attr('height', (function(_this) {
                return function(d) {
                    return _this.y_scale(d.y);
                };
            })(this)).attr('width', this.x_scale.rangeBand()).append('title').text((function(_this) {
                return function(d) {
                    if (d.y === 1) {
                        return d.y + " job";
                    } else {
                        return d.y + " jobs";
                    }
                };
            })(this));
            label = this.svg.selectAll('text').data(this.x_scale.domain()).enter().append('foreignObject').attr('x', (function(_this) {
                return function(d) {
                    return _this.x_scale(d);
                };
            })(this)).attr('y', 6).attr('dy', '.71em').attr('height', 20).attr('width', this.x_scale.rangeBand()).append('xhtml:div').text((function(_this) {
                return function(d) {
                    return d;
                };
            })(this)).attr('style', 'font-size: 11px; text-align: center; word-wrap:break-word; padding: 0 3px');
            rule = this.svg.selectAll('g.rule').data(this.y_scale.ticks(5)).enter().append('svg:g').attr('class', 'rule').attr('transform', (function(_this) {
                return function(d) {
                    return 'translate(0,' + -_this.y_scale(d) + ')';
                };
            })(this));
            rule.append('svg:text').attr('x', this.width - this.padding[1] - this.padding[3] + 6).attr('dy', '.35em').text(d3.format(',d'));
            if (graph_config['title']) {
                label = this.svg.selectAll('g.text').data(['Test 1']).enter().append('text').attr('x', 0).attr('y', 90 - this.height).attr('height', 20).attr('font-size', '24px').attr('fill', '#777').text(graph_config['title']);
            }
            if (graph_config['show_legend']) {
                legend_x = this.width - 130;
                legend_y = 30 - this.height;
                legend_box_width = 18;
                legend_box_height = 18;
                legend = this.svg.selectAll('.legend').data(this.color_scale.domain().reverse().slice()).enter().append('g').attr('class', 'legend').attr('transform', (function(_this) {
                    return function(d, i) {
                        return 'translate(0,' + i * 20 + ')';
                    };
                })(this));
                legend.append('rect').attr('x', legend_x - 10).attr('y', legend_y).attr('width', legend_box_width + 100).attr('height', legend_box_height + 10).style('fill', '#fff');
                legend.append('rect').attr('x', legend_x).attr('y', legend_y).attr('width', legend_box_width).attr('height', legend_box_height).style('fill', this.color_scale);
                return legend.append('text').attr('x', legend_x + 25).attr('y', legend_y + 9).attr('dy', '.35em').text((function(_this) {
                    return function(d) {
                        return d;
                    };
                })(this));
            }
        };

        Graph.prototype.standardize_graphs_config = function(graph_config, queues) {
            var graph, graphs, matched_queues, pattern, pattern_queues, queue, re, remaining_queues, title, _i, _len;
            graphs = [];
            matched_queues = [];
            for (pattern in graph_config) {
                title = graph_config[pattern];
                graph = {
                    title: title,
                    pattern: pattern
                };
                if (pattern === 'OTHER' || pattern === 'ALL') {
                    graphs[pattern] = graph;
                    continue;
                } else {
                    pattern_queues = [];
                    for (_i = 0, _len = queues.length; _i < _len; _i++) {
                        queue = queues[_i];
                        re = new RegExp(pattern, 'i');
                        if (re.test(queue)) {
                            pattern_queues.push(queue);
                            matched_queues.push(queue);
                        }
                    }
                    graph['queues'] = pattern_queues;
                }
                graphs[pattern] = graph;
            }
            remaining_queues = this.array_difference(queues, matched_queues);
            if (graphs['OTHER']) {
                graphs['OTHER']['queues'] = remaining_queues;
            }
            if (graphs['ALL']) {
                graphs['ALL']['queues'] = queues;
            }
            return this.object_values(graphs);
        };

        Graph.prototype.array_difference = function(array1, array2) {
            return array1.filter(function(value) {
                return !(array2.indexOf(value) > -1);
            });
        };

        Graph.prototype.object_values = function(object) {
            var key, value, _results;
            _results = [];
            for (key in object) {
                value = object[key];
                _results.push(value);
            }
            return _results;
        };

        return Graph;

    })();

    $(function() {
        return new SidekiqMonitor.Graph;
    });

}).call(this);