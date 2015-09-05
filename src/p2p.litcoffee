Peer-to-peer connection between Leisure instances.  They send "final"
document changes to each other, meaning that all document computations
are complete and only the document changes need be replicated.

    define ['jquery', 'immutable', './editor', './editorSupport', 'sockjs', './hamtData', './advice', './ot'], (jq, immutable, Editor, Support, SockJS, HamtData, Advice, OT)->
      {
        Map
        Set
      } = window.Immutable = immutable
      {
        DataStore
        preserveSelection
        blockText
        computeNewStructure
        validateBatch
      } = Editor
      {
        OrgData
        getDocumentParams
        editorToolbar
        basicDataFilter
      } = Support
      {
        HamtOrgData
      } = HamtData
      {
        changeAdvice
        afterMethod
        beforeMethod
        callOriginal
      } = Advice

Peer is the top-level object for a peer-to-peer-capable Leisure instance.

      class Peer
        constructor: ->
          @data = new HamtOrgData()
          @clearChanges()
          @pendingReplaces = []
          @unreplacements = []
          @batchCallbacks = []
          @messageCount = 0
          @dataFilter =
            __proto__: basicDataFilter
            endChange: => @dataFinishedChange
            clear: => @dataClear
            replaceBlock: (data, oldBlock, newBlock)=>
              @recordChange @peerChanges, oldBlock, newBlock
          @version = -1
        clearChanges: ->
          @ot = new OT()
        recordChange: (changes, oldBlock, newBlock)->
          if !newBlock
            changes.removes[oldBlock._id] = true
            delete changes.sets[oldBlock._id]
          else
            delete changes.removes[newBlock._id]
            changes.sets[newBlock._id] = true
        recordLocalChanges: (oldBlocks, newBlocks)->
          newIds = _.indexBy newBlocks, '_id'
          for id, block of _.indexBy oldBlocks, '_id'
            if !newIds[id] then @recordChange @localChanges, block, null
          for id, block of newIds
            @recordChange @localChanges, null, block
        setEditor: (@editor)->
        disconnect: ->
          @con?.close()
          @con = null
        hasPendingReplaces: -> @pendingReplaces.length
        applyIncomingChanges: ->
          for repl in @unreplacements by -1
            @replaceText repl.start, repl.end, repl.text
          @unreplacements = []
          for repl in @pendingReplaces
            if !(repl.type == 'conditionalReplace')
              @ot.replace repl
          myPos = -1
          preserveSelection (range)=>
            @ot.eachOperation (start, end, text, offset, effect)=>
              myLatest = null
              myLast = _.last @pendingReplaces
              myRepl = null
              if effect.replCount <= 1
                tmpOff = offset
                for repl in effect.activeOperations
                  if repl == myLast || (!myLast && repl.mine && repl.messageCount? && (!myLatest || myLatest.messageCount < repl.messageCount))
                    myLatest = repl
                    myPos = start + tmpOff + repl.text.length
                    myRepl = repl
                  if myRepl && !myRepl.messageCount?
                    @pushUnreplacement start + tmpOff, myRepl.end + offset + tmpOff, text
                  tmpOff += repl.text.length
              if end <= range.start then range.start += text.length - end + start
              else if start <= range.start < end
                range.start = start + text.length
              @replaceText repl.start, repl.end, repl.text
          if myPos > -1
            range = @editor.getSelectedDocRange()
            range.start = myPos
            range.length = 0
            @editor.selectDocRange range
        connect: (@url, @connectedFunc)->
          @con = new SockJS @url
          @con.onmessage = (msg)=> @handleMessage JSON.parse msg.data
          @con.onclose = => @closed()
          peer = this
          changeAdvice @editor.options, true,
            changesFor: p2p: (parent)->(first, oldBlocks, newBlocks, verbatim)->
              changes = parent first, oldBlocks, newBlocks, verbatim
              peer.sendReplace changes
              changes
            batchReplace: p2p: (parent)->(replacementsFunc, contFunc, errFunc)->
              peer.runBatchReplace replacementsFunc, contFunc, errFunc
        type: 'Unknown Handler'
        close: ->
          console.log "CLOSING: #{@type}"
          @con.close()
        closed: ->
          changeAdvice @editor.options, false,
            changesFor: p2p: true
        send: (type, msg)->
          msg.type = type
          console.log "SEND #{JSON.stringify msg}"
          @con.send JSON.stringify msg
        runBatchReplace: (replacementsFunc, contFunc, errFunc)->
          try
            replacements = validateBatch replacementsFunc()
            msg = type: 'conditionalReplace', replacements: replacements, targetVersion: @version
            @pendingReplaces.push msg
            pushedReplaces = true
            @batchCallbacks.push
              cont: contFunc
              error: errFunc
              replay: => @runBatchReplace replacementsFunc, contFunc, errFunc
            pushedCallbacks = true
            @send 'conditionalReplace', msg
          catch err
            if pushedReplaces then @pendingReplaces.pop()
            if pushedCallbacks then @batchCallbacks.pop()
            errFunc err
        sendReplace: ({oldBlocks, newBlocks})->
          #batch and throttle at one send every 100-125 millis
          offset = @data.offsetForBlock oldBlocks[0]
          repl = replacementFor offset, blockText(oldBlocks), blockText(newBlocks)
          repl.type = 'replace'
          repl.version = @version
          @pushUnreplacement repl.start, repl.end, repl.text
          for r in @pendingReplaces
            if r.end < repl.start
              offset = r.text.length - r.end + r.start
              repl.start -= offset
              repl.end -= offset
          @pendingReplaces.push _.merge (mine: true), repl
          @send 'replace', repl
        pushUnreplacement: (start, end, text)->
          @unreplacements.push
            start: start
            end: start + text.length
            text: @data.getDocSubstring start, end
        mine: (msg)-> msg.connectionId == @connectionId
        handleMessage: (msg)->
          console.log "RECEIVE #{JSON.stringify msg}"
          msg.messageCount = @messageCount++
          if !(msg.type of @handler)
            console.log "Received bad message #{msg.type}", msg
            @close()
          else @handler[msg.type].call this, msg
        dumpReplacements: ->
          repls = ''
          offset = 0
          replacementWidth = 0
          @ot.eachOperation (start, end, text)->
            if offset < start
              offset = start
              deletionWidth = 0
              replacementWidth = 0
            else if end - start > 0 && deletionWidth > end - start then return
            if end - start > 0 && end - start == deletionWidth
              repls += "OVERRIDE #{start}, #{end}, #{text}\n"
            else repls += "#{start}, #{end}, #{text}\n"
            deletionWidth = Math.max deletionWidth, end - start
            replacementWidth = Math.max replacementWidth, text.length
          repls
        handler:
          log: (msg)-> console.log msg.msg
          connect: (msg)->
            {@id, @connectionId, @version} = msg
            @clearChanges()
            #console.log "Connected, id: #{@id}"
            @connectedFunc?(this)
            @connectedFunc = null
          error: (msg)->
            console.log "Received error: #{msg.error}", msg
            @close()
          newVersion: (msg)->
            {@version} = msg
            for msg in @pendingReplaces
              offset = @ot.floatFor msg
              msg.start += offset
              msg.end += offset
              msg.version = @version
            @clearChanges()
            @send 'ack', {}
          rejectChange: ->
            @pendingReplaces.shift()
            @batchCallbacks.pop().replay()
          echo: (msg)->
            pending = @pendingReplaces.shift()
            pending.messageCount = msg.messageCount
            pending.version = @version
            if pending.type == 'conditionalReplace'
              try
                @replaceBatch pending.replacements
                @batchCallbacks.pop().cont()
              catch err
                @batchCallbacks.pop().error(err)
            else
              pending.connectionId = @connectionId
              @handleMessage pending
          conditionalReplace: ({replacements, version})->
            preserveSelection (range)=>
              offset = 0
              for repl in replacements
                {start, end} = repl
                start += offset
                end += offset
                if end <= range.start
                  range.start += text.length - end + start
                else if start <= range.start < end
                  range.start = start + text.length
                offset += repl.text.length - repl.end + repl.start
              @replaceBatch replacements
          replace: (msg)->
            if msg.upgraded && @mine msg then @pendingReplaces.shift()
            @ot.replace msg
            @applyIncomingChanges()
        replaceBatch: (replacements)->
          @data.batchReplace replacements
        replaceText: (start, end, text)->
          @data.replaceText start, end, text
        createSession: (@host, @connectedFunc)->
          @type = 'Master'
          @handler =
            __proto__: Peer::handler
            connect: (msg)->
              @connectUrl = new URL("slave-#{msg.id}", @url)
              Peer::handler.connect.call this, msg
              @send 'initDoc', doc: @data.getText()
            slaveConnect: (msg)->
              @send 'slaveApproval', slaveId: msg.slaveId, approval: true
            slaveDisconnect: (msg)->
          @connect "http://#{@host}/Leisure/master", @connectedFunc
        connectToSession: (@url, connected)->
          @type = 'Slave'
          @handler =
            __proto__: Peer::handler
            connect: (msg)->
              Peer::handler.connect.call this, msg
              @editor.options.load msg.doc
          @connect @url, connected

      replacementFor = (start, oldText, newText)->
        end = start + (oldText.length ? 0)
        for startOff in [0...Math.min oldText.length, newText.length]
          if oldText[startOff] != newText[startOff] then break
        start += startOff
        for endOff in [0..Math.min oldText.length - startOff - 1, newText.length - startOff - 1] by 1
          if oldText[oldText.length - endOff - 1] != newText[newText.length - endOff - 1]
            break
        {
          start
          end: end - endOff
          text: (if startOff || endOff then newText.substring startOff, newText.length - endOff else '')
        }

      $(document).ready ->
        if document.location.search.length > 1 && !connected
          connected = true
          {join} = getDocumentParams()
          if join
            setTimeout (->
              createSessionButton = $(editorToolbar window.PEER.editor.node).find('[name=p2pConnector] [name=createSession]')
              createSessionButton.data hasSession: true
              createSessionButton.closest('.contents').removeClass 'not-connected'
              createSessionButton.closest('.contents').addClass 'connected'
              createSessionButton.button 'option', 'label', 'Disconnect'
              console.log "CREATE SESSION:", createSessionButton[0]
              u = new URL join
              console.log "JOIN SESSION: #{u}"
              window.PEER.connectToSession u.toString()), 1

      {
        Peer
      }
