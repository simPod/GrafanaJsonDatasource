export class GenericDatasourceQueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  target: any;
  panelCtrl: any;
  datasource: any;
  types: object[];
  showJSON: boolean;

  constructor() {
    this.target.hide = false;
    this.target.target = this.target.target || 'select metric';
    if (!this.target.type) {
      this.target.type = this.panelCtrl.panel.type === 'table' ? 'table' : 'timeseries';
    }
    this.target.data = this.target.data || '';

    this.types = [
      { text: 'Time series', value: 'timeseries' },
      { text: 'Table', value: 'table' },
    ];
    this.showJSON = false;
  }

  findMetrics(query: string) {
    return this.datasource.metricFindQuery(query, undefined, this.target.type);
  }

  // not used
  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}
