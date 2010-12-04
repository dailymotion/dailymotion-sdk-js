module('auth');

test('should start with no session', function()
{
    DM.getLoginStatus(function(response)
    {
        ok(!response.session, 'should not get a session');
        action.innerHTML = '';
        action.className = '';
        start();
    });

    expect(1);
    stop();
});

test('cancel login using cancel button', function()
{
    expect(1);
    stop();

    action.onclick = function()
    {
        DM.login(function(response)
        {
            ok(!response.session, 'should not get a session');
            action.innerHTML = '';
            action.className = '';
            start();
        });
    };
    action.innerHTML = 'Click the Cancel Button on the Login Popup';
    action.className = 'login-cancel-button';
});

test('cancel login by closing the popup window', function()
{
    expect(1);
    stop();

    action.onclick = function()
    {
        DM.login(function(response)
        {
            ok(!response.session, 'should not get a session');
            action.innerHTML = '';
            action.className = '';
            start();
        });
    };
    action.innerHTML = 'Close the Login Popup Window using the OS Chrome';
    action.className = 'login-close-window';
});

test('login with the "Accept" button', function()
{
    expect(2);
    stop();

    action.onclick = function()
    {
        DM.login(function(response)
        {
            ok(response.session, 'should get a session');
            equals(response.status, 'connected', 'should be connected');
            action.innerHTML = '';
            action.className = '';
            start();
        });
    };
    action.innerHTML = 'Login with the "Connect" button';
    action.className = 'login-with-connect-button';
});

test('status should now return a session', function()
{
    expect(2);
    stop();

    DM.getLoginStatus(function(response)
    {
        ok(response.session, 'should get a session');
        equals(response.status, 'connected', 'should be connected');
        start();
    });
});