System.register(["lodash"], function (exports_1, context_1) {
    "use strict";
    var __assign = (this && this.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var lodash_1, GenericDatasource;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }
        ],
        execute: function () {
            GenericDatasource = (function () {
                function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    this.name = instanceSettings.name;
                    this.url = instanceSettings.url;
                    this.q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.withCredentials = instanceSettings.withCredentials;
                    this.headers = { 'Content-Type': 'application/json' };
                    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
                        this.headers['Authorization'] = instanceSettings.basicAuth;
                    }
                }
                GenericDatasource.prototype.query = function (options) {
                    var query = this.buildQueryParameters(options);
                    query.targets = query.targets.filter(function (t) { return !t.hide; });
                    if (query.targets.length <= 0) {
                        return this.q.when({ data: [] });
                    }
                    if (this.templateSrv.getAdhocFilters) {
                        query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
                    }
                    else {
                        query.adhocFilters = [];
                    }
                    var index = lodash_1.default.isUndefined(this.templateSrv.index) ? {} : this.templateSrv.index;
                    var variables = {};
                    Object.keys(index).forEach(function (key) {
                        var variable = index[key];
                        variables[variable.name] = {
                            text: variable.current.text,
                            value: variable.current.value
                        };
                    });
                    options.scopedVars = __assign({}, variables, options.scopedVars);
                    query.targets = lodash_1.default.map(query.targets, function (d) {
                        if (d.data && d.data.trim() === "") {
                            delete d.data;
                        }
                    });
                    return this.doRequest({
                        url: this.url + '/query',
                        data: query,
                        method: 'POST'
                    });
                };
                GenericDatasource.prototype.testDatasource = function () {
                    return this.doRequest({
                        url: this.url + '/',
                        method: 'GET',
                    }).then(function (response) {
                        if (response.status === 200) {
                            return { status: "success", message: "Data source is working", title: "Success" };
                        }
                    });
                };
                GenericDatasource.prototype.annotationQuery = function (options) {
                    var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
                    var annotationQuery = {
                        range: options.range,
                        annotation: {
                            name: options.annotation.name,
                            datasource: options.annotation.datasource,
                            enable: options.annotation.enable,
                            iconColor: options.annotation.iconColor,
                            query: query
                        },
                        rangeRaw: options.rangeRaw
                    };
                    return this.doRequest({
                        url: this.url + '/annotations',
                        method: 'POST',
                        data: annotationQuery
                    }).then(function (result) {
                        return result.data;
                    });
                };
                GenericDatasource.prototype.metricFindQuery = function (query) {
                    var interpolated = {
                        target: this.templateSrv.replace(query, null, 'regex')
                    };
                    return this.doRequest({
                        url: this.url + '/search',
                        data: interpolated,
                        method: 'POST',
                    }).then(this.mapToTextValue);
                };
                GenericDatasource.prototype.mapToTextValue = function (result) {
                    return lodash_1.default.map(result.data, function (d, i) {
                        if (d && d.text && d.value) {
                            return { text: d.text, value: d.value };
                        }
                        else if (lodash_1.default.isObject(d)) {
                            return { text: d, value: i };
                        }
                        return { text: d, value: d };
                    });
                };
                GenericDatasource.prototype.doRequest = function (options) {
                    options.withCredentials = this.withCredentials;
                    options.headers = this.headers;
                    return this.backendSrv.datasourceRequest(options);
                };
                GenericDatasource.prototype.buildQueryParameters = function (options) {
                    var _this = this;
                    options.targets = lodash_1.default.filter(options.targets, function (target) {
                        return target.target !== 'select metric';
                    });
                    var targets = lodash_1.default.map(options.targets, function (target) {
                        var data = target.data;
                        if (data) {
                            data = JSON.parse(data);
                        }
                        return {
                            target: _this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
                            data: data,
                            refId: target.refId,
                            hide: target.hide,
                            type: target.type || 'timeseries'
                        };
                    });
                    options.targets = targets;
                    return options;
                };
                GenericDatasource.prototype.getTagKeys = function (options) {
                    var _this = this;
                    return new Promise(function (resolve, reject) {
                        _this.doRequest({
                            url: _this.url + '/tag-keys',
                            method: 'POST',
                            data: options
                        }).then(function (result) {
                            return resolve(result.data);
                        });
                    });
                };
                GenericDatasource.prototype.getTagValues = function (options) {
                    var _this = this;
                    return new Promise(function (resolve, reject) {
                        _this.doRequest({
                            url: _this.url + '/tag-values',
                            method: 'POST',
                            data: options
                        }).then(function (result) {
                            return resolve(result.data);
                        });
                    });
                };
                return GenericDatasource;
            }());
            exports_1("GenericDatasource", GenericDatasource);
        }
    };
});
//# sourceMappingURL=datasource.js.map