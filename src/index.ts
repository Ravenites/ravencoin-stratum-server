import { Pool } from './pool';
import { AuthorizeFn, Config } from './types';

export * from './algo-properties';
export * from './block-template';
export * from './daemon';
export * from './job-counter';
export * from './job-manager';
export * from './merkle-tree';
export * from './nonce';
export * from './peer';
export * from './pool';
export * from './stratum';
export * from './transactions';
export * from './types';
export * from './utils';
export * from './var-diff';

export function createPool(poolOptions: Config, authorizeFn: AuthorizeFn) {
  return new Pool(poolOptions, authorizeFn);
}
