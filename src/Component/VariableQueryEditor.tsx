import { getTemplateSrv } from '@grafana/runtime';
import { InlineField, InlineFieldRow, InlineSwitch, Input } from '@grafana/ui';
import React, { useState } from 'react';
import { GenericOptions, GrafanaQuery, VariableQuery } from '../types';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../DataSource';

export type Props = QueryEditorProps<DataSource, GrafanaQuery, GenericOptions, VariableQuery>;

export const VariableQueryEditor = ({ onChange, query, datasource, range }: Props) => {
  const [variableQuery, setVariableQuery] = useState(query);
  const saveQuery = () => {
    onChange(variableQuery);
  };

  const handleChange = (event: React.FormEvent<HTMLInputElement>) =>
    setVariableQuery({
      ...variableQuery,
      query: event.currentTarget.value,
    });
  const handleChangeSwitch = (event: React.FormEvent<HTMLInputElement>) =>
    setVariableQuery({
      ...variableQuery,
      format: event.currentTarget.checked ? 'json' : 'string',
    });

  const checkValidJSON = (variableQuery: VariableQuery) => {
    if (variableQuery.format === 'json') {
      const jsonString = getTemplateSrv().replace(variableQuery.query, undefined, 'json');

      try {
        JSON.parse(jsonString);
      } catch (e) {
        if (e instanceof Error && e.name === 'SyntaxError') {
          return true;
        }

        throw e;
      }
    }
    return false;
  };

  const isJsonFormatEnabled = (format: string) => {
    return format === 'json';
  };

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Query" invalid={checkValidJSON(variableQuery)} grow>
          <Input name="query" onBlur={saveQuery} onChange={handleChange} value={variableQuery.query} />
        </InlineField>
        <InlineField
          labelWidth={14}
          label="Raw JSON"
          tooltip="When enabled, the query string is parsed as a JSON object. Otherwise when disabled, the query string is placed into a 'target' key to create a JSON object."
        >
          <InlineSwitch
            name="format"
            onBlur={saveQuery}
            onChange={handleChangeSwitch}
            value={isJsonFormatEnabled(variableQuery.format)}
          />
        </InlineField>
      </InlineFieldRow>
    </>
  );
};
