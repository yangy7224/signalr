(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports', '~/bower_components/config/dist/index.js', '@aspnet/signalr', './miniProgramSignalr.js'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('~/bower_components/config/dist/index.js'), require('@aspnet/signalr'), require('./miniProgramSignalr.js'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.index, global.signalr, global.miniProgramSignalr);
        global.index = mod.exports;
    }
})(this, function (exports, _index, _require, _require2) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _index2 = _interopRequireDefault(_index);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }

            return arr2;
        } else {
            return Array.from(arr);
        }
    }

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

    var HubConnectionBuilder = _require.HubConnectionBuilder,
        HttpTransportType = _require.HttpTransportType,
        LogLevel = _require.LogLevel;
    var HubConnection = _require2.HubConnection;


    var ua = window.navigator.userAgent.toLowerCase();
    var isMiniProgram = !Boolean(ua.indexOf('micromessenger') == -1);

    var CommandType = {
        SendMsgName: 'sendMessage',
        ReceiveMsgName: 'receive',
        ErrorMsgName: 'system'
    };

    var SignalR = function () {
        function SignalR(params) {
            _classCallCheck(this, SignalR);

            this.connection = {};
            this.options = params;
            this.response = {};
            this.init();
            this.start();
            this.register();
        }
        //初始化消息中心


        _createClass(SignalR, [{
            key: 'init',
            value: function init() {
                if (isMiniProgram) {
                    this.connection = new HubConnection();
                } else {
                    this.connection = new HubConnectionBuilder().withUrl(_index2.default.getCurrentConfigUrl() + '/chat?token=' + this.options.token, {
                        skipNegotiation: true,
                        transport: HttpTransportType.WebSockets
                    }).configureLogging(LogLevel.Information).build();
                }
            }
        }, {
            key: 'start',
            value: function start() {
                if (isMiniProgram) {
                    this.connection.start(_index2.default.getCurrentConfigUrl() + '/chat', { token: this.options.token }).catch(function (err) {
                        return console.error(err.toString());
                    });
                } else {
                    this.connection.start().catch(function (err) {
                        return console.error(err.toString());
                    });
                }
            }
        }, {
            key: 'register',
            value: function register() {
                var _this = this;

                this.connection.on(CommandType.SendMsgName, function () {});
                this.connection.on(CommandType.ReceiveMsgName, function (res) {
                    _this.onReceive(res);
                });
                this.connection.on(CommandType.ErrorMsgName, function (res) {
                    _this.onError(res);
                });
            }
        }, {
            key: 'sendMessage',
            value: function sendMessage(relationType, relationId, toUserId, msg) {
                if (isMiniProgram) {
                    var _connection;

                    (_connection = this.connection).send.apply(_connection, [CommandType.SendMsgName].concat(_toConsumableArray(Array.prototype.slice.call(arguments))));
                } else {
                    var _connection2;

                    (_connection2 = this.connection).invoke.apply(_connection2, [CommandType.SendMsgName].concat(_toConsumableArray(Array.prototype.slice.call(arguments))));
                }
            }
        }, {
            key: 'onReceive',
            value: function onReceive(res) {}
        }, {
            key: 'onError',
            value: function onError(res) {}
        }]);

        return SignalR;
    }();

    exports.default = SignalR;
});