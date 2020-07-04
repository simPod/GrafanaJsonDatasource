import { Format } from './format';
import { GrafanaTarget } from './types';

export class QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  // Name must be `target` as of Grafana 7.0.5
  // This is a hack to bypass TS checks for magical field injection
  target: GrafanaTarget;
  panelCtrl: any;
  datasource: any;
  types: object[];
  showJSON: boolean;
  showRawMetricEditor = false;

  constructor() {
    // @ts-ignore
    this.target = this.target;

    if (this.target.type === undefined) {
      this.target.type = this.panelCtrl.panel.type === Format.Table ? Format.Table : Format.Timeseries;
    }
    this.target.data = this.target.data === undefined ? '' : this.target.data;

    this.types = [
      { text: 'Time series', value: Format.Timeseries },
      { text: 'Table', value: Format.Table },
    ];
    this.showJSON = false;
  }

  findMetrics(query: string) {
    return this.datasource.metricFindQuery(query, undefined, this.target.type);
  }

  toggleEditorMode() {
    this.showRawMetricEditor = !this.showRawMetricEditor;
  }

  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}
