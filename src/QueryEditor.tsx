import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { AsyncSelect, CodeEditor, Label, Select } from '@grafana/ui';

import React, { ComponentType } from 'react';
import { DataSource } from './DataSource';
import { Format } from './format';

import { GenericOptions, GrafanaQuery } from './types';

type Props = QueryEditorProps<DataSource, GrafanaQuery, GenericOptions>;

const formatAsOptions = [
  { label: 'Time series', value: Format.Timeseries },
  { label: 'Table', value: Format.Table },
];

export const QueryEditor: ComponentType<Props> = ({ datasource, onChange, onRunQuery, query }) => {
  const [formatAs, setFormatAs] = React.useState<SelectableValue<Format>>(formatAsOptions[0]);
  const [metric, setMetric] = React.useState<SelectableValue<string>>();
  const [data, setData] = React.useState('');

  React.useEffect(() => {
    if (formatAs.value === undefined) {
      return;
    }

    if (metric?.value === undefined) {
      return;
    }

    onChange({ ...query, data: data, target: metric.value, type: formatAs.value });

    onRunQuery();
  }, [data, formatAs, metric]);

  const loadMetrics = (query: string) => {
    return datasource.metricFindQuery(query).then(
      result => result.map(value => ({ label: value.text, value: value.value })),
      response => {
        throw new Error(response.statusText);
      }
    );
  };

  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form">
          <Select
            prefix="Format As: "
            options={formatAsOptions}
            defaultValue={formatAs}
            onChange={v => {
              setFormatAs(v);
            }}
          />
        </div>

        <div className="gf-form">
          <AsyncSelect
            prefix="Metric: "
            loadOptions={loadMetrics}
            defaultOptions
            placeholder="Select metric"
            allowCustomValue
            value={metric}
            onChange={v => {
              setMetric(v);
            }}
          />
        </div>
      </div>
      <div className="gf-form gf-form--alt">
        <div className="gf-form-label">
          <Label>Additional JSON Data</Label>
        </div>
        <div className="gf-form">
          <CodeEditor
            width="500px"
            height="100px"
            language="json"
            showLineNumbers={true}
            showMiniMap={data.length > 100}
            value={data}
            onBlur={value => setData(value)}
          />
        </div>
      </div>
    </>
  );
  // }
};
