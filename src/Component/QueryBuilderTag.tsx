import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { getTagColorsFromName, IconButton, useStyles2 } from '@grafana/ui';
import React, { ComponentType } from 'react';
import { match } from 'ts-pattern';

interface QueryBuilderTagProps {
  name: string;
  value: unknown;
  onRemove: (name: string) => void;
}

const getStylesForName = (name: string) => (theme: GrafanaTheme2) => {
  const { color, borderColor } = getTagColorsFromName(name);

  return {
    itemStyle: css({
      display: 'flex',
      alignItems: 'center',
      height: theme.spacing(3),
      backgroundColor: color,
      color: theme.colors.text.maxContrast,
      border: `1px solid ${borderColor}`,
      borderRadius: 3,
      padding: `0 ${theme.spacing(0.5)}`,
      marginRight: 3,
      whiteSpace: 'nowrap',
      textShadow: 'none',
      fontWeight: 500,
      fontSize: theme.typography.bodySmall.fontSize,
    }),

    nameStyle: css({
      marginRight: 3,
    }),

    buttonStyles: css({
      margin: 0,
      '&:hover::before': {
        display: 'none',
      },
    }),
  };
};

export const QueryBuilderTag: ComponentType<QueryBuilderTagProps> = ({ name, value, onRemove }) => {
  const styles = useStyles2(getStylesForName(name));

  const formattedValue: React.ReactNode = match(typeof value)
    .with('string', () => `"${value}"`)
    .with('number', () => value as number)
    .with('boolean', () => (value as boolean).toString())
    .with('object', () => (value === null ? 'null' : `"${JSON.stringify(value)}"`))
    .otherwise(() => `"${JSON.stringify(value)}"`);

  return (
    <div className={styles.itemStyle}>
      <span className={styles.nameStyle}>
        {name}={formattedValue}
      </span>
      <IconButton
        name="times"
        size="lg"
        aria-label={`Remove ${name}`}
        onClick={() => onRemove(name)}
        type="button"
        className={styles.buttonStyles}
      />
    </div>
  );
};
