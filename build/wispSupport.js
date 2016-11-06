// Generated by CoffeeScript 1.10.0
(function() {
  var slice = [].slice;

  define(['./eval', './docOrg', 'lib/bluebird.min', './gen'], function(Eval, DocOrg, Bluebird, Gen) {
    var Compiler, Promise, Scope, SourceMapConsumer, SourceMapGenerator, SourceNode, Wisp, blockSource, codeOffset, compile, envFunc, findNs, jsCodeFor, lineColumnStrOffset, parseIt, setLounge, sourceMapFromCode, translateIdentifierWord, wispCompile, wispEval, wispFileCounter, wispPromise, wispRequire, wp;
    setLounge = Eval.setLounge, parseIt = Eval.parseIt, jsCodeFor = Eval.jsCodeFor, Scope = Eval.Scope, lineColumnStrOffset = Eval.lineColumnStrOffset;
    blockSource = DocOrg.blockSource;
    Promise = Bluebird.Promise;
    SourceNode = Gen.SourceNode, SourceMapConsumer = Gen.SourceMapConsumer, SourceMapGenerator = Gen.SourceMapGenerator;
    Wisp = null;
    wispCompile = null;
    wispFileCounter = 0;
    wispRequire = function(s, base) {
      var m;
      s = new URL(s, 'http://x\/' + base.replace(/\./g, "\/")).pathname.replace(/^\//, '').replace('\/', '.');
      if (m = s.match(/^(\.)?wisp\./)) {
        return findNs(s.substring(m[0].length), Wisp);
      } else {
        return findNs(s, Leisure.WispNS);
      }
    };
    findNs = function(nsName, obj, create) {
      var comp, j, len, ref1;
      ref1 = nsName.split('.');
      for (j = 0, len = ref1.length; j < len; j++) {
        comp = ref1[j];
        if (!obj[comp]) {
          if (create) {
            obj[comp] = new Scope;
          } else {
            return null;
          }
        }
        obj = obj[comp];
      }
      if (create && !obj._ns_) {
        obj._ns_ = {
          id: nsName
        };
      }
      return obj;
    };
    wp = null;
    translateIdentifierWord = null;
    wispPromise = function() {
      return wp || (wp = new Promise(function(resolve, reject) {
        return setTimeout((function() {
          var req;
          req = window.require;
          window.require = null;
          return req(['lib/wisp'], function(W) {
            var baseWispCompile, exports;
            Leisure.Wisp = Wisp = W;
            translateIdentifierWord = W.backend.escodegen.writer.translateIdentifierWord;
            baseWispCompile = Wisp.compiler.compile;
            window.require = req;
            wispCompile = function() {
              var args, node;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              node = baseWispCompile.apply(null, args);
              if (node.error) {
                throw node.error;
              }
              return node;
            };
            Leisure.wispCompilePrim = wispCompile;
            Leisure.wispCompileBase = baseWispCompile;
            Leisure.WispNS = {
              lounge: {
                tools: {}
              }
            };
            exports = Leisure.WispNS.lounge.tools;
            return resolve(wispCompile);
          });
        }), 100);
      }));
    };
    Compiler = (function() {
      function Compiler() {}

      Compiler.prototype.compile = function(s, nsName1, wrapFunction, returnList1) {
        var ref1;
        this.nsName = nsName1;
        this.wrapFunction = wrapFunction;
        this.returnList = returnList1;
        this.reqs = '';
        this.splice = '';
        this.pad = this.wrapFunction ? '  ' : '';
        this.result = wispCompile(s, {
          "source-uri": "wispEval-" + (wispFileCounter++)
        });
        if (this.result.ast[0].op === 'ns') {
          this.nsName = (ref1 = this.result.ast[0].form.tail.head) != null ? ref1.name : void 0;
        }
        return {
          nameSpace: this.handleNameSpace(),
          code: this.scanNodes()
        };
      };

      Compiler.prototype.handleNameSpace = function() {
        var j, k, l, len, len1, len2, names, needsExports, node, nsObj, ref, ref1, ref2, ref3, ref4, ref5, req;
        this.gennedNs = true;
        needsExports = _.find(this.result.ast, function(n) {
          return n.op === 'def';
        });
        if (this.nsName) {
          nsObj = findNs(this.nsName, Leisure.WispNS, true);
          names = {
            _ns_: true
          };
          ref1 = this.result.ast;
          for (j = 0, len = ref1.length; j < len; j++) {
            node = ref1[j];
            if (node.op === 'def') {
              names[node.id.id.name] = true;
            }
          }
          if (this.result.ast[0].op === 'ns' && this.result.ast[0].require) {
            ref2 = this.result.ast[0].require;
            for (k = 0, len1 = ref2.length; k < len1; k++) {
              req = ref2[k];
              ref3 = req.refer;
              for (l = 0, len2 = ref3.length; l < len2; l++) {
                ref = ref3[l];
                names[translateIdentifierWord(((ref4 = ref.rename) != null ? ref4 : ref.name).name)] = true;
              }
            }
          }
          nsObj.newNames(_.keys(names));
          if (needsExports) {
            if (this.wrapFunction) {
              this.reqs += "exports = exports || window.Leisure.WispNS." + this.nsName + ";\n";
            } else {
              this.reqs += "var exports = window.Leisure.WispNS." + this.nsName + ";\n";
            }
          }
          if (this.result.ast[0].require) {
            this.reqs += "var require = function(s) {\n  return Leisure.wispRequire(s, '" + this.nsName + "');\n};\n";
          }
          if (this.result.ast[0].op !== 'ns') {
            this.reqs += "var _ns_ = {\n  id: '" + this.nsName + "',\n  doc: void 0\n};\n";
          } else if (this.result.ast[0].doc) {
            this.splice = "exports._ns_.doc = _ns_.doc;\n";
          }
          this.end = (ref5 = this.result.ast[0].end) != null ? ref5 : {
            line: 0,
            column: 0
          };
          if (this.pad) {
            this.splice = this.splice.replace(/\n/g, '\n' + this.pad);
          }
          this.gennedNs = false;
        } else if (needsExports) {
          if (this.wrapFunction) {
            this.reqs += "exports = exports || {};\n";
          } else {
            this.destroyExports = true;
          }
        }
        if (this.pad) {
          this.reqs = this.reqs.replace(/\n/g, '\n' + this.pad);
        }
        return nsObj;
      };

      Compiler.prototype.scanNodes = function() {
        var addReturn, children, code, con, destroyingExport, exprPos, exprs, file, foundEnd, head, lastLoc, nodes, prevCode, ref1, returnNode, splicedResult, startedPush, tail;
        if (this.returnList) {
          exprs = _.filter(_.map(this.result.ast, (function(_this) {
            return function(n, i) {
              var ref1;
              if (!((ref1 = n.op) === 'def' || ref1 === 'ns') && n.form && !(n.op === 'var' && n.form.name === 'debugger')) {
                return _this.result['js-ast'].body[i].loc;
              }
            };
          })(this)), identity);
          if (exprs.length) {
            this.reqs += "var $ret$ = [];\n";
          } else {
            this.returnList = false;
          }
        } else if (this.wrapFunction) {
          addReturn = true;
        }
        head = [];
        tail = [];
        foundEnd = false;
        startedPush = false;
        exprPos = 0;
        returnNode = null;
        destroyingExport = false;
        prevCode = {
          code: ''
        };
        con = SourceMapConsumer.fromSourceMap(this.result['source-map']);
        nodes = SourceNode.fromStringWithSourceMap(this.result.code, con);
        if (addReturn) {
          addReturn = lastLoc = _.last(_.filter(_.map(this.result.ast, (function(_this) {
            return function(n, i) {
              var ref1, ref2;
              if (!((ref1 = n.op) === 'def' || ref1 === 'ns') && n.form) {
                return (ref2 = _this.result['js-ast'].body[i].loc) != null ? ref2.start : void 0;
              }
            };
          })(this)), identity));
        }
        nodes.walk((function(_this) {
          return function(code, loc) {
            var c, c2, node, ref1;
            if (code.match(/\/\/# sourceMappingURL=/)) {
              foundEnd = true;
              code = code.replace(/\/\/# sourceMappingURL=.*/, '');
              if (!code.trim()) {
                return;
              }
            } else if (foundEnd) {
              return;
            }
            if (_this.destroyExports && !destroyingExport && code === "exports" && prevCode.code.match(/ *= */)) {
              destroyingExport = true;
              return;
            } else if (destroyingExport) {
              if (code.match(/ *= */)) {
                destroyingExport = false;
              }
              return;
            }
            if (_this.nsName) {
              code = code.replace(/^ *var /g, ' ');
            }
            if (_this.returnList && !startedPush && loc.line >= ((ref1 = exprs[exprPos]) != null ? ref1.start.line : void 0) && loc.column >= exprs[exprPos].start.column - 1) {
              startedPush = true;
              if (prevCode.node) {
                c = prevCode.node.children[0];
                c2 = c.replace(/((^|\n) *)([^ \n]+)$/, '$1$$ret$$.push($3');
              }
              if (prevCode.node && c !== c2) {
                prevCode.node.children[0] = c2;
              } else {
                code = "$ret$.push(" + code;
              }
            }
            if (startedPush && (loc.line != null) && (code.match(/;[ \n]*$/) || (loc.line >= exprs[exprPos].end.line && loc.column >= exprs[exprPos].end.column))) {
              startedPush = false;
              code = code.replace(/;([ \n]*)$/, ');$1');
              exprPos++;
            }
            if (_this.pad) {
              code = code.replace(/\n/g, '\n' + _this.pad);
            }
            node = new SourceNode(loc.line, loc.column, loc.source, code, loc.name);
            if (addReturn && !returnNode && loc.line === lastLoc.line && loc.column >= lastLoc.column - 1) {
              returnNode = node;
            }
            if (!_this.gennedNs && (loc.line < _this.end.line + 1 || (loc.line === _this.end.line + 1 && loc.column < _this.end.column))) {
              head.push(node);
            } else {
              _this.gennedNs = true;
              tail.push(node);
            }
            return prevCode = {
              code: code,
              loc: loc,
              node: node
            };
          };
        })(this));
        file = (ref1 = _.find(nodes.children, function(n) {
          return n instanceof SourceNode;
        })) != null ? ref1.source : void 0;
        children = [head, new SourceNode(1, 0, file, this.splice), tail];
        if (returnNode) {
          code = returnNode.children[0];
          if (_.last(tail) === returnNode) {
            returnNode.children[0] = "return " + code;
          } else {
            returnNode.children[0] = "var $ret$ = " + code;
            children.push("\n" + this.pad + "return $ret$;\n");
          }
        } else if (this.returnList) {
          children.push(this.wrapFunction ? "\n" + this.pad + "return $ret$;\n" : "\n" + this.pad + "$ret$;\n");
        }
        if (startedPush) {
          tail.push(");");
        }
        if (this.reqs) {
          children.unshift(this.reqs);
        }
        if (this.wrapFunction) {
          children.unshift("(function(exports, console){\n" + this.pad + "console = console ? console : window.console;\n" + this.pad);
          children.push('})');
        }
        splicedResult = new SourceNode(1, 0, file, children).toStringWithSourceMap();
        if (file) {
          splicedResult.map.setSourceContent(file, con.sourceContentFor(file));
        }
        return splicedResult.code + ("\n//# sourceMappingURL=data:application/json;base64," + (btoa(JSON.stringify(splicedResult.map.toJSON()))) + "\n");
      };

      return Compiler;

    })();
    compile = function(s, nsName, wrapFunction, returnList) {
      this.wrapFunction = wrapFunction;
      return new Compiler().compile(s, nsName, this.wrapFunction, returnList);
    };
    Leisure.wispCompile = compile;
    Leisure.wispEval = wispEval = function() {
      var args, code, nameSpace, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      ref1 = compile.apply(null, args), nameSpace = ref1.nameSpace, code = ref1.code;
      if (nameSpace) {
        return nameSpace["eval"](code);
      } else {
        return eval(code);
      }
    };
    Leisure.wispRequire = wispRequire;
    Leisure.wispFindNs = findNs;
    sourceMapFromCode = function(code) {
      return new SourceMapConsumer(JSON.parse(atob(code.substring(code.lastIndexOf('\n', code.length - 2)).match(/sourceMappingURL=.*base64,([^\n]*)\n/)[1])));
    };
    codeOffset = function(err, code, src, originalSrc) {
      var column, ign, line, ref1, ref2;
      ref1 = err.stack.match(/\n +at .*:([0-9]*):([0-9]*)/), ign = ref1[0], line = ref1[1], column = ref1[2];
      line = Number(line);
      column = Number(column);
      ref2 = sourceMapFromCode(code).originalPositionFor({
        line: line - 1,
        column: column
      }), line = ref2.line, column = ref2.column;
      return lineColumnStrOffset(src, line, column) + (originalSrc != null ? originalSrc : src).length - src.length;
    };
    envFunc = function(env) {
      env.executeText = function(text, props, cont) {
        return setLounge(this, (function(_this) {
          return function() {
            var result;
            result = [Leisure.wispEval(text)];
            if (cont) {
              return cont(result);
            } else {
              return result;
            }
          };
        })(this));
      };
      env.executeBlock = function(block, props, cont) {
        return this.compileBlock(block).call(this, cont);
      };
      env.compileBlock = function(block) {
        var code, column, err, error, func, ignore, line, m, macros, msg, nameSpace, ns, nsObj, original, pos, props, ref1, ref2, ref3, ref4, res;
        original = res = "" + (blockSource(block).trim());
        try {
          props = this.data.properties(block);
          ns = (ref1 = (ref2 = props.namespace) != null ? ref2.trim() : void 0) != null ? ref1 : void 0;
          if (ns) {
            if (props.macro) {
              macros = true;
            }
            res = "(ns " + ns + ")\n" + res;
            ns = ns.match(/^[^ ]+/)[0];
            nsObj = findNs(ns, Leisure.WispNS, true);
          }
          ref3 = compile(res, ns, true, true), nameSpace = ref3.nameSpace, code = ref3.code;
          func = nameSpace ? nameSpace["eval"](code) : eval(code);
          return function() {
            var args, cont, envConsole, err, error, ref4;
            cont = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
            env = this;
            envConsole = {
              log: function() {
                var args;
                args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
                return env.write(args.join(' '));
              }
            };
            try {
              return setLounge(env, function() {
                return (cont != null ? cont : identity)(_.filter(func.apply(null, [null, envConsole].concat(slice.call(args))), function(n) {
                  return typeof n !== 'undefined';
                }));
              });
            } catch (error) {
              err = error;
              console.error((ref4 = err.stack) != null ? ref4 : err);
              if (original !== blockSource(env.data.getBlock(block._id)).trim()) {
                console.error("Warning, code is from a different version of block " + block._id);
              }
              env.errorAt(codeOffset(err, code, res, original), err.message);
              return (cont != null ? cont : identity)([]);
            }
          };
        } catch (error) {
          err = error;
          console.error((ref4 = err.stack) != null ? ref4 : err);
          if (m = err.message.match(/^([^\n]+)\nline:([^\n]+)\ncolumn:([^\n]+)(\n|$)/)) {
            ignore = m[0], msg = m[1], line = m[2], column = m[3];
            pos = lineColumnStrOffset(res, Number(line.trim()), Number(column.trim()));
            pos += original.length - res.length;
            return env.errorAt(pos, msg);
          } else if (code) {
            return env.errorAt(codeOffset(err, code, res, original), err.message);
          } else {
            return env.errorAt(0, err.message);
          }
        }
      };
      env.generateCode = function(text, noFunc) {
        debugger;
      };
      return env;
    };
    return function(env) {
      return wispPromise().then(function() {
        envFunc(env);
        return resolve(envFunc);
      });
    };
  });

}).call(this);

//# sourceMappingURL=wispSupport.js.map
