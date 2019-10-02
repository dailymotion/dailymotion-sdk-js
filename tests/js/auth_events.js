module('auth events');

test('verify subscriber gets notified on various events', function() {
  var expected = 5;

  var cb = function(response) {
    ok(true, 'subscriber got called');
    expected -= 1;
    if (expected < 0) {
      throw new Exception('got more auth events than expected');
    }
  };
  DM.Event.subscribe('auth.sessionChange', cb);

  action.innerHTML = 'Accept the connection';
  action.onclick = function() {
    // 1
    DM.login(function() {
      // 2
      DM.api('logout', function(response) {
        // 3
        action.innerHTML = 'Accept the connection again';
        action.onclick = function() {
          DM.login(function() {
            // 4
            DM.logout(function() {
              // 5
              action.innerHTML = 'Accept the connection one more time';
              action.onclick = function() {
                DM.login(
                  function() {
                    action.innerHTML = 'Accept the connection one last time';
                    action.onclick = function() {
                      // should not trigger subscriber
                      DM.login(
                        function() {
                          // 6
                          ok(expected == 0, 'got all expected callbacks');

                          // unsubscribe once we're done
                          DM.Event.unsubscribe('auth.sessionChange', cb);
                          action.innerHTML = '';
                          start();
                        },
                        { scope: 'write' }
                      );
                    };
                  },
                  { scope: 'read' }
                );
              };
            });
          });
        };
      });
    });
  };
  action.className = 'session-subscribers';

  expect(expected + 1);
  stop();
});

test('verify status event only gets fired once per change', function() {
  var expected = 2;
  expect(expected);
  stop();

  var oldSession = DM._session;
  var oldStatus = DM._userStatus;

  DM.Auth.setSession(EXPIRED_SESSION, 'connected');
  var cb = function(response) {
    ok(true, 'subscriber got called');
    expected -= 1;

    if (expected == 0) {
      // reset back
      DM._session = oldSession;
      DM._userStatus = oldStatus;
      start();
    }
  };
  DM.Event.subscribe('auth.statusChange', cb);
  DM.Auth.setSession(null, 'notConnected');
  DM.Auth.setSession(null, 'notConnected');
  DM.Auth.setSession(null, 'unknown');
});
