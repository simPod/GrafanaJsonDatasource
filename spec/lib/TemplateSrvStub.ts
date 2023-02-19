import { ScopedVars, TimeRange } from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime/services/templateSrv';
import template from 'lodash/template';

export default class TemplateSrvStub implements TemplateSrv {
  containsTemplate(target?: string | undefined): boolean {
    throw new Error('Method not implemented.');
  }
  updateTimeRange(timeRange: TimeRange): void {
    throw new Error('Method not implemented.');
  }
  templateSettings = { interpolate: /\[\[([\s\S]+?)\]\]/g };
  data = {};
  adhocFilters = [];
  // tslint:disable-next-line:max-line-length
  // https://github.com/grafana/grafana/blob/c1c0daa13d5951e3e13d46ef9467d9d832993fe5/public/app/features/variables/utils.ts#L23
  regex = /\$(\w+)|\[\[(\w+?)(?::(\w+))?\]\]|\${(\w+)(?:\.([^:^\}]+))?(?::([^\}]+))?}/g;
  replace(target?: string, scopedVars?: ScopedVars, format?: string | Function): string {
    return template(target, this.templateSettings)(this.data);
  }

  getVariables() {
    return [];
  }

  getAdhocFilters(datasourceName: string) {
    return this.adhocFilters;
  }

  updateTemplateData() {}
}
