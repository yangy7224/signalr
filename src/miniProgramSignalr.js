const protocal = {
  protocol: "json",
  version: 1
};

const MessageType = {
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
  Close: 7,
}


export class HubConnection {

  constructor() {
    this.openStatus = false;
    this.methods = {};
    this.negotiateResponse = {};
    this.connection = {};
    this.url = "";
    this.invocationId = 0;
    this.callbacks = {};
  }

  start(url, queryString) {
    const that = this;
    var negotiateUrl = url + "/negotiate";
    if (queryString) {
      for(var query in queryString){
        negotiateUrl += (negotiateUrl.indexOf("?") < 0 ? "?" : "&") + (`${query}=` + encodeURIComponent(queryString[query]));
      }
    }
    return new Promise(function (resolve, reject) {
        wx.request({
            url: negotiateUrl,
            method: "post",
            async: false,
            success: res => {
                that.negotiateResponse = res.data;
                that.startSocket(negotiateUrl.replace("/negotiate",""));
                resolve(res.data);
            },
            fail: res => {
                console.error(`requrst ${url} error : ${res}`);
                reject(res);
            }
        });
    })  

  }

  startSocket(url) {
    url += (url.indexOf("?") < 0 ? "?" : "&") + ("id=" + this.negotiateResponse.connectionId);
    url = url.replace(/^http/, "ws");
    this.url = url;
    if (this.connection != null && this.openStatus) {
      return;
    }

    this.connection = wx.connectSocket({
      url: url
    })

    this.connection.onOpen(res => {
      console.log(`websocket connectioned to ${this.url}`);
      this.sendData(protocal);
      this.openStatus = true;
      this.onOpen(res);

      // let relationType = "Buyoffer";
      // let relationId = 2;
      // this.send("setMessageReaded", relationType, relationId);
    });

    this.connection.onClose(res => {
      console.log(`websocket disconnection`);
      this.connection = null;
      this.openStatus = false;
      this.onclose(res);
    });

    this.connection.onError(res => {
      console.error(`websocket error msg: ${msg}`);
      this.close({
        reason: msg
      });
      this.onError(res)
    });

    this.connection.onMessage(res => this.receive(res));
  }

  on(method, fun) {
    if (this.methods[method]) {
      this.methods[method].push(fun);
    } else {
      this.methods[method] = [fun];
    }
  }

  onOpen(data) {}

  onclose(msg) {

  }

  onError(msg) {

  }


  close(data) {
    if (data) {
      this.connection.close(data);
    } else {
      this.connection.close();
    }
    
    this.openStatus = false;
  }

  sendData(data, success, fail, complete) {
    this.connection.send({
      data: JSON.stringify(data) + "", 
      success: success,
      fail: fail,
      complete: complete
    });
  }

  receive(data) {
    console.log(data);
    if (data.data.indexOf("{\"type\":1,") < 0) return;
    

    // todo 原消息结构需要调整，旧的{ msg, nickName = fromClient.NickName, avatar = fromClient.Avatar } 新的 {List<xxx>}
    // todo 接收到信息列表后的处理逻辑，追加到本地消息列表；再根据前端所在的页面：首页-红点，列表页-红点+显示最新1条+重新排序，聊天页-显示最新+设置只读（必须是匹配的relationType和relationId的）
    // todo 如果当前页是聊天页，收到消息后设置为只读，参考sendMessage方法，改为SetMessageReaded(relationType, relationID)
    
    let message = JSON.parse(data.data.split('')[0].replace("gm", ""));


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

  send(functionName) {
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


  invoke(functionName) {
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
      }

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

  invokeClientMethod(message) {
    var methods = this.methods[message.target.toLowerCase()];
    if (methods) {
      methods.forEach(m => m.apply(this, message.arguments));
      if (message.invocationId) {
        // This is not supported in v1. So we return an error to avoid blocking the server waiting for the response.
        var errormsg = "Server requested a response, which is not supported in this version of the client.";
        console.error(errormsg);
        this.close({
          reason: errormsg
        });
      }
    } else {
      console.warn(`No client method with the name '${message.target}' found.`);
    }
  }
}