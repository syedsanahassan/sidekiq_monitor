(function() {
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    SidekiqMonitor.AbstractJobsTable = (function() {
        function AbstractJobsTable() {
            this.format_time_ago = __bind(this.format_time_ago, this);
            this.start_polling = __bind(this.start_polling, this);
            this.reload_table = __bind(this.reload_table, this);
            this.on_poll = __bind(this.on_poll, this);
            this.show_job = __bind(this.show_job, this);
            this.initialize_ui = __bind(this.initialize_ui, this);
            this.initialize_with_options = __bind(this.initialize_with_options, this);
            this.api_params = {};
            this.initialize();
        }

        AbstractJobsTable.prototype.initialize_with_options = function(options) {
            this.options = options;
            this.table = $(this.options.table_selector);
            this.columns = this.options.columns;
            this.status_filter = null;
            $.getJSON(SidekiqMonitor.settings.api_url('jobs/clean'));
            this.table.dataTable({
                bProcessing: true,
                bServerSide: true,
                sAjaxSource: this.table.data('source'),
                iDisplayLength: 10,
                aaSorting: [[this.columns.enqueued_at, 'desc']],
                sPaginationType: 'bootstrap',
                aoColumns: this.options.column_options,
                oLanguage: {
                    sInfo: '_TOTAL_ jobs',
                    sInfoFiltered: ' (filtered from _MAX_)',
                    sLengthMenu: 'Per page: _MENU_',
                    sSearch: ''
                },
                fnRowCallback: (function(_this) {
                    return function(nRow, aData, iDisplayIndex) {
                        return $('.timeago', nRow).timeago();
                    };
                })(this),
                fnInitComplete: (function(_this) {
                    return function() {
                        var filter_container;
                        filter_container = _this.table.siblings('.dataTables_filter');
                        filter_container.find('input').attr('placeholder', 'Search...');
                        return $.getJSON(SidekiqMonitor.settings.api_url('jobs/statuses'), function(statuses) {
                            var status_filter_html;
                            status_filter_html = '';
                            $.each(statuses, function(key, status) {
                                return status_filter_html += "<button type=\"button\" class=\"btn btn-small\" data-value=\"" + status + "\">" + status + "</button>";
                            });
                            status_filter_html = "<div class=\"btn-group status-filter\" data-toggle=\"buttons-radio\">" + status_filter_html + "</div>";
                            filter_container.prepend(status_filter_html);
                            return _this.status_filter = filter_container.find('.status-filter');
                        });
                    };
                })(this),
                fnServerData: (function(_this) {
                    return function(sSource, aoData, fnCallback) {
                        $.each(_this.api_params, function(key, value) {
                            return aoData.push({
                                name: key,
                                value: _this.api_params[key]
                            });
                        });
                        return $.getJSON(sSource, aoData, function(json) {
                            return fnCallback(json);
                        });
                    };
                })(this)
            });
            this.table.parents('.dataTables_wrapper').addClass('jobs-table-wrapper');
            return this.initialize_ui();
        };

        AbstractJobsTable.prototype.initialize_ui = function() {
            this.table.on('click', '.status-value', (function(_this) {
                return function(e) {
                    var job, tr;
                    tr = $(e.target).parents('tr:first')[0];
                    job = _this.table.fnGetData(tr);
                    _this.show_job(job);
                    return false;
                };
            })(this));
            this.table.on('click', '.retry-job', (function(_this) {
                return function(e) {
                    var id;
                    id = $(e.target).attr('data-job-id');
                    $.getJSON(SidekiqMonitor.settings.api_url('jobs/retry/' + id), function() {
                        return _this.reload_table();
                    });
                    return false;
                };
            })(this));
            $('body').on('click', '.status-filter .btn', (function(_this) {
                return function(e) {
                    var btn, value;
                    e.stopPropagation();
                    btn = $(e.target);
                    btn.siblings('.btn').removeClass('active');
                    btn.toggleClass('active');
                    value = _this.status_filter.find('.active:first').attr('data-value');
                    if (value == null) {
                        value = '';
                    }
                    return _this.table.fnFilter(value, _this.columns.status - 1);
                };
            })(this));
            return this.start_polling();
        };

        AbstractJobsTable.prototype.show_job = function(job) {
            var args, class_name, duration, id, jid, key, modal, modal_html, name, result, result_html, rows_html, started_at, status, value;
            if (job == null) {
                return false;
            }
            id = job[this.columns.id];
            jid = job[this.columns.jid];
            class_name = job[this.columns.class_name];
            name = job[this.columns.name];
            started_at = job[this.columns.started_at];
            duration = job[this.columns.duration];
            status = job[this.columns.status];
            result = job[this.columns.result];
            args = job[this.columns.args];
            status = $("<div>" + status + "</div>").find('.status-value').text();
            result_html = '';
            if (status === 'failed') {
                rows_html = '';
                for (key in result) {
                    value = result[key];
                    if (key !== 'message' && key !== 'backtrace') {
                        rows_html += "<tr><td>" + key + "</td><td>" + (JSON.stringify(value, null, 2)) + "</td></tr>";
                    }
                }
                if (rows_html) {
                    rows_html = "<h4>Result</h4>\n<table class=\"table table-striped\">\n  " + rows_html + "\n</table>";
                }
                result_html = "<h4>Error</h4>\n" + result.message + "\n" + rows_html + "\n<h5>Backtrace</h5>\n<pre>\n" + (result.backtrace.join("\n")) + "\n</pre>";
            } else if (result != null) {
                rows_html = '';
                for (key in result) {
                    value = result[key];
                    rows_html += "<tr><td>" + key + "</td><td>" + (JSON.stringify(value, null, 2)) + "</td></tr>";
                }
                result_html = "<h4>Result</h4>\n<table class=\"table table-striped\">\n  " + rows_html + "\n</table>";
            }
            modal_html = "<div class=\"modal hide fade job-modal\" role=\"dialog\">\n  <div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\">×</button>\n    <h3>Job</h3>\n  </div>\n  <div class=\"modal-body\">\n    <table class=\"table table-striped\">\n      <tr>\n        <th>ID</th>\n        <td>" + id + "</td>\n      </tr>\n      <tr>\n        <th>JID</th>\n        <td>" + jid + "</td>\n      </tr>\n      <tr>\n        <th>Class</th>\n        <td>" + class_name + "</td>\n      </tr>\n      <tr>\n        <th>Name</th>\n        <td>" + name + "</td>\n      </tr>\n      <tr>\n        <th>Args</th>\n        <td>" + (JSON.stringify(args, null, 2)) + "</td>\n      </tr>\n      <tr>\n        <th>Started</th>\n        <td>" + started_at + "</td>\n      </tr>\n      <tr>\n        <th>Duration</th>\n        <td>" + duration + "</td>\n      </tr>\n      <tr>\n        <th>Status</th>\n        <td>" + status + "</td>\n      </tr>\n    </table>\n    " + result_html + "\n    <div class=\"job-custom-views\"></div>\n  </div>\n</div>";
            $('.job-modal').modal('hide');
            $('body').append(modal_html);
            modal = $('.job-modal:last');
            modal.modal({
                width: 480
            });
            return $.getJSON(SidekiqMonitor.settings.api_url("jobs/custom_views/" + id), function(views) {
                var html, view, _i, _len;
                html = '';
                for (_i = 0, _len = views.length; _i < _len; _i++) {
                    view = views[_i];
                    html += "<h4>" + view['name'] + "</h4>\n" + view['html'];
                }
                return $('.job-custom-views', modal).html(html);
            });
        };

        AbstractJobsTable.prototype.on_poll = function() {
            if (document.hasFocus()) {
                return this.reload_table();
            }
        };

        AbstractJobsTable.prototype.reload_table = function() {
            return this.table.dataTable().fnStandingRedraw();
        };

        AbstractJobsTable.prototype.start_polling = function() {
            return setInterval((function(_this) {
                return function() {
                    return _this.on_poll();
                };
            })(this), SidekiqMonitor.settings.poll_interval);
        };

        AbstractJobsTable.prototype.format_time_ago = function(time) {
            if (time != null) {
                return "<span class=\"timeago\" title=\"" + time + "\">" + time + "</span>";
            } else {
                return "";
            }
        };

        return AbstractJobsTable;

    })();

}).call(this);