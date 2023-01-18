import tls from 'tls';
import { StratumClient } from '../stratum';
import { Daemon } from './';
import { Banning } from './stratum';

export type Config = {
  address: string;
  api?: any;
  banning?: Banning;
  blockRefreshInterval: number;
  coin: Coin;
  connectionTimeout: number;
  daemons: Daemon[];
  feePercent: number;
  jobRebroadcastTimeout: number;
  kawpow_validator?: string;
  kawpow_wrapper_host?: string;
  kawpow_wrapper_port?: number;
  p2p: P2p;
  ports: Record<string, Port>;
  rewardRecipients: Record<string, number>; // address: percentage
  tcpProxyProtocol: boolean;
  testnet?: boolean;
};

export type Port = {
  diff: number;
  tls?: tls.TLSSocket;
  varDiff: {
    maxDiff: number;
    maxJump: number;
    minDiff: number;
    retargetTime: number;
    targetTime: number;
    variancePercent: number;
  };
};

export type Coin = {
  algorithm: string; // kawpow
  name: string; // ravencoin
  peerMagic?: string;
  peerMagicTestnet?: string;
  reward: string; // 'POS' | 'POW'
  symbol: string; // RVN
};

export type Recipient = {
  address: string;
  percent: number;
};

type InitStats = {
  connections: number;
  difficulty: number;
  networkHashRate: number;
  stratumPorts?: number[];
};

type P2p = {
  enabled?: boolean;
  host: string;
  port: number;
  disableTransactions?: boolean;
};

export interface PoolOptions extends Config {
  initStats: InitStats;
  hasSubmitMethod: boolean;
  poolAddressScript: any;
  protocolVersion: number;
  recipients: Recipient[];
}

export type RelinquishMinersStratumClient = {
  subId: string;
  client: StratumClient;
};
