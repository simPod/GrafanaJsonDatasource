import { isDataFrame, LoadingState } from '@grafana/data';
import { DateTime } from '@grafana/data/datetime/moment_wrapper';
import {
  BackendSrv,
  FetchResponse,
  getBackendSrv,
  getTemplateSrv,
  setBackendSrv,
  setTemplateSrv,
} from '@grafana/runtime';
import { of } from 'rxjs';
import { DataSource } from '../src/DataSource';
import { QueryRequest } from '../src/types';
import TemplateSrvStub from './lib/TemplateSrvStub';

const options = {
  app: 'dashboard',
  requestId: 'Q102',
  timezone: '',
  panelId: 2,
  dashboardId: 1893,
  range: {
    from: '2019-11-22T07:23:23.836Z' as unknown as DateTime,
    to: '2019-11-22T10:23:23.836Z' as unknown as DateTime,
    raw: {
      from: 'now-3h',
      to: 'now',
    },
  },
  interval: '5s',
  intervalMs: 5000,
  targets: [],
  maxDataPoints: 1920,
  scopedVars: {
    __interval: {
      text: '5s',
      value: '5s',
    },
    __interval_ms: {
      text: '5000',
      value: 5000,
    },
  },
  startTime: 1574418203842,
  rangeRaw: {
    from: 'now-3h',
    to: 'now',
  },
};

describe('GenericDatasource', () => {
  const ds = new DataSource({} as any);

  it('should return an empty array when no targets are set', async () => {
    const result = await ds.query({ ...options, targets: [] });

    expect(result.data).toHaveLength(0);
  });

  it('should return the server results when a target is set', async () => {
    setBackendSrv({
      fetch: (request) =>
        of({
          data: [
            {
              target: 'X',
              datapoints: [
                [1, 1621077300000],
                [2, 1621077600000],
                [3, 1621077900000],
              ],
            },
          ],
        }),
    } as BackendSrv);

    const templateSrvStub = new TemplateSrvStub();
    templateSrvStub.replace = (data) => data ?? '';
    setTemplateSrv(templateSrvStub);

    const result = await ds.query({ ...options, targets: [{ refId: 'A', payload: '', target: 'hits' }] });

    const series = result.data[0];
    expect(isDataFrame(series)).toBe(true);
    expect(series.name).toBe('X');
    expect(series.length).toBe(3);
    expect(series.fields[0].values).toHaveLength(3);
  });

  it('should return the metric target results when a target is set', async () => {
    setBackendSrv({
      fetch: (request) => {
        const target = request.data.metric;
        const result = [target + '_0', target + '_1', target + '_2'];

        return of({
          _request: request,
          data: result,
        } as unknown as FetchResponse);
      },
    } as BackendSrv);

    const templateSrvStub = new TemplateSrvStub();
    templateSrvStub.replace = (data) => data ?? '';
    setTemplateSrv(templateSrvStub);

    const result = await ds.listMetrics('search');

    expect(result).toHaveLength(3);
    expect(result[0].label).toBe('search_0');
    expect(result[0].value).toBe('search_0');
    expect(result[1].label).toBe('search_1');
    expect(result[1].value).toBe('search_1');
    expect(result[2].label).toBe('search_2');
    expect(result[2].value).toBe('search_2');
  });

  it('should return the metric results when the target is an empty string', async () => {
    setBackendSrv({
      fetch: (request) =>
        of({
          _request: request,
          data: ['metric_0', 'metric_1', 'metric_2'],
        } as unknown as FetchResponse),
    } as BackendSrv);

    const templateSrvStub = new TemplateSrvStub();
    templateSrvStub.replace = (data) => data ?? '';
    setTemplateSrv(templateSrvStub);

    const result = await ds.listMetrics('');

    expect(result).toHaveLength(3);
    expect(result[0].label).toBe('metric_0');
    expect(result[0].value).toBe('metric_0');
    expect(result[1].label).toBe('metric_1');
    expect(result[1].value).toBe('metric_1');
    expect(result[2].label).toBe('metric_2');
    expect(result[2].value).toBe('metric_2');
  });

  it('should return the metric results when the args are an empty object', async () => {
    setBackendSrv({
      fetch: (request) =>
        of({
          _request: request,
          data: ['metric_0', 'metric_1', 'metric_2'],
        } as unknown as FetchResponse),
    } as BackendSrv);

    const templateSrvStub = new TemplateSrvStub();
    templateSrvStub.replace = (data) => data ?? '';
    setTemplateSrv(templateSrvStub);

    const result = await ds.listMetrics('');

    expect(result).toHaveLength(3);
    expect(result[0].label).toBe('metric_0');
    expect(result[0].value).toBe('metric_0');
    expect(result[1].label).toBe('metric_1');
    expect(result[1].value).toBe('metric_1');
    expect(result[2].label).toBe('metric_2');
    expect(result[2].value).toBe('metric_2');
  });

  it('should return the metric target results when the args are a string', async () => {
    getBackendSrv().fetch = (request) => {
      const target = request.data.metric;
      const result = [target + '_0', target + '_1', target + '_2'];

      return of({
        _request: request,
        data: result,
      } as unknown as FetchResponse);
    };

    const templateSrvStub = new TemplateSrvStub();
    templateSrvStub.replace = (data) => data ?? '';
    setTemplateSrv(templateSrvStub);

    const result = await ds.listMetrics('search');

    expect(result).toHaveLength(3);
    expect(result[0].label).toBe('search_0');
    expect(result[0].value).toBe('search_0');
    expect(result[1].label).toBe('search_1');
    expect(result[1].value).toBe('search_1');
    expect(result[2].label).toBe('search_2');
    expect(result[2].value).toBe('search_2');
  });

  it('should accept raw json instead of a target/string query for template vars', async () => {
    let jsonParsed = false;
    getBackendSrv().fetch = (request) => {
      const payload = request.data.payload;
      if (payload.target === 'search') {
        jsonParsed = true;
      }

      return of({
        _request: request,
        data: [],
      } as unknown as FetchResponse);
    };

    const templateSrvStub = new TemplateSrvStub();
    templateSrvStub.replace = (data) => data ?? '';
    setTemplateSrv(templateSrvStub);

    await ds.metricFindQuery({ query: `{"target":"search"}`, format: 'json' });

    expect(jsonParsed).toBe(true);
  });

  it('should return data as text and as value', (done) => {
    const result = ds.mapToTextValue({ data: ['zero', 'one', 'two'] });

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

    const result = ds.mapToTextValue({ data });

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

    const result = ds.mapToTextValue({ data });

    expect(result).toHaveLength(3);
    expect(result[0].text).toBe(data[0]);
    expect(result[0].value).toBe(0);
    expect(result[1].text).toBe(data[1]);
    expect(result[1].value).toBe(1);
    expect(result[2].text).toBe(data[2]);
    expect(result[2].value).toBe(2);
    done();
  });

  it('should support tag keys', async () => {
    const data = [
      { type: 'string', text: 'One', key: 'one' },
      { type: 'string', text: 'two', key: 'Two' },
    ];

    getBackendSrv().fetch = (request) =>
      of({
        data,
        _request: request,
      } as unknown as FetchResponse);

    const result = await ds.getTagKeys();

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe(data[0].type);
    expect(result[0].text).toBe(data[0].text);
    expect(result[0].key).toBe(data[0].key);
    expect(result[1].type).toBe(data[1].type);
    expect(result[1].text).toBe(data[1].text);
    expect(result[1].key).toBe(data[1].key);
  });

  it('should support tag values', async () => {
    const data = [
      { key: 'eins', text: 'Eins!' },
      { key: 'zwei', text: 'Zwei' },
      { key: 'drei', text: 'Drei!' },
    ];

    setBackendSrv({
      fetch: (request) =>
        of({
          data,
          _request: request,
        } as unknown as FetchResponse),
    } as BackendSrv);

    const result = await ds.getTagValues(null);

    expect(result).toHaveLength(3);
    expect(result[0].text).toBe(data[0].text);
    expect(result[0].key).toBe(data[0].key);
    expect(result[1].text).toBe(data[1].text);
    expect(result[1].key).toBe(data[1].key);
    expect(result[2].text).toBe(data[2].text);
    expect(result[2].key).toBe(data[2].key);
  });

  it('should support scoped variables', async () => {
    const ds = new DataSource({} as any);
    const templateSrvStub = new TemplateSrvStub();
    // As returned by getTemplateSrv().getVariables() in a prd environment
    templateSrvStub.variables = [
      {
        // QueryVariableModel
        type: 'query',
        datasource: { type: 'Frontend Perf', uid: undefined },
        definition: 'value1',
        sort: 0,
        query: {
          query: 'value1',
        },
        regex: '',
        refresh: 1,

        // VariableWithMultiSupport
        multi: false,
        includeAll: false,
        allValue: null,

        // VariableWithOptions
        current: {
          text: 'option1',
          value: 'option1',
          selected: false,
        },
        options: [
          {
            text: 'option1',
            value: 'option1',
            selected: true,
          },
          {
            text: 'option2',
            value: 'option2',
            selected: false,
          },
        ],

        //BaseVariableModel
        name: 'value1',
        id: 'value1',
        rootStateKey: null,
        global: false,
        hide: 0,
        skipUrlSync: false,
        index: 0,
        state: LoadingState.Done,
        error: null,
        description: null,
      },
      {
        // QueryVariableModel
        type: 'query',
        datasource: { type: 'Frontend Perf', uid: undefined },
        definition: 'value2',
        sort: 0,
        query: {
          query: 'value2',
        },
        regex: '',
        refresh: 1,

        // VariableWithMultiSupport
        multi: false,
        includeAll: false,
        allValue: null,

        // VariableWithOptions
        current: {
          text: 'option2',
          value: 'option2',
          selected: false,
        },
        options: [
          {
            text: 'option1',
            value: 'option1',
            selected: false,
          },
          {
            text: 'option2',
            value: 'option2',
            selected: true,
          },
        ],

        //BaseVariableModel
        name: 'value2',
        id: 'value2',
        rootStateKey: null,
        global: false,
        hide: 0,
        skipUrlSync: false,
        index: 1,
        state: LoadingState.Done,
        error: null,
        description: null,
      },
      {
        // QueryVariableModel
        type: 'query',
        datasource: { type: 'Frontend Perf', uid: undefined },
        definition: 'multiValue',
        sort: 0,
        query: {
          query: 'multiValue',
        },
        regex: '',
        refresh: 1,

        // VariableWithMultiSupport
        multi: true,
        includeAll: false,
        allValue: null,

        // VariableWithOptions
        current: {
          text: ['foo', 'bar'],
          value: ['foo', 'bar'],
          selected: false,
        },
        options: [
          {
            text: 'foo',
            value: 'foo',
            selected: true,
          },
          {
            text: 'bar',
            value: 'bar',
            selected: true,
          },
          {
            text: 'unselected',
            value: 'unselected',
            selected: false,
          },
        ],

        //BaseVariableModel
        name: 'multiValue',
        id: 'multiValue',
        rootStateKey: null,
        global: false,
        hide: 0,
        skipUrlSync: false,
        index: 3,
        state: LoadingState.Done,
        error: null,
        description: null,
      },
    ];
    setTemplateSrv(templateSrvStub);

    const testcase: QueryRequest = {
      ...options,
      targets: [
        {
          payload: {
            value1: '$value1',
            value2: '$value2',
            multiValue: '$multiValue',
          },
          refId: 'A',
          target: '',
        },
      ],
      scopedVars: {
        multiValue: { text: 'bar', value: 'bar' },
      },
    };

    // Expect multiValue to be in scope
    expect(ds.processTargets(testcase).targets).toMatchObject([
      {
        payload: {
          value1: 'option1',
          value2: 'option2',
          multiValue: 'bar',
        },
        refId: 'A',
        target: '',
      },
    ]);

    // Expect multiValue as is, because we are not in scope.
    testcase.targets = [
      {
        payload: {
          value1: '$value1',
          value2: '$value2',
          multiValue: '$multiValue',
        },
        refId: 'A',
        target: '',
      },
    ];
    testcase.scopedVars = {
      multiValue: { selected: false, text: ['foo', 'bar'], value: ['foo', 'bar'] },
    };

    expect(ds.processTargets(testcase).targets).toMatchObject([
      {
        payload: {
          value1: 'option1',
          value2: 'option2',
          multiValue: 'foo,bar',
        },
        refId: 'A',
        target: '',
      },
    ]);
  });
});

describe('GenericDatasource.prototype.buildQueryTargets', () => {
  const REPLACING_TO = JSON.stringify('replaced');
  const REPLACED_VALUE = JSON.parse(REPLACING_TO);

  const templateSrvStub = new TemplateSrvStub();
  templateSrvStub.replace = (str) => (str?.match((getTemplateSrv() as any).regex) ? REPLACING_TO : str ?? '');
  beforeEach(() => {
    setTemplateSrv(templateSrvStub);
  });

  const ds = new DataSource({} as any);

  it('simple key-value', () => {
    const testcase: QueryRequest = {
      ...options,
      targets: [
        {
          payload: `{
					"A": "[[value]]"
				}`,
          hide: true,
          refId: 'A',
          target: 'TIME_TO_LAST_BYTE',
          datasource: 'Frontend Perf',
        },
      ],
    };

    expect(ds.processTargets(testcase).targets).toMatchObject([
      {
        payload: { A: REPLACED_VALUE },
        target: testcase.targets[0].target,
        refId: testcase.targets[0].refId,
        hide: testcase.targets[0].hide,
      },
    ]);
  });

  it('random json', () => {
    const testcase = {
      ...options,
      targets: [
        {
          payload: `{
					"filters": [
						{"key": "SOME", "value": "$interval"},
						{"key": "SOME2", "value": "$\{function\}"}
					]
				}`,
          hide: false,
          refId: 'A',
          target: 'TIME_TO_LAST_BYTE',
          datasource: 'Frontend Perf',
        },
      ],
    };

    expect(ds.processTargets(testcase).targets).toMatchObject([
      {
        payload: {
          filters: [
            { key: 'SOME', value: REPLACED_VALUE },
            { key: 'SOME2', value: REPLACED_VALUE },
          ],
        },
        target: testcase.targets[0].target,
        refId: testcase.targets[0].refId,
        hide: testcase.targets[0].hide,
      },
    ]);
  });

  it('complex string interpolation', () => {
    const testcase = {
      ...options,
      targets: [
        {
          payload: `{
					"filters": [
						{"A": "$interval ms"}
					]
				}`,
          hide: false,
          refId: 'A',
          target: 'TIME_TO_LAST_BYTE',
          datasource: 'Frontend Perf',
        },
      ],
    };

    expect(ds.processTargets(testcase).targets).toMatchObject([
      {
        payload: {
          filters: [{ A: `${REPLACED_VALUE} ms` }],
        },
        target: testcase.targets[0].target,
        refId: testcase.targets[0].refId,
        hide: testcase.targets[0].hide,
      },
    ]);
  });
});

describe('GenericDatasource.prototype.buildQueryTargets', () => {
  const REPLACING_NUMBER_TO = JSON.stringify(15);
  const REPLACED_NUMBER_VALUE = JSON.parse(REPLACING_NUMBER_TO);

  const templateSrvStub = new TemplateSrvStub();
  templateSrvStub.replace = (str) => (str?.match((getTemplateSrv() as any).regex) ? REPLACING_NUMBER_TO : str ?? '');
  beforeEach(() => {
    setTemplateSrv(templateSrvStub);
  });

  const ds = new DataSource({} as any);

  it('random json with number placeholder', () => {
    const testcase = {
      ...options,
      targets: [
        {
          payload: `{
					"filters": [
						{"key": "SOME", "value": $interval},
						{"key": "SOME2", "value": $\{function\}}
					]
				}`,
          hide: false,
          refId: 'A',
          target: 'TIME_TO_LAST_BYTE',
          datasource: 'Frontend Perf',
        },
      ],
    };

    expect(ds.processTargets(testcase).targets).toMatchObject([
      {
        payload: {
          filters: [
            { key: 'SOME', value: REPLACED_NUMBER_VALUE },
            { key: 'SOME2', value: REPLACED_NUMBER_VALUE },
          ],
        },
        target: testcase.targets[0].target,
        refId: testcase.targets[0].refId,
        hide: testcase.targets[0].hide,
      },
    ]);
  });
});

describe('GenericDatasource.prototype.buildQueryTargets', () => {
  const REPLACING_BOOLEAN_TO = JSON.stringify(true);
  const REPLACED_BOOLEAN_VALUE = JSON.parse(REPLACING_BOOLEAN_TO);

  const templateSrvStub = new TemplateSrvStub();
  templateSrvStub.replace = (str) => (str?.match((getTemplateSrv() as any).regex) ? REPLACING_BOOLEAN_TO : str ?? '');
  beforeEach(() => {
    setTemplateSrv(templateSrvStub);
  });

  const ds = new DataSource({} as any);

  it('random json with boolean placeholder', () => {
    const testcase = {
      ...options,
      targets: [
        {
          payload: `{
					"filters": [
						{"key": "SOME", "value": $interval},
						{"key": "SOME2", "value": $\{function\}}
					]
				}`,
          hide: false,
          refId: 'A',
          target: 'TIME_TO_LAST_BYTE',
          datasource: 'Frontend Perf',
        },
      ],
    };

    expect(ds.processTargets(testcase).targets).toMatchObject([
      {
        payload: {
          filters: [
            { key: 'SOME', value: REPLACED_BOOLEAN_VALUE },
            { key: 'SOME2', value: REPLACED_BOOLEAN_VALUE },
          ],
        },
        target: testcase.targets[0].target,
        refId: testcase.targets[0].refId,
        hide: testcase.targets[0].hide,
      },
    ]);
  });
});
