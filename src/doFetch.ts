import { DataSource } from './DataSource';
import { BackendSrvRequest, getBackendSrv } from '@grafana/runtime';

export const doFetch = <T>(dataSource: DataSource, options: BackendSrvRequest) => {
  options.credentials = dataSource.withCredentials ? 'include' : 'same-origin';
  options.headers = dataSource.headers;

  return getBackendSrv().fetch<T>(options);
};
