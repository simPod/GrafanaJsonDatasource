import { Datasource } from './datasource';
import { QueryCtrl } from './query_ctrl';

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
  Datasource,
  QueryCtrl,
  GenericConfigCtrl as ConfigCtrl,
  GenericQueryOptionsCtrl as QueryOptionsCtrl,
  GenericAnnotationsQueryCtrl as AnnotationsQueryCtrl,
};
