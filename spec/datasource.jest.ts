// import { beforeEach, describe, expect, it } from './lib/common';
import TemplateSrvStub from './lib/TemplateSrvStub';
import { Datasource } from '../src/module';
import q from 'q';

describe('GenericDatasource', () => {
  const ctx: any = {
    backendSrv: {},
    templateSrv: new TemplateSrvStub(),
  };

  beforeEach(() => {
    ctx.$q = q;
    ctx.ds = new Datasource({}, ctx.$q, ctx.backendSrv, ctx.templateSrv);
  });

  it('should return an empty array when no targets are set', (done) => {
    ctx.ds.query({ targets: [] }).then((result) => {
      expect(result.data).toHaveLength(0);
      done();
    });
  });

  it('should return the server results when a target is set', (done) => {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        _request: request,
        data: [
          {
            target: 'X',
            datapoints: [1, 2, 3],
          },
        ],
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.query({ targets: ['hits'] }).then((result) => {
      expect(result._request.data.targets).toHaveLength(1);

      const series = result.data[0];
      expect(series.target).toBe('X');
      expect(series.datapoints).toHaveLength(3);
      done();
    });
  });

  it('should return the metric results when a target is null', (done) => {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        _request: request,
        data: [
          'metric_0',
          'metric_1',
          'metric_2',
        ],
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.metricFindQuery({ target: null }).then((result) => {
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('metric_0');
      expect(result[0].value).toBe('metric_0');
      expect(result[1].text).toBe('metric_1');
      expect(result[1].value).toBe('metric_1');
      expect(result[2].text).toBe('metric_2');
      expect(result[2].value).toBe('metric_2');
      done();
    });
  });

  it('should return the metric target results when a target is set', (done) => {
    ctx.backendSrv.datasourceRequest = function (request) {
      const target = request.data.target;
      const result = [target + '_0', target + '_1', target + '_2'];

      return ctx.$q.when({
        _request: request,
        data: result,
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.metricFindQuery('search').then((result) => {
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('search_0');
      expect(result[0].value).toBe('search_0');
      expect(result[1].text).toBe('search_1');
      expect(result[1].value).toBe('search_1');
      expect(result[2].text).toBe('search_2');
      expect(result[2].value).toBe('search_2');
      done();
    });
  });

  it('should return the metric results when the target is an empty string', (done) => {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        _request: request,
        data: [
          'metric_0',
          'metric_1',
          'metric_2',
        ],
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.metricFindQuery('').then((result) => {
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('metric_0');
      expect(result[0].value).toBe('metric_0');
      expect(result[1].text).toBe('metric_1');
      expect(result[1].value).toBe('metric_1');
      expect(result[2].text).toBe('metric_2');
      expect(result[2].value).toBe('metric_2');
      done();
    });
  });

  it('should return the metric results when the args are an empty object', (done) => {
    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        _request: request,
        data: [
          'metric_0',
          'metric_1',
          'metric_2',
        ],
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.metricFindQuery().then((result) => {
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('metric_0');
      expect(result[0].value).toBe('metric_0');
      expect(result[1].text).toBe('metric_1');
      expect(result[1].value).toBe('metric_1');
      expect(result[2].text).toBe('metric_2');
      expect(result[2].value).toBe('metric_2');
      done();
    });
  });

  it('should return the metric target results when the args are a string', (done) => {
    ctx.backendSrv.datasourceRequest = function (request) {
      const target = request.data.target;
      const result = [target + '_0', target + '_1', target + '_2'];

      return ctx.$q.when({
        _request: request,
        data: result,
      });
    };

    ctx.templateSrv.replace = function (data) {
      return data;
    };

    ctx.ds.metricFindQuery('search').then((result) => {
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('search_0');
      expect(result[0].value).toBe('search_0');
      expect(result[1].text).toBe('search_1');
      expect(result[1].value).toBe('search_1');
      expect(result[2].text).toBe('search_2');
      expect(result[2].value).toBe('search_2');
      done();
    });
  });

  it('should return data as text and as value', (done) => {
    const result = ctx.ds.mapToTextValue({ data: ['zero', 'one', 'two'] });

    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('zero');
    expect(result[0].value).toBe('zero');
    expect(result[1].text).toBe('one');
    expect(result[1].value).toBe('one');
    expect(result[2].text).toBe('two');
    expect(result[2].value).toBe('two');
    done();
  });

  it('should return text as text and value as value', (done) => {
    const data = [
      { text: 'zero', value: 'value_0' },
      { text: 'one', value: 'value_1' },
      { text: 'two', value: 'value_2' },
    ];

    const result = ctx.ds.mapToTextValue({ data });

    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('zero');
    expect(result[0].value).toBe('value_0');
    expect(result[1].text).toBe('one');
    expect(result[1].value).toBe('value_1');
    expect(result[2].text).toBe('two');
    expect(result[2].value).toBe('value_2');
    done();
  });

  it('should return data as text and index as value', (done) => {
    const data = [
      { a: 'zero', b: 'value_0' },
      { a: 'one', b: 'value_1' },
      { a: 'two', b: 'value_2' },
    ];

    const result = ctx.ds.mapToTextValue({ data });

    expect(result).toHaveLength(3);
    expect(result[0].text).toBe(data[0]);
    expect(result[0].value).toBe(0);
    expect(result[1].text).toBe(data[1]);
    expect(result[1].value).toBe(1);
    expect(result[2].text).toBe(data[2]);
    expect(result[2].value).toBe(2);
    done();
  });

  it('should support tag keys', (done) => {
    const data = [
      { type: 'string', text: 'One', key: 'one' },
      { type: 'string', text: 'two', key: 'Two' },
    ];

    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        data,
        _request: request,
      });
    };

    ctx.ds.getTagKeys().then((result) => {
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(data[0].type);
      expect(result[0].text).toBe(data[0].text);
      expect(result[0].key).toBe(data[0].key);
      expect(result[1].type).toBe(data[1].type);
      expect(result[1].text).toBe(data[1].text);
      expect(result[1].key).toBe(data[1].key);
      done();
    });
  });

  it('should support tag values', (done) => {
    const data = [
      { key: 'eins', text: 'Eins!' },
      { key: 'zwei', text: 'Zwei' },
      { key: 'drei', text: 'Drei!' },
    ];

    ctx.backendSrv.datasourceRequest = function (request) {
      return ctx.$q.when({
        data,
        _request: request,
      });
    };

    ctx.ds.getTagValues().then((result) => {
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe(data[0].text);
      expect(result[0].key).toBe(data[0].key);
      expect(result[1].text).toBe(data[1].text);
      expect(result[1].key).toBe(data[1].key);
      expect(result[2].text).toBe(data[2].text);
      expect(result[2].key).toBe(data[2].key);
      done();
    });
  });

});
