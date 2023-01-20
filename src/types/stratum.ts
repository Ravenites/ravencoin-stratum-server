export type AuthorizeFn = (
  remoteAddress: string | undefined, // ip address
  localPort: number | undefined,
  address: string, // workerName xxxxxxxxx.x
  worderPassword: string,
  extraNonce1: string | null,
  version: number | string | null,
  cb: AuthorizeFnCallback
) => void;

type AuthorizeFnCallback = (
  error: any,
  authorized: boolean,
  disconnect: boolean
) => void;

export type Banning = {
  checkThreshold: number;
  enabled: boolean;
  invalidPercent: number;
  purgeInterval: number;
  time: number;
};

export type JobParams = [
  number | string, // jobId
  string, // header_hash
  string, // seedhash
  string, // target
  boolean,
  number, // rpcData heigth
  number | string // rpcData bits
];

export type ClientHandleSubmit = {
  id: number;
  method: string;
  params: string[];
};
