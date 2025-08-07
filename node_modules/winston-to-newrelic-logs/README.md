# winston-to-newrelic-logs 
[![Build Status](https://secure.travis-ci.org/namshi/newrelic-winston.png)](http://travis-ci.org/namshi/newrelic-winston)

A [newrelic][0] transport for [winston][1] that sends logs to New Relic's Log Product

## Installation

Tested on node-6.x, requires npm.

``` sh
  $ npm install winston --save
  $ npm install winston-to-newrelic-logs --save
```

## Usage
```javascript
const winston = require('winston');
const NRLogsWinston = require('winston-to-newrelic-logs');
const logger = winston.createLogger({
    transports: [
      new NewrelicWinston({ 
        licenseKey: process.env.NR_LICENCE, 
        apiUrl: 'https://log-api.newrelic.com' 
      }),
    ]
});

logger.log({
    level: 'info',
    message: 'Message'
  });

```


**All other possible winston's levels, or custom levels, will noop**

[0]: http://newrelic.com/
[1]: https://github.com/flatiron/winston
