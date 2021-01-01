(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
        __hasProp = {}.hasOwnProperty;

    SidekiqMonitor.JobsTable = (function(_super) {
        __extends(JobsTable, _super);

        function JobsTable() {
            this.initialize = __bind(this.initialize, this);
            return JobsTable.__super__.constructor.apply(this, arguments);
        }

        JobsTable.prototype.initialize = function() {
            var options;
            options = {
                table_selector: 'table.jobs',
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
                    }, null, null, {
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
            return this.initialize_with_options(options);
        };

        return JobsTable;

    })(SidekiqMonitor.AbstractJobsTable);

    $(function() {
        return new SidekiqMonitor.JobsTable;
    });

}).call(this);