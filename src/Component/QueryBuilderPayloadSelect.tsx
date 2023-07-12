import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { Select } from '@grafana/ui';
import { DataSource } from 'DataSource';
import { includes, isArray } from 'lodash';
import React, { ComponentType } from 'react';
import { GenericOptions, GrafanaQuery, MetricPayloadConfig } from 'types';

type PayloadValue = SelectableValue<string | number>;

interface PayloadSelectProps extends QueryEditorProps<DataSource, GrafanaQuery, GenericOptions> {
  config: MetricPayloadConfig;
  onPayloadChange: (value: PayloadValue | PayloadValue[]) => void;
  isMulti?: boolean;
  value?: string | number | string[] | number[];
}

export const QueryBuilderPayloadSelect: ComponentType<PayloadSelectProps> = ({
  config,
  datasource,
  query,
  onPayloadChange,
  isMulti,
  value,
}) => {
  const [currentOption, setCurrentOption] = React.useState<PayloadValue | PayloadValue[]>();
  const [isPayloadOptionsLoading, setIsPayloadOptionsLoading] = React.useState<boolean>(false);
  const [payloadOptions, setPayloadOptions] = React.useState<PayloadValue[]>([]);
  const loadMetricPayloadOptions = React.useCallback(() => {
    return datasource.listMetricPayloadOptions(config.name, query.target ?? '', query.payload).then(
      (metrics) => {
        if (value) {
          const vars = datasource.getVariables();
          for (const key in vars) {
            if (Object.prototype.hasOwnProperty.call(vars, key)) {
              metrics.push({ label: `$${key}`, value: `$${key}` });
            }
          }

          if (isArray(currentOption)) {
            for (let index = 0; index < currentOption.length; index++) {
              const foundOption = metrics.find((item) => item.value === currentOption[index].value);
              if (foundOption !== undefined) {
                metrics.push({
                  value: currentOption[index].value,
                  label: currentOption[index].label,
                });
              }
            }
          } else if (currentOption) {
            const foundOption = metrics.find((item) => item.value === currentOption.value);
            if (foundOption !== undefined) {
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

  const getMetricPayloadOptions = React.useCallback(() => {
    setIsPayloadOptionsLoading(true);
    loadMetricPayloadOptions()
      .then((options) => {
        setPayloadOptions(options);
      })
      .finally(() => {
        setIsPayloadOptionsLoading(false);
      });
  }, [loadMetricPayloadOptions, setPayloadOptions, setIsPayloadOptionsLoading]);

  // Initializing metric options
  React.useEffect(() => {
    if (value) {
      getMetricPayloadOptions();
    }
  }, []);

  React.useEffect(() => {
    if (value) {
      if (isArray(value)) {
        const foundOptions = payloadOptions.filter((item) => includes(value, item.value));
        if (foundOptions) {
          setCurrentOption(foundOptions);
        } else if (value) {
          setCurrentOption([{ label: value, value: value }]);
        }
      } else {
        const foundOption = payloadOptions.find((item) => item.value === value);
        if (foundOption) {
          setCurrentOption(foundOption);
        } else if (value) {
          setCurrentOption({ label: value.toString(), value: value });
        }
      }
    } else {
      setCurrentOption(undefined);
    }
  }, [query.payload, payloadOptions]);

  return (
    <Select<string | number>
      key={config.name}
      width={config.width}
      isLoading={isPayloadOptionsLoading}
      prefix={config.label}
      options={config.options ?? payloadOptions}
      placeholder={config.placeholder ?? ''}
      allowCustomValue
      isClearable={true}
      isMulti={isMulti}
      value={currentOption}
      onOpenMenu={() => {
        if (!config.options) {
          getMetricPayloadOptions();
        }
      }}
      onChange={(v) => {
        onPayloadChange(v);
      }}
    />
  );
};
