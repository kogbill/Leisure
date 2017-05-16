###
Copyright (C) 2013, Bill Burdick, Tiny Concepts: https://github.com/zot/Leisure

(licensed with ZLIB license)

This software is provided 'as-is', without any express or implied
warranty. In no event will the authors be held liable for any damages
arising from the use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not
claim that you wrote the original software. If you use this software
in a product, an acknowledgment in the product documentation would be
appreciated but is not required.

2. Altered source versions must be plainly marked as such, and must not be
misrepresented as being the original software.

3. This notice may not be removed or altered from any source distribution.
###

'use strict'
define ['./base', './ast', './runtime', 'lodash', 'lib/source-map', 'browser-source-map-support', 'lib/js-yaml'], (Base, Ast, Runtime, _, SourceMap, SourceMapSupport, Yaml)->
  SourceMapSupport?.install()
  {
    simpyCons,
    resolve,
    lazy,
    verboseMsg,
    nsLog,
  } = Base
  {
    dump
  } = Yaml
  rz = resolve
  lz = lazy
  lc = Leisure_call
  {
    nameSub,
    getLitVal,
    getRefName,
    getLambdaVar,
    getLambdaBody,
    getApplyFunc,
    getApplyArg,
    getAnnoName,
    getAnnoData,
    getAnnoBody,
    getLetName,
    getLetValue,
    getLetBody,
    Leisure_lit,
    Leisure_ref,
    Leisure_lambda,
    Leisure_apply,
    Leisure_let,
    Leisure_anno,
    setType,
    setDataType,
    cons,
    Nil,
    define,
    functionInfo,
    getPos,
    isNil,
    getType
    ast2Json
    rangeToJson
    getPos
  } = root = Ast
  {
    Monad2
    _true
    _false
    _unit
    left
    right
    booleanFor
    newConsFrom
    dumpMonadStack
  } = Runtime

  consFrom = newConsFrom

  {
    SourceNode
    SourceMapConsumer
    SourceMapGenerator
  } = SourceMap

  varNameSub = (n)-> "L_#{nameSub n}"

  useArity = true
  megaArity = false
  curDef = null
  trace = false
  trace = true
  stackSize = 20
  useThunkStacks = false
  USE_STRICT = '"use strict";\n'
  #USE_STRICT = ''

  setMegaArity = (setting)-> megaArity = setting

#########
# Code
#########

  collectArgs = (args, result)->
    for i in args
      if Array.isArray i then collectArgs i, result else result.push i
    result

  locateAst = (ast)->
    [line, col] = pos = getPos(ast).toArray()
    [line,col]

  check = (bool, arg)->
    if !bool then console.log new Error("Bad sourcemap arg: #{arg}").stack

  checkChild = (child)->
    if Array.isArray child
      child.forEach checkChild
    else check (typeof child == 'string') || (child instanceof SourceNode), child

  currentFile = 'NEVERGIVENFILE.lsr'
  currentFuncName = undefined

  withFile = (file, name, block)->
    oldFileName = currentFile
    oldFuncName = currentFuncName
    currentFile = file
    currentFuncName = name
    try
      block()
    finally
      currentFile = oldFileName
      currentFuncName = oldFuncName

  sn = (ast, str...)->
    [line, offset] = locateAst ast
    check typeof line == 'number', 'line'
    check typeof offset == 'number', 'offset'
    checkChild str
    if line < 1 then line = 1
    if currentFile == 'NEVERGIVENFILE.lsr' then console.log new Error("SN CALLED WITHOUT FILE").stack
    if currentFuncName?
      new SourceNode(line, offset, currentFile, str, currentFuncName)
    else new SourceNode(line, offset, currentFile, str)

  jsCodeFor = (codeMap)->
    "#{codeMap.code}\n//# sourceMappingURL=data:application/json;base64,#{btoa JSON.stringify codeMap.map.toJSON()}\n"

  functionId = 0
  codeNum = 0

  class CodeGenerator
    constructor: (fileName, @useContext, @noFile)->
      @fileName = fileName ? "dynamic code with source #{++codeNum}"
      @startId = functionId
      @funcInfo = []
    contextInit: ->
      if @useContext then '\n  L_$F.context = L_$context;'
      else ''
    addFunc: (ast)->
      @funcInfo.push
        type: 'function'
        id: functionId
        srcRange: rangeToJson getPos ast
      functionId++
    addSubfunc: (id, index, ast)->
      @funcInfo.push
        type: 'subfuncion'
        id: functionId
        primaryId: id
        index: index
      functionId++
    genSource: (source, ast)->
      if @noFile
        sm = @genNode(ast).prepend(USE_STRICT + '(').add(')').toStringWithSourceMap file: @fileName
        map = JSON.parse sm.map.toString()
        result = sm.code
      else
        funcName = if ast instanceof Leisure_anno && getAnnoName(ast) == 'leisureName' then getAnnoData ast else null
        #fileName = "dynamic code with source #{++codeNum}"
        withFile @fileName, funcName, =>
          try
            sm = @genNode(ast).toStringWithSourceMap file: @fileName
            map = JSON.parse sm.map.toString()
            map.sourcesContent =  [source]
            result = sm.code
          catch err
            err.message = "Error generating code for:\n  #{source.trim().replace /\n/g, '\n  '}\n#{err.message}"
            throw err
      @endId = functionId
      "#{result}\n//# sourceMappingURL=data:application/json;utf-8;base64,#{btoa JSON.stringify map}\n"
    genNode: (ast)->
      result = @genUniq ast, Nil, [Nil, 0]
      @endId = functionId
      result
    genMap: (ast)->
      hasFile = ast instanceof Leisure_anno && getAnnoName(ast) == 'filename'
      #filename = if hasFile then getAnnoData ast else 'GENFORUNKNOWNFILE.lsr'
      filename = if hasFile then getAnnoData ast else @fileName
      nameAst = if hasFile then getAnnoBody ast else null
      funcname = if nameAst instanceof Leisure_anno && getAnnoName(nameAst) == 'leisureName' then getAnnoData nameAst else currentFuncName
      sub = withFile filename, null, => @genNode(ast)
      [line, offset] = locateAst ast
      @endId = functionId
      if funcname then new SourceNode line, offset, filename, sub, funcname
      else sub
    gen: (ast)-> new SourceNode(1, 0, currentFile, ['(', @genMap(ast), ')']).toStringWithSourceMap(file: currentFile).code
    genUniq: (ast, names, uniq, lambdaContext)->
      switch ast.constructor
        when Leisure_lit then sn ast, JSON.stringify getLitVal ast
        when Leisure_ref then sn ast, "resolve(", (@genRefName ast, uniq, names), ")"
        when Leisure_lambda
          newContext = if !lambdaContext?
            count: 0
            id: @addFunc ast
          else
            count: lambdaContext.count + 1
            id: @addSubfunc lambdaContext.id, lambdaContext.count + 1, ast
          @genLambda ast, names, uniq, _.defaults newContext, lambdaContext
        when Leisure_apply
          if useArity then @genArifiedApply ast, names, uniq, arity
          else sn ast, (@genUniq (getApplyFunc ast), names, uniq), "(", (@genApplyArg (getApplyArg ast), names, uniq), ")"
        when Leisure_let then sn ast, "(function(){", (@genLets ast, names, uniq), "})()"
        when Leisure_anno
          name = getAnnoName ast
          data = getAnnoData ast
          if name == 'arity' && useArity && data > 1
            @genArifiedLambda (getAnnoBody ast), names, uniq, data
          else
            try
              if trace && name == 'leisureName'
                oldDef = curDef
                curDef = data
              genned = @genUniq (getAnnoBody ast), names, uniq
              switch name
                when 'type' then sn ast, "setType(", (genned), ", '", data, "')"
                when 'dataType' then sn ast, "setDataType(", genned, ", '", data, "')"
                when 'define'
                  [funcName, arity, src] = data.toArray()
                  sn ast, "define('", funcName, "', lazify(ast, genned), ", arity, ", ", JSON.stringify(src), ")"
                when 'leisureName'
                  genned
                else genned
            finally
              if trace && name == 'leisureName' then curDef = oldDef
        else "CANNOT GENERATE CODE FOR UNKNOWN AST TYPE: #{ast}, #{ast.constructor} #{Leisure_lambda}"
    genArifiedApply: (ast, names, uniq)->
      args = []
      func = ast
      while dumpAnno(func) instanceof Leisure_apply
        args.push getApplyArg dumpAnno func
        func = getApplyFunc dumpAnno func
      args.reverse()
      defaultArity = false
      if args.length > 1 && ((dmp = dumpAnno(func)) instanceof Leisure_ref) && (((info = functionInfo[funcName = getRefName dmp]) && ((info.newArity && (arity = info.arity) && arity <= args.length) || (!arity && megaArity))) || (!info && isNil names.find (el)-> el == funcName))
        if defaultArity = !arity then arity = args.length
        argCode = []
        argCode.push ast
        if defaultArity then argCode.push 'L$('
        argCode.push @genUniq func, names, uniq
        if defaultArity then argCode.push ')('
        else argCode.push '('
        for i in [0...arity]
          if i > 0 then argCode.push ', '
          argCode.push sn args[i], @genApplyArg args[i], names, uniq
        argCode.push ')'
        for i in [arity...args.length] by 1
          argCode.push '(', (sn args[i], @genApplyArg args[i], names, uniq), ')'
        sn argCode...
      else
        ast = dumpAnno ast
        sn ast, (@genUniq (getApplyFunc ast), names, uniq), "(", (@genApplyArg (getApplyArg ast), names, uniq), ")"
    genLambda: (ast, names, uniq, ctx)->
      name = getLambdaVar ast
      u = addUniq name, names, uniq
      n = cons name, names
      id = if ctx.count then ctx.id
      code = if curDef && useThunkStacks
        "function(#{(uniqName name, u)}){var old = #{genPushThunk(ast)}; var ret = #{(@genUniq (getLambdaBody ast), n, u, ctx)}; L$setThunkStack(old); return ret;};"
      else "function(#{(uniqName name, u)}){return #{(@genUniq (getLambdaBody ast), n, u, ctx)}}"
      addLambdaProperties ast, sn ast, """
        (function(){
          var L_$F = (#{code});
          L_$F.leisureFunctionId = #{ctx.id};#{@contextInit()}
          L_$F.leisureLength = L_$F.length;
          return L_$F;
        })()
      """
    genArifiedLambda: (ast, names, uniq, arity)->
      if arity < 2 then @genLambda ast, names, uniq, 0
      else
        args = getNArgs(arity, ast).toArray()
        argList = _.map(args, ((x)-> 'L_' + x)).join ', '
        mainFunc = sn ast, """
          (function(){
            var L_$F = function(#{argList}) {
              return L_checkPartial(L_$F, arguments) || #{@genUniq(getNthLambdaBody(ast, arity), names, uniq)};
            };
            L_$F.leisureFunctionId = #{@addFunc ast};
            L_$F.leisureLength = #{args.length};
            return L_$F;
          })()
        """
        result = addLambdaProperties ast, (sn ast, mainFunc)
        annoAst = ast
        while annoAst instanceof Leisure_anno
          name = getAnnoName annoAst
          data = getAnnoData annoAst
          switch name
            when 'type' then result = sn ast, "setType(", result, ", '", data, "')"
            when 'dataType' then result = sn ast, "setDataType(", result, ", '", data, "')"
          annoAst = getAnnoBody annoAst
        result
    genRefName: (ref, uniq, names)->
      name = getRefName ref
      if isNil (val = names.find (el)-> el == name)
        ns = findName nameSub name
        if ns == root.currentNameSpace then nsLog "LOCAL NAME: #{name} FOR #{root.currentNameSpace} #{location ref}"
        else if !ns then nsLog "GUESSING LOCAL NAME #{name} FOR #{root.currentNameSpace} #{location ref}"
        varNameSub name
      else uniqName name, uniq
    genApplyArg: (arg, names, uniq)->
      d = dumpAnno arg
      if d instanceof Leisure_apply then lazify d, @genUniq arg, names, uniq
      else if d instanceof Leisure_ref then @genRefName d, uniq, names
      else if d instanceof Leisure_lit then sn arg, JSON.stringify getLitVal d
      else if d instanceof Leisure_let then lazify arg, (@genUniq arg, names, uniq)
      else if d instanceof Leisure_lambda then sn arg, 'lazy(', (@genUniq arg, names, uniq), ')'
      else lazify arg, (@genUniq arg, names, uniq)
    genLetAssign: (arg, names, uniq)->
      if dumpAnno(arg) instanceof Leisure_let then lazify arg, (@genLets arg, names, uniq)
      else lazify arg, (@genUniq arg, names, uniq)
    genLets: (ast, names, uniq)->
      bindings = letList ast, []
      letNames = _.reduce bindings, ((n, l)-> cons (getLetName l), n), names
      [letUniq, decs, assigns] = _.reduce bindings, ((result, l)=>
        [u, code, assigns] = result
        newU = addUniq (getLetName l), letNames, u
        letName = uniqName (getLetName l), newU
        [newU,
          (cons (sn ast, letName + ' = ', @genLetAssign(getLetValue(l), letNames, u)), code),
          (cons letName, assigns)]), [uniq, Nil, Nil]
      sn ast, "  var ", assigns.reverse().join(', '), ";\n  ", decs.reverse().intersperse(';\n  ').toArray(), ";\n\n  return ", (@genUniq (getLastLetBody ast), letNames, letUniq)

  wrapContext = (node, fileName)->
    new SourceNode 1, 0, fileName, """
      (function(L_$context){
        return """, node, """
      })
    """

  genPushThunk = (ast)->
    if useThunkStacks
      [line, offset] = locateAst ast
      "L$pushThunk((typeof stack != 'undefined' ? stack : L$thunkStack || L$emptyThunkStack), '#{curDef}:#{line}:#{offset}')"
    else ''

  findName = (name)->
    for i in [root.nameSpacePath.length - 1 .. 0]
      if LeisureNameSpaces[root.nameSpacePath[i]]?[name] then return root.nameSpacePath[i]
    if root.currentNameSpace && LeisureNameSpaces[root.currentNameSpace][name] then root.currentNameSpace
    else null

  location = (ast)->
    [line, col] = locateAst ast
    "#{line}:#{col}"

  getLambdaArgs = (ast)->
    args = []
    while ast instanceof Leisure_lambda
      args.push getLambdaVar ast
      ast = getLambdaBody ast
    [args, ast]

  getNthLambdaBody = (ast, n)->
    if n == 0 then ast
    else if (d = dumpAnno ast) instanceof Leisure_lambda then getNthLambdaBody getLambdaBody(d), n - 1
    else throw new Error "Expected lambda but got #{ast}"

  (window ? global ? {}).curryCall = curryCall = (args, func)->
    f = func args[0]
    for i in [1...args.length]
      f = f args[i]
    f

  getNArgs = (n, ast)->
    d = dumpAnno ast
    if !n then Nil else cons (getLambdaVar d), getNArgs n - 1, getLambdaBody d

  specialAnnotations = ['type', 'dataType', 'define']

  arrayify = (cons)->
    if cons instanceof Leisure_cons then cons.map((el)-> arrayify el).toArray()
    else cons

  getLambdaProperties = (body, props)->
    if body instanceof Leisure_anno
      if !_.includes specialAnnotations, getAnnoName(body)
        if !props then props = {}
        value = getAnnoData body
        props[getAnnoName body] = arrayify value
      getLambdaProperties getAnnoBody(body), props
    props

  addLambdaProperties = (ast, def, extras)->
    props = getLambdaProperties getLambdaBody ast
    if props || extras
      p = {}
      if props then _.merge p, props
      if extras then _.merge p, extras
      sn ast, "setLambdaProperties(", def, ", ", (JSON.stringify p), ")"
    else def

  lcons = (a, b)-> rz(L_cons)(lz a)(lz b)
  parseErr = (a, b)-> rz(L_parseErr)(a, b)

  lconsFrom = (array)->
    if array instanceof Array
      p = rz L_nil
      for el in array.reverse()
        p = lcons lconsFrom(el), p
      p
    else array

  assocListProps = null

  getAssocListProps = ->
    if !assocListProps
      assocListProps = lcons lcons('assoc', 'true'), rz(L_nil)
      assocListProps.properties = assocListProps
    assocListProps

  lacons = (key, value, list)->
    alist = lcons lcons(key, value), list
    alist.properties = getAssocListProps()
    alist

  (window ? global).setLambdaProperties = (def, props)->
    p = rz L_nil
    for k, v of props
      p = lacons k, lconsFrom(v), p
    def.properties = p
    def

# The ThunkStack is a list of at most stackLimit items, using the
# functional queue technique given in Purely Functional Data Structures
# by Okasaki.  No need for a pop() operation here, just push() and items().

  class ThunkStack
    constructor: (@front, @back, @frontLen, @backLen)->
    push: (item)->
      if @backLen + @frontLen >= stackSize
        if @backLen == 0 then new ThunkStack null, reverseThunks([item, @front])[1], 0, @frontLen
        else new ThunkStack [item, @front], @back[1], @frontLen + 1, @backLen - 1
      else new ThunkStack [item, @front], @back, @frontLen + 1, @backLen
    items: ->
      items = []
      frontItems = []
      stack = @back
      while stack
        items.push stack[0]
        stack = stack[1]
      stack = @front
      while stack
        frontItems.push stack[0]
        stack = stack[1]
      items.concat frontItems.reverse()

  (global ? window).L$emptyThunkStack = new ThunkStack null, null, 0, 0

  reverseThunks = (stack)->
    result = null
    while stack
      result = [stack[0], result]
      stack = stack[1]
    result

  (global ? window).L$thunkStack = []

  (global ? window).L$convertError = (err, args)->
    if !err.L_stack
      console.log 'CONVERTING ERROR:', err
      (global ? window).ERR = err
      err.L_stack = args.callee.L$stack
      err.L_args = args
    err

  (global ? window).L$pushThunk = (stack, entry)->
    old = L$thunkStack
    (global ? window).L$thunkStack = stack.slice(Math.max(0, stack.length - 9))
    stack.push entry
    old

  (global ? window).L$setThunkStack = (stack)->
    (global ? window).L$thunkStack = stack

  lazify = (ast, body)->
    if curDef && useThunkStacks
      sn ast, "(function(){var stack = L$thunkStack; var f = function(){var old = ", genPushThunk(ast), '; var ret = ', body, '; L$setThunkStack(old); if (f.memo) stack = null; return ret;}; return f;})()'
    else sn ast, "function(){return ", body, ';}'

  dumpAnno = (ast)-> if ast instanceof Leisure_anno then dumpAnno getAnnoBody ast else ast

  addUniq = (name, names, uniq)->
    if (names.find (el)-> el == name) != Nil
      [overrides, num] = uniq
      [(cons (cons name, "#{name}_#{num}"), overrides), num + 1]
    else uniq

  uniqName = (name, uniq)->
    [uniq] = uniq
    kv = uniq.find ((el)-> el.head() == name), uniq
    varNameSub (if kv != Nil then kv.tail() else name)

  letList = (ast, buf)->
    if ast instanceof Leisure_let
      buf.push ast
      letList getLetBody(ast), buf
    else buf

  getLastLetBody = (ast)-> if ast instanceof Leisure_let then getLastLetBody getLetBody ast else ast

  define 'traceOff', new Monad2 'traceOff', (env, cont)->
    trace = false
    cont _unit

  define 'traceOn', new Monad2 'traceOn', (env, cont)->
    trace = true
    cont _unit

  define 'runAst', ((code)->(ast)->
    new Monad2 'runAst', (env, cont)->
      #console.log "running code", code
      jsCode = null
      try
        jsCode = if env.fileName then withFile env.fileName, null, =>
          new CodeGenerator(env.fileName, false, true).genSource null, rz(ast)
        else new CodeGenerator().genSource rz(code), rz(ast)
        cont eval jsCode
      catch err
        dumpMonadStack err, env
        codeMsg = (if jsCode then "CODE: \n#{jsCode}\n" else '')
        baseMsg = "\n\nParse error: #{err.message}\n#{codeMsg}AST: "
        err.message = "#{baseMsg}#{ast()}"
        console.log err
        cont parseErr (lz baseMsg), (ast)), null, null, null, 'parser'

  define 'genAst', ((ast)->
    try
      gen rz ast
    catch err
      parseErr (lz '\n\nParse error: ' + err.toString() + "AST: "), (ast)), null, null, null, 'parser'


#####
# TMP HOOKS
#####

#####
# END TMP HOOKS
#####

  gen = (ast)-> new CodeGenerator().gen ast
  genMap = (ast)-> new CodeGenerator().genMap ast
  genSource = (source, ast)-> new CodeGenerator().genSource source, ast

  {
    gen
    genMap
    genSource
    sourceNode: sn
    withFile
    curryCall
    #useNameSpace: useNameSpace
    #pushNameSpace: pushNameSpace
    #getNameSpacePath: getNameSpacePath
    #clearNameSpacePath: clearNameSpacePath
    #saveNameSpace: saveNameSpace
    #restoreNameSpace: restoreNameSpace
    SourceNode
    SourceMapConsumer
    SourceMapGenerator
    setMegaArity
    CodeGenerator
  }
