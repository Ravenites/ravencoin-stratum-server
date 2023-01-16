import { Pool } from './pool';
import { AuthorizeFn, Config } from './types';

export * from './daemon';
export * from './types';
export * from './var-diff';

export function createPool(poolOptions: Config, authorizeFn: AuthorizeFn) {
  return new Pool(poolOptions, authorizeFn);
}
