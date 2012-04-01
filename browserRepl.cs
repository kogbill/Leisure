if window? and (!global? or global == window)
  window.global = window
  window.Repl = root = {}
  Pretty = window.Pretty
else root = exports ? this

lastLine = null
input = null
write = null

init = (inputField, output, defs)->
  write = (line)-> defs.innerHTML += line
  ReplCore.setWriter (line)-> output.innerHTML += line
  ReplCore.setNext -> input.value = ''
  ReplCore.setHandler (ast, result, a, c, r)->
    if ast.lazpName? then defs.innerHTML += "#{markupDef(lastLine)}<br>"
    else output.innerHTML += "#{lastLine} \u2192\n  #{ReplCore.getType result}: #{Pretty.print result}\n"
  input = inputField
  input.onkeypress = (e)->
    if (e.charCode || e.keyCode || e.which) == 13
      lastLine = input.value.replace(/\\/g, '\u03BB')
      ReplCore.processLine(lastLine)
  ReplCore.help()
  input.select()

markupDef = (line)->
  if line.match /^\s*#/ then line
  if (match = line.match /^[^=]*(?=\s*=)/) then "<b>#{match[0]}</b>#{line.substring(match[0].length)}"
  else line

markupLines = (lines)-> lines.split('\n').map(markupDef).join('<br>')

handleFiles = (fileElement)->
  files = fileElement.files
  reader = new FileReader()
  reader.onerror = (evt)-> alert('error' + evt)
  reader.onload = ->
    for line in reader.result.split('\n')
      if line
        write "#{markupDef line}\n"
        ast = Lazp.compileLine line
        if ast then [ast, result] = Lazp.evalLine line
  reader.readAsText(files[0])
  fileElement.value = null
  input.select()

root.init = init
root.markupDef = markupDef
root.markupLines = markupLines
root.handleFiles = handleFiles