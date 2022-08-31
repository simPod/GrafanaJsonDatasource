import { css, cx, CSSObject } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { MetricPayloadConfig } from 'types';
import React, { ComponentType } from 'react';
import { withTheme2 } from '@grafana/ui';

interface Props {
  config: MetricPayloadConfig;
  onValueChange: (value: string) => void;
  theme: GrafanaTheme2;
  value?: string
}

export function getFocusStyles(theme: GrafanaTheme2): CSSObject {
  return {
    outline: '2px dotted transparent',
    outlineOffset: '2px',
    boxShadow: `0 0 0 2px ${theme.colors.background.canvas}, 0 0 0px 4px ${theme.colors.primary.main}`,
    transitionTimingFunction: `cubic-bezier(0.19, 1, 0.22, 1)`,
    transitionDuration: '0.2s',
    transitionProperty: 'outline, outline-offset, box-shadow',
  };
}

const getStyles = (theme: GrafanaTheme2) => {
  const focusStyles = getFocusStyles(theme);
  return {
    wrapper: css`
      &:focus-within {
        ${focusStyles}
      }
    `,
  };
};

export const UnThemedTextArea: ComponentType<Props> = ({ theme, onValueChange, value:v }) => {
  const styles = getStyles(theme);
  const html = React.useRef<string>(v ? `<div>${v.replace(/([^\n])\n/g,'$1</div><div>').replace(/\n/g, '</div><div><br /></div><div>')}` : '</div>');
  return (
    <div className={cx('slate-query-field__wrapper', styles.wrapper)}>
      <div
        dangerouslySetInnerHTML={{__html: html.current}}
        contentEditable={true}
        style={{ width: '100%', outline: 'none' }}
        onBlur={(val) => {
          onValueChange(val.currentTarget.innerText.replace(/\n\n/g,"\n"));
        }}
        onInput={(v)=>{
          html.current = v.currentTarget.innerHTML
        }}
        />
    </div>
  );
};

export const QueryBuilderTextArea = withTheme2(UnThemedTextArea);
