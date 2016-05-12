var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var through = require('through2')
var readonly = require('read-only-stream')
var quotemeta = require('quotemeta')

inherits(Wrap, EventEmitter)
module.exports = Wrap

function Wrap (prefix, archive) {
  if (!(this instanceof Wrap)) return new Wrap(prefix, archive)
  EventEmitter.call(this)
  this._archive = archive
  this._prefix = prefix.replace(/\/+$/, '')
  this.key = archive.key + '/' + this._prefix
  this._re = RegExp('^' + quotemeta(this._prefix) + '/')
}

Wrap.prototype._add = function (entry) {
  if (typeof entry === 'string') {
    entry = this._prefix + '/' + entry
  } else if (entry.name) {
    entry.name = this._prefix + '/' + entry.name
  }
  return entry
}

Wrap.prototype._remove = function (entry) {
  if (typeof entry === 'string') {
    entry = entry.replace(this._re, '')
  } else if (entry.name) {
    entry.name = entry.name.replace(this._re, '')
  }
  return entry
}

Wrap.prototype.append = function (entry, cb) {
  this._archive.append(this._add(entry), cb)
}

Wrap.prototype.get = function (index, cb) {
  this._archive.get(index, cb)
}

Wrap.prototype.download = function (index, cb) {
  this._archive.download(index, cb)
}

Wrap.prototype.list = function () {
  var self = this
  var prefix = self._prefix
  return readonly(self._archive.list().pipe(through.obj(write)))

  function write (entry, enc, next) {
    if (entry.name.split('/')[0] === prefix) {
      this.push(self._remove(entry))
    }
    next()
  }
}

Wrap.prototype.createFileReadStream = function (entry) {
  return this._archive.createFileReadStream(this._add(entry))
}

Wrap.prototype.createFileWriteStream = function (entry) {
  return this._archive.createFileWriteStream(this._add(entry))
}
