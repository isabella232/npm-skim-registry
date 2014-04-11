// kill the couchdb process that's running as a detached child process
// started by the 00-setup.js test

var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var test = require('tap').test
var pidfile = path.resolve(__dirname, 'fixtures', 'pid');
var _users = path.resolve(__dirname, 'fixtures', '_users.couch');
var db = path.resolve(__dirname, 'fixtures', 'registry.couch');
var log = path.resolve(__dirname, 'fixtures', 'couch.log');
var repl = path.resolve(__dirname, 'fixtures', '_replicator.couch');

test('kill all the users', function (t) {
    t.pass('_users db deleted');
    t.end();
})

test('craigslist (well, how do you get rid of YOUR couches?)', function (t) {
    try {
        var pid = fs.readFileSync(pidfile);
    } catch (er) {}

    if (pid) {
        try { process.kill(pid) } catch (er) {
            // ok if already killed
            t.equal(er.code, 'ESRCH');
        }
    }

    try { fs.unlinkSync(pidfile) } catch (er) {
        // ok if gone
        t.equal(er.code, 'ENOENT');
    }

    try { fs.unlinkSync(repl) } catch (er) {
        t.equal(er.code, 'ENOENT');
    }
    try { fs.unlinkSync(log) } catch (er) {
        t.equal(er.code, 'ENOENT');
    }
    try { fs.unlinkSync(_users) } catch (er) {
        t.equal(er.code, 'ENOENT');
    }
    try { fs.unlinkSync(db) } catch (er) {
        t.equal(er.code, 'ENOENT');
    }

    t.pass('couch is no more');
    t.end();
})

test('cleanup multifishes', function(t) {
    var client = require('./client.js');
    client.rmr('registry-testing', function(er) {
        if (er && (er.statusCode !== 404 && er.code !== 'ENOENT'))
            throw er;
        t.pass('done');
        t.end();
    })
});

test('cleanup fixture dir', function(t) {
    rimraf(path.join(__dirname, 'fixtures', 'destinations'), function(err) {
        t.pass('ok');
        t.end();
    });
});
