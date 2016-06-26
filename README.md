[![CircleCI](https://circleci.com/gh/Cr1stal/rucaptcha-resolver.svg?style=svg)](https://circleci.com/gh/Cr1stal/rucaptcha-resolver)
RuCaptcha Resolver
=========

RuCaptcha Resolver is a simple library for cracking captcha through [rucaptcha](https://rucaptcha.com/?from=1330825) service.

### To install

    npm install rucaptcha-resolver

### To run the ava tests

    npm test

### Node versions

RuCaptcha Resolver is intended to be run on NodeJS 4.x or higher.

### API

```js
'use strict';

const request = require('co-request').defaults({ encoding: null });
const vo = require('vo');
const RuCaptchaResolver = require('rucaptcha-resolver').RuCaptchaResolver;

vo(function* () {
  const solver = new RuCaptchaResolver({ apiKey: 'YOUR_API_KEY' });

  try {
    const response = yield request.get('https://upload.wikimedia.org/wikipedia/commons/6/69/Captcha.jpg');
    const body = response.body;
    // Image should be in base64 encoding
    const image = new Buffer(body).toString('base64');

    const result = yield* solver.resolve({ image });
    console.log(`Captcha Text: ${result}`);
  } catch (e) {
    console.log(e);
  }
})();
```
