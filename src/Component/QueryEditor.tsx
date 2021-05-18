import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { CodeEditor, InlineField, InlineFieldRow, InlineLabel, Select } from '@grafana/ui';
import { find } from 'lodash';

import React, { ComponentType } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { DataSource } from '../DataSource';
import { Format } from '../format';

import { GenericOptions, GrafanaQuery } from '../types';

type Props = QueryEditorProps<DataSource, GrafanaQuery, GenericOptions>;

const formatAsOptions = [
  { label: 'Time series', value: Format.Timeseries },
  { label: 'Table', value: Format.Table },
];

interface LastQuery {
  data: string;
  metric: string;
  format: string;
}

export const QueryEditor: ComponentType<Props> = ({ datasource, onChange, onRunQuery, query }) => {
  const [formatAs, setFormatAs] = React.useState<SelectableValue<Format>>(
    find(formatAsOptions, (option) => option.value === query.type) ?? formatAsOptions[0]
  );
  const [metric, setMetric] = React.useState<SelectableValue<string>>();
  const [data, setData] = React.useState(query.data ?? '');

  const [lastQuery, setLastQuery] = React.useState<LastQuery | null>(null);

  const [metricOptions, setMetricOptions] = React.useState<Array<SelectableValue<string>>>([]);
  const [isMetricOptionsLoading, setIsMetricOptionsLoading] = React.useState<boolean>(false);

  const loadMetrics = React.useCallback(
    (type: SelectableValue<Format>) => {
      const typeValue = type.value!;

      return datasource.metricFindQuery('', undefined, typeValue).then(
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
      );
    },
    [datasource, query.target]
  );

  const refreshMetricOptions = React.useCallback(
    (type: SelectableValue<Format>) => {
      setIsMetricOptionsLoading(true);
      loadMetrics(type)
        .then((metrics) => {
          setMetricOptions(metrics);
        })
        .finally(() => {
          setIsMetricOptionsLoading(false);
        });
    },
    [loadMetrics, setMetricOptions, setIsMetricOptionsLoading]
  );

  // Initializing metric options
  React.useEffect(() => {
    refreshMetricOptions(formatAs);
  }, [formatAs, refreshMetricOptions]);

  React.useEffect(() => {
    if (metric?.value === undefined || metric?.value === '') {
      return;
    }

    if (
      lastQuery !== null &&
      metric?.value === lastQuery.metric &&
      formatAs.value! === lastQuery.format &&
      data === lastQuery.data
    ) {
      return;
    }

    setLastQuery({
      data,
      metric: metric.value,
      format: formatAs.value!,
    });

    onChange({ ...query, data, target: metric.value, type: formatAs.value! });

    onRunQuery();
  }, [data, formatAs, metric]);

  return (
    <>
      <InlineFieldRow>
        <InlineField>
          <Select
            prefix="Format As: "
            options={formatAsOptions}
            defaultValue={formatAs}
            onChange={(v) => {
              setFormatAs(v);
            }}
          />
        </InlineField>

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
              <InlineLabel>Body</InlineLabel>
              <CodeEditor
                width="100%"
                height="200px"
                language="json"
                showLineNumbers={true}
                showMiniMap={data.length > 100}
                value={data}
                onBlur={(value) => setData(value)}
              />
            </div>
          )}
        </AutoSizer>
      </InlineFieldRow>
    </>
  );
};
