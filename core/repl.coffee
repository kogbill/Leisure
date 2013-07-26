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

require('source-map-support').install()
#Error.stackTraceLimit = Infinity
Error.stackTraceLimit = 50
root = module.exports = require './base'
_ = require './lodash.min'
path = require 'path'
fs = require 'fs'

{
  setType,
  setDataType,
  ast2Json,
  json2Ast,
  Nil,
} = require './ast'
{gen} = require './gen'
{
  readFile,
  writeFile,
} = require './base'
{
  identity,
  runMonad,
  basicRunMonad,
  defaultEnv,
} = require './runtime'

global.runMonad = runMonad
global.basicRunMonad = basicRunMonad
global.setType = setType
global.setDataType = setDataType
global.defaultEnv = defaultEnv
global.identity = identity

# compilation stage
# 0: use CoffeeScript Leisure compiler
# 1: use only SimpleParse.lsr
# 2: use generatedPrelude.lsr
#
stage = 2
stages = ['./simpleParseJS', './simpleParse', './generatedPrelude']

diag = false

readline = require('readline')

evalInput = (text, cont)->
  if text
    try
      runMonad L_newParseLine()(->Nil)(->text), defaultEnv, (ast)->
        try
          if diag
            console.log "AST: #{ast}"
            console.log "CODE: (#{gen ast})"
          runMonad (eval "(#{gen ast})"), defaultEnv, cont
        catch err
          cont err.stack
    catch err
      cont err.stack
  else cont ''

help = ->
  console.log """
  Welcome to the Leisure REPL!

  Here are the commands:
  :d -- toggle diagnostics
  :{ -- start multiline input
  :} -- end multiline input
  :h -- print this message
  ! -- evaluate JavaScript expression (after the !)
  funcs -- list all known functions (this is really just a monad)
  (anything else) -- evaluate Leisure code

"""

oldFunctionCount = 0
leisureFunctions = null

updateCompleter = (rl)->
  if root.functionCount != oldFunctionCount
    oldFunctionCount = root.functionCount
    leisureFunctions = global.leisureFuncNames.toArray()

tokenString = (t)-> t(->(txt)->(pos)-> txt())
rl = null

leisureCompleter = (line)->
  tokens = L_tokens()(->line)(->root.getValue 'tokenPat').toArray()
  if tokens.length > 0
    origLast = tokenString(tokens[tokens.length - 1])
    last = origLast.toLowerCase()
    completions = _.filter(leisureFunctions, (el)->el.toLowerCase().indexOf(last) == 0)
    if completions.length == 1
      newLast = completions[0].substring 0, last.length
      rl.line = line.substring(0, line.length - last.length) + newLast
      [completions, newLast]
    else [_.filter(leisureFunctions, (el)->el.toLowerCase().indexOf(last) == 0), origLast]
  else [[], line]

interrupted = false

repl = ->
  lines = null
  leisureDir = path.join process.env.HOME, '.leisure'
  historyFile = path.join(leisureDir, 'history')
  rl = readline.createInterface process.stdin, process.stdout, leisureCompleter
  updateCompleter()
  fs.exists historyFile, (exists)->
    ((cont)->
      if exists then readFile historyFile, (err, contents)->
        if !err then rl.history = contents.trim().split('\n').reverse()
        cont()
      else fs.exists leisureDir, (exists)->
        if exists then cont()
        else fs.mkdir leisureDir, (err)->
          if err
            console.log "Could not create leisure dir!"
            process.exit 1
          cont()) ()->
      help()
      multiline = false
      rl.setPrompt 'Leisure> '
      rl.prompt()
      root.defaultEnv.err = (err)->
        console.log "Error: #{err.stack ? err}"
        multiline = false
        rl.setPrompt 'Leisure> '
        rl.prompt()
      startMultiline = ->
        if multiline then console.log "Already reading multiline input"
        else
          multiline = true
          lines = []
          rl.setPrompt '... '
      finishMultiline = (dumpInput)->
        multiline = false
        l = lines
        lines = []
        if dumpInput
          rl.setPrompt 'Leisure> '
          rl.prompt()
        else
          try
            #console.log "EVAL: #{JSON.stringify l.join '\n'}"
            evalInput (l.join '\n'), (result)->
              console.log String result
              rl.setPrompt 'Leisure> '
              rl.prompt()
          catch err
            console.log "ERROR: #{err.stack}"
      rl.on 'line', (line)->
        interrupted = false
        if rl.history[0] == rl.history[1] then rl.history.shift()
        else if line.trim() then fs.appendFile historyFile, "#{line}\n", (->)
        switch line.trim()
          when ':d'
            diag = !diag
            console.log "Diag: #{if diag then 'on' else 'off'}"
          when ':{'
            startMultiline()
          when ':}'
            if ! multiline then console.log "Not reading multiline input."
            else
              finishMultiline()
          when ':h' then help()
          else
            if m = line.match /^:{(.*)$/
              startMultiline()
              if m[1] then lines.push m[1]
            else if line.match /^!/ then console.log eval line.substring 1
            else if multiline
              if !line then finishMultiline()
              else lines.push line
            else
              try
                evalInput line, (result)->
                  console.log String result
                  rl.prompt()
                return
              catch err
                console.log "ERROR: #{err.stack}"
        rl.prompt()
      rl.on 'close', -> process.exit 0
      rl.on 'SIGINT', ->
        if interrupted then rl.pause()
        else if multiline then finishMultiline true
        else
          console.log "\n(^C again to quit)"
          interrupted = true

verbose = false
gennedAst = false
gennedJs = false
newOptions = true
action = null
outDir = null
recompiled = false
loadedParser = false
processedFiles = false
createAstFile = false
createJsFile = false

compile = (file, cont)->
  ext = path.extname file
  readFile file, (err, contents)->
    if err
      console.log "Error reading file: #{file}"
      cont()
    else
      lines = runMonad L_linesForFile()(-> contents)
      names = runMonad L_namesForLines()(-> lines)
      asts = []

      #for line in lines.toArray()
      #  try
      #    asts.push (runMonad L_runLine()(->names)(->line)).head()
      #  catch err
      #    console.log "Error running line: #{line}\n#{err.stack}"
      #if true

      compileLines lines, names, asts, (asts)->
        if asts instanceof Error then cont asts
        else
          if createAstFile
            outputFile = (if ext == file then file else file.substring(0, file.length - ext.length)) + ".ast"
            if outDir then outputFile = path.join(outDir, path.basename(outputFile))
            if verbose then console.log "AST FILE: #{outputFile}"
            writeFile outputFile, "[\n  #{_(asts).map((item)-> JSON.stringify ast2Json item).join ',\n  '}\n]", (err)->
              if err
                console.log "Error writing AST file: #{outputFile}"
                cont replaceErr err, "Error writing AST file: #{outputFile}...\n#{err.message}"
              else if !createJsFile then cont(asts)
          if createJsFile
            outputFile = (if ext == file then file else file.substring(0, file.length - ext.length)) + ".js"
            if outDir then outputFile = path.join(outDir, path.basename(outputFile))
            if verbose then console.log "JS FILE: #{outputFile}"
            writeFile outputFile, _(asts).map((item)-> "runMonad(#{gen item})").join(';\n') + ";\n", (err)->
              if !err then cont(asts)
              else
                console.log "Error writing JS file: #{outputFile}"
                cont replaceErr err, "Error writing JS file: #{outputFile}...\n#{err.message}"
          else cont []

compileLines = (lines, names, asts, cont)->
  if lines.isNil() then cont asts
  else
    runMonad L_runLine()(->names)(->lines.head()), null, (ast)->
      #console.log "@@@ AST #{if typeof ast == 'function' then ast.constructor.name else ast}..."
      #console.log "@@@ #{ast.head()}"
      if ast instanceof Error then cont replaceErr ast, "Error compiling line: #{lines.head()}...\n#{ast.message}"
      else
        asts.push ast.head()
        compileLines lines.tail(), names, asts, cont

primCompile = (file, cont)->
  {
    parseLine,
    compileFile,
  } = require stages[stage]
  ext = path.extname file
  readFile file, (err, contents)->
    if !err
      compiled = compileFile contents, file
      outputFile = (if ext == file then file else file.substring(0, file.length - ext.length)) + ".js"
      if outDir then outputFile = path.join(outDir, path.basename(outputFile))
      if verbose then console.log "JS FILE: #{outputFile}"
      writeFile outputFile, compiled, (err)-> if !err then cont(compiled)

genJsFromAst = (file, cont)->
  readFile file, (err, contents)->
    if !err then genJs _(JSON.parse(contents)).map((json)-> json2Ast json), cont

usage = ->
  console.log """
  Usage repl [-v | -a | -0 | -1 | -c | -d DIR] [FILE ...]

  -v            verbose
  -a            only parse to AST
  -0            use CoffeeScript parser
  -1            use simple Leisure parser
  -c            for -0, compile to JS using CoffeeScript compiler
                for -1, or normal case, create AST and JS file
  -d DIR        specify output directory for .ast and .js files

  Without no FILE arguments, runs interactive REPL
  """
  process.exit 0

processArg = (pos)->
  #console.log "Process Arg: #{process.argv.join ', '}, pos: #{pos}"
  if pos >= process.argv.length
    if processedFiles then process.exit 0
    else
      repl()
      return
  if process.argv[pos][0] == '-' and !newOptions
    actions = []
    newOptions = true
    gennedAst = gennedJs = false
  switch process.argv[pos]
    when '-v'
      verbose = true
    when '-a'
      action = compile
      createAstFile = true
    when '-c'
      if stage == 0
        action = primCompile
        loadedParser = true
      else
        action = compile
        createAstFile = createJsFile = true
    when '-d'
      outDir = process.argv[pos + 1]
      pos++
    when '-0'
      stage = 0
    when '-1'
      stage = 1
    else
      newOptions = true
      #console.log "Process #{process.argv.join ', '}"
      if process.argv[pos][0] == '-' then usage()
      else
        processedFiles = true
        if !loadedParser
          #console.log "REQUIRING #{stages[stage]}"
          require stages[stage]
        #console.log "PROCESSING #{process.argv[pos]} with #{action}"
        action process.argv[pos], -> processArg pos + 1
      return
  processArg pos + 1

run = ->
  #console.log "Run: #{process.argv.join ', '}"
  if process.argv.length == 2
    require stages[stage]
    repl()
  else processArg 2

run()