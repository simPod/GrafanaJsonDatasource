import {
  AnnotationEvent,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
  toDataFrame,
} from '@grafana/data';
import { AnnotationQueryRequest } from '@grafana/data/types/datasource';
import { BackendDataSourceResponse, FetchResponse, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { BackendSrvRequest } from '@grafana/runtime/services/backendSrv';
import { isEqual, isObject } from 'lodash';
import { lastValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ResponseParser } from './response_parser';
import {
  GenericOptions,
  GrafanaQuery,
  MetricFindTagKeys,
  MetricFindTagValues,
  MultiValueVariable,
  QueryRequest,
  TextValuePair,
  VariableQuery,
} from './types';

const supportedVariableTypes = ['adhoc', 'constant', 'custom', 'interval', 'query', 'textbox'];

export class DataSource extends DataSourceApi<GrafanaQuery, GenericOptions> {
  url: string;
  withCredentials: boolean;
  headers: any;
  responseParser: ResponseParser;

  constructor(instanceSettings: DataSourceInstanceSettings<GenericOptions>) {
    super(instanceSettings);

    this.responseParser = new ResponseParser();

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

  listMetrics(filter: string, options?: any, type?: string): Promise<MetricFindValue[]> {
    return lastValueFrom(
      this.doFetch({
        url: `${this.url}/search`,
        data: {
          type,
          target: getTemplateSrv().replace(filter, undefined, 'regex'),
        },
        method: 'POST',
      }).pipe(
        map((response) => this.mapToTextValue(response)),
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

  annotationQuery(
    options: AnnotationQueryRequest<GrafanaQuery & { query: string; iconColor: string }>
  ): Promise<AnnotationEvent[]> {
    const query = getTemplateSrv().replace(options.annotation.query, {}, 'glob');

    const annotationQuery = {
      annotation: {
        query,
        name: options.annotation.name,
        datasource: options.annotation.datasource,
        enable: options.annotation.enable,
        iconColor: options.annotation.iconColor,
      },
      range: options.range,
      rangeRaw: options.rangeRaw,
      variables: this.getVariables(),
    };

    return lastValueFrom(
      this.doFetch<AnnotationEvent[]>({
        url: `${this.url}/annotations`,
        method: 'POST',
        data: annotationQuery,
      }).pipe(
        map((result) => {
          return result.data;
        }),
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
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;

    return getBackendSrv().fetch<T>(options);
  }

  processTargets(options: QueryRequest) {
    options.targets = options.targets
      .filter((target) => {
        // remove placeholder targets
        return target.target !== undefined;
      })
      .map((target) => {
        if (target.payload.trim() !== '') {
          if (typeof target.payload === 'string') {
            target.payload = target.payload.replace((getTemplateSrv() as any).regex, (match) =>
              this.cleanMatch(match, options)
            );
          }

          target.payload = JSON.parse(target.payload);
        }

        if (typeof target.target === 'string') {
          target.target = getTemplateSrv().replace(target.target.toString(), options.scopedVars, 'regex');
        }

        return target;
      });

    return options;
  }

  cleanMatch(match: string, options: any) {
    const replacedMatch = getTemplateSrv().replace(match, options.scopedVars, 'json');
    if (
      typeof replacedMatch === 'string' &&
      replacedMatch[0] === '"' &&
      replacedMatch[replacedMatch.length - 1] === '"'
    ) {
      return JSON.parse(replacedMatch);
    }
    return replacedMatch;
  }

  getVariables() {
    const variables: { [id: string]: TextValuePair } = {};
    Object.values(getTemplateSrv().getVariables()).forEach((variable) => {
      if (!supportedVariableTypes.includes(variable.type)) {
        console.warn(`Variable of type "${variable.type}" is not supported`);

        return;
      }

      if (variable.type === 'adhoc') {
        // These are being added to request.adhocFilters
        return;
      }

      const supportedVariable = variable as MultiValueVariable;

      let variableValue = supportedVariable.current.value;
      if (variableValue === '$__all' || isEqual(variableValue, ['$__all'])) {
        if (supportedVariable.allValue === null || supportedVariable.allValue === '') {
          variableValue = supportedVariable.options.slice(1).map((textValuePair) => textValuePair.value);
        } else {
          variableValue = supportedVariable.allValue;
        }
      }

      variables[supportedVariable.id] = {
        text: supportedVariable.current.text,
        value: variableValue,
      };
    });

    return variables;
  }
}
