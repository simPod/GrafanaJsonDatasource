import {
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  LegacyMetricFindQueryOptions,
  MetricFindValue,
  ScopedVars,
  SelectableValue,
  toDataFrame,
  VariableOption,
  VariableWithMultiSupport,
} from '@grafana/data';
import { FetchResponse, getTemplateSrv, TemplateSrv, DataSourceWithBackend } from '@grafana/runtime';
import { isArray, isObject } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseParser } from './response_parser';
import {
  GenericOptions,
  GrafanaQuery,
  MetricConfig,
  MetricFindTagKeys,
  MetricFindTagValues,
  MetricPayloadConfig,
  QueryEditorMode,
  QueryRequest,
  VariableQuery,
} from './types';
import { match, P } from 'ts-pattern';
import { valueFromVariableWithMultiSupport } from './variable/valueFromVariableWithMultiSupport';
import { VariableSupport } from './variable/VariableSupport';
import { doFetch } from './doFetch';
import { MetricFindQuery } from './MetricFindQuery';

export class DataSource extends DataSourceWithBackend<GrafanaQuery, GenericOptions> {
  url: string;
  withCredentials: boolean;
  headers: any;
  responseParser: ResponseParser;
  defaultEditorMode: QueryEditorMode;
  constructor(
    instanceSettings: DataSourceInstanceSettings<GenericOptions>,
    private readonly templateSrv: TemplateSrv = getTemplateSrv()
  ) {
    super(instanceSettings);

    this.responseParser = new ResponseParser();
    this.defaultEditorMode = instanceSettings.jsonData?.defaultEditorMode ?? 'code';
    this.url = instanceSettings.url === undefined ? '' : instanceSettings.url;

    this.variables = new VariableSupport(this, this.templateSrv);
    this.withCredentials = instanceSettings.withCredentials !== undefined;
    this.headers = { 'Content-Type': 'application/json' };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  filterQuery(query: GrafanaQuery): boolean {
    return !query.hide;
  }

  query(options: QueryRequest): Promise<DataQueryResponse> {
    const request = this.processTargets(options);

    if (request.targets.length === 0) {
      return Promise.resolve({ data: [] });
    }

    options.scopedVars = { ...this.getVariables(), ...options.scopedVars };

    return lastValueFrom(
      doFetch<any[]>(this, {
        url: `${this.url}/query`,
        data: request,
        method: 'POST',
      }).pipe(
        map((response) => {
          response.data = response.data.map(toDataFrame);

          return response;
        })
      )
    );
  }

  annotations = {};

  metricFindQuery(variableQuery: VariableQuery, options?: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const interpolated: string =
      variableQuery.format === 'json'
        ? JSON.parse(getTemplateSrv().replace(variableQuery.query, undefined, 'json'))
        : {
            target: getTemplateSrv().replace(variableQuery.query, undefined, 'regex'),
          };

    let metricFindQuery = new MetricFindQuery(this, interpolated);
    return metricFindQuery.process(options?.range);
  }

  listMetricPayloadOptions(
    name: string,
    metric: string,
    payload: string | { [key: string]: unknown }
  ): Promise<Array<SelectableValue<string | number>>> {
    return lastValueFrom<Array<SelectableValue<string | number>>>(
      doFetch(this, {
        url: `${this.url}/metric-payload-options`,
        data: {
          metric,
          payload: this.processPayload(payload, 'builder', undefined),
          name,
        },
        method: 'POST',
      }).pipe(
        map((response) =>
          isArray(response.data)
            ? response.data.map((item) => ({ ...item, label: item.label ? item.label : item.value }))
            : []
        )
      )
    );
  }

  listMetrics(target: string | number, payload?: string | { [key: string]: any }): Promise<MetricConfig[]> {
    return lastValueFrom<MetricConfig[]>(
      doFetch(this, {
        url: `${this.url}/metrics`,
        data: {
          metric: target.toString() ? getTemplateSrv().replace(target.toString(), undefined, 'regex') : undefined,
          payload: payload ? this.processPayload(payload, 'builder', undefined) : undefined,
        },
        method: 'POST',
      }).pipe(
        map((response) => {
          if (!isArray(response.data)) {
            return [];
          }

          return response.data.map((item: MetricConfig | string) => {
            if (typeof item === 'string') {
              return { value: item, label: item, payloads: [] };
            }

            return {
              ...item,
              payloads: (item.payloads ?? []).map((payload: MetricPayloadConfig) => ({
                ...payload,
                label: payload.label ?? payload.name,
              })),
              label: item.label ?? item.value,
            };
          });
        })
      )
    );
  }

  getTagKeys(options?: any): Promise<MetricFindTagKeys[]> {
    return lastValueFrom(
      doFetch<MetricFindTagKeys[]>(this, {
        url: `${this.url}/tag-keys`,
        method: 'POST',
        data: options,
      }).pipe(map((result) => result.data))
    );
  }

  getTagValues(options: any): Promise<MetricFindTagValues[]> {
    return lastValueFrom(
      doFetch<MetricFindTagValues[]>(this, {
        url: `${this.url}/tag-values`,
        method: 'POST',
        data: options,
      }).pipe(map((result) => result.data))
    );
  }

  mapToTextValue(result: any) {
    return result.data.map((d: any, i: any) => {
      if (d && d.text && d.value) {
        return { text: d.text, value: d.value };
      }

      if (isObject(d)) {
        return { text: d, value: i };
      }
      return { text: d, value: d };
    });
  }

  processPayload(payload: string | { [key: string]: unknown }, editorMode?: QueryEditorMode, scopedVars?: ScopedVars) {
    try {
      if (typeof payload === 'string' && editorMode !== 'builder') {
        if (payload.trim() !== '') {
          return JSON.parse(
            payload.replace((getTemplateSrv() as any).regex, (match) => this.cleanMatch(match, { scopedVars }))
          );
        }
        return {};
      } else {
        const newPayload: { [key: string]: any } =
          typeof payload === 'string' ? (JSON.parse(payload) as { [key: string]: unknown }) : { ...payload };
        for (const key in newPayload) {
          if (Object.prototype.hasOwnProperty.call(newPayload, key)) {
            const value = newPayload[key];
            if (isArray(value)) {
              newPayload[key] = value.map((item) => getTemplateSrv().replace(item.toString(), scopedVars, 'regex'));
            } else {
              newPayload[key] = getTemplateSrv().replace(newPayload[key].toString(), scopedVars, 'regex');
            }
          }
        }
        return newPayload;
      }
    } catch (error) {
      return {};
    }
  }

  processTarget(q: GrafanaQuery, scopedVars?: ScopedVars) {
    const query = { ...q };
    query.payload = this.processPayload(query.payload ?? '', query.editorMode, scopedVars);
    if (typeof query.target === 'string') {
      query.target = getTemplateSrv().replace(query.target.toString(), scopedVars, 'regex');
    }
    return query;
  }

  processTargets(options: QueryRequest) {
    options.targets = options.targets
      .filter((query) => {
        // remove placeholder targets
        return query.target !== undefined;
      })
      .map((query) => {
        return this.processTarget(query, options.scopedVars);
      });

    return options;
  }

  cleanMatch(match: string, options: { scopedVars?: ScopedVars }) {
    const replacedMatch = getTemplateSrv().replace(match, options.scopedVars, 'json');
    if (replacedMatch[0] === '"' && replacedMatch[replacedMatch.length - 1] === '"') {
      return JSON.parse(replacedMatch);
    }
    return replacedMatch;
  }

  getVariables() {
    const variableOptions: Record<VariableWithMultiSupport['id'], VariableOption> = {};

    Object.values(getTemplateSrv().getVariables()).forEach((variable) => {
      if (variable.type === 'adhoc') {
        // These belong to request.filters
        return;
      }

      if (variable.type === 'system') {
        return;
      }

      const value = match(variable)
        .with({ type: P.union('custom', 'query') }, (v) => valueFromVariableWithMultiSupport(v))
        .with({ type: P.union('constant', 'datasource', 'groupby', 'interval', 'textbox') }, (v) => v.current.value)
        .exhaustive();

      if (value === undefined) {
        return;
      }

      variableOptions[variable.id] = {
        selected: false,
        text: variable.current.text,
        value: value,
      };
    });

    return variableOptions;
  }
}
