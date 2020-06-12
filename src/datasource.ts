import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
} from '@grafana/data';
import { AnnotationEvent } from '@grafana/data/types/data';
import { AnnotationQueryRequest } from '@grafana/data/types/datasource';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { isEqual, isObject } from 'lodash';
import { GenericOptions, GenericQuery } from './types';

export class GenericDatasource extends DataSourceApi<GenericQuery, GenericOptions> {
  url: string;
  withCredentials: boolean;
  headers: any;

  constructor(instanceSettings: DataSourceInstanceSettings<GenericOptions>) {
    super(instanceSettings);

    this.url = instanceSettings.url === undefined ? '' : instanceSettings.url;

    this.withCredentials = instanceSettings.withCredentials !== undefined;
    this.headers = { 'Content-Type': 'application/json' };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  query(options: DataQueryRequest<GenericQuery>): Promise<DataQueryResponse> {
    const query = this.buildQueryParameters(options);

    if (query.targets.length <= 0) {
      return Promise.resolve({ data: [] });
    }

    const templateSrv = getTemplateSrv() as any;
    if (templateSrv.getAdhocFilters) {
      query.adhocFilters = templateSrv.getAdhocFilters(this.name);
    } else {
      query.adhocFilters = [];
    }

    options.scopedVars = { ...this.getVariables(), ...options.scopedVars };

    return this.doRequest({
      url: `${this.url}/query`,
      data: query,
      method: 'POST',
    });
  }

  testDatasource(): Promise<any> {
    return this.doRequest({
      url: `${this.url}/`,
      method: 'GET',
    }).then((response: any) => {
      if (response.status === 200) {
        return { status: 'success', message: 'Data source is working', title: 'Success' };
      }

      return {
        status: 'error',
        message: `Data source is not working: ${response.message}`,
        title: 'Error',
      };
    });
  }

  metricFindQuery(query: string, options?: any, type?: string): Promise<MetricFindValue[]> {
    const interpolated = {
      type,
      target: getTemplateSrv().replace(query, undefined, 'regex'),
    };

    return this.doRequest({
      url: `${this.url}/search`,
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  getTagKeys(options?: any): Promise<MetricFindValue[]> {
    return new Promise(resolve => {
      this.doRequest({
        url: `${this.url}/tag-keys`,
        method: 'POST',
        data: options,
      }).then((result: any) => {
        return resolve(result.data);
      });
    });
  }

  getTagValues(options: any): Promise<MetricFindValue[]> {
    return new Promise(resolve => {
      this.doRequest({
        url: `${this.url}/tag-values`,
        method: 'POST',
        data: options,
      }).then((result: any) => {
        return resolve(result.data);
      });
    });
  }

  annotationQuery(
    options: AnnotationQueryRequest<GenericQuery & { query: string; iconColor: string }>
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

    return this.doRequest({
      url: `${this.url}/annotations`,
      method: 'POST',
      data: annotationQuery,
    }).then((result: any) => {
      return result.data;
    });
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

  doRequest(options: any) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;

    return getBackendSrv().datasourceRequest(options);
  }

  buildQueryParameters(options: any) {
    options.targets = options.targets
      .filter((target: any) => {
        // remove placeholder targets
        return target.target !== 'select metric';
      })
      .map((target: any) => {
        let data = null;

        if (target.data !== undefined && target.data.trim() !== '') {
          data = JSON.parse(target.data, (key, value) => {
            if (typeof value === 'string') {
              return value.replace((getTemplateSrv() as any).regex, match => this.cleanMatch(match, options));
            }

            return value;
          });
        }

        let targetValue = target.target;
        if (typeof targetValue === 'string') {
          targetValue = getTemplateSrv().replace(target.target.toString(), options.scopedVars, 'regex');
        }

        return {
          data,
          target: targetValue,
          refId: target.refId,
          hide: target.hide,
          type: target.type,
        };
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
    const variables: any = {};
    Object.values(getTemplateSrv().getVariables()).forEach((variable: any) => {
      let variableValue = variable.current.value;
      if (variableValue === '$__all' || isEqual(variableValue, ['$__all'])) {
        if (variable.allValue === null || variable.allValue === '') {
          variableValue = variable.options.slice(1).map((textValuePair: any) => textValuePair.value);
        } else {
          variableValue = variable.allValue;
        }
      }

      variables[variable.id] = {
        text: variable.current.text,
        value: variableValue,
      };
    });

    return variables;
  }
}
