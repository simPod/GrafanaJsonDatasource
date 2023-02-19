import {
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
  ScopedVars,
  SelectableValue,
  toDataFrame,
  VariableOption,
  VariableWithMultiSupport,
} from '@grafana/data';
import {
  BackendDataSourceResponse,
  FetchResponse,
  getBackendSrv,
  getTemplateSrv,
  BackendSrvRequest,
} from '@grafana/runtime';
import { isArray, isObject } from 'lodash';
import { lastValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

export class DataSource extends DataSourceApi<GrafanaQuery, GenericOptions> {
  url: string;
  withCredentials: boolean;
  headers: any;
  responseParser: ResponseParser;
  defaultEditorMode: QueryEditorMode;
  constructor(instanceSettings: DataSourceInstanceSettings<GenericOptions>) {
    super(instanceSettings);

    this.responseParser = new ResponseParser();
    this.defaultEditorMode = instanceSettings.jsonData?.defaultEditorMode ?? 'code';
    this.url = instanceSettings.url === undefined ? '' : instanceSettings.url;

    this.withCredentials = instanceSettings.withCredentials !== undefined;
    this.headers = { 'Content-Type': 'application/json' };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  query(options: QueryRequest): Promise<DataQueryResponse> {
    const request = this.processTargets(options);

    if (request.targets.length === 0) {
      return Promise.resolve({ data: [] });
    }

    // @ts-ignore
    request.adhocFilters = getTemplateSrv().getAdhocFilters(this.name);

    options.scopedVars = { ...this.getVariables(), ...options.scopedVars };

    return lastValueFrom(
      this.doFetch<any[]>({
        url: `${this.url}/query`,
        data: request,
        method: 'POST',
      }).pipe(
        map((response) => {
          response.data = response.data.map(toDataFrame);

          return response;
        }),
        catchError((err) => {
          console.error(err);

          return of({ data: [] });
        })
      )
    );
  }

  annotations = {};

  async testDatasource() {
    const errorMessageBase = 'Data source is not working';

    try {
      const response = await lastValueFrom(
        this.doFetch({
          url: this.url,
          method: 'GET',
        }).pipe(map((response) => response))
      );

      if (response.status === 200) {
        return { status: 'success', message: 'Data source is working', title: 'Success' };
      }

      return {
        message: response.statusText ? response.statusText : errorMessageBase,
        status: 'error',
        title: 'Error',
      };
    } catch (err) {
      if (typeof err === 'string') {
        return {
          status: 'error',
          message: err,
        };
      }

      let error = err as FetchResponse;
      let message = error.statusText ?? errorMessageBase;
      if (error.data?.error?.code !== undefined) {
        message += `: ${error.data.error.code}. ${error.data.error.message}`;
      }

      return { status: 'error', message, title: 'Error' };
    }
  }

  metricFindQuery(variableQuery: VariableQuery, options?: any, type?: string): Promise<MetricFindValue[]> {
    const interpolated =
      variableQuery.format === 'json'
        ? JSON.parse(getTemplateSrv().replace(variableQuery.query, undefined, 'json'))
        : {
            type,
            target: getTemplateSrv().replace(variableQuery.query, undefined, 'regex'),
          };

    const variableQueryData = {
      payload: interpolated,
      range: options?.range,
      rangeRaw: options?.rangeRaw,
    };

    return lastValueFrom(
      this.doFetch<BackendDataSourceResponse>({
        url: `${this.url}/variable`,
        data: variableQueryData,
        method: 'POST',
      }).pipe(
        map((response) => {
          return this.responseParser.transformMetricFindResponse(response);
        }),
        catchError((err) => {
          console.error(err);

          return of([]);
        })
      )
    );
  }

  listMetricPayloadOptions(
    name: string,
    metric: string,
    payload: string | { [key: string]: unknown }
  ): Promise<Array<SelectableValue<string | number>>> {
    return lastValueFrom<Array<SelectableValue<string | number>>>(
      this.doFetch({
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
        ),

        catchError((err) => {
          console.error(err);
          return of([]);
        })
      )
    );
  }

  listMetrics(target: string | number, payload?: string | { [key: string]: any }): Promise<MetricConfig[]> {
    return lastValueFrom<MetricConfig[]>(
      this.doFetch({
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
              payloads: isArray(item.payloads)
                ? item.payloads.map((payload: MetricPayloadConfig) => ({
                    ...payload,
                    label: payload.label ? payload.label : payload.name,
                  }))
                : [],
              label: item.label ?? item.value,
            };
          });
        }),

        catchError((err) => {
          console.error(err);

          return of([]);
        })
      )
    );
  }

  getTagKeys(options?: any): Promise<MetricFindTagKeys[]> {
    return lastValueFrom(
      this.doFetch<MetricFindTagKeys[]>({
        url: `${this.url}/tag-keys`,
        method: 'POST',
        data: options,
      }).pipe(
        map((result) => result.data),
        catchError((err) => {
          console.error(err);

          return of([]);
        })
      )
    );
  }

  getTagValues(options: any): Promise<MetricFindTagValues[]> {
    return lastValueFrom(
      this.doFetch<MetricFindTagValues[]>({
        url: `${this.url}/tag-values`,
        method: 'POST',
        data: options,
      }).pipe(
        map((result) => result.data),
        catchError((err) => {
          console.error(err);

          return of([]);
        })
      )
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

  doFetch<T>(options: BackendSrvRequest) {
    options.credentials = this.withCredentials ? 'include' : 'same-origin';
    options.headers = this.headers;

    return getBackendSrv().fetch<T>(options);
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
              newPayload[key] = value.map((item) => getTemplateSrv().replace(item.toString(), undefined, 'regex'));
            } else {
              newPayload[key] = getTemplateSrv().replace(newPayload[key].toString(), undefined, 'regex');
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
      .filter((target) => {
        // remove placeholder targets
        return target.target !== undefined;
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
        // These belong to request.adhocFilters
        return;
      }

      if (variable.type === 'system') {
        return;
      }

      const value = match(variable)
        .with({ type: P.union('custom', 'query') }, (v) => valueFromVariableWithMultiSupport(v))
        .with({ type: P.union('constant', 'datasource', 'interval', 'textbox') }, (v) => v.current.value)
        .exhaustive();

      variableOptions[variable.id] = {
        selected: false,
        text: variable.current.text,
        value: value,
      };
    });

    return variableOptions;
  }
}
