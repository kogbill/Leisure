// Generated by CoffeeScript 1.9.3
(function() {
  var MasterHandler, MessageHandler, OT, SlaveHandler, _, badIdError, badMsgTypeError, badVersionError, crypto, disapprovedError, guid, http, isTextMsg, masters, ref, requirejs, s4, slaves, socketPrefix, sockjs, sockjsUtil, startServer, validateBatch,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  require('source-map-support').install();

  sockjs = require('sockjs');

  sockjsUtil = require('sockjs/lib/utils');

  http = require('http');

  crypto = require('crypto');

  _ = require('./lib/lodash.min');

  requirejs = require('requirejs').config({
    baseUrl: path.dirname(module.filename)
  });

  ref = requirejs('./common'), badIdError = ref.badIdError, badMsgTypeError = ref.badMsgTypeError, disapprovedError = ref.disapprovedError, badVersionError = ref.badVersionError;

  OT = requirejs('./ot');

  masters = {};

  slaves = {};

  socketPrefix = '/Leisure/(master|slave(?:-([^/]*)))';

  s4 = function() {
    var bytes, n;
    bytes = crypto.randomBytes(2);
    n = (bytes[0] + (bytes[1] << 8)).toString(16);
    while (n.length < 4) {
      n = '0' + n;
    }
    return n;
  };

  guid = function() {
    return "" + (s4()) + (s4()) + "-" + (s4()) + "-" + (s4()) + "-" + (s4()) + "-" + (s4()) + (s4()) + (s4());
  };

  MessageHandler = (function() {
    function MessageHandler() {
      this.id = guid();
      this.ot = new OT();
    }

    MessageHandler.prototype.setConnection = function(con1) {
      this.con = con1;
      console.log(this.type + " connection: " + this.id);
      this.con.leisure = this;
      this.con.on('data', (function(_this) {
        return function(msg) {
          return _this.handleMessage(JSON.parse(msg));
        };
      })(this));
      return this.con.on('close', (function(_this) {
        return function() {
          return _this.closed();
        };
      })(this));
    };

    MessageHandler.prototype.type = 'Unknown Handler';

    MessageHandler.prototype.close = function() {
      return this.con.close();
    };

    MessageHandler.prototype.closed = function() {
      return console.log(this.type + " closed: " + this.id);
    };

    MessageHandler.prototype.send = function(msg) {
      console.log("S    " + (JSON.stringify(msg)));
      return this.con.write(JSON.stringify(msg));
    };

    MessageHandler.prototype.sendError = function(msg) {
      msg.type = 'error';
      this.send(msg);
      return setTimeout(((function(_this) {
        return function() {
          return _this.close();
        };
      })(this)), 1);
    };

    MessageHandler.prototype.handleMessage = function(msg) {
      msg.connectionId = this.connectionId;
      console.log("R    " + (JSON.stringify(msg)));
      if (!(msg.type in this.handler)) {
        console.log("Received bad message " + msg.type, msg);
        return this.close();
      } else {
        return this.handler[msg.type].call(this, msg);
      }
    };

    MessageHandler.prototype.handler = {
      log: function(msg) {
        return console.log(msg.msg);
      },
      replace: function(msg) {
        return this.master.relay(msg);
      },
      conditionalReplace: function(msg) {
        if (msg.version !== this.master.version && this.master.versionDirty) {
          return this.send({
            type: 'rejectChange',
            targetVersion: msg.targetVersion,
            version: this.version
          });
        } else {
          return this.master.relay(msg);
        }
      },
      ack: function(msg) {
        return this.master.peerAcknowledgedVersion(msg);
      }
    };

    MessageHandler.prototype.shouldEcho = function(msg) {
      return isTextMsg(msg) && msg.connectionId === this.connectionId;
    };

    return MessageHandler;

  })();

  isTextMsg = function(msg) {
    var ref1;
    return (ref1 = msg.type) === 'replace' || ref1 === 'conditionalReplace';
  };

  validateBatch = function(replacements) {
    var i, last, len, repl;
    replacements = _.sortBy(replacements, function(x) {
      return x.start;
    });
    last = 0;
    for (i = 0, len = replacements.length; i < len; i++) {
      repl = replacements[i];
      if (repl.start < last) {
        throw new Error("Attempt to perform overlapping replacements in batch");
      }
      last = repl.end;
    }
    return replacements;
  };

  MasterHandler = (function(superClass) {
    extend(MasterHandler, superClass);

    function MasterHandler() {
      MasterHandler.__super__.constructor.call(this);
      this.master = this;
      this.connectionId = "peer-0";
      this.slaves = {};
      this.pendingSlaves = {};
      this.doc = '';
      this.peerCount = 0;
      this.version = 0;
      this.nextVersionCallbacks = [];
      this.pendingVersionAcks = {};
      this.remainingVersionAcks = 0;
      this.versionDirty = false;
    }

    MasterHandler.prototype.type = 'Master';

    MasterHandler.prototype.setConnection = function(con) {
      masters[this.id] = this;
      MasterHandler.__super__.setConnection.call(this, con);
      return this.send({
        type: 'connect',
        id: this.id,
        connectionId: this.connectionId,
        version: this.version
      });
    };

    MasterHandler.prototype.addSlave = function(slave) {
      slave.connectionId = "peer-" + (++this.peerCount);
      this.pendingSlaves[slave.connectionId] = slave;
      return this.send({
        type: 'slaveConnect',
        slaveId: slave.connectionId
      });
    };

    MasterHandler.prototype.removeSlave = function(slave) {
      delete this.slaves[slave.connectionId];
      delete this.pendingSlaves[slave.connectionId];
      return this.send({
        type: 'slaveDisconnect',
        slaveId: slave.connectionId
      });
    };

    MasterHandler.prototype.closed = function() {
      var id, ref1, slave;
      delete masters[this.con.leisure.id];
      ref1 = this.slaves;
      for (id in ref1) {
        slave = ref1[id];
        slave.close();
      }
      this.slaves = {};
      return MasterHandler.__super__.closed.call(this);
    };

    MasterHandler.prototype.versionClean = function() {
      return !this.versionDirty && !this.remainingVersionAcks;
    };

    MasterHandler.prototype.startVersionInc = function() {
      if (this.versionDirty && !this.remainingVersionAcks) {
        this.pendingVersionAcks = _.clone(slaves);
        this.pendingVersionAcks[this.connectionId] = this;
        this.remainingVersionAcks = _.size(this.pendingVersionAcks);
        return this.broadcast({
          type: 'newVersion',
          version: this.version + 1
        });
      }
    };

    MasterHandler.prototype.setDoc = function(doc) {
      this.doc = doc;
      return this.versionDirty = true;
    };

    MasterHandler.prototype.peerAcknowledgedVersion = function(msg) {
      var cb, i, len, ref1;
      console.log("RECEIVED VERSION ACK");
      if (this.pendingVersionAcks[msg.connectionId]) {
        delete this.pendingVersionAcks[msg.connectionId];
        this.remainingVersionAcks--;
        if (!this.remainingVersionAcks) {
          this.versionDirty = false;
          this.version++;
          console.log("VERSION INC: " + this.version);
          this.ot = new OT();
          ref1 = this.nextVersionCallbacks;
          for (i = 0, len = ref1.length; i < len; i++) {
            cb = ref1[i];
            cb();
          }
          return this.nextVersionCallbacks = [];
        }
      }
    };

    MasterHandler.prototype.connection = function(msg) {
      if (msg.connectionId === this.connectionId) {
        return this;
      } else {
        return this.slaves[msg.connectionId];
      }
    };

    MasterHandler.prototype.upgradeMsg = function(msg) {
      var offset;
      offset = this.ot.floatFor(msg.start);
      msg.start += offset;
      msg.end += offset;
      msg.version = this.version + 1;
      msg.upgraded = true;
      console.log("PUSH " + (JSON.stringify(msg)));
      return this.nextVersionCallbacks.push((function(_this) {
        return function() {
          console.log("RUN  " + (JSON.stringify(msg)));
          return _this.relay(msg, true);
        };
      })(this));
    };

    MasterHandler.prototype.relay = function(msg, suppressVersionInc) {
      var end, i, len, offset, ref1, repl, start, text;
      if (this.remainingVersionAcks) {
        if (msg.version === this.version) {
          return this.upgradeMsg(msg);
        } else if (msg.version === this.version + 1) {
          console.log("PUSH " + (JSON.stringify(msg)));
          return this.nextVersionCallbacks.push((function(_this) {
            return function() {
              console.log("RUN  " + (JSON.stringify(msg)));
              return _this.relay(msg, true);
            };
          })(this));
        } else {
          return this.sendError(badVersionError(this.version, msg));
        }
      } else if (msg.version !== this.version) {
        return this.sendError(badVersionError(this.version, msg));
      } else {
        if (msg.type === 'replace') {
          start = msg.start, end = msg.end, text = msg.text;
          this.ot.replace(msg);
          this.setDoc(this.doc.substring(0, start) + text + this.doc.substring(end));
        } else if (msg.type === 'conditionalReplace') {
          msg.replacements = validateBatch(msg.replacements);
          offset = 0;
          ref1 = msg.replacements;
          for (i = 0, len = ref1.length; i < len; i++) {
            repl = ref1[i];
            this.setDoc = this.doc.substring(0, repl.start + offset) + repl.text + this.doc.substring(repl.end + offset);
            offset += repl.text.length - repl.end + repl.start;
          }
        }
        this.broadcast(msg);
        if (!suppressVersionInc) {
          return this.startVersionInc();
        }
      }
    };

    MasterHandler.prototype.sendEchoIfNeeded = function(msg) {
      var con;
      if (isTextMsg(msg) && !msg.upgraded && (con = this.connection(msg))) {
        con.send({
          type: 'echo',
          version: this.version
        });
        return con;
      }
    };

    MasterHandler.prototype.broadcast = function(msg) {
      var echoer, id, ref1, results, slave;
      if ((echoer = this.sendEchoIfNeeded(msg)) !== this) {
        this.send(msg);
      }
      ref1 = this.slaves;
      results = [];
      for (id in ref1) {
        slave = ref1[id];
        if (echoer !== slave) {
          results.push(slave.send(msg));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    MasterHandler.prototype.handler = {
      __proto__: MessageHandler.prototype.handler,
      initDoc: function(arg) {
        this.doc = arg.doc;
      },
      slaveApproval: function(arg) {
        var approval, slave, slaveId;
        slaveId = arg.slaveId, approval = arg.approval;
        if (slave = this.pendingSlaves[slaveId]) {
          delete this.pendingSlaves[slaveId];
          if (approval) {
            this.slaves[slaveId] = slave;
            return slave.send({
              type: 'connect',
              id: this.id,
              connectionId: slave.connectionId,
              doc: this.doc,
              version: this.version
            });
          } else {
            return slave.sendError(disapprovedError());
          }
        }
      }
    };

    return MasterHandler;

  })(MessageHandler);

  SlaveHandler = (function(superClass) {
    extend(SlaveHandler, superClass);

    function SlaveHandler() {
      return SlaveHandler.__super__.constructor.apply(this, arguments);
    }

    SlaveHandler.prototype.type = 'Slave';

    SlaveHandler.prototype.setConnection = function(con, masterId) {
      if (!(this.master = masters[masterId])) {
        this.sendError(badMasterIdError(masterId));
      } else {
        this.master.addSlave(this);
      }
      return SlaveHandler.__super__.setConnection.call(this, con);
    };

    SlaveHandler.prototype.setId = function(id1) {
      this.id = id1;
    };

    SlaveHandler.prototype.closed = function() {
      this.master.removeSlave(this);
      return SlaveHandler.__super__.closed.call(this);
    };

    return SlaveHandler;

  })(MessageHandler);

  startServer = function(port) {
    var http_server;
    http_server = http.createServer();
    sockjs.createServer({
      sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js',
      prefix: socketPrefix
    }).on('connection', function(con) {
      var ignore, masterId, ref1, type;
      ref1 = con.pathname.match(socketPrefix), ignore = ref1[0], type = ref1[1], masterId = ref1[2];
      if (type === 'master') {
        return new MasterHandler().setConnection(con);
      } else {
        return new SlaveHandler().setConnection(con, masterId);
      }
    }).installHandlers(http_server);
    return http_server.listen(port, '0.0.0.0');
  };

  module.exports = {
    startServer: startServer,
    guid: guid
  };

}).call(this);

//# sourceMappingURL=server.js.map
