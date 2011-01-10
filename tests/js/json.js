module('json');

test('json flatten', function()
{
    same
    (
        DM.JSON.flatten({ a: 1, b: 'two', c: [1,2,3], d: {e:1,f:2} }),
        {a: '1', b: 'two', c: '[1,2,3]', d: '{"e":1,"f":2}'},
        'expect encoded bits'
    );
});
