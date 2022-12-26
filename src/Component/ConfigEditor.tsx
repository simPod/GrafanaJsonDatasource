import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DataSourceHttpSettings, LegacyForms } from '@grafana/ui';
import React, { ComponentType } from 'react';
import { GenericOptions } from '../types';
import { QueryEditorModeToggle } from './QueryEditorModeToggle';

const { FormField } = LegacyForms;

type Props = DataSourcePluginOptionsEditorProps<GenericOptions>;

export const ConfigEditor: ComponentType<Props> = ({ options, onOptionsChange }) => (
  <>
    <DataSourceHttpSettings
      defaultUrl={'http://localhost:8080'}
      dataSourceConfig={options}
      showAccessOptions={true}
      onChange={onOptionsChange}
    />
    <h3 className="page-heading">Other</h3>
    <div className="gf-form-group">
      <div className="gf-form-inline">
        <div className="gf-form">
          <FormField
            label="Default edit mode"
            labelWidth={13}
            inputEl={
              <QueryEditorModeToggle
                size="md"
                mode={options.jsonData.defaultEditorMode ?? 'code'}
                onChange={(v) => {
                  onOptionsChange({
                    ...options,
                    jsonData: {
                      ...options.jsonData,
                      defaultEditorMode: v,
                    },
                  });
                }}
              />
            }
          />
        </div>
      </div>
    </div>
  </>
);
