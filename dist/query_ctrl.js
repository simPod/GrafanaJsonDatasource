System.register(["app/plugins/sdk", "./css/query-editor.css!"], function (exports_1, context_1) {
    "use strict";
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        }
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var sdk_1, GenericDatasourceQueryCtrl;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            },
            function (_1) {
            }
        ],
        execute: function () {
            GenericDatasourceQueryCtrl = (function (_super) {
                __extends(GenericDatasourceQueryCtrl, _super);
                function GenericDatasourceQueryCtrl($scope, $injector) {
                    var _this = _super.call(this, $scope, $injector) || this;
                    _this.target.target = _this.target.target || 'select metric';
                    _this.target.type = _this.target.type || 'timeseries';
                    _this.target.data = _this.target.data || "";
                    if (!_this.target.format) {
                        _this.target.format = _this.panelCtrl.panel.type === 'table' ? 'table' : 'timeseries';
                    }
                    _this.formats = [{ text: 'Time series', value: 'timeseries' }, { text: 'Table', value: 'table' }];
                    _this.showJSON = false;
                    return _this;
                }
                GenericDatasourceQueryCtrl.prototype.getOptions = function (query) {
                    return this.datasource.metricFindQuery(query || '');
                };
                GenericDatasourceQueryCtrl.prototype.toggleEditorMode = function () {
                    this.target.rawQuery = !this.target.rawQuery;
                };
                GenericDatasourceQueryCtrl.prototype.onChangeInternal = function () {
                    this.panelCtrl.refresh();
                };
                GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
                return GenericDatasourceQueryCtrl;
            }(sdk_1.QueryCtrl));
            exports_1("GenericDatasourceQueryCtrl", GenericDatasourceQueryCtrl);
        }
    };
});
//# sourceMappingURL=query_ctrl.js.map