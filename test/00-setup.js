// start the couchdb spinning as a detached child process.
// the zz-teardown.js test kills it.

var spawn = require('child_process').spawn
var test = require('tap').test
var path = require('path')
var fs = require('fs')
var http = require('http')
var url = require('url')

// just in case it was still alive from a previous run, kill it.
require('./zz-teardown.js')

// just make sure we can load a client, or crash early
require('./client.js')

// run with the cwd of the main program.
var cwd = path.dirname(__dirname)

var conf = path.resolve(__dirname, 'fixtures', 'couch.ini')
var pidfile = path.resolve(__dirname, 'fixtures', 'pid')
var logfile = path.resolve(__dirname, 'fixtures', 'couch.log')
var started = /Apache CouchDB has started on http:\/\/127\.0\.0\.1:15984\/\n$/

test('start couch as a zombie child', function (t) {
  var fd = fs.openSync(pidfile, 'wx')

  try { fs.unlinkSync(logfile) } catch (er) {}

  var child = spawn('couchdb', ['-a', conf], {
    detached: true,
    stdio: 'ignore',
    cwd: cwd
  })
  child.unref()
  t.ok(child.pid)
  fs.writeSync(fd, child.pid + '\n')
  fs.closeSync(fd)

  // wait for it to create a log, give it 5 seconds
  var start = Date.now()
  fs.readFile(logfile, function R (er, log) {
    log = log ? log.toString() : ''
    if (!er && !log.match(started))
      er = new Error('not started yet')
    if (er) {
      if (Date.now() - start < 5000)
        return setTimeout(function () {
          fs.readFile(logfile, R)
        }, 100)
      else
        throw er
    }
    t.pass('relax')
    t.end()
  })
})

test('create test db', function(t) {
  var u = url.parse('http://admin:admin@localhost:15984/registry')
  u.method = 'PUT'
  http.request(u, function(res) {
    t.equal(res.statusCode, 201)
    var c = ''
    res.setEncoding('utf8')
    res.on('data', function(chunk) {
      c += chunk
    })
    res.on('end', function() {
      c = JSON.parse(c)
      t.same(c, { ok: true })
      t.end()
    })
  }).end()
})

test('create test record', function(t) {
  var testPkg = require('./fixtures/test-package.json')
  var tf = path.resolve(__dirname, 'fixtures/test-package-0.0.0.tgz')
  var tgzData = fs.readFileSync(tf, 'base64')
  testPkg._attachments['test-package-0.0.0.tgz'].data = tgzData
  testPkg._attachments['test-package-0.0.0.tgz'].stub = false

  var body = new Buffer(JSON.stringify(testPkg))
  var u = url.parse('http://admin:admin@localhost:15984/registry/test-package')
  u.method = 'PUT'
  u.headers = {
    'content-type': 'application/json',
    'content-length': body.length,
    connection: 'close'
  }
  http.request(u, function(res) {
    t.equal(res.statusCode, 201)
    if (res.statusCode !== 201)
      res.pipe(process.stderr)
    t.end()
  }).end(body)
})