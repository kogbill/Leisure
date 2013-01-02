(function() {
  var DONE, Notebook, Prim, addOpenButton, addPath, auth, checkDriveAuth, computePaths, createAuthButton, finishAuth, handleAuthResult, id2File, id2Paths, initFileList, initGdrive, initStorage, leisureDir, listFiles, loadFile, makeLeisureDir, mimePart, mkdir, openFile, path2Ids, readFile, replaceAuth, root, runOpen, showDelay, updateFile, writeFile, _ref, _ref2, _ref3;

  if ((typeof window !== "undefined" && window !== null) && (!(typeof global !== "undefined" && global !== null) || global === window)) {
    root = (_ref = window.GdriveStorage) != null ? _ref : (window.GdriveStorage = {});
    Prim = (_ref2 = window.Prim) != null ? _ref2 : (window.Prim = {});
    Notebook = (_ref3 = window.Notebook) != null ? _ref3 : (window.Notebook = {});
    window.global = window;
  } else {
    root = typeof exports !== "undefined" && exports !== null ? exports : this;
    Prim = require('./prim');
  }

  if (!(typeof window !== "undefined" && window !== null)) {
    initStorage = function initStorage() {};
    return;
  }

  initStorage = function initStorage(callback) {
    var action, cb, frag, ids, state, _ref4, _ref5;
    Prim.newUriHandler('googledrive', {
      read: function read(uri, cont, err, next) {
        return initGdrive(function() {
          var files;
          files = path2Ids["/LeisureStorage" + uri.path];
          if (!files) {
            return next();
          } else if (files.length > 1) {
            return err(new Error("More than one file for uri: " + uri));
          } else {
            return readFile(id2File[files[0]], function(err, result) {
              if (!err) {
                return cont(result);
              } else {
                return new Error("Error reading file " + uri + ": " + err.statusText);
              }
            });
          }
        });
      },
      write: function write(uri, data, cont, err) {
        return initGdrive(function() {
          var files;
          files = path2Ids["/LeisureStorage" + uri.path];
          if (!files) {
            return writeFile(uri.path.substring(1), data, [
              {
                id: leisureDir
              }
            ], function(json) {
              if (json) {
                return cont();
              } else {
                return err(new Error("Problem writing file"));
              }
            });
          } else if ((files != null ? files.length : void 0) > 1) {
            return err(new Error("More than one file for uri: " + uri));
          } else {
            return updateFile(id2File[files[0]], data, function(json) {
              if (json) {
                return cont();
              } else {
                return err(new Error("Problem writing file"));
              }
            });
          }
        });
      }
    });
    frag = ((_ref4 = Boot.documentFragment) != null ? _ref4 : '#').substring(1);
    state = new Prim.URI("" + document.location.href + frag).getFragParams().state;
    cb = function cb() {
      callback();
      return addOpenButton();
    };
    if (state) {
      _ref5 = JSON.parse(state), ids = _ref5.ids, action = _ref5.action;
      if (action !== "open") {
        document.body.innerHTML = "<h1>Unknwn action from Google Drive: " + action + "</h1>";
      }
      if (!ids || ids.length !== 1) {
        return document.body.innerHTML = "<h1>More than one file to open</h1>";
      } else {
        cb();
        return loadFile(ids[0]);
      }
    } else {
      window.leisureAutoRunAll = true;
      window.markup();
      return cb();
    }
  };

  loadFile = function loadFile(id) {
    document.body.innerHTML = "<h1>LOADING Google Drive file... </h1>";
    return initGdrive(function() {
      var file;
      file = id2File[id];
      if (!file) {
        return document.body.innerHTML = "<h1>Unknown file id: " + ids[0] + "</h1>";
      } else {
        document.body.innerHTML = "<h1>LOADING " + file.title + "... </h1>";
        return readFile(file, function(err, text) {
          var filename, node, path, _i, _j, _len, _len2, _ref4, _ref5;
          if (err) {
            return document.body.innerHTML = "<h1>Error loading " + file.title + ": " + err.statusText + "</h1>";
          } else if (file.fileExtension === 'lmd') {
            if (id2Paths[file.id].length > 1) {
              _ref4 = id2Paths[file.id];
              for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                path = _ref4[_i];
                if (path.match('^/LeisureStorage/')) {
                  if (filename) {
                    document.body.innerHTML = "<h1>Error loading " + file.title + ": More than one path to file in LeisureStorage, " + (JSON.stringify(id2Paths[file.id])) + "</h1>";
                  }
                  return;
                } else {
                  filename = path;
                }
              }
            } else {
              filename = id2Paths[file.id][0];
            }
            document.body.innerHTML = "<!--\n" + text + "\n-->";
            window.leisureAutoRunAll = true;
            window.markup();
            _ref5 = document.querySelectorAll("[leisurenode='code']");
            for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
              node = _ref5[_j];
              node.setAttribute('contentEditable', 'true');
              Notebook.bindNotebook(node);
              Notebook.changeTheme(node, 'thin');
              Notebook.evalDoc(node);
            }
            return Notebook.setFilename("googledrive://" + filename);
          } else {
            return document.body.innerHTML = "<h1>Error loading " + file.title + "; can only load *.lmd files.</h1>";
          }
        });
      }
    });
  };

  id2Paths = {};

  path2Ids = {};

  id2File = {};

  leisureDir = null;

  addPath = function addPath(id, path) {
    if (path2Ids[path]) {
      path2Ids[path].push(id);
    } else {
      path2Ids[path] = [id];
    }
    if (id2Paths[id]) {
      return id2Paths[id].push(path);
    } else {
      return id2Paths[id] = [path];
    }
  };

  computePaths = function computePaths(file) {
    var parent, parentPath, _i, _j, _len, _len2, _ref4, _ref5;
    if (id2Paths[file.id]) {
      return id2Paths[file.id];
    } else {
      id2File[file.id] = file;
      if (file.parents.length === 0) {
        addPath(file.id, "/" + file.title);
      } else {
        _ref4 = file.parents;
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          parent = _ref4[_i];
          if (parent.isRoot) {
            addPath(file.id, "/" + file.title);
          } else {
            _ref5 = computePaths(id2File[parent.id]);
            for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
              parentPath = _ref5[_j];
              addPath(file.id, "" + parentPath + "/" + file.title);
            }
          }
        }
      }
      return id2Paths[file.id];
    }
  };

  auth = {
    finished: false,
    succeeded: false,
    started: false,
    cont: [],
    err: null,
    status: null,
    token: null
  };

  showDelay = function showDelay() {
    var widget, _ref4;
    if (widget = (_ref4 = Notebook.lastEnv) != null ? _ref4.getWidget() : void 0) {
      widget.appendChild(Notebook.createNode("<img src='loading.gif'>"));
      return function() {
        return Notebook.lastEnv.destroyWidget();
      };
    } else {
      return function() {};
    }
  };

  initGdrive = function initGdrive(cont) {
    var del;
    if (auth.finished) {
      return cont();
    } else if (auth.started) {
      return auth.cont.push(cont);
    } else {
      del = showDelay();
      return Notebook.delay(function() {
        Boot.loadThen(["https://apis.google.com/js/client.js?onload=gapiClientLoaded"], true, function() {});
        auth.started = true;
        return auth.cont.push(function() {
          if (typeof del === "function") del();
          return cont();
        });
      });
    }
  };

  initFileList = function initFileList(cont) {
    return listFiles(function(json) {
      var dirs, item, key, name, names, _i, _j, _k, _len, _len2, _len3, _ref4, _ref5;
      _ref4 = json.items;
      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
        item = _ref4[_i];
        if (!item.explicitlyTrashed) id2File[item.id] = item;
      }
      _ref5 = json.items;
      for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
        item = _ref5[_j];
        computePaths(item);
      }
      names = (function() {
        var _results;
        _results = [];
        for (key in path2Ids) {
          _results.push(key);
        }
        return _results;
      })();
      names.sort();
      for (_k = 0, _len3 = names.length; _k < _len3; _k++) {
        name = names[_k];
        console.log(name);
      }
      dirs = path2Ids["/LeisureStorage"];
      if (!dirs) {
        return makeLeisureDir(cont);
      } else {
        if (dirs.length > 1) {
          replaceAuth({
            succeeded: false,
            err: "More than one LeisureStorage directory"
          });
        } else {
          console.log("SETTING DIR TO " + dirs[0]);
          leisureDir = dirs[0];
        }
        return cont();
      }
    });
  };

  window.gapiClientLoaded = function gapiClientLoaded() {
    return window.setTimeout((function() {
      return checkDriveAuth(true);
    }), 100);
  };

  window.handleAuthClick = function handleAuthClick(event) {
    checkDriveAuth(false);
    return false;
  };

  checkDriveAuth = function checkDriveAuth(immediate) {
    console.log("AUTH");
    try {
      return gapi.auth.authorize({
        client_id: '270759921607',
        scope: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.install'].join(' '),
        immediate: immediate
      }, handleAuthResult);
    } catch (err) {
      finishAuth({
        status: 'failed',
        err: err
      });
      return console.log("Authentication not allowed by security");
    }
  };

  handleAuthResult = function handleAuthResult(authResult) {
    var authorizeButton;
    authorizeButton = document.getElementById('authorize-button');
    if (!authResult) {
      console.log("Not authenticated, yet -- creating button");
      return createAuthButton();
    } else {
      if (authResult.error) {
        console.log("Authentication failed: " + authResult.error);
        return finishAuth({
          succeeded: false,
          err: authResult != null ? authResult.error : void 0
        });
      } else {
        console.log("Authenticated: " + (JSON.stringify(authResult)));
        return finishAuth({
          succeeded: true,
          token: authResult.access_token
        });
      }
    }
  };

  createAuthButton = function createAuthButton() {
    if (!auth.buttonDiv) {
      auth.buttonDiv = document.createElement('div');
      auth.buttonDiv.setAttribute('style', 'background: white; z-index: 10000; position: absolute; left: 0; top: 0; width: 100%; height: 100%');
      auth.buttonDiv.innerHTML = '<span>Would you like to authorize Leisure to create files and access them in a LeisureStorage directory in your Google drive?  <button onclick="handleAuthClick()">Yes</button> <button onclick="denyAuth()">No</button></span>';
      return document.body.insertBefore(auth.buttonDiv, document.body.firstChild);
    }
  };

  window.denyAuth = function denyAuth() {
    return finishAuth({
      succeeded: false,
      err: 'User denied authorization'
    });
  };

  finishAuth = function finishAuth(obj) {
    var cont, _i, _len, _ref4, _ref5, _results;
    if (!auth.finished) {
      replaceAuth(obj);
      if (obj.succeeded) {
        return initFileList(function() {
          var cont, _i, _len, _ref4, _ref5, _results;
          _ref5 = (_ref4 = auth.cont) != null ? _ref4 : [];
          _results = [];
          for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
            cont = _ref5[_i];
            _results.push(cont());
          }
          return _results;
        });
      } else {
        _ref5 = (_ref4 = auth.cont) != null ? _ref4 : [];
        _results = [];
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          cont = _ref5[_i];
          _results.push(cont());
        }
        return _results;
      }
    }
  };

  replaceAuth = function replaceAuth(obj) {
    var _ref4, _ref5;
    if (auth.buttonDiv) document.body.removeChild(auth.buttonDiv);
    obj.cont = ((_ref5 = auth.cont) != null ? _ref5 : []).concat((_ref4 = obj.cont) != null ? _ref4 : []);
    obj.finished = true;
    return auth = obj;
  };

  makeLeisureDir = function makeLeisureDir(cont) {
    console.log("No LeisureStorage directory.  Creating one");
    return mkdir('LeisureStorage', function(json, raw) {
      computePaths(json);
      console.log("SETTING DIR TO " + json.id);
      leisureDir = json.id;
      console.log("CREATED DIR: " + raw, json);
      return cont();
    });
  };

  addOpenButton = function addOpenButton() {
    var open, save;
    return;
    save = document.body.querySelector('[leisureId=saveButton]');
    open = Notebook.createNode("<button>Open</button>");
    save.parentNode.insertBefore(open, save.nextSibling);
    return open.addEventListener('click', function() {
      return runOpen();
    });
  };

  runOpen = function runOpen() {
    return initGdrive(function() {
      var picker, view;
      view = new google.picker.DocsView();
      view.setParent(path2Ids["/LeisureStorage"]);
      picker = new google.picker.PickerBuilder().addView(view).setCallback(openFile).build();
      return picker.setVisible(true);
    });
  };

  openFile = function openFile(json) {
    var _ref4;
    if ((json != null ? json.action : void 0) === 'picked' && (json != null ? (_ref4 = json.docs) != null ? _ref4.length : void 0 : void 0) > 0) {
      return loadFile(json.docs[0].id);
    }
  };

  mimePart = function mimePart(boundary, mimeType, content) {
    return ["\r\n--", boundary, "\r\n", "Content-Type: ", mimeType, "\r\n", "Content-Length: ", content.length, "\r\n", "\r\n", content].join('');
  };

  DONE = 4;

  readFile = function readFile(file, callback) {
    var del;
    if (file.downloadUrl) {
      del = showDelay();
      return Notebook.delay(function() {
        var xhr;
        console.log("File:", file);
        xhr = new XMLHttpRequest();
        xhr.open('GET', file.downloadUrl);
        xhr.setRequestHeader('Authorization', 'Bearer ' + auth.token);
        xhr.onreadystatechange = function onreadystatechange() {
          if (this.readyState === DONE) {
            del();
            console.log("XHR", xhr);
            if (this.status === 200) {
              return callback(null, xhr.responseText);
            } else {
              return callback(xhr);
            }
          }
        };
        return xhr.send();
      });
    } else {
      return callback(null);
    }
  };

  writeFile = function writeFile(name, contents, parents, callback) {
    var del;
    del = showDelay();
    return Notebook.delay(function() {
      var json, req;
      console.log("WRITING " + name + " (del: " + del + "), parents:", JSON.stringify(parents));
      json = JSON.stringify({
        mimeType: 'text/plain',
        title: name,
        parents: parents != null ? parents : []
      });
      req = gapi.client.request({
        'path': '/upload/drive/v2/files?uploadType=multipart',
        'method': 'POST',
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="END_OF_PART"',
          'Authorization': 'Bearer ' + auth.token
        },
        'body': [mimePart("END_OF_PART", "application/json", json), mimePart("END_OF_PART", "text/plain", contents), "\r\n--END_OF_PART--\r\n"].join('')
      });
      return req.execute(function(json) {
        del();
        if (json) computePaths(json);
        return callback(json);
      });
    });
  };

  updateFile = function updateFile(file, contents, callback) {
    var del;
    del = showDelay();
    return Notebook.delay(function() {
      console.log("UPDATING " + name + ", parents:", JSON.stringify(file.parents));
      return gapi.client.request({
        'path': "/upload/drive/v2/files/" + file.id + "?uploadType=multipart&alt=json",
        'method': 'PUT',
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="END_OF_PART"',
          'Authorization': 'Bearer ' + auth.token
        },
        'body': [mimePart("END_OF_PART", "application/json", JSON.stringify(file)), mimePart("END_OF_PART", "text/plain", contents), "\r\n--END_OF_PART--\r\n"].join('')
      }).execute(function(json) {
        del();
        return callback(json);
      });
    });
  };

  listFiles = function listFiles(query, callback) {
    var q;
    if (!callback) {
      callback = query;
      q = '';
    } else {
      q = "&q=" + (encodeURIComponent(query));
    }
    return (gapi.client.request({
      path: "/drive/v2/files?maxResults=10000" + q,
      method: 'GET'
    })).execute(callback);
  };

  mkdir = function mkdir(name, callback) {
    return (gapi.client.request({
      path: '/drive/v2/files',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + auth.token
      },
      body: JSON.stringify({
        title: name,
        parents: [],
        mimeType: "application/vnd.google-apps.folder"
      })
    })).execute(callback);
  };

  root.initStorage = initStorage;

}).call(this);
