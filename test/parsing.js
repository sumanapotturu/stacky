// Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
//
// Use of this source code is governed by a BSD-style license that can be found
// in the LICENSE file.
'use strict';

var expect = require('chai').expect;

var parsing = require('../lib/parsing');

describe('parsing', function() {

  describe('.parse', function() {
    var parse = parsing.parse;

    it('throws for gibberish', function() {
      expect(parse.bind(null, '')).to.throw(Error);
      expect(parse.bind(null, 'asldfkjalsdfj')).to.throw(Error);
      expect(parse.bind(null, 'asfdasf\n\n\n\n')).to.throw(Error);
    });

    it('parses V8 stacks', function() {
      var stack = parse(
        'ReferenceError: FAIL is not defined\n' +
        '   at Constraint.execute (deltablue.js:525:2)\n' +
        '   at Constraint.recalculate (deltablue.js:424:21)\n' +
        '   at Planner.addPropagate (deltablue.js:701:6)\n' +
        '   at Constraint.satisfy (deltablue.js:184:15)\n' +
        '   at Planner.incrementalAdd (deltablue.js:591:21)\n' +
        '   at Constraint.addConstraint (deltablue.js:162:10)\n' +
        '   at Constraint.BinaryConstraint (deltablue.js:346:7)\n' +
        '   at Constraint.EqualityConstraint (deltablue.js:515:38)\n' +
        '   at chainTest (deltablue.js:807:6)\n' +
        '   at deltaBlue (deltablue.js:879:2)');
      expect(stack.length).to.be.eq(10);
    });

    it('parses Gecko stacks', function() {
      var stack = parse(
        'trace@file:///C:/example.html:9:17\n' +
        'b@file:///C:/example.html:16:13\n' +
        'a@file:///C:/example.html:19:13\n' +
        '@file:///C:/example.html:21:9');
      expect(stack.length).to.be.eq(4);
    });

  });

  describe('.parseGeckoLine', function() {
    var parseGeckoLine = parsing.parseGeckoLine;

    it('parses lines w/ methods', function() {
      expect(parseGeckoLine('foo@bar:1:2')).to.deep.equal({
        method:   'foo',
        location: 'bar',
        line:     1,
        column:   2,
      });
    });

    it('parses lines w/ blank methods', function() {
      expect(parseGeckoLine('@bar:1:2')).to.deep.equal({
        method:   '',
        location: 'bar',
        line:     1,
        column:   2,
      });
    });

    it('parses lines w/o methods', function() {
      expect(parseGeckoLine('bar:1:2')).to.deep.equal({
        method:   '',
        location: 'bar',
        line:     1,
        column:   2,
      });
    });

    it('parses lines w/o columns', function() {
      expect(parseGeckoLine('foo@bar:1')).to.deep.equal({
        method:   'foo',
        location: 'bar',
        line:     1,
        column:   0,
      });
    });

    it('parses lines w/ windows paths', function() {
      expect(parseGeckoLine('trace@file:///C:/example.html:9:17')).to.deep.equal({
        method:   'trace',
        location: 'file:///C:/example.html',
        line:     9,
        column:   17,
      });
    });

    it('parses legacy gecko lines w/ arguments', function() {
      expect(parseGeckoLine('b(3,4,"\n",[object])@file:///C:/example.html:16')).to.deep.equal({
        method:   'b(3,4,"\n",[object])',
        location: 'file:///C:/example.html',
        line:     16,
        column:   0,
      });
    });

    it('returns null for gibberish', function() {
      expect(parseGeckoLine('jkahsdflkjhasdflkhjasf')).to.be.null;
      expect(parseGeckoLine('')).to.be.null;
      expect(parseGeckoLine('    ')).to.be.null;
    });

  });

  describe('.parseV8Line', function() {
    var parseV8Line = parsing.parseV8Line;

    it('parses minimal lines', function() {
      expect(parseV8Line('  at Type.name (file:1:2)')).to.deep.equal({
        method:   'Type.name',
        location: 'file',
        line:     1,
        column:   2,
      });
    });

    it('parses without indent', function() {
      expect(parseV8Line('at Type.name (file:1:2)')).to.deep.equal({
        method:   'Type.name',
        location: 'file',
        line:     1,
        column:   2,
      });
    });

    it('parses constructor calls', function() {
      expect(parseV8Line('  at new Foo (file:1:2)')).to.deep.equal({
        method:   'new Foo',
        location: 'file',
        line:     1,
        column:   2,
      });
    });

    it('parses aliased method calls', function() {
      expect(parseV8Line('  at Type.functionName [as methodName] (file:1:2)')).to.deep.equal({
        method:   'Type.functionName [as methodName]',
        location: 'file',
        line:     1,
        column:   2,
      });
    });

    it('handles evals somewhat gracefully', function() {
      expect(parseV8Line('eval at Foo.a (eval at Bar.z (myscript.js:10:3))')).to.deep.equal({
        method:   'eval at Foo.a (eval at Bar.z',
        location: 'myscript.js',
        line:     10,
        column:   3,
      });
    });

    it('returns null for gibberish', function() {
      expect(parseV8Line('jkahsdflkjhasdflkhjasf')).to.be.null;
      expect(parseV8Line('')).to.be.null;
      expect(parseV8Line('    ')).to.be.null;
    });
  });

});
