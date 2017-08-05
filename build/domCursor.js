// Generated by CoffeeScript 1.12.7
(function() {
  'use strict';
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  (function() {
    var domCursor, domCursorForCaret, getOrgText;
    DOMCursor.prototype.filterOrg = function() {
      return this.addFilter(function(n) {
        return !n.hasAttribute('data-nonorg') || 'skip';
      });
    };
    domCursor = function(node, pos) {
      return new DOMCursor(node, pos).filterOrg();
    };
    getOrgText = function(node) {
      return domCursor(node.firstChild, 0).mutable().filterTextNodes().filterParent(node).getText();
    };
    return domCursorForCaret = function(end) {
      var c, parent, sel;
      sel = getSelection();
      c = sel.type === 'None' ? emptyDOMCursor : end ? domCursor(sel.extentNode, sel.extendOffset) : domCursor(sel.anchorNode, sel.anchorOffset);
      if (!c.empty) {
        parent = parentForNode(sel.focusNode);
        c = c.mutable().filterVisibleTextNodes().filterParent(parent).firstText();
        if (c.pos < c.node.length) {
          c;
        } else {
          c.next();
        }
      }
      return c;
    };
  });

  define(function() {
    var DOMCursor, EmptyDOMCursor, MutableDOMCursor, chooseLower, chooseUpper, debug, differentLines, differentPosition, emptyDOMCursor, emptyRect, getClientRect, getTextPosition, isCollapsed, positioner, reject, sameRanges, selectRange, spareRange;
    DOMCursor = (function() {
      function DOMCursor(node1, pos3, filter) {
        var ref;
        this.node = node1;
        this.pos = pos3;
        if (this.node instanceof Range) {
          filter = this.pos;
          this.pos = this.node.startOffset;
          this.node = this.node.startContainer;
        }
        this.pos = (ref = this.pos) != null ? ref : 0;
        this.filter = filter || function() {
          return true;
        };
        this.computeType();
        this.savedTextPosition = null;
      }

      DOMCursor.prototype.isCollapsed = function() {
        return !this.isEmpty() && isCollapsed(this.node);
      };

      DOMCursor.prototype.computeType = function() {
        this.type = !this.node ? 'empty' : this.node.nodeType === this.node.TEXT_NODE ? 'text' : 'element';
        return this;
      };

      DOMCursor.prototype.equals = function(other) {
        return this.node === other.node && this.pos === other.pos;
      };

      DOMCursor.prototype.newPos = function(node, pos) {
        if (node instanceof Range) {
          return new DOMCursor(node);
        } else {
          return new DOMCursor(node, pos, this.filter);
        }
      };

      DOMCursor.prototype.toString = function() {
        return "DOMCursor(" + this.type + ", " + this.pos + (this.type === 'text' ? ', ' + this.posString() : '') + ")";
      };

      DOMCursor.prototype.posString = function() {
        return this.node.data.substring(0, this.pos) + '|' + this.node.data.substring(this.pos);
      };

      DOMCursor.prototype.textPosition = function() {
        var ref;
        if (this.isEmpty()) {
          return null;
        } else {
          return (ref = this.savedTextPosition) != null ? ref : (this.savedTextPosition = getTextPosition(this.node, this.pos));
        }
      };

      DOMCursor.prototype.isDomCaretTextPosition = function() {
        var p, r;
        p = this.textPosition();
        r = document.caretRangeFromPoint(p.left, p.top);
        return r.startContainer === this.node && r.startOffset === this.pos;
      };

      DOMCursor.prototype.character = function() {
        var p;
        p = this.type === 'text' ? this : this.save().firstText();
        return p.node.data[p.pos];
      };

      DOMCursor.prototype.isEmpty = function() {
        return this.type === 'empty';
      };

      DOMCursor.prototype.setFilter = function(f) {
        return new DOMCursor(this.node, this.pos, f);
      };

      DOMCursor.prototype.addFilter = function(filt) {
        var oldFilt;
        oldFilt = this.filter;
        return this.setFilter(function(n) {
          var r1, r2, ref, ref1;
          return (((ref = (r1 = oldFilt(n))) === 'quit' || ref === 'skip') && r1) || (((ref1 = (r2 = filt(n))) === 'quit' || ref1 === 'skip') && r2) || (r1 && r2);
        });
      };

      DOMCursor.prototype.next = function(up) {
        var n, res, saved;
        saved = this.save();
        n = this.nodeAfter(up);
        while (!n.isEmpty()) {
          switch (res = this.filter(n)) {
            case 'skip':
              n = n.nodeAfter(true);
              continue;
            case 'quit':
              break;
            default:
              if (res) {
                return n;
              }
          }
          n = n.nodeAfter();
        }
        return this.restore(saved).emptyNext();
      };

      DOMCursor.prototype.prev = function(up) {
        var n, res, saved;
        saved = this.save();
        n = this.nodeBefore(up);
        while (!n.isEmpty()) {
          switch (res = this.filter(n)) {
            case 'skip':
              n = n.nodeBefore(true);
              continue;
            case 'quit':
              break;
            default:
              if (res) {
                return n;
              }
          }
          n = n.nodeBefore();
        }
        return this.restore(saved).emptyPrev();
      };

      DOMCursor.prototype.nodes = function() {
        var n, results;
        n = this;
        results = [];
        while (!(n = n.next()).isEmpty()) {
          results.push(n.node);
        }
        return results;
      };

      DOMCursor.prototype.moveCaret = function(r) {
        if (!this.isEmpty()) {
          if (!r) {
            r = document.createRange();
          }
          r.setStart(this.node, this.pos);
          r.collapse(true);
          selectRange(r);
        }
        return this;
      };

      DOMCursor.prototype.adjustForNewline = function() {
        var n, s;
        if (this.isEmpty()) {
          return this;
        } else {
          s = this.save();
          n = this;
          if (this.pos === 0 && this.node.data[0] === '\n') {
            while (!n.isEmpty() && (n = n.prev()).type !== 'text') {}
            if (n.isEmpty()) {
              return s;
            } else {
              if (n.node.data[n.pos - 1] === '\n') {
                return s;
              } else {
                return n;
              }
            }
          } else if (this.pos === this.node.length && this.node.data[this.pos - 1] === '\n') {
            while (!n.isEmpty() && (n = n.next()).type !== 'text') {}
            if (n.node.data[n.pos] === '\n') {
              s;
            }
            return n;
          } else {
            return this;
          }
        }
      };

      DOMCursor.prototype.range = function(other, r) {
        if (!r) {
          r = document.createRange();
        }
        if (other == null) {
          other = this;
        }
        r.setStart(this.node, this.pos);
        r.setEnd(other.node, other.pos);
        return r;
      };

      DOMCursor.prototype.firstText = function(backwards) {
        var n;
        n = this;
        while (!n.isEmpty() && (n.type !== 'text' || (!backwards && n.pos === n.node.data.length))) {
          n = (backwards ? n.prev() : n.next());
        }
        return n;
      };

      DOMCursor.prototype.countChars = function(node, pos) {
        var n, start, tot;
        start = this.copy();
        if (node instanceof DOMCursor) {
          pos = node.pos;
          node = node.node;
        }
        n = this;
        tot = 0;
        while (!n.isEmpty() && n.node !== node) {
          if (n.type === 'text') {
            tot += n.node.length;
          }
          n = n.next();
        }
        if (n.isEmpty() || n.node !== node) {
          return -1;
        } else if (n.type === 'text') {
          tot += pos;
          if (start.node === n.node) {
            tot -= start.pos;
          }
          return tot;
        } else {
          return tot;
        }
      };

      DOMCursor.prototype.forwardChars = function(count, contain) {
        var n;
        if (count === 0) {
          return this;
        }
        n = this;
        count += this.pos;
        while (!n.isEmpty() && 0 <= count) {
          if (n.type === 'text') {
            if (count < n.node.length) {
              if (count === 0 && contain) {
                n = n.prev();
                while (n.type !== 'text') {
                  n = n.prev();
                }
                return n.newPos(n.node, n.node.length);
              } else {
                return n.newPos(n.node, count);
              }
            }
            count -= n.node.length;
          }
          n = n.next();
        }
        return n.emptyNext();
      };

      DOMCursor.prototype.hasAttribute = function(a) {
        return (this.node != null) && this.node.nodeType === this.node.ELEMENT_NODE && this.node.hasAttribute(a);
      };

      DOMCursor.prototype.getAttribute = function(a) {
        return (this.node != null) && this.node.nodeType === this.node.ELEMENT_NODE && this.node.getAttribute(a);
      };

      DOMCursor.prototype.filterTextNodes = function() {
        return this.addFilter(function(n) {
          return n.type === 'text';
        });
      };

      DOMCursor.prototype.filterVisibleTextNodes = function() {
        return this.filterTextNodes().addFilter(function(n) {
          return !n.isCollapsed();
        });
      };

      DOMCursor.prototype.filterParent = function(parent) {
        if (!parent) {
          return this.setFilter(function() {
            return 'quit';
          });
        } else {
          return this.addFilter(function(n) {
            return parent.contains(n.node) || 'quit';
          });
        }
      };

      DOMCursor.prototype.filterRange = function(startContainer, startOffset, endContainer, endOffset) {
        var r;
        if (startOffset == null) {
          if (startContainer instanceof Range) {
            r = startContainer;
            startContainer = r.startContainer;
            startOffset = r.startOffset;
            endContainer = r.endContainer;
            endOffset = r.endOffset;
          } else {
            return this;
          }
        }
        return this.addFilter(function(n) {
          var endPos, ref, startPos;
          startPos = startContainer.compareDocumentPosition(n.node);
          return (startPos === 0 ? (startOffset <= (ref = n.pos) && ref <= endOffset) : startPos & Element.DOCUMENT_POSITION_FOLLOWING ? (endPos = endContainer.compareDocumentPosition(n.node), endPos === 0 ? n.pos <= endOffset : endPos & Element.DOCUMENT_POSITION_PRECEDING) : void 0) || 'quit';
        });
      };

      DOMCursor.prototype.getText = function() {
        var n, t;
        n = this.mutable().firstText();
        if (n.isEmpty()) {
          return '';
        } else {
          t = n.node.data.substring(n.pos);
          while (!(n = n.next()).isEmpty()) {
            if (n.type === 'text') {
              t += n.node.data;
            }
          }
          if (t.length) {
            while (n.type !== 'text') {
              n.prev();
            }
            n = n.newPos(n.node, n.node.length);
            while (n.pos > 0 && reject(n.filter(n))) {
              n.pos--;
            }
            return t.substring(0, t.length - n.node.length + n.pos);
          } else {
            return '';
          }
        }
      };

      DOMCursor.prototype.getTextTo = function(other) {
        var n, t;
        n = this.mutable().firstText();
        if (n.isEmpty()) {
          return '';
        } else {
          t = n.node.data.substring(n.pos);
          if (n.node !== other.node) {
            while (!(n = n.next()).isEmpty()) {
              if (n.type === 'text') {
                t += n.node.data;
              }
              if (n.node === other.node) {
                break;
              }
            }
          }
          if (t.length) {
            while (n.type !== 'text') {
              n.prev();
            }
            if (n.node === other.node) {
              n = n.newPos(n.node, other.pos);
            } else {
              n = n.newPos(n.node, n.node.length);
            }
            while (n.pos > 0 && reject(n.filter(n))) {
              n.pos--;
            }
            return t.substring(0, t.length - n.node.length + n.pos);
          } else {
            return '';
          }
        }
      };

      DOMCursor.prototype.char = function() {
        return this.type === 'text' && this.node.data[this.pos];
      };

      DOMCursor.prototype.isNL = function() {
        return this.char() === '\n';
      };

      DOMCursor.prototype.endsInNL = function() {
        return this.type === 'text' && this.node.data[this.node.length - 1] === '\n';
      };

      DOMCursor.prototype.moveToStart = function() {
        return this.newPos(this.node, 0);
      };

      DOMCursor.prototype.moveToNextStart = function() {
        return this.next().moveToStart();
      };

      DOMCursor.prototype.moveToEnd = function() {
        var end;
        end = this.node.length - (this.endsInNL() ? 1 : 0);
        return this.newPos(this.node, end);
      };

      DOMCursor.prototype.moveToPrevEnd = function() {
        return this.prev().moveToEnd();
      };

      DOMCursor.prototype.forwardWhile = function(test) {
        var n, prev, t;
        prev = n = this.immutable();
        while (n = n.forwardChar()) {
          if (n.isEmpty() || !(t = test(n))) {
            return prev;
          }
          if (t === 'found') {
            return n;
          }
          prev = n;
        }
      };

      DOMCursor.prototype.checkToEndOfLine = function(test) {
        var n, tp;
        n = this.immutable();
        tp = n.textPosition();
        while (!n.isEmpty() && (test(n))) {
          if (differentLines(tp, n.textPosition())) {
            return true;
          }
          n = n.forwardChar();
        }
        return n.isEmpty();
      };

      DOMCursor.prototype.checkToStartOfLine = function(test) {
        var n, tp;
        n = this.immutable();
        tp = n.textPosition();
        while (!n.isEmpty() && (test(n))) {
          if (differentLines(tp, n.textPosition())) {
            return true;
          }
          n = n.backwardChar();
        }
        return n.isEmpty();
      };

      DOMCursor.prototype.endOfLine = function() {
        var tp;
        tp = this.textPosition();
        return this.forwardWhile(function(n) {
          return !differentLines(tp, n.textPosition());
        });
      };

      DOMCursor.prototype.forwardLine = function(goalFunc) {
        var line, tp;
        if (!goalFunc) {
          goalFunc = function() {
            return -1;
          };
        }
        line = 0;
        tp = this.textPosition();
        return this.forwardWhile(function(n) {
          var pos;
          pos = n.textPosition();
          if (differentLines(tp, pos)) {
            tp = pos;
            line++;
          }
          if (line === 1 && goalFunc(pos.left + 2) > -1) {
            return 'found';
          } else {
            return line !== 2;
          }
        });
      };

      DOMCursor.prototype.backwardWhile = function(test) {
        var n, prev, t;
        prev = n = this.immutable();
        while (n = n.backwardChar()) {
          if (n.isEmpty() || !(t = test(n))) {
            return prev;
          }
          if (t === 'found') {
            return n;
          }
          prev = n;
        }
      };

      DOMCursor.prototype.startOfLine = function() {
        var tp;
        tp = this.textPosition();
        return this.backwardWhile(function(n) {
          return !differentLines(tp, n.textPosition());
        });
      };

      DOMCursor.prototype.differentPosition = function(c) {
        return differentPosition(this.textPosition(), c.textPosition());
      };

      DOMCursor.prototype.differentLines = function(c) {
        return differentLines(this.textPosition(), c.textPosition());
      };

      DOMCursor.prototype.backwardLine = function(goalFunc) {
        var line, tp;
        if (!goalFunc) {
          goalFunc = function() {
            return -1;
          };
        }
        tp = this.textPosition();
        line = 0;
        return (this.backwardWhile(function(n) {
          var pos, ref;
          pos = n.textPosition();
          if (differentLines(tp, pos)) {
            tp = pos;
            line++;
          }
          if (line === 1 && ((ref = goalFunc(n.textPosition().left - 2)) === (-1) || ref === 0)) {
            return 'found';
          } else {
            return line !== 2;
          }
        })).adjustBackward();
      };

      DOMCursor.prototype.adjustBackward = function() {
        var p;
        p = this.textPosition();
        return this.backwardWhile(function(n) {
          return !differentPosition(p, n.textPosition());
        });
      };

      DOMCursor.prototype.forwardChar = function() {
        var n;
        if (this.pos + 1 <= this.node.length) {
          return this.newPos(this.node, this.pos + 1);
        } else {
          n = this;
          while (!(n = n.next()).isEmpty()) {
            if (n.node.length !== 0) {
              break;
            }
          }
          return n;
        }
      };

      DOMCursor.prototype.boundedForwardChar = function() {
        var n;
        n = this.save().forwardChar();
        if (n.isEmpty()) {
          return n.prev();
        } else {
          return n;
        }
      };

      DOMCursor.prototype.backwardChar = function() {
        var oldNode, p;
        p = this;
        oldNode = this.node;
        while (!p.isEmpty() && p.pos === 0) {
          p = p.prev();
        }
        if (!p.isEmpty()) {
          return p.newPos(p.node, (p.node !== oldNode ? p.pos : p.pos - 1));
        } else {
          return p;
        }
      };

      DOMCursor.prototype.boundedBackwardChar = function() {
        var n;
        n = this.save().backwardChar();
        if (n.isEmpty()) {
          return n.next();
        } else {
          return n;
        }
      };

      DOMCursor.prototype.show = function(topRect) {
        var p, top;
        if (p = this.textPosition()) {
          top = (topRect != null ? topRect.width : void 0) && topRect.top === 0 ? topRect.bottom : 0;
          if (p.bottom > window.innerHeight) {
            window.scrollBy(0, p.bottom - window.innerHeight);
          } else if (p.top < top) {
            window.scrollBy(0, p.top - top);
          }
        }
        return this;
      };

      DOMCursor.prototype.immutable = function() {
        return this;
      };

      DOMCursor.prototype.withMutations = function(func) {
        return func(this.copy().mutable());
      };

      DOMCursor.prototype.mutable = function() {
        return new MutableDOMCursor(this.node, this.pos, this.filter);
      };

      DOMCursor.prototype.save = function() {
        return this;
      };

      DOMCursor.prototype.restore = function(n) {
        return n.immutable();
      };

      DOMCursor.prototype.copy = function() {
        return this;
      };

      DOMCursor.prototype.nodeAfter = function(up) {
        var node;
        node = this.node;
        while (node) {
          if (node.nodeType === node.ELEMENT_NODE && !up && node.childNodes.length) {
            return this.newPos(node.childNodes[0], 0);
          } else if (node.nextSibling) {
            return this.newPos(node.nextSibling, 0);
          } else {
            up = true;
            node = node.parentNode;
          }
        }
        return this.emptyNext();
      };

      DOMCursor.prototype.emptyNext = function() {
        return {
          __proto__: emptyDOMCursor,
          filter: this.filter,
          prev: (function(_this) {
            return function(up) {
              if (up) {
                return _this.prev(up);
              } else {
                return _this;
              }
            };
          })(this),
          nodeBefore: (function(_this) {
            return function(up) {
              if (up) {
                return _this.nodeBefore(up);
              } else {
                return _this;
              }
            };
          })(this)
        };
      };

      DOMCursor.prototype.nodeBefore = function(up) {
        var newNode, node;
        node = this.node;
        while (node) {
          if (node.nodeType === node.ELEMENT_NODE && !up && node.childNodes.length) {
            newNode = node.childNodes[node.childNodes.length - 1];
          } else if (node.previousSibling) {
            newNode = node.previousSibling;
          } else {
            up = true;
            node = node.parentNode;
            continue;
          }
          return this.newPos(newNode, newNode.length);
        }
        return this.emptyPrev();
      };

      DOMCursor.prototype.emptyPrev = function() {
        return {
          __proto__: emptyDOMCursor,
          filter: this.filter,
          next: (function(_this) {
            return function(up) {
              if (up) {
                return _this.next(up);
              } else {
                return _this;
              }
            };
          })(this),
          nodeAfter: (function(_this) {
            return function(up) {
              if (up) {
                return _this.nodeAfter(up);
              } else {
                return _this;
              }
            };
          })(this)
        };
      };

      return DOMCursor;

    })();
    EmptyDOMCursor = (function(superClass) {
      extend(EmptyDOMCursor, superClass);

      function EmptyDOMCursor() {
        return EmptyDOMCursor.__super__.constructor.apply(this, arguments);
      }

      EmptyDOMCursor.prototype.moveCaret = function() {
        return this;
      };

      EmptyDOMCursor.prototype.show = function() {
        return this;
      };

      EmptyDOMCursor.prototype.nodeAfter = function() {
        return this;
      };

      EmptyDOMCursor.prototype.nodeBefore = function() {
        return this;
      };

      EmptyDOMCursor.prototype.next = function() {
        return this;
      };

      EmptyDOMCursor.prototype.prev = function() {
        return this;
      };

      return EmptyDOMCursor;

    })(DOMCursor);
    emptyDOMCursor = new EmptyDOMCursor();
    MutableDOMCursor = (function(superClass) {
      extend(MutableDOMCursor, superClass);

      function MutableDOMCursor() {
        return MutableDOMCursor.__super__.constructor.apply(this, arguments);
      }

      MutableDOMCursor.prototype.setFilter = function(filter1) {
        this.filter = filter1;
        return this;
      };

      MutableDOMCursor.prototype.newPos = function(node1, pos3) {
        this.node = node1;
        this.pos = pos3;
        this.savedTextPosition = null;
        return this.computeType();
      };

      MutableDOMCursor.prototype.copy = function() {
        return new MutableDOMCursor(this.node, this.pos, this.filter);
      };

      MutableDOMCursor.prototype.mutable = function() {
        return this;
      };

      MutableDOMCursor.prototype.immutable = function() {
        return new DOMCursor(this.node, this.pos, this.filter);
      };

      MutableDOMCursor.prototype.save = function() {
        return this.immutable();
      };

      MutableDOMCursor.prototype.restore = function(np) {
        this.node = np.node;
        this.pos = np.pos;
        this.filter = np.filter;
        return this;
      };

      MutableDOMCursor.prototype.emptyPrev = function() {
        this.type = 'empty';
        this.next = function(up) {
          this.revertEmpty();
          if (up) {
            return this.next(up);
          } else {
            return this;
          }
        };
        this.nodeAfter = function(up) {
          this.computeType();
          if (up) {
            return this.nodeAfter(up);
          } else {
            return this;
          }
        };
        this.prev = function() {
          return this;
        };
        this.nodeBefore = function() {
          return this;
        };
        return this;
      };

      MutableDOMCursor.prototype.revertEmpty = function() {
        this.computeType();
        delete this.next;
        delete this.prev;
        delete this.nodeAfter;
        delete this.nodeBefore;
        return this;
      };

      MutableDOMCursor.prototype.emptyNext = function() {
        this.type = 'empty';
        this.prev = function(up) {
          this.revertEmpty();
          if (up) {
            return this.prev(up);
          } else {
            return this;
          }
        };
        this.nodeBefore = function(up) {
          this.computeType();
          if (up) {
            return this.nodeBefore(up);
          } else {
            return this;
          }
        };
        this.next = function() {
          return this;
        };
        this.nodeAfter = function() {
          return this;
        };
        return this;
      };

      return MutableDOMCursor;

    })(DOMCursor);
    isCollapsed = function(node) {
      var type;
      if (node) {
        type = node.nodeType;
        return type === 7 || type === 8 || (type === node.TEXT_NODE && (node.data === '' || isCollapsed(node.parentNode))) || /^(script|style)$/i.test(node.nodeName) || (type === node.ELEMENT_NODE && !node.offsetParent);
      }
    };
    selectRange = function(r) {
      var sel;
      if (r) {
        debug("select range", r, new Error('trace').stack);
        sel = getSelection();
        if (!(sel.rangeCount === 1 && sameRanges(sel.getRangeAt(0), r))) {
          return sel.setBaseAndExtent(r.startContainer, r.startOffset, r.endContainer, r.endOffset);
        }
      }
    };
    sameRanges = function(r1, r2) {
      return r1.compareBoundaryPoints(Range.START_TO_START, r2) === 0 && r1.compareBoundaryPoints(Range.END_TO_END, r2) === 0;
    };
    debug = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (DOMCursor.debug) {
        return console.log.apply(console, args);
      }
    };
    reject = function(filterResult) {
      return !filterResult || (filterResult === 'quit' || filterResult === 'skip');
    };
    positioner = document.createElement('DIV');
    positioner.setAttribute('style', 'display: inline-block');
    positioner.innerHTML = 'x';
    spareRange = document.createRange();
    emptyRect = {
      width: 0,
      height: 0
    };
    getTextPosition = function(textNode, offset) {
      var r;
      if (offset < textNode.length) {
        spareRange.setStart(textNode, offset);
        spareRange.setEnd(textNode, offset + 1);
        r = getClientRect(spareRange);
        if (!r || (r.width === 0 && r.height === 0)) {
          spareRange.selectNodeContents(textNode.parentNode);
          if (spareRange.getClientRects().length === 0) {
            r = textNode.parentNode.getBoundingClientRect();
          }
        }
      } else {
        spareRange.setStart(textNode, offset);
        spareRange.collapse(true);
        r = getClientRect(spareRange);
      }
      if (!r || (r.width === 0 && r.height === 0)) {
        if (offset === 0) {
          textNode.parentNode.insertBefore(positioner, textNode);
        } else if (offset === textNode.length || textNode.splitText(offset)) {
          textNode.parentNode.insertBefore(positioner, textNode.nextSibling);
        }
        spareRange.selectNode(positioner);
        r = spareRange.getBoundingClientRect();
        positioner.parentNode.removeChild(positioner);
        textNode.parentNode.normalize();
      }
      return r;
    };
    chooseUpper = function(r1, r2) {
      return r1.top < r2.top;
    };
    chooseLower = function(r1, r2) {
      return r1.top > r2.top;
    };
    getClientRect = function(r) {
      var comp, i, len, rect, rects, result;
      rects = r.getClientRects();
      if (rects.length === 1) {
        return rects[0];
      } else if (rects.length === 2) {
        result = rects[0];
        comp = r.startContainer.data[r.startOffset] === '\n' && r.startOffset > 0 && r.startContainer.data[r.startOffset] !== '\n' ? chooseUpper : chooseLower;
        for (i = 0, len = rects.length; i < len; i++) {
          rect = rects[i];
          if (comp(rect, result)) {
            result = rect;
          }
        }
        return result;
      } else {
        return emptyRect;
      }
    };
    differentPosition = function(pos1, pos2) {
      var l1, l2, r1, r2;
      return differentLines(pos2, pos1) || ((pos1.right != null) && (pos2.right != null) ? (r1 = Math.floor(pos1.right), r2 = Math.floor(pos2.right), l1 = Math.floor(pos1.left), l2 = Math.floor(pos2.left), (r1 !== r2 || l1 !== l2) && (r2 < l1 || r1 < l2 || ((r1 < r2) === (l1 < l2) && (r1 > r2) === (l1 > l2)))) : Math.floor(pos1.left) !== Math.floor(pos2.left));
    };
    differentLines = function(pos1, pos2) {
      return (pos1.bottom - 4 <= pos2.top) || (pos2.bottom - 4 <= pos1.top);
    };
    DOMCursor.MutableDOMCursor = MutableDOMCursor;
    DOMCursor.emptyDOMCursor = emptyDOMCursor;
    DOMCursor.isCollapsed = isCollapsed;
    DOMCursor.selectRange = selectRange;
    DOMCursor.getTextPosition = getTextPosition;
    DOMCursor.differentPosition = differentPosition;
    DOMCursor.differentLines = differentLines;
    DOMCursor.debug = false;
    return DOMCursor;
  });

}).call(this);

//# sourceMappingURL=domCursor.js.map
