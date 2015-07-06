// Generated by CoffeeScript 1.9.3
(function() {
  define(['cs!./base', 'cs!./ast', 'cs!./runtime', 'acorn', 'acorn_walk', './lib/lispyscript/browser-bundle'], function(Base, Ast, Runtime, Acorn, AcornWalk, LispyScript) {
    var Html, Node, _true, acorn, acornLoose, acornWalk, cons, defaultEnv, define, errorDiv, escapeHtml, findError, getType, getValue, handleErrors, html, isError, jsEnv, jsEval, jsonConvert, knownLanguages, languageEnvMaker, lazy, lc, leisureEnv, lispyScript, lsEnv, lz, makeHamt, makeSyncMonad, newConsFrom, replacements, resolve, runMonad, runMonad2, runNextResult, rz, setValue, unescapePresentationHtml, walk;
    acorn = Acorn;
    acornWalk = AcornWalk;
    acornLoose = null;
    setTimeout((function() {
      return require(['acorn_loose'], function(AcornLoose) {
        return acornLoose = AcornLoose;
      });
    }), 1);
    lispyScript = lsrequire("lispyscript");
    getType = Ast.getType, cons = Ast.cons, define = Ast.define, unescapePresentationHtml = Ast.unescapePresentationHtml;
    Node = Base.Node, resolve = Base.resolve, lazy = Base.lazy, defaultEnv = Base.defaultEnv;
    rz = resolve;
    lz = lazy;
    lc = Leisure_call;
    runMonad = Runtime.runMonad, runMonad2 = Runtime.runMonad2, newConsFrom = Runtime.newConsFrom, setValue = Runtime.setValue, getValue = Runtime.getValue, makeSyncMonad = Runtime.makeSyncMonad, makeHamt = Runtime.makeHamt, _true = Runtime._true, jsonConvert = Runtime.jsonConvert;
    leisureEnv = function(env) {
      env.presentValue = function(v) {
        return rz(L_showHtml)(lz(v));
      };
      env.executeText = function(text, props, cont) {
        var old, result;
        old = getValue('parser_funcProps');
        setValue('parser_funcProps', props);
        result = rz(L_baseLoadString)('notebook')(text);
        return runMonad2(result, env, function(results) {
          return runNextResult(results, env, function() {
            setValue('parser_funcProps', old);
            return typeof cont === "function" ? cont(env, results) : void 0;
          });
        });
      };
      return env;
    };
    runNextResult = function(results, env, cont) {
      while (results !== rz(L_nil) && getType(results.head().tail()) === 'left') {
        env.write("PARSE ERROR: " + (getLeft(results.head().tail())));
        results = results.tail();
      }
      if (results !== rz(L_nil)) {
        return runMonad2(getRight(results.head().tail()), env, function(res2) {
          if (getType(res2) !== 'unit') {
            env.write(String(env.presentValue(res2)));
          }
          return runNextResult(results.tail(), env, cont);
        });
      } else {
        return cont();
      }
    };
    jsEnv = function(env) {
      env.presentValue = function(v) {
        if (v instanceof Html) {
          return v.content;
        } else {
          return escapeHtml(v);
        }
      };
      env.executeText = function(text, props, cont) {
        var err, value;
        try {
          value = jsEval(env, text);
          if (value.length) {
            return this.write(this.presentValue(value.join('\n')));
          }
        } catch (_error) {
          err = _error;
          return this.errorAt(0, err.message);
        } finally {
          if (typeof cont === "function") {
            cont(env);
          }
        }
      };
      return env;
    };
    jsEval = function(env, text) {
      var console, err, err2, errNode, expr, exprText, i, len, newText, parsed, ref;
      try {
        parsed = acorn.parse(text);
      } catch (_error) {
        err = _error;
        errNode = null;
        handleErrors(acornLoose.parse_dammit(text), function(node) {
          return errNode = node;
        });
        try {
          eval(text);
        } catch (_error) {
          err2 = _error;
          if (errNode) {
            env.errorAt(Math.min(errNode.start, errNode.end), err2.message);
          } else {
            env.errorAt(findError(err.message, text), err2.message);
          }
          return [];
        }
      }
      env.results = [];
      newText = 'var leisure_results=[];';
      ref = parsed.body;
      for (i = 0, len = ref.length; i < len; i++) {
        expr = ref[i];
        if (expr.type === 'ExpressionStatement') {
          exprText = text.substring(expr.start, expr.end);
          if (exprText[exprText.length - 1] === ';') {
            exprText = exprText.substring(0, exprText.length - 1);
          }
          newText += "leisure_results.push(" + exprText + ");";
        } else {
          newText += text.substring(expr.start, expr.end);
        }
      }
      newText += ";leisure_results;";
      console = {
        log: (function(_this) {
          return function(str) {
            return env.write(env.presentValue(str));
          };
        })(this)
      };
      return eval(newText);
    };
    findError = function(err, text) {
      var col, i, len, line, n, ref, ref1, tot, txt, x;
      ref = err.match(/\(([0-9]*):([0-9]*)\)/), x = ref[0], line = ref[1], col = ref[2];
      line = Number(line - 1);
      tot = Number(col);
      ref1 = text.split('\n');
      for (n = i = 0, len = ref1.length; i < len; n = ++i) {
        txt = ref1[n];
        if (n === line) {
          break;
        } else {
          tot += txt.length + 1;
        }
      }
      return tot;
    };
    walk = window.Walk = function(node, func) {
      var type, v;
      v = {};
      for (type in acornWalk.base) {
        v[type] = func;
      }
      return acornWalk.simple(node, v, null);
    };
    isError = function(node) {
      return node.name === "✖";
    };
    handleErrors = function(ast, func) {
      return walk(ast, function(node) {
        if (isError(node)) {
          return func(node);
        }
      });
    };
    lsEnv = function(env) {
      env.presentValue = function(v) {
        if (v instanceof Html) {
          return v.content;
        } else {
          return escapeHtml(v);
        }
      };
      env.executeText = function(text, props, cont) {
        var console, err, value;
        try {
          console = {
            log: (function(_this) {
              return function(str) {
                return env.write(env.presentValue(str));
              };
            })(this)
          };
          value = eval(lispyScript._compile(text));
          if (typeof value !== 'undefined') {
            return this.write(this.presentValue(value));
          }
        } catch (_error) {
          err = _error;
          return this.errorAt(0, err.message);
        } finally {
          if (typeof cont === "function") {
            cont(env);
          }
        }
      };
      return env;
    };
    Html = (function() {
      function Html(content1) {
        this.content = content1;
      }

      return Html;

    })();
    html = function(content) {
      return new Html(content);
    };
    errorDiv = function(err, orgText) {
      return "<span class='error' contenteditable='false'><span class='hidden'>" + (orgText || '') + "</span><span data-nonorg='true'>" + (escapeHtml(err)) + "</span></span>";
    };
    replacements = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    };
    escapeHtml = function(str) {
      if (typeof str === 'string') {
        return str.replace(/[<>&'"]/g, function(c) {
          return replacements[c];
        });
      } else {
        return str;
      }
    };
    knownLanguages = {
      leisure: leisureEnv,
      javascript: jsEnv,
      js: jsEnv,
      lisp: lsEnv
    };
    languageEnvMaker = function(name) {
      return knownLanguages[name != null ? name.toLowerCase() : void 0];
    };
    return {
      languageEnvMaker: languageEnvMaker,
      html: html,
      Html: Html,
      escapeHtml: escapeHtml
    };
  });

}).call(this);

//# sourceMappingURL=eval.js.map