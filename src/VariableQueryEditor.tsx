import React, { useState } from 'react';
import { VariableQuery } from './types';
import { InlineFieldRow, InlineField, InlineSwitch, Input } from '@grafana/ui';
import {} from '@emotion/core'; // This can be removed in the next release of @grafana/ui https://github.com/grafana/grafana/pull/31479

interface VariableQueryProps {
  query: VariableQuery;
  onChange: (query: VariableQuery, definition: string) => void;
}

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ onChange, query }) => {
  const [state, setState] = useState(query);
  let asJsonString = '';
  if (state.asJson){
    asJsonString = ' (JSON)';
  }
  const saveQuery = () => {
    onChange(state, `${state.query}` + asJsonString);
  };

  const handleChange = (event: React.FormEvent<HTMLInputElement>) =>
    setState({
      ...state,
      [event.currentTarget.name]: event.currentTarget.value,
    });
  const handleChangeSwitch = (event: React.FormEvent<HTMLInputElement>) =>
    setState({
      ...state,
      [event.currentTarget.name]: event.currentTarget.checked,
    });

  const legacySupport = (legacyOrNew: VariableQuery | string) => {
    console.log(legacyOrNew);
    if (typeof legacyOrNew === 'object') {
      console.log("State was object");
      return legacyOrNew.query;
    } else {
      console.log("State was string");
      setState({['query']: legacyOrNew, ['asJson']: false});
      return legacyOrNew;
    }
  }

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Query" labelWidth={8}>
          <Input name="query" width={99} onBlur={saveQuery} onChange={handleChange} value={legacySupport(state)} />
        </InlineField>
        <InlineField
          labelWidth={14}
          label="Raw JSON"
          tooltip="When enabled, the query string is parsed as a JSON object. Otherwise when disabled, the query string is placed into a 'target' key to create a JSON object."
        >
          <InlineSwitch name="asJson" onBlur={saveQuery} onChange={handleChangeSwitch} value={state.asJson} />
        </InlineField>
      </InlineFieldRow>
    </>
  );
};
