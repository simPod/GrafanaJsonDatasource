import { describe, beforeEach, it, sinon, expect, angularMocks } from './lib/common';
import TemplateSrvStub from './lib/template_srv_stub';
import {Datasource} from "../src/module";
import Q from "q";

describe('GenericDatasource', function() {
    let ctx: any = {
        backendSrv: {},
        templateSrv: new TemplateSrvStub()
    };

    beforeEach(function() {
        ctx.$q = Q;
        ctx.ds = new Datasource({}, ctx.$q, ctx.backendSrv, ctx.templateSrv);
    });

    it('should return an empty array when no targets are set', function(done) {
        ctx.ds.query({targets: []}).then(function(result) {
            expect(result.data).to.have.length(0);
            done();
        });
    });

    it('should return the server results when a target is set', function(done) {
        ctx.backendSrv.datasourceRequest = function(request) {
            return ctx.$q.when({
                _request: request,
                data: [
                    {
                        target: 'X',
                        datapoints: [1, 2, 3]
                    }
                ]
            });
        };

        ctx.templateSrv.replace = function(data) {
            return data;
        }

        ctx.ds.query({targets: ['hits']}).then(function(result) {
            expect(result._request.data.targets).to.have.length(1);

            var series = result.data[0];
            expect(series.target).to.equal('X');
            expect(series.datapoints).to.have.length(3);
            done();
        });
    });

    it ('should return the metric results when a target is null', function(done) {
        ctx.backendSrv.datasourceRequest = function(request) {
            return ctx.$q.when({
                _request: request,
                data: [
                    "metric_0",
                    "metric_1",
                    "metric_2",
                ]
            });
        };

        ctx.templateSrv.replace = function(data) {
            return data;
        }

        ctx.ds.metricFindQuery({target: null}).then(function(result) {
            expect(result).to.have.length(3);
            expect(result[0].text).to.equal('metric_0');
            expect(result[0].value).to.equal('metric_0');
            expect(result[1].text).to.equal('metric_1');
            expect(result[1].value).to.equal('metric_1');
            expect(result[2].text).to.equal('metric_2');
            expect(result[2].value).to.equal('metric_2');
            done();
        });
    });

    it ('should return the metric target results when a target is set', function(done) {
        ctx.backendSrv.datasourceRequest = function(request) {
            var target = request.data.target;
            var result = [target + "_0", target + "_1", target + "_2"];

            return ctx.$q.when({
                _request: request,
                data: result
            });
        };

        ctx.templateSrv.replace = function(data) {
            return data;
        }

        ctx.ds.metricFindQuery('search').then(function(result) {
            expect(result).to.have.length(3);
            expect(result[0].text).to.equal('search_0');
            expect(result[0].value).to.equal('search_0');
            expect(result[1].text).to.equal('search_1');
            expect(result[1].value).to.equal('search_1');
            expect(result[2].text).to.equal('search_2');
            expect(result[2].value).to.equal('search_2');
            done();
        });
    });

    it ('should return the metric results when the target is an empty string', function(done) {
        ctx.backendSrv.datasourceRequest = function(request) {
            return ctx.$q.when({
                _request: request,
                data: [
                    "metric_0",
                    "metric_1",
                    "metric_2",
                ]
            });
        };

        ctx.templateSrv.replace = function(data) {
            return data;
        }

        ctx.ds.metricFindQuery('').then(function(result) {
            expect(result).to.have.length(3);
            expect(result[0].text).to.equal('metric_0');
            expect(result[0].value).to.equal('metric_0');
            expect(result[1].text).to.equal('metric_1');
            expect(result[1].value).to.equal('metric_1');
            expect(result[2].text).to.equal('metric_2');
            expect(result[2].value).to.equal('metric_2');
            done();
        });
    });

    it ('should return the metric results when the args are an empty object', function(done) {
        ctx.backendSrv.datasourceRequest = function(request) {
            return ctx.$q.when({
                _request: request,
                data: [
                    "metric_0",
                    "metric_1",
                    "metric_2",
                ]
            });
        };

        ctx.templateSrv.replace = function(data) {
            return data;
        }

        ctx.ds.metricFindQuery().then(function(result) {
            expect(result).to.have.length(3);
            expect(result[0].text).to.equal('metric_0');
            expect(result[0].value).to.equal('metric_0');
            expect(result[1].text).to.equal('metric_1');
            expect(result[1].value).to.equal('metric_1');
            expect(result[2].text).to.equal('metric_2');
            expect(result[2].value).to.equal('metric_2');
            done();
        });
    });

    it ('should return the metric target results when the args are a string', function(done) {
        ctx.backendSrv.datasourceRequest = function(request) {
            var target = request.data.target;
            var result = [target + "_0", target + "_1", target + "_2"];

            return ctx.$q.when({
                _request: request,
                data: result
            });
        };

        ctx.templateSrv.replace = function(data) {
            return data;
        }

        ctx.ds.metricFindQuery('search').then(function(result) {
            expect(result).to.have.length(3);
            expect(result[0].text).to.equal('search_0');
            expect(result[0].value).to.equal('search_0');
            expect(result[1].text).to.equal('search_1');
            expect(result[1].value).to.equal('search_1');
            expect(result[2].text).to.equal('search_2');
            expect(result[2].value).to.equal('search_2');
            done();
        });
    });

    it ('should return data as text and as value', function(done) {
        var result = ctx.ds.mapToTextValue({data: ["zero", "one", "two"]});

        expect(result).to.have.length(3);
        expect(result[0].text).to.equal('zero');
        expect(result[0].value).to.equal('zero');
        expect(result[1].text).to.equal('one');
        expect(result[1].value).to.equal('one');
        expect(result[2].text).to.equal('two');
        expect(result[2].value).to.equal('two');
        done();
    });

    it ('should return text as text and value as value', function(done) {
        var data = [
            {text: "zero", value: "value_0"},
            {text: "one", value: "value_1"},
            {text: "two", value: "value_2"},
        ];

        var result = ctx.ds.mapToTextValue({data: data});

        expect(result).to.have.length(3);
        expect(result[0].text).to.equal('zero');
        expect(result[0].value).to.equal('value_0');
        expect(result[1].text).to.equal('one');
        expect(result[1].value).to.equal('value_1');
        expect(result[2].text).to.equal('two');
        expect(result[2].value).to.equal('value_2');
        done();
    });

    it ('should return data as text and index as value', function(done) {
        var data = [
            {a: "zero", b: "value_0"},
            {a: "one", b: "value_1"},
            {a: "two", b: "value_2"},
        ];

        var result = ctx.ds.mapToTextValue({data: data});

        expect(result).to.have.length(3);
        expect(result[0].text).to.equal(data[0]);
        expect(result[0].value).to.equal(0);
        expect(result[1].text).to.equal(data[1]);
        expect(result[1].value).to.equal(1);
        expect(result[2].text).to.equal(data[2]);
        expect(result[2].value).to.equal(2);
        done();
    });

    it('should support tag keys', function(done) {
        var data =  [{'type': 'string', 'text': 'One', 'key': 'one'}, {'type': 'string', 'text': 'two', 'key': 'Two'}];

        ctx.backendSrv.datasourceRequest = function(request) {
            return ctx.$q.when({
                _request: request,
                data: data
            });
        };

        ctx.ds.getTagKeys().then(function(result) {
            expect(result).to.have.length(2);
            expect(result[0].type).to.equal(data[0].type);
            expect(result[0].text).to.equal(data[0].text);
            expect(result[0].key).to.equal(data[0].key);
            expect(result[1].type).to.equal(data[1].type);
            expect(result[1].text).to.equal(data[1].text);
            expect(result[1].key).to.equal(data[1].key);
            done();
        });
    });

    it('should support tag values', function(done) {
        var data =  [{'key': 'eins', 'text': 'Eins!'}, {'key': 'zwei', 'text': 'Zwei'}, {'key': 'drei', 'text': 'Drei!'}];

        ctx.backendSrv.datasourceRequest = function(request) {
            return ctx.$q.when({
                _request: request,
                data: data
            });
        };

        ctx.ds.getTagValues().then(function(result) {
            expect(result).to.have.length(3);
            expect(result[0].text).to.equal(data[0].text);
            expect(result[0].key).to.equal(data[0].key);
            expect(result[1].text).to.equal(data[1].text);
            expect(result[1].key).to.equal(data[1].key);
            expect(result[2].text).to.equal(data[2].text);
            expect(result[2].key).to.equal(data[2].key);
            done();
        });
    });

});
