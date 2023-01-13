export type Algo = {
  multiplier: number;
  diff: number;
  hash: (coin: any) => string;
};
