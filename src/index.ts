import { Pool } from './pool';
import { Config } from './types/pool';
import { AuthorizeFn } from './types/stratum';

require('./algo-properties');

export * from './daemon';
export * from './var-diff';

export * from './job-manager';

export function createPool(poolOptions: Config, authorizeFn: AuthorizeFn) {
  return new Pool(poolOptions, authorizeFn);
}
