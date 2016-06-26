'use strict';

const request = require('co-request');
const uri = require('urijs');
const debug = require('debug')('ru-captcha-resolver');
const sleep = require('co-sleep');

class RuCaptchaResolver {
  constructor(options) {
    this.apiKey = options.apiKey;
  }

  * resolve(options) {
    const apiKey = this.apiKey;
    const image = options.image;

    return yield* this.registerCaptcha(apiKey, image);
  }

  * registerCaptcha(apiKey, captchaInBase64) {
    const url = 'http://rucaptcha.com/in.php';
    const targetURL = uri(url);

    const data = {
      method: 'base64',
      key: apiKey,
      body: captchaInBase64,
      json: true,
    };

    const result = yield request({
      url: targetURL.toString(),
      form: data,
      method: 'POST',
    });

    const body = result.body;

    if (result.statusCode >= 400) {
      debug(`Captcha service not available. Code ${result.statusCode}`);
      throw new Error('Captcha service not available');
    }

    const response = JSON.parse(body);
    if (response.status === 1) {
      const captchaId = response.request;
      return yield* this.getResult(apiKey, captchaId);
    } else {
      throw new Error(`Error from service: ${JSON.stringify(response)}`);
    }
  }

  * getResult(apiKey, captchaId) {
    const url = 'http://rucaptcha.com/res.php';
    const targetURL = uri(url);

    const data = {
      action: 'get',
      key: apiKey,
      id: captchaId,
      json: true,
    };

    const result = yield request({
      url: targetURL.toString(),
      qs: data,
    });

    const res = result;
    const body = result.body;

    if (res.statusCode >= 400) {
      debug(`Captcha service not available. Code ${res.statusCode}`);
      throw new Error('Captcha service not available');
    }

    const response = JSON.parse(body);
    if (response.status === 1) {
      return response.request;
    }

    debug(`Captcha status ${response.request}`);
    if (response.request === 'CAPCHA_NOT_READY') {
      yield sleep(5000);
      return yield* this.getResult(apiKey, captchaId);
    }

    debug('Captcha can\'t be resolved');
    throw new Error("captcha can't be resolved");
  }
}

module.exports = RuCaptchaResolver;
