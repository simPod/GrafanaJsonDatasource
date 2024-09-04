import { getDefaultTimeRange, MetricFindValue, TimeRange } from '@grafana/data';

import { DataSource } from './DataSource';
import { lastValueFrom } from 'rxjs';
import { doFetch } from './doFetch';
import { BackendDataSourceResponse } from '@grafana/runtime';
import { map } from 'rxjs/operators';
import { ResponseParser } from './response_parser';

export class MetricFindQuery {
  range: TimeRange;
  responseParser: ResponseParser;

  constructor(
    private datasource: DataSource,
    private query: string
  ) {
    this.datasource = datasource;
    this.query = query;
    this.range = getDefaultTimeRange();
    this.responseParser = new ResponseParser();
  }

  process(timeRange: TimeRange | undefined = getDefaultTimeRange()): Promise<MetricFindValue[]> {
    return lastValueFrom(
      doFetch<BackendDataSourceResponse>(this.datasource, {
        url: `/api/datasources/uid/${this.uid}/resources/variable`,
        data: {
          payload: this.query,
          range: timeRange,
        },
        method: 'POST',
      }).pipe(map((response) => this.responseParser.transformMetricFindResponse(response)))
    );
  }
}
