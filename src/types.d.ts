import { DataQuery, DataQueryRequest, DataSourceJsonData, VariableModel } from '@grafana/data';
import { TemplateSrv as GrafanaTemplateSrv } from '@grafana/runtime';
import { Format } from './format';

declare module '@grafana/runtime' {
  export interface TemplateSrv extends GrafanaTemplateSrv {
    getAdhocFilters(datasourceName: string): any;
  }
}

export interface DataSourceOptions extends DataSourceJsonData {}

export interface QueryRequest extends DataQueryRequest<GrafanaQuery> {
  adhocFilters?: any[];
}

export interface GrafanaQuery extends DataQuery {
  alias?: string;
  target?: string;
  data: string;
  type: Format;
}

export interface GenericOptions extends DataSourceJsonData {}

export interface MetricFindValue extends MetricFindValue {
  value: any;
  text: string;
}

export interface MetricFindTagKeys extends MetricFindValue {
  key: string;
  type: string;
  text: string;
}

export interface MetricFindTagValues extends MetricFindValue {
  key: string;
  text: string;
}

export interface TextValuePair {
  text: string;
  value: any;
}

export interface MultiValueVariable extends VariableModel {
  allValue: string | null;
  id: string;
  current: TextValuePair;
  options: TextValuePair[];
}
