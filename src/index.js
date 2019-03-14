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
    constructor(options){
        this.hubConnection = {};
        this.options = options;
        this.reBuildInstance = 0;
        this.reConnectionTime = options.reConnectionTime || 3000;

        this.init();
        this.buildConnection();
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
        const that = this;
        let promise = null;

        if(isMiniProgram){
            promise = this.hubConnection.start(`${InterfaceConfig.getCurrentConfigUrl()}/chat`, {token: this.options.token});
        }else {
            promise = this.hubConnection.start();
        }
        promise && promise.then(function () {
            console.log('连接成功');
            clearInterval(that.reBuildInstance);
            that.register();
        }).catch(err => {
            console.log('连接失败');
            that.rebuildConnetion(err);
        });

        this.hubConnection.onclose((err) => { this.onClose(err) });
    }

    // 停止消息中心
    stop(){
        this.hubConnection.stop();
    }

    //注册一些基本事件
    register(){
        this.hubConnection.on(CommandType.SendMsgName, () => {});
        this.hubConnection.on(CommandType.ReceiveMsgName, (res) => {this.onReceive(res)});
        this.hubConnection.on(CommandType.ErrorMsgName, (res) => {this.onError(res)});
    }

    //发送消息
    sendMessage(relationType, relationId, toUserId, dialogueId, msg){
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

    //监听网络断开
    onClose(err){
        console.log(err);
        //断线重连
        this.rebuildConnetion();
    }

    // 建立连接
    buildConnection(){
        this.start();
        // this.register();
    }

    // 断线重连
    rebuildConnetion(err){
        const that = this;
        if(that.reBuildInstance > 0){
            return;
        }
        err && console.log(err.toString());

        that.reBuildInstance = setInterval(function () {
            that.buildConnection();
            console.log('正在尝试重连-----');
        },that.reConnectionTime);
    }
}

export default SignalR

