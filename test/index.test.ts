import { createPool } from '../src';
import { Pool } from '../src/pool';
import data from './data';

describe('Default', () => {
  const pool = createPool(data, () => {});

  it('should initialize the class', function() {
    expect(pool).toBeInstanceOf(Pool);
  });
});
