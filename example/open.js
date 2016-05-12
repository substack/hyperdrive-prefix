var hyperdrive = require('hyperdrive')
var memdb = require('memdb')
var collect = require('collect-stream')
var prefix = require('../')

var drive = hyperdrive(memdb())
var archive = drive.createArchive()
var pending = 2

var dir1 = prefix('dir1', archive)
dir1.createFileWriteStream('hello.txt').end('BEEP BOOP\n')
dir1.createFileWriteStream('whatever.txt').end('hey\n')
dir1.finalize(done)

var dir2 = prefix('dir2', archive)
dir2.createFileWriteStream('hello.txt').end('EHLO WORLD\n')
dir2.finalize(done)

function done () {
  if (--pending !== 0) return
  collect(dir1.list(), function (err, files) {
    show('DIR1/', files)
  })
  collect(dir2.list(), function (err, files) {
    show('DIR2/', files)
  })
  collect(archive.list(), function (err, files) {
    show('LIST', files)
  })
  function show (msg, files) {
    console.log(msg)
    files.forEach(function (file) { console.log('  ' + file.name) })
  }
}
