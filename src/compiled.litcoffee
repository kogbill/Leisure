Compiled version of main Leisure program

    if !navigator.appVersion.match /chrome/i
      document.getElementById('globalLoad').innerHTML = "<h1>Sorry, Leisure only supports Chrome and Chromium, for now</h1><h1>This will improve</h1>"
    else
      requirejs.leisureCompiled = true
      if document.location.search.match /pop=/ then window.close()
      else require ['main']
