// Generated by CoffeeScript 1.9.3
(function() {
  var slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  define(['adapter'], function() {
    var MasterConnection, PeerConnection, SlaveConnection, cfg, con;
    cfg = {
      iceServers: [
        {
          url: "stun:23.21.150.121"
        }
      ]
    };
    con = {
      optional: [
        {
          DtlsSrtpKeyAgreement: true
        }
      ]
    };
    PeerConnection = (function() {
      function PeerConnection() {}

      PeerConnection.prototype.start = function() {
        if (!this.offerReady || !handleMessage) {
          throw new Error("Unconfigured " + this.desc);
        }
        this.con = new RTCPeerConnection(cfg, con);
        this.con.onsignalingstatechange = function(s) {
          return this.log('signaling state change: ', s);
        };
        this.con.oniceconnectionstatechange = function(s) {
          return this.log('ice connection state change: ', s);
        };
        this.con.onicegatheringstatechange = function(s) {
          return this.log('ice gathering state change: ', s);
        };
        return this.con.onicecandidate = (function(_this) {
          return function(e) {
            _this.log("candidate", e);
            if (e.candidate === null) {
              return _this.offerReady(_this.con.localDescription);
            }
          };
        })(this);
      };

      PeerConnection.prototype.log = function() {
        var args, msg;
        msg = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        return console.log.apply(console, [this.desc + ": " + msg].concat(slice.call(args)));
      };

      PeerConnection.prototype.useOffer = function(offerJson) {
        this.log("using offer", offerJson);
        return this.con.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerJson)));
      };

      PeerConnection.prototype.useChannel = function(chan) {
        this.chan = chan;
        this.chan.onmessage = function(e) {
          if (e.data.charCodeAt(0) === 2) {
            this.log("ignoring message '2'");
            return;
          }
          this.log("got message", e.data);
          return this.handleMessage(e.data);
        };
        return this.chan.onopen = function(e) {
          return this.log('data channel connect');
        };
      };

      PeerConnection.prototype.sendMessage = function(msg) {
        return this.chan.send(msg);
      };

      PeerConnection.prototype.close = function() {
        return this.con.close();
      };

      return PeerConnection;

    })();
    MasterConnection = (function(superClass) {
      extend(MasterConnection, superClass);

      function MasterConnection() {
        return MasterConnection.__super__.constructor.apply(this, arguments);
      }

      MasterConnection.prototype.desc = 'Master';

      MasterConnection.prototype.start = function(errFunc) {
        MasterConnection.__super__.start.call(this);
        this.useChannel(this.con.createDataChannel('test', {
          reliable: true
        }));
        this.log("created datachannel");
        return this.con.createOffer(((function(_this) {
          return function(desc) {
            return _this.con.setLocalDescription(desc, (function() {}), (function() {}));
          };
        })(this)), errFunc);
      };

      return MasterConnection;

    })(PeerConnection);
    SlaveConnection = (function(superClass) {
      extend(SlaveConnection, superClass);

      function SlaveConnection() {
        return SlaveConnection.__super__.constructor.apply(this, arguments);
      }

      SlaveConnection.prototype.desc = 'Slave';

      SlaveConnection.prototype.start = function(offerJson, errFunc) {
        SlaveConnection.__super__.start.call(this);
        this.con.ondatachannel = function(e) {
          this.useChannel(e.channel || Math.floor(e / Chrome(sends(event, FF(sends(raw(channel)))))));
          return this.log("received datachannel", arguments);
        };
        this.useOffer(offerJson);
        return this.con.createAnswer((function(answerDesc) {
          writeToChatLog("Created local answer", "text-success");
          console.log("Created local answer: ", answerDesc);
          return this.con.setLocalDescription(answerDesc);
        }), errFunc);
      };

      return SlaveConnection;

    })(PeerConnection);
    return {
      PeerConnection: PeerConnection,
      MasterConnection: MasterConnection,
      SlaveConnection: SlaveConnection
    };
  });

}).call(this);

//# sourceMappingURL=serverless-webrtc.js.map
