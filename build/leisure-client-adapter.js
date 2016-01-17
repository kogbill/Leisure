// Generated by CoffeeScript 1.10.0
(function() {
  var slice = [].slice;

  define(['jquery', 'immutable', './editor', './editorSupport', 'sockjs', './advice', './common', 'lib/bluebird.min', 'lib/ot/ot', './replacements', './export'], function(jq, immutable, Editor, Support, SockJS, Advice, Common, Bluebird, OT, Rep, Exports) {
    var DataStore, EditorClient, Map, OrgData, Peer, Promise, Replacements, Selection, Set, TextOperation, afterMethod, ajaxGet, basicDataFilter, beforeMethod, blockText, callOriginal, changeAdvice, computeNewStructure, configureOpts, diag, editorToolbar, getDocumentParams, isDelete, isInsert, isRetain, mergeExports, noTrim, preserveSelection, randomUserName, ref, replacementFor, replacements, validateBatch;
    mergeExports = Exports.mergeExports;
    ref = window.Immutable = immutable, Map = ref.Map, Set = ref.Set;
    DataStore = Editor.DataStore, preserveSelection = Editor.preserveSelection, blockText = Editor.blockText, computeNewStructure = Editor.computeNewStructure, validateBatch = Editor.validateBatch;
    OrgData = Support.OrgData, getDocumentParams = Support.getDocumentParams, editorToolbar = Support.editorToolbar, basicDataFilter = Support.basicDataFilter, replacementFor = Support.replacementFor, ajaxGet = Support.ajaxGet;
    changeAdvice = Advice.changeAdvice, afterMethod = Advice.afterMethod, beforeMethod = Advice.beforeMethod, callOriginal = Advice.callOriginal;
    noTrim = Common.noTrim;
    Promise = Bluebird.Promise;
    TextOperation = OT.TextOperation, Selection = OT.Selection, EditorClient = OT.EditorClient;
    isRetain = TextOperation.isRetain, isInsert = TextOperation.isInsert, isDelete = TextOperation.isDelete;
    Replacements = Rep.Replacements, replacements = Rep.replacements;
    diag = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return console.log.apply(console, args);
    };
    Peer = (function() {
      function Peer() {
        this.data = new OrgData();
        this.namePromise = randomUserName((function(_this) {
          return function(name1) {
            _this.name = name1;
          };
        })(this));
        this.guardedChangeId = 0;
        this.guardPromises = {};
      }

      Peer.prototype.setEditor = function(editor) {
        this.editor = editor;
      };

      Peer.prototype.disconnect = function() {
        var ref1;
        if ((ref1 = this.con) != null) {
          ref1.close();
        }
        return this.con = null;
      };

      Peer.prototype.connect = function(url, connectedFunc1) {
        var opened, peer;
        this.url = url;
        this.connectedFunc = connectedFunc1;
        console.log("CONNECTED");
        this.con = new SockJS(this.url);
        opened = false;
        this.namePromise["finally"]((function(_this) {
          return function() {
            delete _this.namePromise;
            return new Promise(function(resolve, reject) {
              _this.con.onopen = function() {
                opened = true;
                _this.con.onerror = function() {
                  return _this.closed();
                };
                return resolve();
              };
              return _this.con.onerror = function() {
                if (!openend) {
                  return reject();
                }
              };
            });
          };
        })(this));
        this.con.onmessage = (function(_this) {
          return function(msg) {
            return _this.handleMessage(JSON.parse(msg.data));
          };
        })(this);
        this.con.onclose = (function(_this) {
          return function() {
            return _this.closed();
          };
        })(this);
        peer = this;
        this.editor.options.data.peer = this;
        configureOpts(this.editor.options);
        return this.editor.on('selection', (function(_this) {
          return function() {
            return _this.getSelection();
          };
        })(this));
      };

      Peer.prototype.opFor = function(arg, length) {
        var end, op, start, text;
        start = arg.start, end = arg.end, text = arg.text;
        op = new TextOperation();
        if (start > 0) {
          op = op.retain(start);
        }
        if (end > start) {
          op = op["delete"](end - start);
        }
        if (text.length) {
          op = op.insert(text);
        }
        if (length > end) {
          op = op.retain(length - end);
        }
        return op;
      };

      Peer.prototype.opsFor = function(repls, totalLength) {
        if (repls instanceof Replacements) {
          return this.baseOpsFor(totalLength, function(f) {
            var length, offset, ref1, results, t, text;
            t = repls.replacements;
            results = [];
            while (!t.isEmpty()) {
              ref1 = t.peekFirst(), offset = ref1.offset, length = ref1.length, text = ref1.text;
              t = t.removeFirst();
              results.push(f(offset, length, text));
            }
            return results;
          });
        } else if (_.isArray(repls)) {
          return this.baseOpsFor(totalLength, function(f) {
            var j, last, len1, repl, results;
            last = 0;
            results = [];
            for (j = 0, len1 = repls.length; j < len1; j++) {
              repl = repls[j];
              f(repl.start - last, repl.end - repl.start, repl.text);
              results.push(last = repl.end);
            }
            return results;
          });
        }
      };

      Peer.prototype.baseOpsFor = function(totalLength, iterate) {
        var cursor, op;
        op = new TextOperation();
        cursor = 0;
        iterate(function(offset, length, text) {
          if (offset > 0) {
            op = op.retain(offset);
          }
          if (length > 0) {
            op = op["delete"](length);
          }
          if (text.length) {
            op = op.insert(text);
          }
          return cursor += offset + length;
        });
        if (totalLength > cursor) {
          op = op.retain(totalLength - cursor);
        }
        return op;
      };

      Peer.prototype.inverseOpFor = function(arg, len) {
        var end, start, text;
        start = arg.start, end = arg.end, text = arg.text;
        return this.opFor({
          start: start,
          end: start + text.length,
          text: this.data.getDocSubstring(start, end)
        }, len);
      };

      Peer.prototype.type = 'Unknown Handler';

      Peer.prototype.close = function() {
        console.log("CLOSING: " + this.type);
        return this.con.close();
      };

      Peer.prototype.closed = function() {
        return changeAdvice(this.editor.options, false, {
          changesFor: {
            p2p: true
          },
          batchReplace: {
            p2p: true
          }
        });
      };

      Peer.prototype.send = function(type, msg) {
        msg.type = type;
        return this.con.send(JSON.stringify(msg));
      };

      Peer.prototype.handleMessage = function(msg) {
        if (!(msg.type in this.handler)) {
          console.log("Received bad message " + msg.type, msg);
          return this.close();
        } else {
          return this.handler[msg.type].call(this, msg);
        }
      };

      Peer.prototype.finishConnected = function(arg) {
        var peers, revision;
        this.id = arg.id, peers = arg.peers, revision = arg.revision;
        this.editorClient = new EditorClient(revision, peers, this, this);
        this.newConnectionFunc(_.size(this.editorClient.clients));
        if (typeof this.connectedFunc === "function") {
          this.connectedFunc(this);
        }
        return this.connectedFunc = null;
      };

      Peer.prototype.handler = {
        log: function(msg) {
          return console.log(msg.msg);
        },
        connection: function(arg) {
          var peerId, peerName;
          peerId = arg.peerId, peerName = arg.peerName;
          this.serverCallbacks.set_name(peerId, peerName);
          return this.newConnectionFunc(_.size(this.editorClient.clients));
        },
        disconnection: function(arg) {
          var peerId;
          peerId = arg.peerId;
          this.serverCallbacks.client_left(peerId);
          return this.newConnectionFunc(_.size(this.editorClient.clients));
        },
        error: function(msg) {
          console.log("Received error: " + msg.error, msg);
          return this.close();
        },
        ack: function() {
          return this.serverCallbacks.ack();
        },
        ackGuard: function(arg) {
          var guardId, operation;
          guardId = arg.guardId, operation = arg.operation;
          this.guardPromises[guardId][0](operation);
          return delete this.guardPromises[guardId];
        },
        rejectGuard: function(ack) {
          this.guardPromises[ack.guardId][1](ack);
          return delete this.guardPromises[ack.guardId];
        },
        operation: function(arg) {
          var meta, operation, peerId;
          peerId = arg.peerId, operation = arg.operation, meta = arg.meta;
          this.fromServer = true;
          this.serverCallbacks.operation(operation);
          this.fromServer = false;
          return this.serverCallbacks.selection(peerId, meta);
        },
        selection: function(arg) {
          var peerId, selection;
          peerId = arg.peerId, selection = arg.selection;
          return this.serverCallbacks.selection(selection);
        },
        setName: function(arg) {
          var name, peerId;
          peerId = arg.peerId, name = arg.name;
          this.serverCallbacks.set_name(peerId, name);
          return this.newConnectionFunc(_.size(this.editorClient.clients));
        }
      };

      Peer.prototype.createSession = function(host, connectedFunc, newConnectionFunc) {
        var ref1;
        this.host = host;
        this.newConnectionFunc = newConnectionFunc;
        this.type = 'Master';
        this.newConnectionFunc = (ref1 = this.newConnectionFunc) != null ? ref1 : function() {};
        this.handler = {
          __proto__: Peer.prototype.handler,
          connected: function(msg) {
            this.guid = msg.guid;
            this.connectUrl = new URL("join-" + this.guid, this.url);
            this.editorClient = new EditorClient(0, {}, this, this);
            return this.finishConnected(msg);
          },
          slaveConnect: function(msg) {
            return this.send('slaveApproval', {
              slaveId: msg.slaveId,
              approval: true
            });
          },
          slaveDisconnect: function(msg) {}
        };
        this.connect("http://" + this.host + "/Leisure/create", (function(_this) {
          return function() {
            _this.send('initDoc', {
              doc: _this.data.getText(),
              name: _this.name
            });
            _this.docSnap = _this.data.getText();
            return connectedFunc();
          };
        })(this));
        return this.docSnap = this.data.getText();
      };

      Peer.prototype.connectToSession = function(url, connected, newConnectionFunc) {
        var ref1;
        this.url = url;
        this.newConnectionFunc = newConnectionFunc;
        this.type = 'Slave';
        this.newConnectionFunc = (ref1 = this.newConnectionFunc) != null ? ref1 : function() {};
        this.handler = {
          __proto__: Peer.prototype.handler,
          connected: function(msg) {
            this.finishConnected(msg);
            this.editor.options.load('shared', msg.doc);
            return this.docSnap = msg.doc;
          }
        };
        return this.connect(this.url, (function(_this) {
          return function() {
            _this.send('intro', {
              name: _this.name
            });
            return typeof connected === "function" ? connected() : void 0;
          };
        })(this));
      };

      Peer.prototype.replsForTextOp = function(textOp) {
        var cursor, j, len1, op, popLastEmpty, ref1, repls;
        repls = [];
        popLastEmpty = function() {
          var r;
          if ((r = _.last(repls)) && r.start === r.end && r.text.length === 0) {
            return repls.pop();
          }
        };
        cursor = 0;
        ref1 = textOp.ops;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          op = ref1[j];
          if (isRetain(op)) {
            cursor += op;
            popLastEmpty();
            repls.push({
              start: cursor,
              end: cursor,
              text: ''
            });
          } else if (isDelete(op)) {
            cursor -= op;
            _.last(repls).end = cursor;
          } else {
            _.last(repls).text += op;
          }
        }
        popLastEmpty();
        return repls;
      };

      Peer.prototype.replaceText = function(start, end, text) {
        return this.data.replaceText(start, end, text);
      };

      Peer.prototype.registerCallbacks = function(cb) {
        if (cb.client_left) {
          return this.serverCallbacks = cb;
        } else {
          return this.editorCallbacks = cb;
        }
      };

      Peer.prototype.registerUndo = function(undoFunc) {
        this.undoFunc = undoFunc;
      };

      Peer.prototype.registerRedo = function(redoFunc) {
        this.redoFunc = redoFunc;
      };

      Peer.prototype.getValue = function() {
        return this.data.getText();
      };

      Peer.prototype.applyOperation = function(op) {
        return preserveSelection((function(_this) {
          return function(sel) {
            var j, ref1, repl;
            if (sel.type !== 'None') {
              _this.data.addMark('selStart', sel.start);
              _this.data.addMark('selEnd', sel.start + sel.length);
            }
            ref1 = _this.replsForTextOp(op);
            for (j = ref1.length - 1; j >= 0; j += -1) {
              repl = ref1[j];
              _this.replaceText(repl.start, repl.end, repl.text);
            }
            if (sel.type !== 'None') {
              sel.start = _this.data.getMarkLocation('selStart');
              sel.length = _this.data.getMarkLocation('selEnd') - sel.start;
              _this.data.removeMark('selStart');
              return _this.data.removeMark('selEnd');
            }
          };
        })(this));
      };

      Peer.prototype.getSelection = function() {
        var newSel, sel;
        sel = this.editor.getSelectedDocRange();
        newSel = sel.type === 'Caret' ? Selection.createCursor(sel.start) : sel.type === 'Range' ? new Selection([new Selection.Range(sel.start, sel.start + sel.length)]) : new Selection();
        newSel.scrollTop = sel.scrollTop;
        newSel.scrollLeft = sel.scrollLeft;
        return newSel;
      };

      Peer.prototype.setSelection = function(sel) {
        if (sel.ranges.length) {
          return this.editor.selectDocRange({
            start: sel.ranges[0].start,
            length: sel.ranges[0].end - sel.ranges[0].start,
            scrollTop: sel.scrollTop,
            scrollLeft: sel.scrollLeft
          });
        }
      };

      Peer.prototype.setOtherSelection = function(sel, color, id) {
        return console.log("OTHER SELECTION: " + (JSON.stringify(sel)));
      };

      Peer.prototype.sendSelection = function(sel) {
        return this.send('selection', {
          selection: sel
        });
      };

      Peer.prototype.sendOperation = function(revision, operation, selection) {
        return this.send('operation', {
          revision: revision,
          operation: operation,
          selection: selection
        });
      };

      Peer.prototype.sendGuardedOperation = function(revision, operation, guards) {
        var guardId;
        guardId = "guard-" + (this.guardedChangeId++);
        this.send('guardedOperation', {
          revision: revision,
          operation: operation,
          guards: guards,
          guardId: guardId,
          selection: this.editorClient.selection
        });
        return new Promise((function(_this) {
          return function(success, failure) {
            return _this.guardPromises[guardId] = [success, failure];
          };
        })(this));
      };

      return Peer;

    })();
    configureOpts = function(opts) {
      var data, peer;
      data = opts.data;
      if (!data.peer) {
        return;
      }
      peer = data.peer;
      return changeAdvice(opts, true, {
        guardedReplaceText: {
          p2p: function(parent) {
            return function(start, end, text, gStart, gEnd) {
              var block, j, len1, offset, oldBlock, p, ref1, ref2, repl, reps;
              reps = Replacements.fromArray([start, end, text]);
              ref1 = this.data.blockOffsetForDocOffset(start), offset = ref1.offset, block = ref1.block;
              oldBlock = this.data.getBlock(block);
              ref2 = this.replaceTextEffects(start, end, text, true).repls;
              for (j = 0, len1 = ref2.length; j < len1; j++) {
                repl = ref2[j];
                reps.replace(repl);
              }
              p = peer.sendGuardedOperation(peer.editorClient.revision, peer.opsFor(reps, this.getLength()), [gStart, gEnd]);
              return p.then(((function(_this) {
                return function(op) {
                  var k, len2, ref3, repls, results;
                  repls = peer.replsForTextOp(TextOperation.fromJSON(op));
                  ref3 = Replacements.fromArray(repls).getRepls();
                  results = [];
                  for (k = 0, len2 = ref3.length; k < len2; k++) {
                    repl = ref3[k];
                    results.push(_this.replaceTextEffects(repl.start, repl.end, text));
                  }
                  return results;
                };
              })(this)))["catch"](function() {});
            };
          }
        },
        replaceText: {
          p2p: function(parent) {
            return function(start, end, text, skip) {
              var newLen, oldLen, repl;
              oldLen = this.getLength();
              repl = {
                start: start,
                end: end,
                text: text
              };
              newLen = oldLen + text.length - end + start;
              peer.editorCallbacks.change(peer.opFor(repl, oldLen), peer.inverseOpFor(repl, newLen));
              return parent(start, end, text, skip);
            };
          }
        },
        batchReplace: {
          p2p: function(parent) {
            return function(replacementFunc, cont, error) {
              var guards, j, len1, ops, r, repls;
              repls = validateBatch(replacementFunc()).reverse();
              ops = peer.opsFor(repls, this.getLength());
              for (j = 0, len1 = repls.length; j < len1; j++) {
                r = repls[j];
                guards = [r.gStart, r.end];
              }
              return peer.sendGuardedOperation(peer.editorClient.revision, ops, guards).then(cont, error)["catch"](error);
            };
          }
        }
      });
    };
    window.randomUserName = randomUserName = function(done) {
      var i;
      return Promise.all((function() {
        var j, results;
        results = [];
        for (i = j = 0; j < 2; i = ++j) {
          results.push(ajaxGet('http://randomword.setgetgo.com/get.php'));
        }
        return results;
      })()).then(function(names) {
        return done(names.join(' '));
      });
    };
    mergeExports({
      configurePeerOpts: configureOpts
    });
    return {
      Peer: Peer
    };
  });

}).call(this);

//# sourceMappingURL=leisure-client-adapter.js.map
