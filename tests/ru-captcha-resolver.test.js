/* eslint-disable max-len */
import test from 'ava';
import nock from 'nock';
import RuCaptchaResolver from '../src/ru-captcha-resolver';
import _ from 'lodash';

let data = null;

test.before(() => {
  nock.disableNetConnect();

  data = {
    captchaText: 'hahaha',
    image: 'image',
    apiKey: '123123123',
  };
});

test('get response immediately', function* (t) {
  const apiKey = data.apiKey;
  const image = data.image;
  const requestId = '204';
  const captchaText = data.captchaText;

  nock('http://rucaptcha.com')
    .post('/in.php', _.chain({
      method: 'base64',
      key: apiKey,
      body: image,
      json: true,
    }).map((v, k) => `${k}=${v}`)
      .join('&')
      .value())
    .reply(200, JSON.stringify({
      status: 1,
      request: requestId,
    }));

  nock('http://rucaptcha.com')
    .get('/res.php')
    .query({
      action: 'get',
      key: apiKey,
      id: requestId,
      json: true,
    })
    .reply(200, JSON.stringify({
      status: 1,
      request: captchaText,
    }));

  t.is(yield new RuCaptchaResolver().resolve({ apiKey, image }), captchaText);
});

test('get response after waiting', function* (t) {
  const apiKey = data.apiKey;
  const image = data.image;
  const requestId = '203';
  const captchaText = data.captchaText;

  nock('http://rucaptcha.com')
    .post('/in.php', _.chain({
      method: 'base64',
      key: apiKey,
      body: image,
      json: true,
    }).map((v, k) => `${k}=${v}`)
      .join('&')
      .value())
    .reply(200, JSON.stringify({
      status: 1,
      request: requestId,
    }));

  let i = 0;
  nock('http://rucaptcha.com')
    .get('/res.php')
    .query({
      action: 'get',
      key: apiKey,
      id: requestId,
      json: true,
    })
    .times(5)
    .reply(200, () => {
      let response = {
        status: 0,
        request: 'CAPCHA_NOT_READY',
      };
      if (i === 4) {
        response = {
          status: 1,
          request: captchaText,
        };
      }
      i += 1;
      return JSON.stringify(response);
    });

  t.is(yield new RuCaptchaResolver().resolve({ apiKey, image }), captchaText);
});

test('never get response', function* (t) {
  const apiKey = data.apiKey;
  const image = data.image;
  const requestId = '202';

  nock('http://rucaptcha.com')
    .post('/in.php', _.chain({
      method: 'base64',
      key: apiKey,
      body: image,
      json: true,
    }).map((v, k) => `${k}=${v}`)
      .join('&')
      .value())
    .reply(200, JSON.stringify({
      status: 1,
      request: requestId,
    }));

  nock('http://rucaptcha.com')
    .get('/res.php')
    .query({
      action: 'get',
      key: apiKey,
      id: requestId,
      json: true,
    })
    .reply(200, JSON.stringify({
      status: 0,
      request: 'CUSTOM_CAPCHA_ERROR',
    }));

  try {
    yield new RuCaptchaResolver().resolve({ apiKey, image });
    t.fail();
  } catch (e) {
    t.is(e.constructor, Error);
    t.regex(e.message, /can't be resolved/);
  }
});
