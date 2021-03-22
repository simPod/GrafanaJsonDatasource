import { DataSourcePlugin } from '@grafana/data';
import { ConfigEditor } from './Component/ConfigEditor';
import { QueryEditor } from './Component/QueryEditor';
import { DataSource } from './DataSource';
import { GenericOptions, GrafanaQuery } from './types';
import { VariableQueryEditor } from './VariableQueryEditor';

class GenericAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

export const plugin = new DataSourcePlugin<DataSource, GrafanaQuery, GenericOptions>(DataSource)
  .setAnnotationQueryCtrl(GenericAnnotationsQueryCtrl)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setVariableQueryEditor(VariableQueryEditor);
