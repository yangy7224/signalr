/**
 * Created by yiyang1990 on 2019/2/25.
 */
import InterfaceConfig from '~/bower_components/config/dist/index.js'  //小程序这里要自己改

const { HubConnectionBuilder, HttpTransportType, LogLevel } = require('@aspnet/signalr');
const { HubConnection } = require('./miniProgramSignalr.js');

const ua = window.navigator.userAgent.toLowerCase();
let isMiniProgram = !Boolean(ua.indexOf('micromessenger') == -1);

const CommandType = {
    SendMsgName: 'sendMessage',
    ReceiveMsgName: 'receive',
    ErrorMsgName: 'system'
};

class SignalR {
    constructor(params){
        this.connection = {};
        this.options = params;
        this.response = {};
        this.init();
        this.start();
        this.register();
    }
    //初始化消息中心
    init(){
        if(isMiniProgram){
            this.connection = new HubConnection();
        }else{
            this.connection = new HubConnectionBuilder().withUrl(`${InterfaceConfig.getCurrentConfigUrl()}/chat?token=${this.options.token}`,{
                skipNegotiation: true,
                transport: HttpTransportType.WebSockets
            }).configureLogging(LogLevel.Information).build();
        }

    }

    //启动消息中心
    start(){
        if(isMiniProgram){
            this.connection.start(`${InterfaceConfig.getCurrentConfigUrl()}/chat`, {token: this.options.token}).catch(err => console.error(err.toString()));
        }else {
            this.connection.start().catch(err => console.error(err.toString()));
        }
    }

    //注册一些基本事件
    register(){
        this.connection.on(CommandType.SendMsgName, () => {});
        this.connection.on(CommandType.ReceiveMsgName, (res) => {this.onReceive(res)});
        this.connection.on(CommandType.ErrorMsgName, (res) => {this.onError(res)});
    }

    //发送消息
    sendMessage(relationType, relationId, toUserId, msg){
        if(isMiniProgram){
            this.connection.send(CommandType.SendMsgName, ...Array.prototype.slice.call(arguments));
        }else {
            this.connection.invoke(CommandType.SendMsgName, ...Array.prototype.slice.call(arguments));
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

