// Generated by CoffeeScript 2.3.0
(function() {
  // Test piping data from one process to another
  var fiberReader, fs, module, reader, runTestProcesses1, runTestProcesses2, spawn, trimNL;

  ({fiberReader} = module = require('./spawn'));

  ({spawn} = require('child_process'));

  fs = require('fs');

  runTestProcesses1 = function() {
    var p1;
    p1 = spawn('ls', []);
    return spawn('grep', ['index'], {
      stdio: [p1.stdout, 'pipe', 'inherit']
    });
  };

  runTestProcesses2 = function() {
    var p1;
    p1 = spawn('echo', ['one', 'two']);
    return spawn('wc', [], {
      stdio: [p1.stdout, 'pipe', 'inherit']
    });
  };

  trimNL = function(str) {
    if (str[str.length - 1] === '\n') {
      return str.substring(0, str.length - 1);
    } else {
      return str;
    }
  };

  reader = fiberReader();

  reader.run(function() {
    var err, file1, output, proc1, results, str;
    try {
      proc1 = runTestProcesses1();
      reader.addProc(proc1);
      file1 = fs.createReadStream('/tmp/derp2', {
        highWaterMark: 4096,
        encoding: 'binary'
      });
      //console.log "READING FILE", file1
      reader.addStream(file1);
      while ((output = reader.readLine(file1)) != null) {
        str = trimNL(output);
        console.log(`FILE 1 '${str}${(str === output ? '%' : '')}'`);
      }
      console.log("FILE DONE");
      console.log("READING PROC");
      results = [];
      while ((output = reader.readLine(proc1)) != null) {
        str = trimNL(output);
        results.push(console.log(`PROC 1 '${str}${(str === output ? '%' : '')}'`));
      }
      return results;
    } catch (error) {
      err = error;
      return console.log(err);
    } finally {
      console.log("EXITING");
    }
  });

  reader.run(function() {
    return console.log("FINISHED");
  });

}).call(this);

//# sourceMappingURL=testSpawn.js.map
