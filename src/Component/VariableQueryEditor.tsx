import { getTemplateSrv } from '@grafana/runtime';
import { InlineField, InlineFieldRow, InlineSwitch, Input } from '@grafana/ui';
import React, { useState } from 'react';
import { VariableQuery } from '../types';

interface Props {
  query: VariableQuery;
  onChange: (query: VariableQuery, definition: string) => void;
}

export const VariableQueryEditor: React.FC<Props> = ({ onChange, query }) => {
  const [variableQuery, setVariableQuery] = useState(query);
  const saveQuery = () => {
    onChange(variableQuery, `${variableQuery.query}` + `${variableQuery.format === 'json' ? ' (JSON)' : ''}`);
  };

  const handleChange = (event: React.FormEvent<HTMLInputElement>) =>
    setVariableQuery({
      ...variableQuery,
      query: event.currentTarget.value,
    });
  const handleChangeSwitch = (event: React.FormEvent<HTMLInputElement>) =>
    setVariableQuery({
      ...variableQuery,
      format: event.currentTarget.checked === true ? 'json' : 'string',
    });

  const checkValidJSON = (query: VariableQuery) => {
    if (variableQuery.format === 'json') {
      const jsonString = getTemplateSrv().replace(variableQuery.query, undefined, 'json');

      try {
        JSON.parse(jsonString);
      } catch (e) {
        if (e.name === 'SyntaxError') {
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
