module('qs');

test('query string encoding', function() {
  ok(DM.QS.encode({}) == '', 'empty object should give back empty string');
  ok(DM.QS.encode({ a: 1 }) == 'a=1', 'single key value');
  ok(DM.QS.encode({ a: 1, b: 2 }) == 'a=1&b=2', 'multiple key value');
  ok(DM.QS.encode({ b: 2, a: 1 }) == 'a=1&b=2', 'sorted multiple key value');
});

test('query string encoding with custom separator', function() {
  ok(DM.QS.encode({}, ';') == '', 'empty object should give back empty string');
  ok(DM.QS.encode({ a: 1 }, ';') == 'a=1', 'single key value');
  ok(DM.QS.encode({ a: 1, b: 2 }, ';') == 'a=1;b=2', 'multiple key value');
  ok(DM.QS.encode({ b: 2, a: 1 }, ';') == 'a=1;b=2', 'sorted multiple key value');
});

test('query string explicit encoding control', function() {
  var params = { 'a b c': 'd e f' };
  ok(DM.QS.encode(params) == 'a%20b%20c=d%20e%20f', 'encoded query string');
  ok(DM.QS.encode(params, '&', false) == 'a b c=d e f', 'unencoded query string');
});

test('decoding single named value', function() {
  var expected = JSON.stringify({ a: '1' });
  var actual = JSON.stringify(DM.QS.decode('a=1'));
  ok(actual === expected);
});

test('decoding multiple named value', function() {
  var expected = JSON.stringify({ a: '1', b: '2' });
  var actual = JSON.stringify(DM.QS.decode('a=1&b=2'));
  ok(actual === expected);
});

test('decoding nested named value', function() {
  // 'depth1a[depth2][depth3a]=value1&depth1a[depth2][depth3b]=value2[foo]&bar&depth1b[depth2]=value3&depth1c=value4'
  var nested =
    'depth1a%5Bdepth2%5D%5Bdepth3a%5D=value1&depth1a%5Bdepth2%5D%5Bdepth3b%5D=value2%5Bfoo%5D%26bar&depth1b%5Bdepth2%5D=value3&depth1c=value4';
  var expected = JSON.stringify({
    depth1a: { depth2: { depth3a: 'value1', depth3b: 'value2[foo]&bar' } },
    depth1b: { depth2: 'value3' },
    depth1c: 'value4',
  });
  var actual = JSON.stringify(DM.QS.decode(nested));
  ok(actual === expected);
});

test('decoding named value with spaces in name and value', function() {
  // a b c=d e f
  var encoded = 'a%20b%20c=d%20e%20f';
  var expected = JSON.stringify({ 'a b c': 'd e f' });
  var actual = JSON.stringify(DM.QS.decode(encoded));
  ok(actual === expected);
});

test('decoding array encoded with empty bracket', function() {
  // 'qualities[]=720&qualities[]=480'
  var emptyBracket = 'qualities%5B%5D=720&qualities%5B%5D=480';
  var expected = JSON.stringify({ qualities: ['720', '480'] });
  var actual = JSON.stringify(DM.QS.decode(emptyBracket));
  ok(actual === expected);
});

test('decoding empty array encoded with empty bracket', function() {
  // 'qualities[]='
  var emptyBracketAndEmptyValue = 'qualities%5B%5D=';
  var expected = JSON.stringify({ qualities: [''] });
  var actual = JSON.stringify(DM.QS.decode(emptyBracketAndEmptyValue));
  ok(actual === expected);
});

test('decoding nested array encoded with empty bracket ', function() {
  // 'object[user][]=0&object[user][]=1'
  var nestedAndEmptyBracket = 'object%5Buser%5D%5B%5D=a&object%5Buser%5D%5B%5D=b';
  var expected = JSON.stringify({ object: { user: ['a', 'b'] } });
  var actual = JSON.stringify(DM.QS.decode(nestedAndEmptyBracket));
  ok(actual === expected);
});

test('query string empty value bug', function() {
  var empty = DM.QS.decode('');
  ok(!('' in empty), 'should not find empty value');
});

test('query string lone = value bug', function() {
  var empty = DM.QS.decode('=');
  ok(!('' in empty), 'should not find empty value');
});
