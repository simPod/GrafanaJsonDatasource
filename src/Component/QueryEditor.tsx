import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { CodeEditor, InlineField, InlineFieldRow, InlineLabel, Select } from '@grafana/ui';
import { find } from 'lodash';

import React, { ComponentType } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { DataSource } from '../DataSource';

import { GenericOptions, GrafanaQuery } from '../types';

type Props = QueryEditorProps<DataSource, GrafanaQuery, GenericOptions>;

interface LastQuery {
  payload: string;
  metric: string;
}

export const QueryEditor: ComponentType<Props> = ({ datasource, onChange, onRunQuery, query }) => {
  const [metric, setMetric] = React.useState<SelectableValue<string | number>>();
  const [payload, setPayload] = React.useState(query.payload ?? '');

  const [lastQuery, setLastQuery] = React.useState<LastQuery | null>(null);

  const [metricOptions, setMetricOptions] = React.useState<Array<SelectableValue<string | number>>>([]);
  const [isMetricOptionsLoading, setIsMetricOptionsLoading] = React.useState<boolean>(false);

  const loadMetrics = React.useCallback(
    () =>
      datasource.metricFindQuery({ query: '', format: 'string' }, undefined).then(
        (result) => {
          const metrics = result.map((value) => ({ label: value.text, value: value.value }));

          const foundMetric = find(metrics, (metric) => metric.value === query.target);

          setMetric(foundMetric === undefined ? { label: '', value: '' } : foundMetric);

          return metrics;
        },
        (response) => {
          setMetric({ label: '', value: '' });
          setMetricOptions([]);

          throw new Error(response.statusText);
        }
      ),
    [datasource, query.target]
  );

  const refreshMetricOptions = React.useCallback(() => {
    setIsMetricOptionsLoading(true);
    loadMetrics()
      .then((metrics) => {
        setMetricOptions(metrics);
      })
      .finally(() => {
        setIsMetricOptionsLoading(false);
      });
  }, [loadMetrics, setMetricOptions, setIsMetricOptionsLoading]);

  // Initializing metric options
  React.useEffect(() => refreshMetricOptions(), []);

  React.useEffect(() => {
    if (metric?.value === undefined || metric?.value === '') {
      return;
    }

    if (lastQuery !== null && metric?.value.toString() === lastQuery.metric && payload === lastQuery.payload) {
      return;
    }

    setLastQuery({ payload, metric: metric.value.toString() });

    onChange({ ...query, payload, target: metric.value.toString() });

    onRunQuery();
  }, [payload, metric]);

  return (
    <>
      <InlineFieldRow>
        <InlineField>
          <Select
            isLoading={isMetricOptionsLoading}
            prefix="Metric: "
            options={metricOptions}
            placeholder="Select metric"
            allowCustomValue
            value={metric}
            onChange={(v) => {
              setMetric(v);
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <AutoSizer disableHeight>
          {({ width }) => (
            <div style={{ width: width + 'px' }}>
              <InlineLabel>Payload</InlineLabel>
              <CodeEditor
                width="100%"
                height="200px"
                language="json"
                showLineNumbers={true}
                showMiniMap={payload.length > 100}
                value={payload}
                onBlur={(value) => setPayload(value)}
              />
            </div>
          )}
        </AutoSizer>
      </InlineFieldRow>
    </>
  );
};
