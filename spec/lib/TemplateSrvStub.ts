import { ScopedVars, TimeRange, TypedVariableModel, AdHocVariableFilter } from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime';

export default class TemplateSrvStub implements TemplateSrv {
  containsTemplate(target?: string | undefined): boolean {
    throw new Error('Method not implemented.');
  }

  updateTimeRange(timeRange: TimeRange): void {
    throw new Error('Method not implemented.');
  }

  templateSettings = { interpolate: /\[\[([\s\S]+?)\]\]/g };
  data = {};
  variables: TypedVariableModel[] | [] = [];
  // tslint:disable-next-line:max-line-length
  // https://github.com/grafana/grafana/blob/ab5a3820d5fff4f0f042024b0aee0632e6a4ca08/public/app/features/variables/utils.ts#L24
  /*
   * This regex matches 3 types of variable reference with an optional format specifier
   * There are 6 capture groups that replace will return
   * \$(\w+)                                    $var1
   * \[\[(\w+?)(?::(\w+))?\]\]                  [[var2]] or [[var2:fmt2]]
   * \${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}   ${var3} or ${var3.fieldPath} or ${var3:fmt3} (or ${var3.fieldPath:fmt3} but that is not a separate capture group)
   */
  regex = /\$(\w+)|\[\[(\w+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/g;

  // from: https://github.com/grafana/grafana/blob/ab5a3820d5fff4f0f042024b0aee0632e6a4ca08/public/app/features/templating/template_srv.mock.ts#L30
  // Adjusted for use of scoped variables, and ad hoc filters.
  replace(target?: string, scopedVars?: ScopedVars): string {
    if (target === undefined) {
      return target ?? '';
    }
    this.regex.lastIndex = 0;

    return target.replace(this.regex, (match, var1, var2, fmt2, var3, fieldPath, fmt3) => {
      const variableName = var1 || var2 || var3;
      const variable: TypedVariableModel | undefined = this.variables.find(
        (variable: TypedVariableModel) => variable.name === variableName,
        {}
      );
      if (variable === undefined) {
        return 'unknown variable';
      }
      // AdHoc filters or other variable.
      let value =
        'filters' in variable
          ? variable.filters.map((filter: AdHocVariableFilter) => filter.value)
          : variable.current.value;

      const scopedVar = scopedVars?.[variable.name];
      if (scopedVar !== undefined) {
        value = scopedVar.value;
      }

      return value;
    });
  }

  getVariables(): TypedVariableModel[] {
    return this.variables;
  }
}
