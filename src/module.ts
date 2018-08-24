import { GenericDatasource } from './datasource';
import { GenericDatasourceQueryCtrl } from './query_ctrl';

class GenericConfigCtrl {
  static templateUrl = 'partials/config.html';
}

class GenericQueryOptionsCtrl {
  static templateUrl = 'partials/query.options.html';
}

class GenericAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

export {
  GenericDatasource as Datasource,
  GenericDatasourceQueryCtrl as QueryCtrl,
  GenericConfigCtrl as ConfigCtrl,
  GenericQueryOptionsCtrl as QueryOptionsCtrl,
  GenericAnnotationsQueryCtrl as AnnotationsQueryCtrl,
};
