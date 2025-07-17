import { VariableWithMultiSupport } from '@grafana/data';
import { isEqual } from 'lodash';

export const valueFromVariableWithMultiSupport = (variable: VariableWithMultiSupport) => {
  let variableValue = variable.current.value;
  if (variableValue === '$__all' || isEqual(variableValue, ['$__all'])) {
    if (variable.allValue === null || variable.allValue === '' || variable.allValue === undefined) {
      variableValue = variable.options.slice(1).map((variableOption) => {
        if (typeof variableOption.value !== 'string') {
          const error = new Error('Variable option value is not a string');
          console.error(error.message, variableOption, variable);

          throw error;
        }
        return variableOption.value;
      });
    } else {
      variableValue = variable.allValue;
    }
  }

  return variableValue;
};
