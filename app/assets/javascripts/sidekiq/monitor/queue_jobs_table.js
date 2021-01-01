(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
        __hasProp = {}.hasOwnProperty;

    SidekiqMonitor.QueueJobsTable = (function(_super) {
        __extends(QueueJobsTable, _super);

        function QueueJobsTable() {
            this.load_selected_queue = __bind(this.load_selected_queue, this);
            this.show_queue_stats = __bind(this.show_queue_stats, this);
            this.initialize = __bind(this.initialize, this);
            return QueueJobsTable.__super__.constructor.apply(this, arguments);
        }

        QueueJobsTable.prototype.initialize = function() {
            var options;
            options = {
                table_selector: 'table.queue-jobs',
                columns: {
                    id: 0,
                    jid: 1,
                    queue: 2,
                    class_name: 3,
                    name: 4,
                    enqueued_at: 5,
                    started_at: 6,
                    duration: 7,
                    message: 8,
                    status: 9,
                    result: 10,
                    args: 11
                },
                column_options: [
                    {
                        bVisible: false
                    }, {
                        bVisible: false
                    }, {
                        bVisible: false
                    }, null, {
                        bSortable: false
                    }, {
                        fnRender: (function(_this) {
                            return function(oObj) {
                                return _this.format_time_ago(oObj.aData[_this.columns.enqueued_at]);
                            };
                        })(this)
                    }, {
                        fnRender: (function(_this) {
                            return function(oObj) {
                                return _this.format_time_ago(oObj.aData[_this.columns.started_at]);
                            };
                        })(this)
                    }, null, {
                        bSortable: false
                    }, {
                        fnRender: (function(_this) {
                            return function(oObj) {
                                var class_name, html, status;
                                status = oObj.aData[_this.columns.status];
                                class_name = (function() {
                                    switch (status) {
                                        case 'failed':
                                            return 'danger';
                                        case 'complete':
                                            return 'success';
                                        case 'running':
                                            return 'primary';
                                        default:
                                            return 'info';
                                    }
                                })();
                                html = "<a href=\"#\" class=\"btn btn-" + class_name + " btn-mini status-value\">" + oObj.aData[_this.columns.status] + "</a>";
                                if (status === 'failed') {
                                    html += "<a href=\"#\" class=\"btn btn-mini btn-primary retry-job\" data-job-id=\"" + oObj.aData[_this.columns.id] + "\">Retry<a>";
                                }
                                return "<span class=\"action-buttons\">" + html + "</span>";
                            };
                        })(this)
                    }, {
                        bVisible: false
                    }, {
                        bVisible: false
                    }
                ]
            };
            if (!$(options.table_selector).length) {
                return null;
            }
            this.queue_select = $('[name=queue_select]');
            this.queue_select.selectpicker();
            this.queue_select.change((function(_this) {
                return function() {
                    _this.load_selected_queue();
                    return _this.reload_table();
                };
            })(this));
            this.queue_select.val(this.queue_select.find('option:first').val());
            this.load_selected_queue();
            return this.initialize_with_options(options);
        };

        QueueJobsTable.prototype.show_queue_stats = function() {
            return $.getJSON(SidekiqMonitor.settings.api_url("queues/" + this.queue), (function(_this) {
                return function(stats) {
                    var header_cells, html, value_cells;
                    if (stats) {
                        header_cells = "";
                        value_cells = "";
                        $.each(stats.status_counts, function(status, count) {
                            header_cells += "<th>" + status + "</th>";
                            return value_cells += "<td>" + count + "</td>";
                        });
                        html = "<table class=\"table table-striped table-condensed table-bordered\">\n  <tr>" + header_cells + "</tr>\n  <tr>" + value_cells + "</tr>\n</table>";
                    } else {
                        html = '';
                    }
                    return $('.queue-stats').html(html);
                };
            })(this));
        };

        QueueJobsTable.prototype.load_selected_queue = function() {
            this.queue = this.queue_select.val();
            this.api_params['queue'] = this.queue;
            return this.show_queue_stats();
        };

        return QueueJobsTable;

    })(SidekiqMonitor.AbstractJobsTable);

    $(function() {
        return new SidekiqMonitor.QueueJobsTable;
    });

}).call(this);