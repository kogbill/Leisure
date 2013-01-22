(function() {
  var $, DOWN_ARROW, END, ENTER, ESC, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, Q, RIGHT_ARROW, UP_ARROW, arrows, bindMarkupDiv, bindSlider, chooseSlide, cleanEmptyNodes, closeWindow, countSlide, createNode, delay, getElementCode, handleInternalSections, hideSlide, insertControls, isLeisureCode, jQuery, lastSlide, makeMarkupDiv, makeSection, makeSlideDiv, markupButtons, markupElement, markupSlideContent, markupSlides, mergeLeisureCode, mergeUp, nextSibling, nthSlide, oldSlide, padSlide, presentLeisureCode, previousSibling, remove, showSlide, slideControls, slideKeyListener, slideName, slidePat, slides, sliding, textNode, unwrap, unwrapContent, _,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  jQuery = window.jQuery, $ = window.$, _ = window._;

  ENTER = Notebook.ENTER, delay = Notebook.delay, textNode = Notebook.textNode, createNode = Notebook.createNode, remove = Notebook.remove, unwrap = Notebook.unwrap, insertControls = Notebook.insertControls, cleanEmptyNodes = Notebook.cleanEmptyNodes, isLeisureCode = Notebook.isLeisureCode, getElementCode = Notebook.getElementCode, previousSibling = Notebook.previousSibling, nextSibling = Notebook.nextSibling, presentLeisureCode = Notebook.presentLeisureCode, mergeLeisureCode = Notebook.mergeLeisureCode, closeWindow = Notebook.closeWindow, markupButtons = Notebook.markupButtons, ESC = Notebook.ESC, HOME = Notebook.HOME, END = Notebook.END, PAGE_UP = Notebook.PAGE_UP, PAGE_DOWN = Notebook.PAGE_DOWN, LEFT_ARROW = Notebook.LEFT_ARROW, RIGHT_ARROW = Notebook.RIGHT_ARROW, UP_ARROW = Notebook.UP_ARROW, DOWN_ARROW = Notebook.DOWN_ARROW, arrows = Notebook.arrows;

  Q = 81;

  window.markup = function markup(md) {
    var maindoc, nodes, _ref;
    nodes = document.querySelectorAll('[maindoc]');
    if (nodes.length === 0) {
      maindoc = createNode("<div maindoc></div>");
      document.body.insertBefore(maindoc, document.body.firstChild);
      nodes = [maindoc];
    } else {
      maindoc = nodes[0];
    }
    md = ((_ref = md != null ? md.replace(/\r\n/mg, '\n') : void 0) != null ? _ref : maindoc.innerHTML.replace(/^\s*<!--*/, '').replace(/-->\s*\n*/m, '')).trim();
    document.body.classList.add('hideControls');
    markupSlides(maindoc, md);
    return insertControls(maindoc);
  };

  lastSlide = null;

  if (typeof console !== "undefined" && console !== null) {
    if (typeof console.error === "function") {
      console.error(new Error("Incompatibility: using -webkit-calc").stack);
    }
  }

  slidePat = /^(\*\*\*[^\n]*\n(?:--?\n)?)/m;

  slideName = /^\*\*\*([^\n]*)\n(?:--?\n)?/m;

  sliding = false;

  markupSlides = function markupSlides(el, md) {
    var div, hasCode, slides;
    hasCode = markupSlideContent(el, md);
    slides = el.querySelectorAll('[leisureSection]');
    if (slides.length <= (el.querySelector('[leisureSection="Leisure Controls"]') ? 2 : 1)) {
      document.body.classList.add("oneSlide");
    }
    div = createNode("<div class='slide-controls'>\n  <div id='slide-killbutton' onclick='toggleSlideShow()' style='float: right'><button>Slides</button></div>\n  <div id='slide-num' style='float: right; margin-right: 10px'></div>\n</div>");
    markupButtons(div);
    el.appendChild(div);
    if (location.search && _.find(location.search.slice(1).split('&'), (function(p) {
      return p.match(/^slides=/);
    }))) {
      sliding = true;
      showSlide($(chooseSlide()));
    } else {
      document.body.classList.add('scroll');
    }
    return hasCode;
  };

  markupSlideContent = function markupSlideContent(el, md, noMain) {
    var content, hasCode, i, m, p, pageType, pages, _ref, _ref2;
    pages = md.split(slidePat);
    hasCode = false;
    if (pages.length > 1) {
      console.log("PAGES:", JSON.stringify(pages));
      document.body.classList.add('slide-container');
      el.innerHTML = '';
      bindSlider();
      el.removeAttribute('doc');
      if (pages.length === 3 && !pages[0] && !pages[2]) pages[2] = '\n';
      for (i = 0, _ref = pages.length; i < _ref; i += 2) {
        p = pages[i];
        if (p) {
          pageType = i > 0 ? (m = (_ref2 = pages[i - 1].match(slidePat)) != null ? _ref2[1] : void 0, m.match(/\n-\n/) ? ['continuation', 'hiddenPage'] : m.match(/\n--\n/) ? ['hiddenPage'] : []) : [];
          content = makeSlideDiv(el, pageType, (i > 0 ? pages[i - 1].match(slideName)[1].trim() : 'Main'));
          if (i > 0) {
            hasCode = (markupElement(content, pages[i - 1] + p)) || hasCode;
          } else {
            hasCode = (markupElement(content, '***\n' + p)) || hasCode;
          }
          padSlide(content, (i > 0 ? pages[i - 1] : '***\n'));
        }
      }
    } else {
      content = makeSlideDiv(el, ['page'], 'Main');
      while (el.firstChild !== content.parentNode) {
        content.appendChild(el.firstChild);
      }
      hasCode = markupElement(content, md);
      padSlide(content, '***\n');
      if (noMain) unwrapContent(content);
    }
    return hasCode;
  };

  padSlide = function padSlide(content, header) {
    var div, range;
    if (!content.firstChild || isLeisureCode(content.firstChild)) {
      range = document.createRange();
      range.setStart(content, 0);
      range.setEnd(content, 0);
      div = makeMarkupDiv(range, header);
      div.appendChild(createNode('<br>'));
    }
    if (isLeisureCode(content.lastChild)) {
      range = document.createRange();
      range.setStartAfter(content.lastChild);
      range.setEndAfter(content.lastChild);
      div = makeMarkupDiv(range, '\n');
      return div.appendChild(createNode('<br>'));
    }
  };

  unwrapContent = function unwrapContent(content) {
    var el, section;
    section = content.parentNode;
    el = section.parentNode;
    el.insertBefore(content, section);
    remove(section);
    return unwrap(content);
  };

  makeSlideDiv = function makeSlideDiv(el, pageTypes, title) {
    var content, div, pageType, sectionTitle, _i, _len;
    lastSlide = div = createNode("<div class='leisure_page'></div>");
    div.setAttribute('leisureSection', title);
    div.setAttribute('doc', '');
    div.setAttribute('slide', '');
    div.classList.add('slide');
    div.classList.add('ui-corner-all');
    div.classList.add('ui-widget');
    div.classList.add('ui-widget-content');
    for (_i = 0, _len = pageTypes.length; _i < _len; _i++) {
      pageType = pageTypes[_i];
      div.classList.add(pageType);
    }
    el.appendChild(div);
    sectionTitle = createNode("<span class='pageTitle'>" + title + "</span>");
    sectionTitle.setAttribute('leisureoutput', '');
    div.appendChild(sectionTitle);
    content = createNode("<div class='pageContent'></div>");
    div.appendChild(content);
    return content;
  };

  chooseSlide = function chooseSlide() {
    var param;
    param = _.find(location.search.slice(1).split('&'), (function(p) {
      return p.match(/^slide=.*/);
    }));
    console.log(param);
    if (param) {
      return document.querySelector("[slide='" + (param.split('=')[1]) + "']");
    } else {
      return document.querySelector('[maindoc]').firstElementChild;
    }
  };

  oldSlide = 0;

  window.toggleSlideShow = function toggleSlideShow() {
    sliding = $(document.body).is('.scroll');
    if (sliding) {
      $(document.body).removeClass('scroll');
      return showSlide(nthSlide(oldSlide));
    } else {
      oldSlide = $('.slide.showing').attr('slide');
      hideSlide($('.slide.showing'));
      $(document.body).addClass('scroll');
      return $('#slide-num').html('');
    }
  };

  bindSlider = function bindSlider() {
    return document.body.addEventListener('keydown', slideKeyListener);
  };

  slideControls = [Q, ESC, LEFT_ARROW, RIGHT_ARROW, HOME, END, PAGE_UP, PAGE_DOWN];

  slideKeyListener = function slideKeyListener(e) {
    var c, cur, n, next, s;
    if (sliding) {
      window.evt = e;
      c = e.charCode || e.keyCode || e.which;
      if ((__indexOf.call(slideControls, c) >= 0) && !$(e.target).is('[leisurenode=code],[leisurenode=code] *')) {
        e.preventDefault();
        if (c === ESC) {
          return toggleSlideShow();
        } else if (c === Q) {
          return closeWindow();
        } else {
          cur = $('.slide.showing');
          next = (function() {
            switch (c) {
              case HOME:
                return slides();
              case END:
                return s = slides().last();
              case LEFT_ARROW:
              case PAGE_UP:
                n = cur.prev('[slide]').not('[leisureSection="Leisure Controls"]');
                if (n.length) {
                  return n;
                } else {
                  return slides();
                }
                break;
              case RIGHT_ARROW:
              case PAGE_DOWN:
                n = cur.next('[slide]').not('[leisureSection="Leisure Controls"]');
                if (n.length) {
                  return n;
                } else {
                  return slides().last();
                }
            }
          })();
          hideSlide(cur);
          return showSlide(next);
        }
      }
    }
  };

  slides = function slides() {
    return $('[slide]').not('[leisureSection="Leisure Controls"]').not('.hiddenPage');
  };

  nthSlide = function nthSlide(n) {
    return slides().slice(n);
  };

  countSlide = function countSlide(el) {
    var count, n, slide, _i, _len, _ref;
    n = -1;
    count = 0;
    _ref = slides();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      slide = _ref[_i];
      count++;
      if (slide === el) n = count;
    }
    return [n, count];
  };

  showSlide = function showSlide(el) {
    var count, n, _ref;
    _ref = countSlide(el[0]), n = _ref[0], count = _ref[1];
    oldSlide = n;
    $('#slide-num').html("" + n + " / " + count);
    return $(el).first().removeClass('hidden').addClass('showing');
  };

  hideSlide = function hideSlide(el) {
    return $(el).first().addClass('hidden').removeClass('showing');
  };

  markupElement = function markupElement(el, md) {
    var code, codePos, len, lex, markup, node, prev, prevCodePos, range, slide, _i, _len, _ref, _ref2, _ref3;
    len = md.length;
    slide = (_ref = md.match(slidePat)) != null ? _ref : '';
    _ref2 = window.marked((slide ? md.slice(slide[0].length) : md), {
      saveLex: true,
      gfm: true
    }), markup = _ref2[0], lex = _ref2[1];
    el.innerHTML = markup.trim() || '<br>';
    prev = null;
    range = document.createRange();
    prevCodePos = -1;
    codePos = 0;
    _ref3 = el.querySelectorAll('code');
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      node = _ref3[_i];
      while (lex[codePos].type !== 'code') {
        codePos++;
      }
      if (node.parentNode.tagName !== 'PRE') {
        code = node;
      } else {
        code = node.parentNode;
        code.innerHTML = node.innerHTML;
      }
      code.setAttribute('noLeisureBar', '');
      code.setAttribute('leisureNode', 'code');
      code.md = lex[codePos].text;
      if (code.parentNode.firstChild !== code) {
        if (prev === null || prev.parentNode !== code.parentNode) {
          range.setStart(code.parentNode, 0);
        } else {
          range.setStartAfter(prev);
        }
        range.setEndBefore(code);
        makeMarkupDiv(range, md.substring((prevCodePos === -1 ? 0 : len - lex[prevCodePos].remain), len - lex[codePos].remain - lex[codePos].textLen));
      }
      prevCodePos = codePos;
      codePos++;
      prev = code;
    }
    if (prevCodePos > -1) {
      if (lex[prevCodePos].remain > 0) {
        range.selectNodeContents(prev.parentNode);
        range.setStartAfter(prev);
        makeMarkupDiv(range, md.substring(len - lex[prevCodePos].remain));
      }
    } else {
      range.selectNodeContents(el);
      makeMarkupDiv(range, md);
    }
    return prevCodePos > -1;
  };

  handleInternalSections = function handleInternalSections(content) {
    var before, firstSlide, innerSections, marker, node, nodeContent, nodeTitle, prev, section, sectionHolder, title, _i, _j, _len, _len2, _ref;
    section = content.parentNode;
    sectionHolder = section.parentNode;
    innerSections = section.querySelectorAll('[leisureSection]');
    if (innerSections.length === 0) {
      if (!((_ref = content.firstChild.md) != null ? _ref.match(/^\*\*\*/) : void 0)) {
        if (!section.previousSibling) {
          return section.setAttribute('leisureSection', 'Main');
        } else {
          prev = section.previousSibling.querySelector('.pageContent');
          while (content.firstChild) {
            mergeUp(content.firstChild, prev);
          }
          return remove(section);
        }
      }
    } else {
      title = section.getAttribute('leisureSection');
      firstSlide = !section.previousSibling || section.previousSibling.getAttribute('leisureSection') === 'Leisure Controls';
      before = false;
      for (_i = 0, _len = innerSections.length; _i < _len; _i++) {
        node = innerSections[_i];
        if (node.getAttribute('leisureSection') === title) {
          before = true;
          break;
        }
      }
      before = before || (!innerSections[0].previousSibling);
      marker = section;
      for (_j = 0, _len2 = innerSections.length; _j < _len2; _j++) {
        node = innerSections[_j];
        nodeTitle = node.getAttribute('leisureSection');
        nodeContent = node.querySelector('.pageContent');
        if (nodeTitle === title || (node.previousSibling && nodeTitle === 'Main')) {
          if (nodeTitle === title) before = false;
          while (nodeContent.firstChild) {
            content.insertBefore(nodeContent.firstChild, node);
            mergeLeisureCode(node.previousSibling, node);
          }
          remove(node);
        } else {
          while (node.nextSibling && !node.nextSibling.getAttribute('leisureSection')) {
            mergeUp(node.nextSibling, nodeContent);
          }
          padSlide(nodeContent, "***" + nodeTitle + "\n");
          if (before) {
            section.parentNode.insertBefore(node, section);
          } else {
            section.parentNode.insertBefore(node, marker.nextSibling);
            marker = node;
          }
        }
      }
      if (!content.firstChild) {
        return remove(section);
      } else {
        return padSlide(content, "***" + title + "\n");
      }
    }
  };

  mergeUp = function mergeUp(el, newParent) {
    newParent.appendChild(el);
    return mergeLeisureCode(newParent.lastChild.previousSibling, newParent.lastChild);
  };

  makeSection = function makeSection(title, node, next) {
    var div;
    div = createNode("<div leisureSection='" + title + "'></div>");
    node.parentNode.insertBefore(div, node);
    while (div.nextSibling && div.nextSibling !== next) {
      div.appendChild(div.nextSibling);
    }
    return div;
  };

  makeMarkupDiv = function makeMarkupDiv(range, md) {
    var div;
    div = document.createElement('div');
    range.surroundContents(div);
    div.md = md;
    bindMarkupDiv(div);
    return div;
  };

  bindMarkupDiv = function bindMarkupDiv(div) {
    var editing;
    div.bound = true;
    div.setAttribute('leisureNode', 'markdown');
    div.setAttribute('contenteditable', 'false');
    editing = false;
    div.addEventListener('dblclick', function(e) {
      if (!editing) {
        div.innerHTML = '';
        div.appendChild(textNode(div.md));
        div.style.whiteSpace = 'pre-wrap';
        div.setAttribute('contenteditable', 'true');
        editing = true;
        return div.focus();
      }
    });
    div.addEventListener('keypress', function(e) {
      var br, r, s;
      if (editing) {
        s = window.getSelection();
        r = s.getRangeAt(0);
        if ((e.charCode || e.keyCode || e.which) === ENTER) {
          br = textNode('\n');
          r.insertNode(br);
          r = document.createRange();
          r.setStart(br, 1);
          s.removeAllRanges();
          s.addRange(r);
          return e.preventDefault();
        }
      }
    });
    return div.addEventListener('blur', function(e) {
      var first, frag, last, node, parent, prevSection, r, scroll, _i, _len, _ref, _ref2;
      if (editing) {
        scroll = document.body.scrollTop;
        div.style.whiteSpace = '';
        editing = false;
        div.setAttribute('contenteditable', 'false');
        prevSection = (_ref = div.parentNode.parentNode.previousSibling) != null ? _ref.getAttribute('leisureSection') : void 0;
        parent = div.parentNode;
        if (markupSlideContent(div, div.textContent, prevSection && prevSection !== 'Leisure Controls')) {
          _ref2 = div.querySelectorAll("[leisurenode='code']");
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            node = _ref2[_i];
            presentLeisureCode(node, true);
          }
        } else if (div.textContent.trim() === '') {
          cleanEmptyNodes(div);
        }
        r = document.createRange();
        r.selectNodeContents(div);
        frag = r.extractContents();
        first = frag.childNodes[0];
        last = frag.childNodes[frag.childNodes.length - 1];
        parent.replaceChild(frag, div);
        mergeLeisureCode(previousSibling(first), first);
        mergeLeisureCode(last, nextSibling(last));
        handleInternalSections(parent);
        return delay(function() {
          return document.body.scrollTop = scroll;
        });
      }
    });
  };

  Notebook.markupElement = markupElement;

}).call(this);
