import { QueryEditorProps } from '@grafana/data';
import { EditorField, EditorFieldGroup, EditorHeader, EditorRows } from '@grafana/experimental';
import React, { ComponentType, useCallback } from 'react';
import { DataSource } from '../DataSource';
import AutoSizer from 'react-virtualized-auto-sizer';

import { QueryEditor } from './QueryEditor';
import { QueryBuilder } from './QueryBuilder';
import { QueryEditorModeToggle } from './QueryEditorModeToggle';
import { GenericOptions, GrafanaQuery, QueryEditorMode } from '../types';
import { CodeEditor, InlineField, InlineSwitch } from '@grafana/ui';

type Props = QueryEditorProps<DataSource, GrafanaQuery, GenericOptions>;

function convertPayloadToObject(payload: string | { [key: string]: any }): { [key: string]: any } {
  if (payload) {
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch (err) {
        console.error(err);
        return {};
      }
    } else {
      return payload;
    }
  } else {
    return {};
  }
}

const convertPayloadToString = (payload: string | { [key: string]: any }): string => {
  if (typeof payload === 'string') {
    return payload;
  } else if (payload) {
    return JSON.stringify(payload, undefined, 2);
  } else {
    return '';
  }
};

export const QueryEditorContainer: ComponentType<Props> = (props) => {
  const { onChange, query, datasource } = props;
  const { defaultEditorMode } = datasource;
  const editorMode = query.editorMode!;

  const [showRawQuery, setShowRawQuery] = React.useState<boolean>(false);
  React.useEffect(() => {
    onChange({
      ...query,
      editorMode: query.editorMode ?? defaultEditorMode,
    });
  }, []);

  const onEditorModeChange = useCallback(
    (newMetricEditorMode: QueryEditorMode) => {
      onChange({
        ...query,
        editorMode: newMetricEditorMode,
      });
    },
    [onChange, query]
  );

  return (
    <>
      <EditorHeader>
        <InlineField label="Mode">
          <QueryEditorModeToggle size="md" mode={editorMode} onChange={onEditorModeChange} />
        </InlineField>
        <InlineField label="Raw query">
          <InlineSwitch
            sizes="md"
            label="Raw query"
            value={showRawQuery}
            onChange={(v) => setShowRawQuery(v.currentTarget.checked)}
          />
        </InlineField>
      </EditorHeader>
      <EditorRows>
        {(editorMode ?? defaultEditorMode) === 'code' && (
          <QueryEditor {...props} payload={convertPayloadToString(query.payload)} />
        )}
        {(editorMode ?? defaultEditorMode) === 'builder' && (
          <QueryBuilder {...props} payload={convertPayloadToObject(query.payload)} />
        )}
      </EditorRows>
      {showRawQuery && (
        <EditorFieldGroup>
          <EditorField label="Raw query" width={'100%'} style={{ width: '100%' }}>
            <AutoSizer disableHeight>
              {({ width }) => {
                return (
                  <div style={{ width: width + 'px' }}>
                    <CodeEditor
                      width="100%"
                      height="200px"
                      readOnly={true}
                      value={JSON.stringify(datasource.processTarget(query), undefined, 2)}
                      onBlur={() => {}}
                      language="json"
                    />
                  </div>
                );
              }}
            </AutoSizer>
          </EditorField>
        </EditorFieldGroup>
      )}
    </>
  );
};
