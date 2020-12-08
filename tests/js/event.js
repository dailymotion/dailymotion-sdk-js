module('event');

test('subscribe and fire', function() {
  expect(4);

  var cb1 = function(arg1, arg2) {
    ok(arg1 == 41, 'got expected arg1');
    ok(arg2 == 42, 'got expected arg2');
  };
  var cb2 = function(arg1, arg2) {
    ok(arg1 == 41, 'got expected arg1');
    ok(arg2 == 42, 'got expected arg2');
  };
  DM.Event.subscribe('fake.event1', cb1);
  DM.Event.subscribe('fake.event1', cb2);
  DM.Event.fire('fake.event1', 41, 42);
  DM.Event.unsubscribe('fake.event1', cb1);
  DM.Event.unsubscribe('fake.event1', cb2);
});

test('subscribe and unsubscribe', function() {
  expect(2);

  var cb = function(arg1, arg2) {
    ok(arg1 == 41, 'got expected arg1');
    ok(arg2 == 42, 'got expected arg2');
  };
  DM.Event.subscribe('fake.event2', cb);
  DM.Event.fire('fake.event2', 41, 42);
  DM.Event.unsubscribe('fake.event2', cb);
  DM.Event.fire('fake.event2', 41, 42);
});

test('no subscribers', function() {
  expect(1);

  DM.Event.fire('fake.event3', 41, 42);
  ok(true, 'no errors in firing an event with no subscribers');
});

test('clear subscriptions', function() {
  expect(4);

  var num_fires = 0;

  var cb1 = function(arg1, arg2) {
    ok(arg1 == 41, 'got expected arg1');
    ok(num_fires++ < 2, 'should only be two events');
  };

  DM.Event.subscribe('fake.event3', cb1);
  DM.Event.fire('fake.event3', 41, 42);
  DM.Event.fire('fake.event3', 41, 42);
  DM.Event.clear('fake.event3');
  DM.Event.fire('fake.event3', 41, 42);
});

module('event mixin');

test('subscribe and fire on instance', function() {
  expect(4);

  var cb1 = function(arg1, arg2) {
    ok(arg1 == 41, 'got expected arg1');
    ok(arg2 == 42, 'got expected arg2');
  };
  var cb2 = function(arg1, arg2) {
    ok(arg1 == 41, 'got expected arg1');
    ok(arg2 == 42, 'got expected arg2');
  };

  var MyClass = function() {};
  DM.copy(MyClass.prototype, DM.EventProvider);

  var anInstance = new MyClass();
  anInstance.subscribe('fake.event1', cb1);
  anInstance.subscribe('fake.event1', cb2);
  anInstance.fire('fake.event1', 41, 42);
  anInstance.unsubscribe('fake.event1', cb1);
  anInstance.unsubscribe('fake.event1', cb2);
});

test('subscribe and unsubscribe on instance', function() {
  expect(2);

  var cb = function(arg1, arg2) {
    ok(arg1 == 41, 'got expected arg1');
    ok(arg2 == 42, 'got expected arg2');
  };

  var MyClass = function() {};
  DM.copy(MyClass.prototype, DM.EventProvider);

  var anInstance = new MyClass();
  anInstance.subscribe('fake.event2', cb);
  anInstance.fire('fake.event2', 41, 42);
  anInstance.unsubscribe('fake.event2', cb);
  anInstance.fire('fake.event2', 41, 42);
});

test('no subscribers on instance', function() {
  expect(1);

  var MyClass = function() {};
  DM.copy(MyClass.prototype, DM.EventProvider);

  var anInstance = new MyClass();
  anInstance.fire('fake.event3', 41, 42);
  ok(true, 'no errors in firing an event with no subscribers');
});

test('make sure instances dont share the subscriber map', function() {
  expect(4);

  var cb1 = function(arg1, arg2) {
    ok(arg1 == 41, 'got expected arg1');
    ok(arg2 == 42, 'got expected arg2');
  };
  var cb2 = function(arg1, arg2) {
    ok(arg1 == 43, 'got expected arg1');
    ok(arg2 == 44, 'got expected arg2');
  };

  var MyClass = function() {};
  DM.copy(MyClass.prototype, DM.EventProvider);

  var instance1 = new MyClass();
  var instance2 = new MyClass();

  instance1.subscribe('fake.event1', cb1);
  instance2.subscribe('fake.event1', cb2);

  instance1.fire('fake.event1', 41, 42);
  instance2.fire('fake.event1', 43, 44);
});
