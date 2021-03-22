import React, { useState } from 'react';
import { VariableQuery } from './types';
import { InlineFieldRow, InlineField, InlineSwitch, Input } from '@grafana/ui';
import { getTemplateSrv } from '@grafana/runtime';
import {} from '@emotion/core'; // This can be removed in the next release of @grafana/ui https://github.com/grafana/grafana/pull/31479

interface VariableQueryProps {
  query: VariableQuery;
  onChange: (query: VariableQuery, definition: string) => void;
}

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ onChange, query }) => {
  const [state, setState] = useState(query);
  let asJsonString = '';
  if (state.asJson) {
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
    if (typeof legacyOrNew === 'object') {
      return legacyOrNew.query;
    } else {
      setState({ ['query']: legacyOrNew, ['asJson']: false });
      return legacyOrNew;
    }
  };

  function checkValidJSON(query: VariableQuery) {
    if (state.asJson) {
      try {
        JSON.parse(getTemplateSrv().replace(state.query, undefined, 'json'));
      } catch (e) {
        return true;
      }
    }
    return false;
  }

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Query" invalid={checkValidJSON(state)} grow>
          <Input name="query" onBlur={saveQuery} onChange={handleChange} value={legacySupport(state)} />
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
