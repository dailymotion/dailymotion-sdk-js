module('prelude');

test('copy to object', function() {
  var target = {};
  DM.copy(target, {
    answer: 42,
  });
  ok(target.answer == 42, 'expect the answer');
});

test('copy to object ignore prototype', function() {
  var target = {};
  var source = function() {};
  source.prototype.wrongAnswer = 0;
  var sourceInstance = new source();
  sourceInstance.answer = 42;
  DM.copy(target, sourceInstance);
  ok(target.answer == 42, 'expect the answer');
  ok(!target.wrongAnswer, 'expect no wrong answer');
});

test('copy to object overwrite', function() {
  var target = { the: 42 };
  DM.copy(target, {
    answer: 42,
    the: 0,
  });
  ok(target.answer == 42, 'expect 42');
  ok(target.the == 42, 'expect old value 42');

  DM.copy(target, { the: 0 }, true);
  ok(target.the == 0, 'expect new value 0');
});

test('copy for modules', function() {
  ok(!DM.TestModule, 'module must not exist');
  DM.provide('TestModule', { answer: 42 });
  ok(DM.TestModule.answer == 42, 'expect the new named value');
  delete DM.TestModule;
});

test('guids are not equal', function() {
  ok(DM.guid() != DM.guid(), 'wonder what the odds of this failing are');
});

test('getElementById DM.$', function() {
  var element = DM.$('qunit-header-wrong-id');
  equals(element, null, 'expect null');
  element = DM.$('qunit-header');
  ok(element != null, 'element should not be null anymore');
});
