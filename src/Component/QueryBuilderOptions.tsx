import { SelectableValue } from '@grafana/data';
import { Field, HorizontalGroup, InlineField, InlineSwitch } from '@grafana/ui';
import React, { useState } from 'react';

interface QueryBuilderOptionsProps {
    payload: { [key: string]: unknown };
    onChange: (
        name: string,
        reloadMetric?: boolean,
        v?: SelectableValue<string | number | boolean> | Array<SelectableValue<string | number | boolean>>
    ) => void;
}

const QueryBuilderOptions = (props: QueryBuilderOptionsProps) => {
    const [forwardFill, setForwardFill] = useState<boolean>(false);

    const changeForwardFill = (v: React.FormEvent<HTMLInputElement>) => {
        setForwardFill(v.currentTarget.checked);
        props.onChange('forward_fill', false, { value: v.currentTarget.checked });
    };

    return (
        <div style={{ marginTop: '18px' }}>
            <HorizontalGroup justify="flex-start" spacing="sm">
                <Field label="Options">
                    <InlineField label="Forward-Fill">
                        <InlineSwitch value={forwardFill} disabled={false} transparent={false} onChange={changeForwardFill} />
                    </InlineField>
                </Field>
            </HorizontalGroup>
        </div>
    );
};

export const AVAILABLE_OPTIONS = ['forward_fill'];

export default QueryBuilderOptions;
