// Generated by CoffeeScript 1.12.4
(function() {
  define(['lodash', './ui', './editor', './editorSupport', './diag', './eval', './advice', 'fingertree'], function(_, UI, Editor, EditorSupport, Diag, Eval, Advice, Fingertree) {
    var AtomSupport, LINE_END, NON_LEISURE_LINE_END, Point, basicDataFilter, configureAtom, getDocumentParams, leisureText, path;
    if (!window.atomView) {
      return {
        configureAtom: function() {}
      };
    }
    getDocumentParams = EditorSupport.getDocumentParams, basicDataFilter = EditorSupport.basicDataFilter;
    Point = parent.require('atom').Point;
    path = parent.require('path');
    LINE_END = /\r\n|\r|\n/g;
    NON_LEISURE_LINE_END = /\r\n|\r/g;
    AtomSupport = (function() {
      AtomSupport.prototype.changing = false;

      function AtomSupport(opts1, text) {
        var line, textLines;
        this.opts = opts1;
        textLines = text.split(/\n/);
        if (_.last(textLines) === '') {
          textLines.pop();
        }
        this.atomLines = Fingertree.fromArray((function() {
          var j, len, results;
          results = [];
          for (j = 0, len = textLines.length; j < len; j++) {
            line = textLines[j];
            results.push(line.length + 1);
          }
          return results;
        })(), {
          identity: function() {
            return {
              lines: 0,
              width: 0
            };
          },
          measure: function(v) {
            return {
              lines: 1,
              width: v
            };
          },
          sum: function(a, b) {
            return {
              lines: a.lines + b.lines,
              width: a.width + b.width
            };
          }
        });
        this.opts.data.addFilter({
          __proto__: basicDataFilter,
          replaceText: (function(_this) {
            return function(data, arg) {
              var end, endOff, source, start, startOff, text;
              start = arg.start, end = arg.end, text = arg.text, source = arg.source;
              if (source !== 'atom') {
                try {
                  _this.changing = true;
                  startOff = _this.atomOffset(start);
                  endOff = _this.atomOffset(end);
                  return atomView.editor.setTextInBufferRange([startOff, endOff], text);
                } finally {
                  _this.changing = false;
                }
              }
            };
          })(this)
        });
      }

      AtomSupport.prototype.splitForLine = function(line) {
        return this.atomLines.split(function(m) {
          return m.lines > line;
        });
      };

      AtomSupport.prototype.atomOffset = function(leisureOffset) {
        var m;
        m = (this.atomLines.split(function(m) {
          return m.width > leisureOffset;
        }))[0].measure();
        return Point.fromObject([m.lines, leisureOffset - m.width]);
      };

      AtomSupport.prototype.leisureOffset = function(atomOffset) {
        var p;
        p = Point.fromObject(atomOffset);
        return this.splitForLine(p.row)[0].measure().width + p.column;
      };

      AtomSupport.prototype.handleAtomTextChanged = function(e) {
        var end, first, i, j, k, len, line, ref, ref1, ref2, ref3, ref4, rest, start, t, text;
        start = this.leisureOffset([e.start, 0]);
        end = this.leisureOffset([e.end + 1, 0]);
        text = leisureText(atomView.editor.getTextInRange([[e.start, 0], [e.end + 1 + ((ref = e.bufferDelta) != null ? ref : 0), 0]]));
        if (this.opts.data.getDocSubstring(start, end) !== text) {
          ref1 = this.splitForLine(e.start), first = ref1[0], rest = ref1[1];
          for (i = j = ref2 = e.start, ref3 = e.end; ref2 <= ref3 ? j <= ref3 : j >= ref3; i = ref2 <= ref3 ? ++j : --j) {
            if (rest.isEmpty()) {
              break;
            }
            rest = rest.removeFirst();
          }
          t = (_.last(text) === '\n' ? text.substring(0, text.length - 1) : text);
          ref4 = t.split(LINE_END);
          for (k = 0, len = ref4.length; k < len; k++) {
            line = ref4[k];
            first = first.addLast(line.length + 1);
          }
          this.atomLines = first.concat(rest);
          if (!this.changing) {
            return this.opts.replaceText({
              start: start,
              end: end,
              text: text,
              source: 'atom'
            });
          }
        }
      };

      return AtomSupport;

    })();
    leisureText = function(text) {
      return text.replace(NON_LEISURE_LINE_END, '\n');
    };
    configureAtom = function(opts, cont) {
      return $(document).ready(function() {
        var con, connected, editorId, ignore, m, text, u;
        if (document.location.search.length > 1 && !connected) {
          connected = true;
          con = getDocumentParams().connect;
          if (con) {
            u = new URL(con);
            if (u.protocol === 'atom:' && (m = u.pathname.match(/^\/\/(.*)$/))) {
              ignore = m[0], editorId = m[1];
              text = atomView.editor.getText();
              window.atomSupport = new AtomSupport(opts, leisureText(text));
              opts.loadName = "file:" + (path.join(atomView.editor.getDirectoryPath(), atomView.editor.getFileName()));
              opts.load(opts.loadName, leisureText(text));
              return cont(opts);
            }
          }
        }
      });
    };
    return {
      configureAtom: configureAtom
    };
  });

}).call(this);

//# sourceMappingURL=atomSupport.js.map
