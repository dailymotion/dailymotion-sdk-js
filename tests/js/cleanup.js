module('cleanup');

test('revoke authorization', function() {
  DM.api('/logout', function(response) {
    ok(!DM.getSession(), 'should not get a session');
    start();
  });

  expect(1);
  stop();
});
