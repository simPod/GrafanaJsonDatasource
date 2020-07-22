import { ScopedVars } from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime/services/templateSrv';
import template from 'lodash/template';

export default class TemplateSrvStub implements TemplateSrv {
  templateSettings = { interpolate: /\[\[([\s\S]+?)\]\]/g };
  data = {};
  // Original grafana source
  // tslint:disable-next-line:max-line-length
  // https://github.com/grafana/grafana/blob/e03d702d0c14b214a57ddd5094ff756e845cdd2b/public/app/features/templating/variable.ts#L11
  regex = /\$(\w+)|\[\[([\s\S]+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^\}]+))?(?::(\w+))?}/g;

  replace(target?: string, scopedVars?: ScopedVars, format?: string | Function): string {
    return template(target, this.templateSettings)(this.data);
  }

  getAdhocFilters() {
    return [];
  }

  getVariables() {
    return [];
  }

  variableExists() {
    return false;
  }

  highlightVariablesAsHtml(str) {
    return str;
  }

  setGrafanaVariable(name, value) {
    this.data[name] = value;
  }

  init() {
  }

  fillVariableValuesForUrl() {}

  updateTemplateData() {
  }
}
