///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import isUndefined from 'lodash/isUndefined';

export class GenericDatasource {

  name: string;
  url: string;
  q: any;
  backendSrv: any;
  templateSrv: any;
  withCredentials: boolean;
  headers: any;

  /** @ngInject **/
  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.name = instanceSettings.name;
    this.url = instanceSettings.url;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.headers = { 'Content-Type': 'application/json' };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  query(options) {
    const query = options;
    query.targets = this.buildQueryTargets(options);

    if (query.targets.length <= 0) {
      return this.q.when({ data: [] });
    }

    if (this.templateSrv.getAdhocFilters) {
      query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    } else {
      query.adhocFilters = [];
    }

    options.scopedVars = { ...this.getVariables(), ...options.scopedVars };

    return this.doRequest({
      url: `${this.url}/query`,
      data: query,
      method: 'POST',
    });
  }

  testDatasource() {
    return this.doRequest({
      url: `${this.url}/`,
      method: 'GET',
    }).then((response) => {
      if (response.status === 200) {
        return { status: 'success', message: 'Data source is working', title: 'Success' };
      }

      return {
        status: 'error',
        message: `Data source is not working: ${response.message}`,
        title: 'Error',
      };
    });
  }

  annotationQuery(options) {
    const query = this.templateSrv.replace(options.annotation.query, {}, 'glob');

    const annotationQuery = {
      annotation: {
        query,
        name: options.annotation.name,
        datasource: options.annotation.datasource,
        enable: options.annotation.enable,
        iconColor: options.annotation.iconColor,
      },
      range: options.range,
      rangeRaw: options.rangeRaw,
      variables: this.getVariables(),
    };

    return this.doRequest({
      url: `${this.url}/annotations`,
      method: 'POST',
      data: annotationQuery,
    }).then((result) => {
      return result.data;
    });
  }

  findMetricsQuery(query: string, type: string) {
    const interpolated = {
      type,
      target: this.templateSrv.replace(query, null, 'regex'),
    };

    return this.doRequest({
      url: `${this.url}/search`,
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  mapToTextValue(result) {
    return result.data.map((d, i) => {
      if (d && d.text && d.value) {
        return { text: d.text, value: d.value };
      }

      if (isObject(d)) {
        return { text: d, value: i };
      }
      return { text: d, value: d };
    });
  }

  doRequest(options) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;

    return this.backendSrv.datasourceRequest(options);
  }

  buildQueryTargets(options) {
    return options.targets
      .filter((target) => {
        // remove placeholder targets
        return target.target !== 'select metric';
      })
      .map((target) => {
      	let data = null;

      	if (!isUndefined(target.data) && target.data.trim() !== '') {
      		data = JSON.parse(target.data, (key, value) => {
				if (typeof value === "string") {
					return value.replace(
						this.templateSrv.regex,
						match => this.cleanMatch(match, options)
					)
				}

				return value;
			});
	  	}

        let targetValue = target.target;
        if (typeof targetValue === 'string') {
          targetValue = this.templateSrv.replace(
            target.target.toString(),
            options.scopedVars,
            'regex',
          );
        }

        return {
          data,
          target: targetValue,
          refId: target.refId,
          hide: target.hide,
          type: target.type,
        };
      });
  }

  cleanMatch(match, options) {
    const replacedMatch = this.templateSrv.replace(match, options.scopedVars, 'json');
    if (
    	typeof replacedMatch === 'string' &&
		replacedMatch[0] === '"' && replacedMatch[replacedMatch.length - 1] == '"'
	) {
		return JSON.parse(replacedMatch);
    }
    return replacedMatch;
  }

  getVariables() {
    const index = isUndefined(this.templateSrv.index) ? {} : this.templateSrv.index;
    const variables = {};
    Object.keys(index).forEach((key) => {
      const variable = index[key];

      let variableValue = variable.current.value;
      if (variableValue === '$__all' || isEqual(variableValue, ['$__all'])) {
        if (variable.allValue === null) {
          variableValue = variable.options.slice(1).map(textValuePair => textValuePair.value);
        } else {
          variableValue = variable.allValue;
        }
      }

      variables[key] = {
        text: variable.current.text,
        value: variableValue,
      };
    });

    return variables;
  }

  getTagKeys(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: `${this.url}/tag-keys`,
        method: 'POST',
        data: options,
      }).then((result) => {
        return resolve(result.data);
      });
    });
  }

  getTagValues(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: `${this.url}/tag-values`,
        method: 'POST',
        data: options,
      }).then((result) => {
        return resolve(result.data);
      });
    });
  }

}
