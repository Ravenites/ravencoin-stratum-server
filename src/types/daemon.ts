export type Daemon = {
  host: string;
  port: number;
  user: string;
  password: string;
};

export type Kawpowhash = {
  response: {
    digest: string;
    result: string;
    mix_hash: string;
    meets_target: boolean;
  };
};

export type CmdReturnObj = {
  error: any;
  response: any;
  instance: Daemon;
  data?: any;
};