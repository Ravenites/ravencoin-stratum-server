import { Algo } from './types';

export const diff1 = 0x00000000ff000000000000000000000000000000000000000000000000000000;

export const algos: Record<string, Algo> = {
  kawpow: {
    multiplier: 1,
    diff: parseInt(
      '0x00000000ff000000000000000000000000000000000000000000000000000000'
    ),
    hash: () => '',
  },
};

for (let algo in algos) {
  if (!algos[algo].multiplier) {
    algos[algo].multiplier = 1;
  }
}
