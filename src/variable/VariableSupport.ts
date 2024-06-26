import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { CustomVariableSupport, DataQueryRequest, DataQueryResponse, rangeUtil } from '@grafana/data';
import { getTemplateSrv, TemplateSrv } from '@grafana/runtime';

import { DataSource } from '../DataSource';
import { VariableQueryEditor } from '../Component/VariableQueryEditor';
import { VariableQuery } from '../types';
import { MetricFindQuery } from '../MetricFindQuery';

export class VariableSupport extends CustomVariableSupport<DataSource> {
  constructor(
    private readonly datasource: DataSource,
    private readonly templateSrv: TemplateSrv = getTemplateSrv()
  ) {
    super();
  }

  editor = VariableQueryEditor;

  query(request: DataQueryRequest<VariableQuery>): Observable<DataQueryResponse> {
    const query = typeof request.targets[0] === 'string' ? request.targets[0] : request.targets[0];

    if (!query) {
      return of({ data: [] });
    }

    const scopedVars = {
      ...request.scopedVars,
      __interval: { text: this.datasource.interval, value: this.datasource.interval },
      __interval_ms:
        this.datasource.interval === undefined
          ? undefined
          : {
              text: rangeUtil.intervalToMs(this.datasource.interval),
              value: rangeUtil.intervalToMs(this.datasource.interval),
            },
    };

    const interpolated: string =
      query.format === 'json'
        ? JSON.parse(this.templateSrv.replace(query.query, scopedVars, 'json'))
        : {
            target: this.templateSrv.replace(query.query, scopedVars, 'regex'),
          };

    const metricFindQuery = new MetricFindQuery(this.datasource, interpolated);
    const metricFindStream = from(metricFindQuery.process(request.range));

    return metricFindStream.pipe(map((results) => ({ data: results })));
  }
}
