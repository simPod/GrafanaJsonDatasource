import { AnnotationEvent, DataFrame, MetricFindValue, toDataFrame } from '@grafana/data';
import { BackendDataSourceResponse, FetchResponse, toDataQueryResponse } from '@grafana/runtime';

// https://github.com/grafana/grafana/blob/560c77390550e12e8c0be507c00f27cde0aa31e5/public/app/plugins/datasource/postgres/response_parser.ts
export class ResponseParser {
  transformMetricFindResponse(raw: FetchResponse<BackendDataSourceResponse>): MetricFindValue[] {
    const frame = toDataFrame(raw.data);

    const values: MetricFindValue[] = [];
    const textField = frame.fields.find((f) => f.name === '__text');
    const valueField = frame.fields.find((f) => f.name === '__value');

    if (textField && valueField) {
      for (let i = 0; i < textField.values.length; i++) {
        values.push({ text: '' + textField.values.get(i), value: '' + valueField.values.get(i) });
      }
    } else {
      values.push(
        ...frame.fields
          .flatMap((f) => f.values.toArray())
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

  async transformAnnotationResponse(options: any, data: BackendDataSourceResponse): Promise<AnnotationEvent[]> {
    const frames = toDataQueryResponse({ data: data }).data as DataFrame[];
    if (!frames || !frames.length) {
      return [];
    }
    const frame = frames[0];
    const timeField = frame.fields.find((f) => f.name === 'time');

    if (!timeField) {
      throw new Error('Missing mandatory time column (with time column alias) in annotation query');
    }

    const timeEndField = frame.fields.find((f) => f.name === 'timeend');
    const textField = frame.fields.find((f) => f.name === 'text');
    const tagsField = frame.fields.find((f) => f.name === 'tags');

    const list: AnnotationEvent[] = [];
    for (let i = 0; i < frame.length; i++) {
      const timeEnd = timeEndField && timeEndField.values.get(i) ? Math.floor(timeEndField.values.get(i)) : undefined;
      list.push({
        annotation: options.annotation,
        time: Math.floor(timeField.values.get(i)),
        timeEnd,
        text: textField && textField.values.get(i) ? textField.values.get(i) : '',
        tags:
          tagsField && tagsField.values.get(i)
            ? tagsField.values
                .get(i)
                .trim()
                .split(/\s*,\s*/)
            : [],
      });
    }

    return list;
  }
}
