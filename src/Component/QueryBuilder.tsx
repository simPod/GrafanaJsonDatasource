import { DataSource } from 'DataSource';
import React, { ComponentType } from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { InlineField, Input, Select } from '@grafana/ui';
import { find, includes, isArray, isString } from 'lodash';
import { GenericOptions, GrafanaQuery, MetricConfig, MetricPayloadConfig } from '../types';
import { EditorField, EditorFieldGroup } from '@grafana/experimental';

interface LastQuery {
  payload: string | { [key: string]: any };
  metric: string;
}

type Props = QueryEditorProps<DataSource, GrafanaQuery, GenericOptions>;

export const QueryBuilder: ComponentType<Props> = (props) => {
  const { datasource, onChange, onRunQuery, query } = props;
  const [metric, setMetric] = React.useState<SelectableValue<string | number>>();
  const [payload, setPayload] = React.useState(query.payload ?? '');

  const [lastQuery, setLastQuery] = React.useState<LastQuery | null>(null);
  const [payloadConfig, setPayloadConfig] = React.useState<MetricPayloadConfig[]>([]);
  const [metricOptions, setMetricOptions] = React.useState<MetricConfig[]>([]);
  const [isMetricOptionsLoading, setIsMetricOptionsLoading] = React.useState<boolean>(false);

  const loadMetrics = React.useCallback(() => {
    return datasource.listMetrics(metric?.value ?? query.target ?? '', payload).then(
      (metrics) => {
        const foundMetric = find(metrics, (metric) => metric.value === query.target);
        setMetric(foundMetric === undefined ? { label: '', value: '' } : foundMetric);
        setPayloadConfig(foundMetric?.payloads ?? []);
        return metrics;
      },
      (response) => {
        setMetric({ label: '', value: '' });
        setMetricOptions([]);
        throw new Error(response.statusText);
      }
    );
  }, [datasource, payload, metric?.value]);

  const loadMetricOptions = React.useCallback(() => {
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
  React.useEffect(() => loadMetricOptions(), []);

  React.useEffect(() => {
    if (metric?.value === undefined || metric?.value === '') {
      return;
    }

    if (lastQuery !== null && metric?.value === lastQuery.metric && payload === lastQuery.payload) {
      return;
    }

    setLastQuery({ payload, metric: metric.value.toString() });

    onChange({ ...query, payload, target: metric.value.toString() });

    onRunQuery();
  }, [payload, metric]);

  const changePayload = (
    name: string,
    reloadMetric: boolean,
    v: SelectableValue<string | number> | Array<SelectableValue<string | number>>
  ) => {
    setPayload((ori) => {
      let newPayload: { [key: string]: any } = {};
      try {
        newPayload = isString(ori) ? JSON.parse(ori) : { ...ori };
      } catch (error) {
        console.log(error);
      }
      if(isArray(v)){
        newPayload[name] = v.map((item) => item.value);
      }else{
        newPayload[name] = v.value;
      }
      if (reloadMetric) {
        setIsMetricOptionsLoading(true);
        datasource
          .listMetrics(metric?.value ?? '', { ...newPayload })
          .then(
            (metrics) => {
              const foundMetric = find(metrics, (metric) => metric.value === query.target);
              setMetric(foundMetric === undefined ? { label: '', value: '' } : foundMetric);
              setPayloadConfig(foundMetric?.payloads ?? []);
              setMetricOptions(metrics);
            },
            (response) => {
              setMetric({ label: '', value: '' });
              setMetricOptions([]);
              throw new Error(response.statusText);
            }
          )
          .finally(() => {
            setIsMetricOptionsLoading(false);
          });
      }
      return newPayload;
    });
  };
  return (
    <>
      <EditorFieldGroup>
        <EditorField label="Metric">
          <Select
            isLoading={isMetricOptionsLoading}
            options={metricOptions}
            placeholder="Select metric"
            allowCustomValue
            value={metric}
            onChange={(v) => {
              const findOpts = metricOptions.find((item) => item.value === v.value);
              setPayloadConfig(findOpts?.payloads ?? []);
              setMetric(v);
            }}
          />
        </EditorField>
      </EditorFieldGroup>
      {payloadConfig && payloadConfig.length > 0 && (
        <EditorFieldGroup>
          <EditorField label="Payload">
            <div style={{ display: 'flex', flexFlow: 'row wrap', gap: 16 }}>
              {payloadConfig.map((opt) => {
                switch (opt.type) {
                  case 'select':
                  case 'multi-select':
                    return (
                      <InlineField key={opt.name}>
                        <PayloadSelect
                          {...props}
                          config={opt}
                          isMulti={opt.type === 'multi-select'}
                          onPayloadChange={(v) => {
                            changePayload(opt.name, opt.reloadMetric, v);
                          }}
                        />
                      </InlineField>
                    );
                  default:
                    return (
                      <InlineField key={opt.name}>
                        <Input
                          prefix={opt.label}
                          onBlur={(e) => {
                            changePayload(opt.name, opt.reloadMetric, { value: e.currentTarget.value });
                          }}
                          // value={!isString(query.payload) ? (query.payload[opt.name] as string) : ''}
                          defaultValue={!isString(query.payload) ? (query.payload[opt.name] as string) : ''}
                          placeholder={opt.placeholder ?? ''}
                        />
                      </InlineField>
                    );
                }
              })}
            </div>
          </EditorField>
        </EditorFieldGroup>
      )}
    </>
  );
};

interface PayloadSelectProps extends QueryEditorProps<DataSource, GrafanaQuery, GenericOptions> {
  config: MetricPayloadConfig;
  onPayloadChange: (value: SelectableValue<string | number> | Array<SelectableValue<string | number>>) => void;
  isMulti?: boolean;
}

export const PayloadSelect: ComponentType<PayloadSelectProps> = ({
  config,
  datasource,
  query,
  onPayloadChange,
  isMulti,
}) => {
  const [currentOption, setCurrentOption] = React.useState<
    SelectableValue<string | number> | Array<SelectableValue<string | number>>
  >();
  const [isPayloadOptionsLoading, setIsPayloadOptionsLoading] = React.useState<boolean>(false);
  const [payloadOptions, setPayloadOptions] = React.useState<Array<SelectableValue<string | number>>>([]);
  const loadMetricPayloadValues = React.useCallback(() => {
    return datasource.listMetricPayloadOptions(config.name, query.target ?? '', query.payload).then(
      (metrics) => {
        if (!isString(query.payload)) {
          const currentValue = query.payload[config.name];
          const vars = datasource.getVariables();
          for (const key in vars) {
            if (Object.prototype.hasOwnProperty.call(vars, key)) {
              metrics.push({ label: `$${key}`, value: `$${key}` });
            }
          }
          const foundMetric = find(metrics, (metric) => metric.value === currentValue);
          if (foundMetric) {
            setCurrentOption(foundMetric);
          } else if (currentOption) {
            if(isArray(currentOption)){
              for (let index = 0; index < currentOption.length; index++) {
                metrics.push({ ...currentOption, value: currentOption[index].value, label:  currentOption[index].label });
              }
            }else{
              metrics.push({ ...currentOption, value: currentOption.value, label: currentOption.label });
            }
          }
        }
        return metrics;
      },
      (response) => {
        setPayloadOptions([]);
        throw new Error(response.statusText);
      }
    );
  }, [datasource, query.payload, query.target]);

  const loadMetricPayloadOptions = React.useCallback(() => {
    setIsPayloadOptionsLoading(true);
    loadMetricPayloadValues()
      .then((metrics) => {
        setPayloadOptions(metrics);
      })
      .finally(() => {
        setIsPayloadOptionsLoading(false);
      });
  }, [loadMetricPayloadValues, setPayloadOptions, setIsPayloadOptionsLoading]);

  // Initializing metric options
  React.useEffect(() => {
    if (!isString(query.payload) && query.payload) {
      const val = query.payload[config.name];
      if (val) {
        loadMetricPayloadOptions();
      }
    }
  }, []);

  React.useEffect(() => {
    if (!isString(query.payload) && query.payload) {
      const val = query.payload[config.name] as (string|number|string[]|number[]);
      if(isArray(val)){
        const foundOptions = payloadOptions.filter((item) => includes(val, item.value));
        if (foundOptions) {
          setCurrentOption(foundOptions);
        } else if (val) {
          setCurrentOption([{ label: val, value: val },]);
        }
      }else{
        const foundOption = payloadOptions.find((item) => item.value === val);
        if (foundOption) {
          setCurrentOption(foundOption);
        } else if (val) {
          setCurrentOption({ label: val.toString(), value: val });
        }
      }
    }
  }, [query.payload, payloadOptions]);
  return (
    <Select<string | number>
      key={config.name}
      isLoading={isPayloadOptionsLoading}
      prefix={config.label}
      options={config.options ?? payloadOptions}
      placeholder={config.placeholder ?? ''}
      allowCustomValue
      isMulti={isMulti}
      value={currentOption}
      onOpenMenu={() => {
        if (!config.options) {
          setIsPayloadOptionsLoading(true);
          loadMetricPayloadValues()
            .then((options) => {
              setPayloadOptions(options);
            })
            .finally(() => {
              setIsPayloadOptionsLoading(false);
            });
        }
      }}
      onChange={(v) => {
        if(isArray(v)){
          onPayloadChange(v as Array<SelectableValue<string | number>>);
        }else{
          onPayloadChange(v);
        }
      }}
    />
  );
};
