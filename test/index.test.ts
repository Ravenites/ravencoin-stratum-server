import { createPool } from '../src';
import { Pool } from '../src/pool';
import { data, authorizeFn } from './data';

describe('Default', () => {
  const pool = createPool(data, authorizeFn);

  it('should initialize the class', function() {
    expect(pool).toBeInstanceOf(Pool);
  });
});
