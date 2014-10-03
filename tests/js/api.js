module('api');

test('API calls "fields" should be string or array', function()
{
    DM.api('/playlists', { limit: 3, fields: 'id,uri,name,videos_total' });
    ok(true, 'Allow call with fields as string');
    DM.api('/playlists', { limit: 3, fields: ['id','uri','name','videos_total']});
    ok(true, 'Allow call with fields as array');

    var  testMessage;

    testMessage = 'Disallow call with fields as object';
    try
    {
        DM.api('/playlists', { limit: 3, fields: {}});
        ok(false, testMessage);
    }
    catch(e)
    {
        ok(true, testMessage);
    }

    testMessage = 'Allow call without fields';
    try
    {
        DM.api('/playlists');
        ok(true, testMessage);
    }
    catch(e)
    {
        ok(false, testMessage);
    }

    testMessage = 'Allow call with empty fields as array';
    try
    {
        DM.api('/playlists', {fields: []});
        ok(true, testMessage);
    }
    catch(e)
    {
        ok(false, testMessage);
    }

    testMessage = 'Allow call with empty fields as string';
    try
    {
        DM.api('/playlists', {fields: ''});
        ok(true, testMessage);
    }
    catch(e)
    {
        ok(false, testMessage);
    }
});

test('API calls "subrequests" should be object', function()
{
    testMessage = 'Allow call with subrequests as object';
    DM.api('/playlists',
        {
            fields: 'id,uri,name,videos_total', 
            subrequests:
            {
                'videos':
                {
                    fields: ['thumbnail_120_url'],
                    limit: 4
                }
            }
        }
    );
    ok(true, testMessage);

    testMessage = 'Disallow call with subrequests as string';
    try
    {
        DM.api('/playlists',
            {
                fields: 'id,uri,name,videos_total', 
                subrequests: 'videos.fields(thumbnail_120_url).limit(4)'
            }
        );
        ok(false, testMessage);
    }
    catch(e)
    {
        ok(true, testMessage);
    }
});

