import { MetricFindValue, toDataFrame } from '@grafana/data';
import { BackendDataSourceResponse, FetchResponse } from '@grafana/runtime';

// https://github.com/grafana/grafana/blob/560c77390550e12e8c0be507c00f27cde0aa31e5/public/app/plugins/datasource/postgres/response_parser.ts
export class ResponseParser {
  transformMetricFindResponse(raw: FetchResponse<BackendDataSourceResponse>): MetricFindValue[] {
    const frame = toDataFrame(raw.data);

    const values: MetricFindValue[] = [];
    const textField = frame.fields.find((f) => f.name === '__text');
    const valueField = frame.fields.find((f) => f.name === '__value');

    if (textField && valueField) {
      for (let i = 0; i < textField.values.length; i++) {
        values.push({ text: '' + textField.values[i], value: '' + valueField.values[i] });
      }
    } else {
      values.push(
        ...frame.fields
          .flatMap((f) => f.values)
          .map((v) => ({
            text: v,
          }))
      );
    }

    return Array.from(new Set(values.map((v) => v.text))).map((text) => ({
      text,
      value: values.find((v) => v.text === text)?.value,
    }));
  }
}
