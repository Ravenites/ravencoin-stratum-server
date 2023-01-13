# Ravencoin Stratum Server

[![NPM Package](https://img.shields.io/npm/v/@ravenite/ravencoin-stratum-server.svg?style=flat-square)](https://www.npmjs.org/package/@ravenite/ravencoin-stratum-server)

Stratum Conversion to TypeScript from Ravencoin Stratum Server.

## Getting Started

```sh
# Using npm
npm install @ravenite/ravencoin-stratum-server

# Using yarn
yarn add @ravenite/ravencoin-stratum-server
```

## Usage

```javascript
import { createPool } from '@ravenite/ravencoin-stratum-server'

const options = {...}

function authorizeFn() {...}

const pool = new createPool(options, authorizeFn)

pool.start()
```

## Authorize Function Example

```javascript
function authorizeFn(
  ip,
  port,
  workerName,
  password,
  extraNonce1,
  version,
  callback
) {
  // Your Auth Handler
  handlers.auth(port, workerName, password, function (authorized) {
    var authString = authorized ? 'Authorized' : 'Unauthorized ';
    logger.debug(
      'AUTH>TRUE> authstr [%s] worker [%s] passwd [%s] ip [%s]',
      authString,
      workerName,
      password,
      functions.anonymizeIP(ip)
    );
    // Callback to Stratum Server
    callback({
      error: null,
      authorized: authorized,
      disconnect: false,
    });
  });
}
```

## Options

```json
{
  "address": "xxxxxx",
  "blockRefreshInterval": 400,
  "coin": {
    "algorithm": "kawpow",
    "name": "ravencoin",
    "reward": "POS",
    "symbol": "RVN"
  },
  "connectionTimeout": 600,
  "daemons": [
    {
      "host": "127.0.0.1",
      "port": 8766,
      "user": "user1",
      "password": "pass1"
    }
  ],
  "feePercent": 0,
  "initStats": {
    "updateInterval": 900,
    "historicalRetention": 43200,
    "hashrateWindow": 900
  },
  "jobRebroadcastTimeout": 25,
  "p2p": {
    "enabled": false,
    "host": "127.0.0.1",
    "port": 8767,
    "disableTransactions": true
  },
  "ports": {
    "10008": {
      "diff": 0.05,
      "varDiff": {
        "minDiff": 0.025,
        "maxDiff": 1024,
        "targetTime": 10,
        "retargetTime": 60,
        "variancePercent": 30,
        "maxJump": 25
      }
    },
    "10016": {
      "diff": 0.1,
      "varDiff": {
        "minDiff": 0.05,
        "maxDiff": 1024,
        "targetTime": 10,
        "retargetTime": 60,
        "variancePercent": 30,
        "maxJump": 25
      }
    },
    "10032": {
      "diff": 0.2,
      "varDiff": {
        "minDiff": 0.1,
        "maxDiff": 1024,
        "targetTime": 10,
        "retargetTime": 60,
        "variancePercent": 30,
        "maxJump": 50
      }
    },
    "10256": {
      "diff": 1024000000,
      "varDiff": {
        "minDiff": 1024000000,
        "maxDiff": 20480000000,
        "targetTime": 10,
        "retargetTime": 60,
        "variancePercent": 30,
        "maxJump": 25
      }
    }
  },
  "rewardRecipients": {
    "xxxxxx": 0.5
  },
  "tcpProxyProtocol": false,
  "testnet": true
}
```

| Property              | Type                                         |
| --------------------- | -------------------------------------------- |
| address               | string                                       |
| api                   | any (optional)                               |
| banning               | Banning (optional)                           |
| blockRefreshInterval  | number                                       |
| coin                  | Coin                                         |
| connectionTimeout     | number                                       |
| daemons               | Daemon[]                                     |
| feePercent            | number                                       |
| jobRebroadcastTimeout | number                                       |
| kawpow_validator      | string (optional)                            |
| kawpow_wrapper_host   | string (optional)                            |
| kawpow_wrapper_port   | number (optional)                            |
| p2p                   | P2p                                          |
| poolAddressScript     | any                                          |
| ports                 | Record<string, Port>                         |
| rewardRecipients      | Record<string, number> // address:percentage |
| tcpProxyProtocol      | boolean                                      |
| testnet               | boolean (optional)                           |

### Port

| Property | Type          |
| -------- | ------------- |
| diff     | number        |
| tls      | tls.TLSSocket |
| varDiff  | object        |

#### varDiff

| Property        | Type   |
| --------------- | ------ |
| maxDiff         | number |
| maxJump         | number |
| minDiff         | number |
| retargetTime    | number |
| targetTime      | number |
| variancePercent | number |

### Coin

| Property         | Type                | Value       |
| ---------------- | ------------------- | ----------- |
| algorithm        | string // kawpow    | kawpow      |
| name             | string // ravencoin | ravencoin   |
| peerMagic        | string (optional)   |             |
| peerMagicTestnet | string (optional)   |             |
| reward           | string              | 'POS' 'POW' |
| symbol           | string              | RVN         |

### P2p

| Property            | Type               |
| ------------------- | ------------------ |
| enabled             | boolean (optional) |
| host                | string             |
| port                | number             |
| disableTransactions | boolean (optional) |

### Daemon

| Property | Type   |
| -------- | ------ |
| host     | string |
| port     | number |
| user     | string |
| password | string |

## License

Code released under the GPL-3.0 license.
