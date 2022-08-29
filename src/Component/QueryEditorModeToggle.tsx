import { RadioButtonGroup, Tag } from '@grafana/ui';
import { css } from '@emotion/css';
import React from 'react';

import { SelectableValue } from '@grafana/data';
import { QueryEditorMode } from 'types';
import { RadioButtonGroupProps } from '@grafana/ui/components/Forms/RadioButtonGroup/RadioButtonGroup';

export interface QueryEditorModeToggleProps extends Omit<RadioButtonGroupProps<QueryEditorMode>,"options"> {
  mode?: QueryEditorMode;
}

const editorModes: Array<SelectableValue<QueryEditorMode>> = [
  {
    label: 'Builder',
    value: 'builder',
    component: () => (
      <Tag
        className={css({
          fontSize: 10,
          padding: '1px 5px',
          verticalAlign: 'text-bottom',
        })}
        name={'Beta'}
        colorIndex={1}
      />
    ),
  },
  { label: 'Code', value: 'code' },
];

export function QueryEditorModeToggle({ mode, ...props }: QueryEditorModeToggleProps) {
  return (
    <div data-testid={'QueryEditorModeToggle'}>
      <RadioButtonGroup size="sm" {...props} options={editorModes} value={mode} />
    </div>
  );
}
