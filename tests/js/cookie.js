module('cookie');

var cookieApiKey = 'fakeapikey';

test('clear existing cookie if necessary', function()
{
    var origApiKey = DM._apiKey;
    DM._apiKey = cookieApiKey;
    DM.Cookie.clear();
    ok(true, 'cookie cleared without errors');
    DM._apiKey = origApiKey;
});

test('load cookie that doesnt exist', function()
{
    var origApiKey = DM._apiKey;
    DM._apiKey = cookieApiKey;

    ok(!DM.Cookie.load(), 'should not get a cookie');

    DM._apiKey = origApiKey;
});

test('set a cookie, load and delete it', function()
{
    var origApiKey = DM._apiKey;
    DM._apiKey = cookieApiKey;

    DM.Cookie.set
    ({
        expires: ((+new Date()) + 10000) / 1000,
        base_domain: document.domain,
        answer: 42
    });
    ok(document.cookie.match('dms_' + cookieApiKey), 'found in document.cookie');
    ok(DM.Cookie.load().answer == 42, 'found the answer');
    DM.Cookie.clear();
    ok(!document.cookie.match('dms_' + cookieApiKey), 'not found in document.cookie');
    ok(!DM.Cookie.load(), 'no cookie loaded');

    DM._apiKey = origApiKey;
  }
);

test('set an expired cookie and load it', function()
{
    var origApiKey = DM._apiKey;
    DM._apiKey = cookieApiKey;

    DM.Cookie.set
    ({
        expires: ((+new Date()) - 10000) / 1000,
        base_domain: document.domain,
        answer: 42
    });
    ok(!document.cookie.match('dms_' + cookieApiKey), 'not found in document.cookie');
    ok(!DM.Cookie.load(), 'no cookie loaded');

    DM._apiKey = origApiKey;
});

test('set a malformed cookie value, load and delete it', function()
{
    var origApiKey = DM._apiKey;
    DM._apiKey = cookieApiKey;

    var malformedCookie = JSON.stringify({"SLT":"%'lV9Z","UID":""});
    DM.Cookie.set
    ({
        expires: ((+new Date()) + 10000) / 1000,
        base_domain: document.domain,
        answer: malformedCookie
    });
    ok(document.cookie.match('dms_' + cookieApiKey), 'found in document.cookie');
    ok(DM.Cookie.load().answer == malformedCookie, 'found the answer');
    DM.Cookie.clear();
    ok(!document.cookie.match('dms_' + cookieApiKey), 'not found in document.cookie');
    ok(!DM.Cookie.load(), 'no cookie loaded');

    DM._apiKey = origApiKey;
});
