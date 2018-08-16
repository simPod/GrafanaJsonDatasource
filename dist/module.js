System.register(["./datasource", "./query_ctrl"], function (exports_1, context_1) {
    "use strict";
    var datasource_1, query_ctrl_1, GenericConfigCtrl, GenericQueryOptionsCtrl, GenericAnnotationsQueryCtrl;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (datasource_1_1) {
                datasource_1 = datasource_1_1;
            },
            function (query_ctrl_1_1) {
                query_ctrl_1 = query_ctrl_1_1;
            }
        ],
        execute: function () {
            exports_1("Datasource", datasource_1.GenericDatasource);
            exports_1("QueryCtrl", query_ctrl_1.GenericDatasourceQueryCtrl);
            GenericConfigCtrl = (function () {
                function GenericConfigCtrl() {
                }
                GenericConfigCtrl.templateUrl = 'partials/config.html';
                return GenericConfigCtrl;
            }());
            exports_1("ConfigCtrl", GenericConfigCtrl);
            GenericQueryOptionsCtrl = (function () {
                function GenericQueryOptionsCtrl() {
                }
                GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';
                return GenericQueryOptionsCtrl;
            }());
            exports_1("QueryOptionsCtrl", GenericQueryOptionsCtrl);
            GenericAnnotationsQueryCtrl = (function () {
                function GenericAnnotationsQueryCtrl() {
                }
                GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
                return GenericAnnotationsQueryCtrl;
            }());
            exports_1("AnnotationsQueryCtrl", GenericAnnotationsQueryCtrl);
        }
    };
});
//# sourceMappingURL=module.js.map