// Generated by CoffeeScript 1.9.3
(function() {
  var Html, Node, _true, cons, defaultEnv, define, errorDiv, escapeHtml, getType, getValue, jsEnv, jsonConvert, knownLanguages, languageEnvMaker, lazy, lc, leisureEnv, lz, makeHamt, makeSyncMonad, newConsFrom, ref, ref1, ref2, replacements, resolve, root, runMonad, runMonad2, runNextResult, rz, setValue, unescapePresentationHtml;

  ref = require('16-ast'), getType = ref.getType, cons = ref.cons, define = ref.define, unescapePresentationHtml = ref.unescapePresentationHtml;

  ref1 = root = module.exports = require('15-base'), Node = ref1.Node, resolve = ref1.resolve, lazy = ref1.lazy, defaultEnv = ref1.defaultEnv;

  rz = resolve;

  lz = lazy;

  lc = Leisure_call;

  ref2 = require('17-runtime'), runMonad = ref2.runMonad, runMonad2 = ref2.runMonad2, newConsFrom = ref2.newConsFrom, setValue = ref2.setValue, getValue = ref2.getValue, makeSyncMonad = ref2.makeSyncMonad, makeHamt = ref2.makeHamt, _true = ref2._true, jsonConvert = ref2.jsonConvert;

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
      var console, err;
      console = {
        log: (function(_this) {
          return function(str) {
            return _this.write(_this.presentValue(str));
          };
        })(this)
      };
      try {
        return console.log(eval(text));
      } catch (_error) {
        err = _error;
        return this.write(errorDiv(err.stack));
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

  Leisure.html = function(content) {
    return new Html(content);
  };

  errorDiv = function(err, orgText) {
    return "<div class='error' contenteditable='false'><span class='hidden'>" + (orgText || '') + "</span><span data-nonorg='true'>" + (escapeHtml(err)) + "</span></div>";
  };

  replacements = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;'
  };

  escapeHtml = function(str) {
    if (typeof str === 'string') {
      return str.replace(/[<>&]/g, function(c) {
        return replacements[c];
      });
    } else {
      return str;
    }
  };

  knownLanguages = {
    leisure: leisureEnv,
    javascript: jsEnv,
    js: jsEnv
  };

  languageEnvMaker = function(name) {
    return knownLanguages[name.toLowerCase()];
  };

  Leisure.languageEnvMaker = languageEnvMaker;

}).call(this);

//# sourceMappingURL=eval.js.map