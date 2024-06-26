import { DataQueryRequest, DataSourceJsonData, MetricFindValue, SelectableValue } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface QueryRequest extends DataQueryRequest<GrafanaQuery> {}

export interface GrafanaQuery extends DataQuery {
  editorMode?: QueryEditorMode;
  alias?: string;
  target?: string;
  payload: string | { [key: string]: unknown };
}

export interface GenericOptions extends DataSourceJsonData {
  defaultEditorMode?: QueryEditorMode;
}

export interface VariableQuery extends DataQuery {
  query: string;
  format: 'string' | 'json';
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

export interface MetricPayloadConfig {
  width?: number;
  placeholder?: string;
  name: string;
  label?: string;
  type?: 'input' | 'select' | 'multi-select' | 'textarea';
  reloadMetric?: boolean;
  options?: Array<SelectableValue<string | number>>;
}

export interface MetricConfig {
  label: string;
  value: string;
  payloads: MetricPayloadConfig[];
}

export type QueryEditorMode = 'code' | 'builder';
