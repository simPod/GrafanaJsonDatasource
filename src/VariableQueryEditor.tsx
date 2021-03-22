import React, { useState } from 'react';
import { VariableQuery } from './types';
import { InlineFieldRow, InlineField, InlineSwitch, Input } from '@grafana/ui';
import { } from '@emotion/core'; // This can be removed in the next release of @grafana/ui https://github.com/grafana/grafana/pull/31479

interface VariableQueryProps {
  query: VariableQuery;
  onChange: (query: VariableQuery, definition: string) => void;
}

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ onChange, query }) => {
  const [state, setState] = useState(query);

  const saveQuery = () => {
    onChange(state, `${state.query} (${state.asJson})`);
  };

  const handleChange = (event: React.FormEvent<HTMLInputElement>) =>
    setState({
      ...state,
      [event.currentTarget.name]: event.currentTarget.value,
    });

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Query" labelWidth={8}>
          <Input name="query"
            width={99}
            onBlur={saveQuery}
            onChange={handleChange}
            value={state.query}
          />
        </InlineField>
        <InlineField
          labelWidth={14}
          label="Raw JSON"
          tooltip="When enabled, the query string is parsed as a JSON object. Otherwise when disabled, the query string is placed into a 'target' key to create a JSON object.">
          <InlineSwitch
            name="asJson"
            onBlur={saveQuery}
            onChange={handleChange}
            value={state.asJson}
          />
        </InlineField>
      </InlineFieldRow>
    </>
  );
};