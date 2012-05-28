var parseAst = (function(){
var root;

if ((typeof window !== 'undefined' && window !== null) && (!(typeof global !== 'undefined' && global !== null) || global === window)) {
  parseAst = root = {};
  global = window;
} else {
  root = typeof exports !== 'undefined' && exports !== null ? exports : this;
  Leisure = require('./leisure');
  Leisure.req('./std');
  require('./prim');
  ReplCore = require('./replCore');
  Repl = require('./repl');
}
root.defs = {};
root.tokenDefs = [];
root.macros = {};

var setType = Leisure.setType;
var setDataType = Leisure.setDataType;
var define = Leisure.define;
var defineMacro = Leisure.defineMacro;
var defineToken = Leisure.defineToken;
var processResult = Repl.processResult;

var _make$_node, _node$_svg, _node$_width, _node$_height, _node$_root$_x, _node$_root$_y, _node$_set$_svg, _node$_set$_width, _node$_set$_height, _node$_set$_root$_x, _node$_set$_root$_y, _node$_translate, _node$_line, _treeFor, _nodeFor, _redStyle, _greenStyle, _blueStyle, _createLambdaNode, _createApplyNode, _createRefNode, _createLitNode, _textNode, _typeof;
//make-node = AST(\svg width height root-x root-y f . f svg width height root-x root-y)
root.defs._make$_node = _make$_node = define('make-node', setDataType(function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return setType(function(_f){return _f()(_svg)(_width)(_height)(_root$_x)(_root$_y)}, 'make-node')}}}}}, 'make-node'), 5, "\\svg. \\width. \\height. \\root-x. \\root-y. \\f . f svg width height root-x root-y");
;
//node-svg = AST(\st . st \svg width height root-x root-y . svg)
root.defs._node$_svg = _node$_svg = define('node-svg', function(_st){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _svg()}}}}}))}})())}, 1, "\\st. st \\svg width height root-x root-y . svg");
;
//node-width = AST(\st . st \svg width height root-x root-y . width)
root.defs._node$_width = _node$_width = define('node-width', function(_st){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _width()}}}}}))}})())}, 1, "\\st. st \\svg width height root-x root-y . width");
;
//node-height = AST(\st . st \svg width height root-x root-y . height)
root.defs._node$_height = _node$_height = define('node-height', function(_st){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _height()}}}}}))}})())}, 1, "\\st. st \\svg width height root-x root-y . height");
;
//node-root-x = AST(\st . st \svg width height root-x root-y . root-x)
root.defs._node$_root$_x = _node$_root$_x = define('node-root-x', function(_st){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _root$_x()}}}}}))}})())}, 1, "\\st. st \\svg width height root-x root-y . root-x");
;
//node-root-y = AST(\st . st \svg width height root-x root-y . root-y)
root.defs._node$_root$_y = _node$_root$_y = define('node-root-y', function(_st){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _root$_y()}}}}}))}})())}, 1, "\\st. st \\svg width height root-x root-y . root-y");
;
//node-set-svg = AST(\st value . st \svg width height root-x root-y . make-node value width height root-x root-y)
root.defs._node$_set$_svg = _node$_set$_svg = define('node-set-svg', function(_st){return function(_value){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _make$_node()(_value)(_width)(_height)(_root$_x)(_root$_y)}}}}}))}})())}}, 2, "\\st. \\value. st \\svg width height root-x root-y . make-node value width height root-x root-y");
;
//node-set-width = AST(\st value . st \svg width height root-x root-y . make-node svg value height root-x root-y)
root.defs._node$_set$_width = _node$_set$_width = define('node-set-width', function(_st){return function(_value){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _make$_node()(_svg)(_value)(_height)(_root$_x)(_root$_y)}}}}}))}})())}}, 2, "\\st. \\value. st \\svg width height root-x root-y . make-node svg value height root-x root-y");
;
//node-set-height = AST(\st value . st \svg width height root-x root-y . make-node svg width value root-x root-y)
root.defs._node$_set$_height = _node$_set$_height = define('node-set-height', function(_st){return function(_value){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _make$_node()(_svg)(_width)(_value)(_root$_x)(_root$_y)}}}}}))}})())}}, 2, "\\st. \\value. st \\svg width height root-x root-y . make-node svg width value root-x root-y");
;
//node-set-root-x = AST(\st value . st \svg width height root-x root-y . make-node svg width height value root-y)
root.defs._node$_set$_root$_x = _node$_set$_root$_x = define('node-set-root-x', function(_st){return function(_value){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _make$_node()(_svg)(_width)(_height)(_value)(_root$_y)}}}}}))}})())}}, 2, "\\st. \\value. st \\svg width height root-x root-y . make-node svg width height value root-y");
;
//node-set-root-y = AST(\st value . st \svg width height root-x root-y . make-node svg width height root-x value)
root.defs._node$_set$_root$_y = _node$_set$_root$_y = define('node-set-root-y', function(_st){return function(_value){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _make$_node()(_svg)(_width)(_height)(_root$_x)(_value)}}}}}))}})())}}, 2, "\\st. \\value. st \\svg width height root-x root-y . make-node svg width height root-x value");
;
//node-translate = AST(\st x y . st \svg width height root-x root-y . make-node (translate svg x y) width height (+ root-x x) (+ root-y y))
root.defs._node$_translate = _node$_translate = define('node-translate', function(_st){return function(_x){return function(_y){return _st()((function(){var $m; return function(){return $m || ($m = (function(_svg){return function(_width){return function(_height){return function(_root$_x){return function(_root$_y){return _make$_node()((function(){var $m; return function(){return $m || ($m = (_translate()(_svg)(_x)(_y)))}})())(_width)(_height)((function(){var $m; return function(){return $m || ($m = (_$o()(_root$_x)(_x)))}})())((function(){var $m; return function(){return $m || ($m = (_$o()(_root$_y)(_y)))}})())}}}}}))}})())}}}, 3, "\\st. \\x. \\y. st \\svg width height root-x root-y . make-node\n  translate svg x y\n  width\n  height\n  + root-x x\n  + root-y y");
;
//node-line = AST(\n1 n2 . n1 \s1 w1 h1 x1 y1 . n2 \s2 w2 h2 x2 y2 . line ([ ([ x1 | x1 ]) , ([ y1 | y1 ]) , ([ x2 | x2 ]) , ([ y2 | y2 ]) | default-line-map ]))
root.defs._node$_line = _node$_line = define('node-line', function(_n1){return function(_n2){return _n1()((function(){var $m; return function(){return $m || ($m = (function(_s1){return function(_w1){return function(_h1){return function(_x1){return function(_y1){return _n2()((function(){var $m; return function(){return $m || ($m = (function(_s2){return function(_w2){return function(_h2){return function(_x2){return function(_y2){return _line()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "x1"}))(_$q)(_x1)(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "y1"}))(_$q)(_y1)(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "x2"}))(_$q)(_x2)(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "y2"}))(_$q)(_y2)(_$s)))}})())(_$q)(_default$_line$_map)(_$s)))}})())}}}}}))}})())}}}}}))}})())}}, 2, "\\n1. \\n2. n1 \\s1 w1 h1 x1 y1 . n2 \\s2 w2 h2 x2 y2 .\n  line [['x1'|x1],['y1'|y1],['x2'|x2],['y2'|y2]|default-line-map]");
;
//treeFor = AST(\ast . node-svg (nodeFor ast))
root.defs._treeFor = _treeFor = define('treeFor', function(_ast){return _node$_svg()((function(){var $m; return function(){return $m || ($m = (_nodeFor()(_ast)))}})())}, 1, "\\ast. node-svg (nodeFor ast)");
;
//nodeFor = AST(\ast . (\t . eq t lit (createLitNode (pretty (ast id))) (eq t ref (createRefNode (pretty (ast id))) (eq t lambda (ast \v b . createLambdaNode v b) (eq t apply (ast \f a . createApplyNode f a) (make-node (svg-node ) 0 0 0 0))))) (typeof ast))
root.defs._nodeFor = _nodeFor = define('nodeFor', function(_ast){return function(_t){return _eq()(_t)((function(){return "lit"}))((function(){var $m; return function(){return $m || ($m = (_createLitNode()((function(){var $m; return function(){return $m || ($m = (_pretty()((function(){var $m; return function(){return $m || ($m = (_ast()(_id)))}})())))}})())))}})())((function(){var $m; return function(){return $m || ($m = (_eq()(_t)((function(){return "ref"}))((function(){var $m; return function(){return $m || ($m = (_createRefNode()((function(){var $m; return function(){return $m || ($m = (_pretty()((function(){var $m; return function(){return $m || ($m = (_ast()(_id)))}})())))}})())))}})())((function(){var $m; return function(){return $m || ($m = (_eq()(_t)((function(){return "lambda"}))((function(){var $m; return function(){return $m || ($m = (_ast()((function(){var $m; return function(){return $m || ($m = (function(_v){return function(_b){return _createLambdaNode()(_v)(_b)}}))}})())))}})())((function(){var $m; return function(){return $m || ($m = (_eq()(_t)((function(){return "apply"}))((function(){var $m; return function(){return $m || ($m = (_ast()((function(){var $m; return function(){return $m || ($m = (function(_f){return function(_a){return _createApplyNode()(_f)(_a)}}))}})())))}})())((function(){var $m; return function(){return $m || ($m = (_make$_node()((function(){var $m; return function(){return $m || ($m = (_svg$_node()((function(){return ""}))))}})())((function(){return 0}))((function(){return 0}))((function(){return 0}))((function(){return 0}))))}})())))}})())))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_typeof()(_ast)))}})())}, 1, "\\ast. do\n  t = typeof ast\n  eq t 'lit'\n    createLitNode (pretty (ast id))\n    eq t 'ref'\n      createRefNode (pretty (ast id))\n      eq t 'lambda'\n        ast (\\v b . createLambdaNode v b)\n        eq t 'apply'\n          ast (\\f a . createApplyNode f a)\n          make-node (svg-node '') 0 0 0 0");
;
//redStyle = AST([ ([ stroke | black ]) , ([ stroke-width | 2 ]) , ([ fill | red ]) , ([ rx | 8 ]) , ([ ry | 8 ]) ])
root.defs._redStyle = _redStyle = define('redStyle', _$r()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "stroke"}))(_$q)((function(){return "black"}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "stroke-width"}))(_$q)((function(){return 2}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "fill"}))(_$q)((function(){return "red"}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "rx"}))(_$q)((function(){return 8}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "ry"}))(_$q)((function(){return 8}))(_$s)))}})())(_$s), 0, "[['stroke'|'black'],['stroke-width'|2],['fill'|'red'],['rx'|8],['ry'|8] ]");
;
//greenStyle = AST([ ([ stroke | black ]) , ([ stroke-width | 2 ]) , ([ fill | green ]) , ([ rx | 8 ]) , ([ ry | 8 ]) ])
root.defs._greenStyle = _greenStyle = define('greenStyle', _$r()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "stroke"}))(_$q)((function(){return "black"}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "stroke-width"}))(_$q)((function(){return 2}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "fill"}))(_$q)((function(){return "green"}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "rx"}))(_$q)((function(){return 8}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "ry"}))(_$q)((function(){return 8}))(_$s)))}})())(_$s), 0, "[['stroke'|'black'],['stroke-width'|2],['fill'|'green'],['rx'|8],['ry'|8] ]");
;
//blueStyle = AST([ ([ stroke | black ]) , ([ stroke-width | 2 ]) , ([ fill | blue ]) , ([ rx | 8 ]) , ([ ry | 8 ]) ])
root.defs._blueStyle = _blueStyle = define('blueStyle', _$r()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "stroke"}))(_$q)((function(){return "black"}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "stroke-width"}))(_$q)((function(){return 2}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "fill"}))(_$q)((function(){return "blue"}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "rx"}))(_$q)((function(){return 8}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "ry"}))(_$q)((function(){return 8}))(_$s)))}})())(_$s), 0, "[['stroke'|'black'],['stroke-width'|2],['fill'|'blue'],['rx'|8],['ry'|8] ]");
;
//createLambdaNode = AST(\v b . (\rootBox . (\varBox . (\bodyTree . (\childWidth . (\totalWidth . (\pad . (\rootBox . (\varBox . (\bodyTree . make-node (svg-concat ([ (node-line rootBox varBox) , (node-line rootBox bodyTree) , (node-svg varBox) , (node-svg bodyTree) , (node-svg rootBox) ])) totalWidth (+ (+ (node-height rootBox) 5) (max (node-height varBox) (node-height bodyTree))) (/ totalWidth 2) (/ (node-height rootBox) 2)) (node-translate bodyTree (+ pad (+ (node-width varBox) 5)) (+ (node-height rootBox) 5))) (node-translate varBox pad (+ (node-height rootBox) 5))) (node-translate rootBox (- (/ totalWidth 2) (/ (node-width rootBox) 2)) 0)) (max 0 (/ (- totalWidth childWidth) 2))) (max childWidth (node-width rootBox))) (+ (+ (node-width varBox) 5) (node-width bodyTree))) (nodeFor b)) (textNode greenStyle v)) (textNode greenStyle lambda))
root.defs._createLambdaNode = _createLambdaNode = define('createLambdaNode', function(_v){return function(_b){return function(_rootBox){return function(_varBox){return function(_bodyTree){return function(_childWidth){return function(_totalWidth){return function(_pad){return function(_rootBox){return function(_varBox){return function(_bodyTree){return _make$_node()((function(){var $m; return function(){return $m || ($m = (_svg$_concat()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){var $m; return function(){return $m || ($m = (_node$_line()(_rootBox)(_varBox)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_node$_line()(_rootBox)(_bodyTree)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_node$_svg()(_varBox)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_node$_svg()(_bodyTree)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_node$_svg()(_rootBox)))}})())(_$s)))}})())))}})())(_totalWidth)((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_rootBox)))}})())((function(){return 5}))))}})())((function(){var $m; return function(){return $m || ($m = (_max()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_varBox)))}})())((function(){var $m; return function(){return $m || ($m = (_node$_height()(_bodyTree)))}})())))}})())))}})())((function(){var $m; return function(){return $m || ($m = (_$f()(_totalWidth)((function(){return 2}))))}})())((function(){var $m; return function(){return $m || ($m = (_$f()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_rootBox)))}})())((function(){return 2}))))}})())}((function(){var $m; return function(){return $m || ($m = (_node$_translate()(_bodyTree)((function(){var $m; return function(){return $m || ($m = (_$o()(_pad)((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_width()(_varBox)))}})())((function(){return 5}))))}})())))}})())((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_rootBox)))}})())((function(){return 5}))))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_node$_translate()(_varBox)(_pad)((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_rootBox)))}})())((function(){return 5}))))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_node$_translate()(_rootBox)((function(){var $m; return function(){return $m || ($m = (_$_()((function(){var $m; return function(){return $m || ($m = (_$f()(_totalWidth)((function(){return 2}))))}})())((function(){var $m; return function(){return $m || ($m = (_$f()((function(){var $m; return function(){return $m || ($m = (_node$_width()(_rootBox)))}})())((function(){return 2}))))}})())))}})())((function(){return 0}))))}})())}((function(){var $m; return function(){return $m || ($m = (_max()((function(){return 0}))((function(){var $m; return function(){return $m || ($m = (_$f()((function(){var $m; return function(){return $m || ($m = (_$_()(_totalWidth)(_childWidth)))}})())((function(){return 2}))))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_max()(_childWidth)((function(){var $m; return function(){return $m || ($m = (_node$_width()(_rootBox)))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_width()(_varBox)))}})())((function(){return 5}))))}})())((function(){var $m; return function(){return $m || ($m = (_node$_width()(_bodyTree)))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_nodeFor()(_b)))}})())}((function(){var $m; return function(){return $m || ($m = (_textNode()(_greenStyle)(_v)))}})())}((function(){var $m; return function(){return $m || ($m = (_textNode()(_greenStyle)((function(){return "lambda"}))))}})())}}, 2, "\\v. \\b. do\n  rootBox = textNode greenStyle 'lambda'\n  varBox = textNode greenStyle v\n  bodyTree = nodeFor b\n  childWidth = + (+ (node-width varBox) 5) (node-width bodyTree)\n  totalWidth = max childWidth (node-width rootBox)\n  pad = max 0 (/ (- totalWidth childWidth) 2)\n  rootBox = node-translate rootBox (- (/ totalWidth 2) (/ (node-width rootBox) 2)) 0\n  varBox = node-translate varBox pad (+ (node-height rootBox) 5)\n  bodyTree = node-translate bodyTree (+ pad (+ (node-width varBox) 5)) (+ (node-height rootBox) 5)\n  make-node\n    svg-concat [(node-line rootBox varBox), (node-line rootBox bodyTree), (node-svg varBox),(node-svg bodyTree),(node-svg rootBox)]\n    totalWidth\n    + (+ (node-height rootBox) 5) (max (node-height varBox) (node-height bodyTree))\n    / totalWidth 2\n    / (node-height rootBox) 2");
;
//createApplyNode = AST(\f a . (\rootBox . (\funcTree . (\argTree . (\childWidth . (\totalWidth . (\pad . (\rootBox . (\argTree . (\funcTree . make-node (svg-concat ([ (node-line rootBox funcTree) , (node-line rootBox argTree) , (node-svg rootBox) , (node-svg funcTree) , (node-svg argTree) ])) totalWidth (+ (+ (node-height rootBox) 5) (max (node-height argTree) (node-height funcTree))) (/ totalWidth 2) (/ (node-height rootBox) 2)) (node-translate funcTree (+ pad (+ (node-width argTree) 5)) (+ (node-height rootBox) 5))) (node-translate argTree pad (+ (node-height rootBox) 5))) (node-translate rootBox (- (/ totalWidth 2) (/ (node-width rootBox) 2)) 0)) (max 0 (/ (- totalWidth childWidth) 2))) (max childWidth (node-width rootBox))) (+ (+ (node-width argTree) 5) (node-width funcTree))) (nodeFor a)) (nodeFor f)) (textNode blueStyle apply))
root.defs._createApplyNode = _createApplyNode = define('createApplyNode', function(_f){return function(_a){return function(_rootBox){return function(_funcTree){return function(_argTree){return function(_childWidth){return function(_totalWidth){return function(_pad){return function(_rootBox){return function(_argTree){return function(_funcTree){return _make$_node()((function(){var $m; return function(){return $m || ($m = (_svg$_concat()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){var $m; return function(){return $m || ($m = (_node$_line()(_rootBox)(_funcTree)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_node$_line()(_rootBox)(_argTree)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_node$_svg()(_rootBox)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_node$_svg()(_funcTree)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_node$_svg()(_argTree)))}})())(_$s)))}})())))}})())(_totalWidth)((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_rootBox)))}})())((function(){return 5}))))}})())((function(){var $m; return function(){return $m || ($m = (_max()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_argTree)))}})())((function(){var $m; return function(){return $m || ($m = (_node$_height()(_funcTree)))}})())))}})())))}})())((function(){var $m; return function(){return $m || ($m = (_$f()(_totalWidth)((function(){return 2}))))}})())((function(){var $m; return function(){return $m || ($m = (_$f()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_rootBox)))}})())((function(){return 2}))))}})())}((function(){var $m; return function(){return $m || ($m = (_node$_translate()(_funcTree)((function(){var $m; return function(){return $m || ($m = (_$o()(_pad)((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_width()(_argTree)))}})())((function(){return 5}))))}})())))}})())((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_rootBox)))}})())((function(){return 5}))))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_node$_translate()(_argTree)(_pad)((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_height()(_rootBox)))}})())((function(){return 5}))))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_node$_translate()(_rootBox)((function(){var $m; return function(){return $m || ($m = (_$_()((function(){var $m; return function(){return $m || ($m = (_$f()(_totalWidth)((function(){return 2}))))}})())((function(){var $m; return function(){return $m || ($m = (_$f()((function(){var $m; return function(){return $m || ($m = (_node$_width()(_rootBox)))}})())((function(){return 2}))))}})())))}})())((function(){return 0}))))}})())}((function(){var $m; return function(){return $m || ($m = (_max()((function(){return 0}))((function(){var $m; return function(){return $m || ($m = (_$f()((function(){var $m; return function(){return $m || ($m = (_$_()(_totalWidth)(_childWidth)))}})())((function(){return 2}))))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_max()(_childWidth)((function(){var $m; return function(){return $m || ($m = (_node$_width()(_rootBox)))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_$o()((function(){var $m; return function(){return $m || ($m = (_node$_width()(_argTree)))}})())((function(){return 5}))))}})())((function(){var $m; return function(){return $m || ($m = (_node$_width()(_funcTree)))}})())))}})())}((function(){var $m; return function(){return $m || ($m = (_nodeFor()(_a)))}})())}((function(){var $m; return function(){return $m || ($m = (_nodeFor()(_f)))}})())}((function(){var $m; return function(){return $m || ($m = (_textNode()(_blueStyle)((function(){return "apply"}))))}})())}}, 2, "\\f. \\a. do\n  rootBox = textNode blueStyle 'apply'\n  funcTree = nodeFor f\n  argTree = nodeFor a\n  childWidth = + (+ (node-width argTree) 5) (node-width funcTree)\n  totalWidth = max childWidth (node-width rootBox)\n  pad = max 0 (/ (- totalWidth childWidth) 2)\n  rootBox = node-translate rootBox (- (/ totalWidth 2) (/ (node-width rootBox) 2)) 0\n  argTree = node-translate argTree pad (+ (node-height rootBox) 5)\n  funcTree = node-translate funcTree (+ pad (+ (node-width argTree) 5)) (+ (node-height rootBox) 5)\n  make-node\n    svg-concat [(node-line rootBox funcTree), (node-line rootBox argTree), (node-svg rootBox), (node-svg funcTree), (node-svg argTree)]\n    totalWidth\n    + (+ (node-height rootBox) 5) (max (node-height argTree) (node-height funcTree))\n    / totalWidth 2\n    / (node-height rootBox) 2");
;
//createRefNode = AST(\ref . textNode redStyle ref)
root.defs._createRefNode = _createRefNode = define('createRefNode', function(_ref){return _textNode()(_redStyle)(_ref)}, 1, "\\ref. textNode redStyle ref");
;
//createLitNode = AST(\lit . textNode greenStyle lit)
root.defs._createLitNode = _createLitNode = define('createLitNode', function(_lit){return _textNode()(_greenStyle)(_lit)}, 1, "\\lit. textNode greenStyle lit");
;
//textNode = AST(\map txt . svg-measure-text txt  \w h . (\node-w . (\node-h . make-node (svg-concat ([ (rect ([ ([ x | 2 ]) , ([ y | 2 ]) , ([ width | node-w ]) , ([ height | node-h ]) | map ])) , (text txt ([ ([ text-anchor | middle ]) , ([ dominant-baseline | mathematical ]) , ([ x | (+ 14 (/ w 2)) ]) , ([ y | (+ 5 (/ h 2)) ]) ])) ])) node-w node-h (/ node-w 2) (/ node-h 2)) (+ h 14)) (+ w 24))
root.defs._textNode = _textNode = define('textNode', function(_map){return function(_txt){return _svg$_measure$_text()(_txt)((function(){return ""}))((function(){var $m; return function(){return $m || ($m = (function(_w){return function(_h){return function(_node$_w){return function(_node$_h){return _make$_node()((function(){var $m; return function(){return $m || ($m = (_svg$_concat()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){var $m; return function(){return $m || ($m = (_rect()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "x"}))(_$q)((function(){return 2}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "y"}))(_$q)((function(){return 2}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "width"}))(_$q)(_node$_w)(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "height"}))(_$q)(_node$_h)(_$s)))}})())(_$q)(_map)(_$s)))}})())))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_text()(_txt)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "text-anchor"}))(_$q)((function(){return "middle"}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "dominant-baseline"}))(_$q)((function(){return "mathematical"}))(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "x"}))(_$q)((function(){var $m; return function(){return $m || ($m = (_$o()((function(){return 14}))((function(){var $m; return function(){return $m || ($m = (_$f()(_w)((function(){return 2}))))}})())))}})())(_$s)))}})())(_$b)((function(){var $m; return function(){return $m || ($m = (_$r()((function(){return "y"}))(_$q)((function(){var $m; return function(){return $m || ($m = (_$o()((function(){return 5}))((function(){var $m; return function(){return $m || ($m = (_$f()(_h)((function(){return 2}))))}})())))}})())(_$s)))}})())(_$s)))}})())))}})())(_$s)))}})())))}})())(_node$_w)(_node$_h)((function(){var $m; return function(){return $m || ($m = (_$f()(_node$_w)((function(){return 2}))))}})())((function(){var $m; return function(){return $m || ($m = (_$f()(_node$_h)((function(){return 2}))))}})())}((function(){var $m; return function(){return $m || ($m = (_$o()(_h)((function(){return 14}))))}})())}((function(){var $m; return function(){return $m || ($m = (_$o()(_w)((function(){return 24}))))}})())}}))}})())}}, 2, "\\map. \\txt. (svg-measure-text txt '') \\w h . do\n  node-w = + w 24\n  node-h = + h 14\n  make-node\n    (svg-concat [(rect [['x'|2],['y'|2],['width'|node-w],['height'|node-h] | map]), (text txt [['text-anchor'|\"middle\"],['dominant-baseline'|\"mathematical\"],['x'|(+ 14 (/ w 2))],['y'|(+ 5 (/ h 2))]])])\n    node-w\n    node-h\n    / node-w 2\n    / node-h 2");
;
//typeof = AST(\x . getType x id false)
root.defs._typeof = _typeof = define('typeof', function(_x){return _getType()(_x)(_id)(_false)}, 1, "\\x. getType x id false");
;

if (typeof window !== 'undefined' && window !== null) {
  Leisure.processTokenDefs(root.tokenDefs);
}
return root;
}).call(this)