// Generated by CoffeeScript 2.2.4
(function() {
  // Shared worker for Leisure's ODB maintains multiple in-memory trace logs and
  // persists between page refreshes so we can browse logs as if it were a database
  var OdbWorker, TraceDumper, addCallGraphEntry, addRecord, defKey, dump, last, newTraceRecords, pad, processTrace, shared, traceRecords, verbose, worker;

  self.traceRecords = traceRecords = {};

  shared = typeof SharedWorkerGlobalScope !== "undefined" && SharedWorkerGlobalScope !== null;

  defKey = function(context, id) {
    var key;
    return key = `${context.id}-${id}`;
  };

  verbose = function() {};

  //verbose = (args...)-> console.log args...
  OdbWorker = class OdbWorker {
    constructor() {
      if (shared) {
        self.onconnect = (e) => {
          return this.init(e.ports[0]);
        };
      } else {
        this.init(self);
      }
    }

    init(port) {
      this.port = port;
      return this.port.onmessage = function(e) {
        var err;
        verbose("message ", e.data.msg);
        try {
          return worker[e.data.msg](e, e.data);
        } catch (error) {
          err = error;
          console.log(err.stack);
          if (e.data.msgId) {
            return this.port.postMessage({
              msgId,
              error: {
                message: err.message,
                stack: err.stack
              }
            });
          }
        }
      };
    }

    setVerbose(e, {
        verbose: state
      }) {
      return verbose = state ? function(...args) {
        return console.log(...args);
      } : function() {};
    }

    queueValues(e, {logName, values}) {
      var pos, records, ref;
      records = (ref = traceRecords[logName]) != null ? ref : newTraceRecords(logName);
      pos = 0;
      while (pos < values.length) {
        pos = this[values[pos]](records, pos, values);
      }
      return null;
    }

    getTraceRecords(e) {
      var logName;
      if (logName = e.data.logName) {
        return traceRecords[logName] || (function() {
          throw new Error(`No trace log named ${logName}`);
        })();
      } else {
        throw new Error("No trace log specified");
      }
    }

    dumpValues(e, {logName}) {
      return console.log(traceRecords[logName].dump());
    }

    latestEntry(e, {logName, msgId}) {
      var r;
      console.log("GETTING LATEST ENTRY");
      return this.port.postMessage({
        return: (r = this.getTraceRecords(e)) && r.sequence[r.sequenceCount - 1],
        msgId
      });
    }

    getEntry(e, {logName, type, key, msgId}) {
      var records, ref;
      if (!type) {
        type = 'sequence';
      }
      return this.port.postMessage({
        return: (records = this.getTraceRecords(e)) && ((ref = records[type]) != null ? ref[key] : void 0),
        msgId
      });
    }

    getCallGraphInfo(e, {logName, msgId}) {
      var records;
      records = this.getTraceRecords(e);
      return this.port.postMessage({
        return: {
          length: records.callGraphs.length,
          latest: records.callGraphs.slice(records.callGraphs.length - 10)
        },
        msgId
      });
    }

    getCallGraphEntry(e, {logName, msgId, number}) {
      return this.port.postMessage({
        return: this.getTraceRecords(e).callGraphs[number],
        msgId
      });
    }

    clearEntries(e, {logName}) {
      return newTraceRecords(logName);
    }

    deleteEntries(e, {logName}) {
      return traceRecords[logName] = {};
    }

    getContextDef(e, {logName, context, id, msgId}) {
      context = this.getTraceRecords(e).contexts[context];
      return this.port.postMessage({
        return: context.lazyDefs[id] || context.lambdaDefs[id],
        msgId
      });
    }

    getLambdaDef(e, {logName, lambdaName}) {
      return this.port.postMessage({
        return: this.getTraceRecords(e).lambdaDefsByName[lambdaName],
        msgId
      });
    }

    lazyValue(records, pos, values) {
      var context, id, instance, record, type;
      type = values[pos++];
      instance = values[pos++];
      context = values[pos++];
      id = values[pos++];
      record = records.add(records.values, instance, {type, instance, context, id});
      records.addCallGraphEntry(0, record.sequence);
      return pos;
    }

    resolve(records, pos, values) {
      var instance, record, result, type;
      type = values[pos++];
      instance = values[pos++];
      result = [values[pos++]];
      if (result[0] === -1) {
        result.push(values[pos++]);
      }
      record = records.add(records.resolves, instance, {
        type,
        instance,
        value: result
      });
      records.addCallGraphEntry(0, record.sequence);
      return pos;
    }

    lambda(records, pos, values) {
      var context, id, instance, parent, type;
      type = values[pos++];
      instance = values[pos++];
      context = values[pos++];
      id = values[pos++];
      parent = values[pos++];
      records.add(records.lambdas, instance, {type, instance, context, id, parent});
      records.lambdaList.push(instance);
      return pos;
    }

    call(records, pos, values) {
      var args, context, i, id, instance, j, record, ref, type, v;
      type = values[pos++];
      instance = values[pos++];
      context = values[pos++];
      id = values[pos++];
      args = [];
      for (i = j = 0, ref = values[pos++]; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        args.push(v = values[pos++]);
        if (v === -1) {
          args.push(values[pos++]);
        }
      }
      record = records.add(records.calls, null, {type, instance, context, id, args});
      records.stack.push(record);
      records.addCallGraphEntry(1, record.sequence);
      return pos;
    }

    return(records, pos, values) {
      var caller, context, id, instance, record, result, type;
      type = values[pos++];
      instance = values[pos++];
      context = values[pos++];
      id = values[pos++];
      result = [values[pos++]];
      if (result[0] === -1) {
        result.push(values[pos++]);
      }
      caller = records.stack.pop();
      record = records.add(records.returns, null, {
        type,
        instance,
        context,
        id,
        caller: caller.sequence,
        value: result
      });
      records.addCallGraphEntry(-1, record.sequence);
      return pos;
    }

    createPartial(records, pos, values) {
      var args, context, i, id, instance, j, lambda, record, ref, type, v;
      type = values[pos++];
      instance = values[pos++];
      lambda = values[pos++];
      context = values[pos++];
      id = values[pos++];
      args = [];
      for (i = j = 0, ref = values[pos++]; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        args.push(v = values[pos++]);
        if (v === -1) {
          args.push(values[pos++]);
        }
      }
      record = records.add(records.partials, instance, {type, instance, lambda, context, id, args});
      return pos;
    }

    callPartial(records, pos, values) {
      var args, context, i, id, instance, j, lambda, record, ref, type, v;
      type = values[pos++];
      instance = values[pos++];
      lambda = values[pos++];
      context = values[pos++];
      id = values[pos++];
      args = [];
      for (i = j = 0, ref = values[pos++]; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        args.push(v = values[pos++]);
        if (v === -1) {
          args.push(values[pos++]);
        }
      }
      record = records.add(records.partialCalls, instance, {type, instance, lambda, context, id, args});
      records.addCallGraphEntry(0, record.sequence);
      return pos;
    }

    mark(records, pos, values) {
      var count, record, type;
      type = values[pos++];
      count = values[pos++];
      record = records.add(records.marks, null, {type, count});
      return pos;
    }

    context(records, pos, values) {
      var argCount, args, col, context, debugType, defs, externalMap, id, inlineMap, lambdaDefs, lazyDefs, length, line, name, parent, source, type;
      [type, context, source, inlineMap, externalMap, debugType, length] = values.slice(pos, pos + 7);
      pos += 7;
      defs = [];
      lambdaDefs = {};
      lazyDefs = {};
      records.contexts[context] = {
        type,
        id: context,
        source,
        inlineMap,
        externalMap,
        defs,
        lambdaDefs,
        lazyDefs,
        debugType
      };
      id = 0;
      length += pos;
      while (pos < length) {
        [type, line, col, parent] = values.slice(pos, pos + 4);
        pos += 4;
        if (type === 'lazy') {
          defs.push(lazyDefs[id] = {
            context,
            id,
            type: 'lazyDef',
            line,
            col,
            parent
          });
        } else {
          [name, argCount] = values.slice(pos, pos + 2);
          pos += 2;
          args = values.slice(pos, pos + argCount);
          pos += argCount;
          defs.push(lambdaDefs[id] = {
            context,
            id,
            type: 'lambdaDef',
            line,
            col,
            parent,
            name,
            args
          });
          if (name) {
            records.lambdaDefsByName[name] = lambdaDefs[id];
          }
        }
        id++;
      }
      return pos;
    }

  };

  self.worker = worker = new OdbWorker();

  self.traceRecords = traceRecords;

  console.log("global: ", self);

  console.log("worker: ", worker);

  console.log("records: ", traceRecords);

  addRecord = function(records, map, instanceId, record) {
    var seq;
    seq = record.sequence = records.sequenceCount++;
    records.sequence[seq] = record;
    if (map) {
      map[instanceId !== null ? instanceId : seq] = record;
    }
    if (records.items[instanceId] == null) {
      records.items[instanceId] = record;
    }
    return record;
  };

  newTraceRecords = function(name) {
    var records, ref, ref1, ref2, ref3;
    records = traceRecords[name] = {
      callGraphs: [],
      sequenceCount: 0,
      sequence: [],
      contexts: (ref = (ref1 = traceRecords[name]) != null ? ref1.contexts : void 0) != null ? ref : [],
      lambdaDefsByName: (ref2 = (ref3 = traceRecords[name]) != null ? ref3.lambdaDefsByName : void 0) != null ? ref2 : {},
      values: {},
      resolves: {},
      lambdas: {},
      lambdaIds: [],
      calls: {},
      partials: {},
      partialCalls: {},
      returns: {},
      items: {},
      contexts: [],
      stack: []
    };
    records.add = addRecord.bind(null, records);
    records.dump = dump.bind(null, name);
    records.addCallGraphEntry = addCallGraphEntry.bind(null, records);
    return records;
  };

  last = function(a) {
    return a[a.length - 1];
  };

  addCallGraphEntry = function(records, delta, seq) {
    var cg, entry;
    cg = records.callGraphs;
    if (cg.length === 0 || (entry = last(cg).level === 0)) {
      entry = {
        size: 0,
        level: 0,
        start: seq
      };
      cg.push(entry);
    }
    entry.size++;
    entry.level += delta;
    if (entry.level < 0) {
      throw new Error("Call level dropped below zero");
    } else if (entry.level === 0) {
      return entry.end = seq;
    }
  };

  processTrace = function(records, value) {};

  TraceDumper = class TraceDumper {
    dump(records1) {
      var context, def, i, result, type;
      this.records = records1;
      this.level = 0;
      this.called = {};
      result = ((function() {
        var j, len, ref, results;
        ref = this.records.contexts;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          context = ref[j];
          results.push(this.dumpRecord(context) + '\n' + ((function() {
            var k, len1, ref1, results1;
            ref1 = context.defs;
            results1 = [];
            for (k = 0, len1 = ref1.length; k < len1; k++) {
              def = ref1[k];
              type = def.type === 'lazy' ? 'lazyDef' : 'lambdaDef';
              results1.push(this.dumpRecord(Object.assign({}, def, {type})));
            }
            return results1;
          }).call(this)).join('\n'));
        }
        return results;
      }).call(this)).join('\n');
      return result + '\n' + ((function() {
        var j, ref, results;
        results = [];
        for (i = j = 0, ref = this.records.sequenceCount; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
          results.push(this.dumpRecord(this.records.sequence[i]));
        }
        return results;
      }).call(this)).join('\n');
    }

    dumpRecord(record) {
      var i, j, prefix, ref;
      prefix = record.sequence != null ? pad(7, String(record.sequence)) + ' ' : '';
      for (i = j = 0, ref = this.level; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        prefix = prefix + '  ';
      }
      return `${prefix}${record.type} ` + this[record.type](record).join(' ');
    }

    nameForLambda(lambda, context, id) {
      var ctx, def, l, ref;
      if ((context == null) && typeof lambda === 'number') {
        if (l = this.records.lambdas[lambda]) {
          def = this.records.contexts[l.context].defs[l.id];
        }
      } else if (context != null) {
        def = this.records.contexts[context].defs[id];
      } else if (lambda.context != null) {
        def = this.records.contexts[lambda.context].defs[lambda.id];
      }
      if (def) {
        if (def.name) {
          return def.name;
        } else {
          id = def.id;
          ctx = this.records.contexts[def.context];
          while (def && !def.name) {
            def = ctx.defs[def.parent];
          }
          return `${(ref = def != null ? def.name : void 0) != null ? ref : ''}[${id}]`;
        }
      } else {
        return `[${lambda}]`;
      }
    }

    nextValue(value, pos) {
      var v;
      pos = pos != null ? pos : 0;
      if (value[pos] === -1) {
        return value[pos + 1];
      } else if (typeof value[pos] === 'number') {
        if (v = this.records.values[value[pos]]) {
          return `VALUE[${v.instance} in ${this.nameForLambda(v.parent)}]`;
        } else {
          return this.nameForLambda(value[pos]);
        }
      } else {
        return value[pos];
      }
    }

    context({id, source, debugType}) {
      return [id, source, debugType];
    }

    lambdaDef({line, col, context, id, parent, name, argNames}) {
      var ref;
      //[name ? (if parent? then 'unknown' else '????'), "id: #{context}:#{id}:#{parent ? '-'}", "position: #{line ? '?'}:#{col ? '?'}", argNames]
      return [(ref = this.nameForLambda('unknown', context, id)) != null ? ref : '????', `id: ${context}:${id}:${parent != null ? parent : '-'}`, `position: ${line != null ? line : '?'}:${col != null ? col : '?'}`, argNames];
    }

    lazyDef({line, col, context, id, parent}) {
      return [`id: ${context}:${id}:${parent != null ? parent : '-'}`, `position: ${line != null ? line : '?'}:${col != null ? col : '?'}`];
    }

    lazyValue({instance, id, parent, context}) {
      return [`(${instance} ${this.nameForLambda("unknown", context, id)})`];
    }

    resolve({instance, value}) {
      return [`(${instance}):`, this.nextValue(value)];
    }

    lambda({instance, context, id, parent}) {
      return [this.nameForLambda(instance, context, id), this.records.contexts[context].defs[id].args.join(', ')];
    }

    call({instance, context, id, args}) {
      var pos, result;
      if (this.called[instance]) {
        this.called[instance]++;
      } else {
        this.called[instance] = 1;
      }
      this.level++;
      result = [this.nameForLambda(instance, context, id), `(${instance}):`];
      pos = 0;
      while (pos < args.length) {
        result.push(this.nextValue(args, pos));
        pos += args[pos] === -1 ? 2 : 1;
      }
      return result;
    }

    return({caller, instance, context, id, value}) {
      if (this.called[instance]) {
        this.called[instance]--;
        this.level--;
      }
      return ["from", this.nameForLambda(instance, context, id), `(${instance} caller: ${caller}):`, this.nextValue(value)];
    }

    createPartial({instance, lambda, args}) {
      return [this.nameForLambda(lambda), instance, args];
    }

    callPartial({instance, args}) {
      return [this.nameForLambda(this.records.partials[instance].lambda), instance, args];
    }

  };

  pad = function(number, string) {
    while (string.length < number) {
      string = " " + string;
    }
    return string;
  };

  dump = function(logName) {
    return new TraceDumper().dump(traceRecords[logName]);
  };

  self.dump = dump;

}).call(this);

//# sourceMappingURL=odbWorker.js.map
