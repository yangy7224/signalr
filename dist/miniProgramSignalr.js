(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.miniProgramSignalr = mod.exports;
  }
})(this, function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var protocal = {
    protocol: "json",
    version: 1
  };

  var MessageType = {
    /** Indicates the message is an Invocation message and implements the {@link InvocationMessage} interface. */
    Invocation: 1,
    /** Indicates the message is a StreamItem message and implements the {@link StreamItemMessage} interface. */
    StreamItem: 2,
    /** Indicates the message is a Completion message and implements the {@link CompletionMessage} interface. */
    Completion: 3,
    /** Indicates the message is a Stream Invocation message and implements the {@link StreamInvocationMessage} interface. */
    StreamInvocation: 4,
    /** Indicates the message is a Cancel Invocation message and implements the {@link CancelInvocationMessage} interface. */
    CancelInvocation: 5,
    /** Indicates the message is a Ping message and implements the {@link PingMessage} interface. */
    Ping: 6,
    /** Indicates the message is a Close message and implements the {@link CloseMessage} interface. */
    Close: 7
  };

  var HubConnection = exports.HubConnection = function () {
    function HubConnection() {
      _classCallCheck(this, HubConnection);

      this.openStatus = false;
      this.methods = {};
      this.negotiateResponse = {};
      this.connection = {};
      this.url = "";
      this.invocationId = 0;
      this.callbacks = {};
    }

    _createClass(HubConnection, [{
      key: "start",
      value: function start(url, queryString) {
        var _this2 = this;

        var negotiateUrl = url + "/negotiate";
        if (queryString) {
          for (var query in queryString) {
            negotiateUrl += (negotiateUrl.indexOf("?") < 0 ? "?" : "&") + (query + "=" + encodeURIComponent(queryString[query]));
          }
        }
        wx.request({
          url: negotiateUrl,
          method: "post",
          async: false,
          success: function success(res) {
            _this2.negotiateResponse = res.data;
            _this2.startSocket(negotiateUrl.replace("/negotiate", ""));
          },
          fail: function fail(res) {
            console.error("requrst " + url + " error : " + res);
            return;
          }
        });
      }
    }, {
      key: "startSocket",
      value: function startSocket(url) {
        var _this3 = this;

        url += (url.indexOf("?") < 0 ? "?" : "&") + ("id=" + this.negotiateResponse.connectionId);
        url = url.replace(/^http/, "ws");
        this.url = url;
        console.log(url);
        return false;
        if (this.connection != null && this.openStatus) {
          return;
        }

        this.connection = wx.connectSocket({
          url: url
        });

        this.connection.onOpen(function (res) {
          console.log("websocket connectioned to " + _this3.url);
          _this3.sendData(protocal);
          _this3.openStatus = true;
          _this3.onOpen(res);

          // let relationType = "Buyoffer";
          // let relationId = 2;
          // this.send("setMessageReaded", relationType, relationId);
        });

        this.connection.onClose(function (res) {
          console.log("websocket disconnection");
          _this3.connection = null;
          _this3.openStatus = false;
          _this3.onClose(res);
        });

        this.connection.onError(function (res) {
          console.error("websocket error msg: " + msg);
          _this3.close({
            reason: msg
          });
          _this3.onError(res);
        });

        this.connection.onMessage(function (res) {
          return _this3.receive(res);
        });
      }
    }, {
      key: "on",
      value: function on(method, fun) {
        if (this.methods[method]) {
          this.methods[method].push(fun);
        } else {
          this.methods[method] = [fun];
        }
      }
    }, {
      key: "onOpen",
      value: function onOpen(data) {}
    }, {
      key: "onClose",
      value: function onClose(msg) {}
    }, {
      key: "onError",
      value: function onError(msg) {}
    }, {
      key: "close",
      value: function close(data) {
        if (data) {
          this.connection.close(data);
        } else {
          this.connection.close();
        }

        this.openStatus = false;
      }
    }, {
      key: "sendData",
      value: function sendData(data, success, fail, complete) {
        this.connection.send({
          data: JSON.stringify(data) + "",
          success: success,
          fail: fail,
          complete: complete
        });
      }
    }, {
      key: "receive",
      value: function receive(data) {
        console.log(data);
        if (data.data.indexOf("{\"type\":1,") < 0) return;

        // todo 原消息结构需要调整，旧的{ msg, nickName = fromClient.NickName, avatar = fromClient.Avatar } 新的 {List<xxx>}
        // todo 接收到信息列表后的处理逻辑，追加到本地消息列表；再根据前端所在的页面：首页-红点，列表页-红点+显示最新1条+重新排序，聊天页-显示最新+设置只读（必须是匹配的relationType和relationId的）
        // todo 如果当前页是聊天页，收到消息后设置为只读，参考sendMessage方法，改为SetMessageReaded(relationType, relationID)

        var message = JSON.parse(data.data.split('')[0].replace("gm", ""));

        switch (message.type) {
          case MessageType.Invocation:
            this.invokeClientMethod(message);
            break;
          case MessageType.StreamItem:
            break;
          case MessageType.Completion:
            var callback = this.callbacks[message.invocationId];
            if (callback != null) {
              delete this.callbacks[message.invocationId];
              callback(message);
            }
            break;
          case MessageType.Ping:
            // Don't care about pings
            break;
          case MessageType.Close:
            console.log("Close message received from server.");
            this.close({
              reason: "Server returned an error on close"
            });
            break;
          default:
            console.warn("Invalid message type: " + message.type);
        }
      }
    }, {
      key: "send",
      value: function send(functionName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
          args[_i - 1] = arguments[_i];
        }

        this.sendData({
          target: functionName,
          arguments: args,
          type: MessageType.Invocation,
          invocationId: this.invocationId.toString()
        });
        this.invocationId++;
      }
    }, {
      key: "invoke",
      value: function invoke(functionName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
          args[_i - 1] = arguments[_i];
        }

        var _this = this;
        var id = this.invocationId;
        var p = new Promise(function (resolve, reject) {

          _this.callbacks[id] = function (message) {
            if (message.error) {
              reject(new Error(message.error));
            } else {
              resolve(message.result);
            }
          };

          _this.sendData({
            target: functionName,
            arguments: args,
            type: MessageType.Invocation,
            invocationId: _this.invocationId.toString()
          }, null, function (e) {
            reject(e);
          });
        });
        this.invocationId++;
        return p;
      }
    }, {
      key: "invokeClientMethod",
      value: function invokeClientMethod(message) {
        var _this4 = this;

        var methods = this.methods[message.target.toLowerCase()];
        if (methods) {
          methods.forEach(function (m) {
            return m.apply(_this4, message.arguments);
          });
          if (message.invocationId) {
            // This is not supported in v1. So we return an error to avoid blocking the server waiting for the response.
            var errormsg = "Server requested a response, which is not supported in this version of the client.";
            console.error(errormsg);
            this.close({
              reason: errormsg
            });
          }
        } else {
          console.warn("No client method with the name '" + message.target + "' found.");
        }
      }
    }]);

    return HubConnection;
  }();
});