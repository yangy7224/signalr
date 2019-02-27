/**
 * Created by yiyang1990 on 2019/2/25.
 */
let isMiniProgram = !Boolean(window);

const InterfaceConfig = require(isMiniProgram? '../../../bower_components/config/dist/index.js' : '~/bower_components/config/dist/index.js').default;
const Hub = require(isMiniProgram ? './miniProgramSignalr.js' : '@aspnet/signalr');

const CommandType = {
    SendMsgName: 'sendMessage',
    ReceiveMsgName: 'receive',
    ErrorMsgName: 'system'
};

class SignalR {
    constructor(params){
        this.hubConnection = {};
        this.options = params;
        this.init();
        this.start();
        this.register();
    }
    //初始化消息中心
    init(){
        if(isMiniProgram){
            this.hubConnection = new Hub.HubConnection();
        }else{
            this.hubConnection = new Hub.HubConnectionBuilder().withUrl(`${InterfaceConfig.getCurrentConfigUrl()}/chat?token=${this.options.token}`,{
                skipNegotiation: true,
                transport: Hub.HttpTransportType.WebSockets
            }).configureLogging(Hub.LogLevel.Information).build();
        }

    }

    //启动消息中心
    start(){
        if(isMiniProgram){
            this.hubConnection.start(`${InterfaceConfig.getCurrentConfigUrl()}/chat`, {token: this.options.token});
        }else {
            this.hubConnection.start().catch(err => console.error(err.toString()));
        }
    }

    //注册一些基本事件
    register(){
        this.hubConnection.on(CommandType.SendMsgName, () => {});
        this.hubConnection.on(CommandType.ReceiveMsgName, (res) => {this.onReceive(res)});
        this.hubConnection.on(CommandType.ErrorMsgName, (res) => {this.onError(res)});
    }

    //发送消息
    sendMessage(relationType, relationId, toUserId, msg){
        if(isMiniProgram){
            this.hubConnection.send(CommandType.SendMsgName, ...Array.prototype.slice.call(arguments));
        }else {
            this.hubConnection.invoke(CommandType.SendMsgName, ...Array.prototype.slice.call(arguments));
        }
    }

    // 监听接受事件
    onReceive(res){

    }
    // 监听系统事件
    onError(res){

    }
}

export default SignalR

