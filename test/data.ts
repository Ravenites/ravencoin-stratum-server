const data = {
  address: 'xxxxxx',
  blockRefreshInterval: 400,
  coin: {
    algorithm: 'kawpow',
    name: 'ravencoin',
    reward: 'POS',
    symbol: 'RVN',
  },
  connectionTimeout: 600,
  daemons: [
    {
      host: '127.0.0.1',
      port: 8766,
      user: 'user1',
      password: 'pass1',
    },
  ],
  feePercent: 0,
  initStats: {
    updateInterval: 900,
    historicalRetention: 43200,
    hashrateWindow: 900,
  },
  jobRebroadcastTimeout: 25,
  p2p: {
    enabled: false,
    host: '127.0.0.1',
    port: 8767,
    disableTransactions: true,
  },
  ports: {
    '10008': {
      diff: 0.05,
      varDiff: {
        maxDiff: 1024,
        maxJump: 25,
        minDiff: 0.025,
        retargetTime: 60,
        targetTime: 10,
        variancePercent: 30,
      },
    },
    '10016': {
      diff: 0.1,
      varDiff: {
        maxDiff: 1024,
        maxJump: 25,
        minDiff: 0.05,
        retargetTime: 60,
        targetTime: 10,
        variancePercent: 30,
      },
    },
    '10032': {
      diff: 0.2,
      varDiff: {
        maxDiff: 1024,
        maxJump: 50,
        minDiff: 0.1,
        retargetTime: 60,
        targetTime: 10,
        variancePercent: 30,
      },
    },
    '10256': {
      diff: 1024000000,
      varDiff: {
        maxDiff: 20480000000,
        maxJump: 25,
        minDiff: 1024000000,
        retargetTime: 60,
        targetTime: 10,
        variancePercent: 30,
      },
    },
  },
  rewardRecipients: {
    xxxxxx: 0.5,
  },
  tcpProxyProtocol: false,
  testnet: true,
};

export default data;
