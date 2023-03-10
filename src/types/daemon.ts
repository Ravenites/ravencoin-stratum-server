export type Daemon = {
  host: string;
  port: number;
  user: string;
  password: string;
};

export type Kawpowhash = {
  digest: string;
  result: string;
  mix_hash: string;
  meets_target: boolean;
};
