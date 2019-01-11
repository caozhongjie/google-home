'use strict';
// process.env.DEBUG = 'actions-on-google:*';
const https = require('https');
const App = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');
const EventProxy = require('eventproxy');// 第三方控件，用于控制并发
const querystring = require('querystring');
const crypto = require('crypto');
const voiceJSON = require( "./locales");
const proxy = new EventProxy();
// a. the action name from the make_name Dialogflow intent
const NAME_ACTION = 'command';
// b. the parameters that are parsed from the make_name intent
const COMMAND_ARGUMENT = 'command';
const appKey      = "62357059d25d4fbe868433cd66d58375";
const appSecret   = "523376ac0b5949ee82ec7243d07ea683";
let _command      = -1;  //对应协议中的指令
let _workMode     = 0;   //对应协议的工作状态
let intent        = null;//指令转译后JSON.stringify(....)赋值给intent
let req           = null;
let commandArr    = null;
let outPutSpeech  = null;
/**
 *  main function
 *  bonaCt
 * */
exports.conga = functions.https.onRequest((request, response) => {
    const app         = new App({request, response});
    function mainFun(app){
        if(app.getUser().accessToken){
            const accessToken = app.getUser().accessToken;
            const locale      = String(app.getUser().locale);
            console.log("locale-----"+locale);
            if(locale==="en-US"||locale==="en-GB"||locale==="en-AU"){
                commandArr   = voiceJSON["en-US"].command;
                outPutSpeech = voiceJSON["en-US"].outPutSpeech;
            }else if(locale==="de-DE"){
                commandArr   = voiceJSON["de-DE"].command;
                outPutSpeech = voiceJSON["de-DE"].outPutSpeech;
            }else if(locale==="ja-JP"){
                commandArr   = voiceJSON["ja-JP"].command;
                outPutSpeech = voiceJSON["ja-JP"].outPutSpeech;
            }else if(locale==="fr-FR"||locale==="fr-CA"){
                commandArr   = voiceJSON["fr-FR"].command;
                outPutSpeech = voiceJSON["fr-FR"].outPutSpeech;
            }else if(locale==="es-ES"||locale==="es-419"){
                commandArr   = voiceJSON["es-ES"].command;
                outPutSpeech = voiceJSON["es-ES"].outPutSpeech;
            }else if(locale==="it-IT"){
                commandArr   = voiceJSON["it-IT"].command;
                outPutSpeech = voiceJSON["it-IT"].outPutSpeech;
            }else if(locale==="ru-RU"){
                commandArr   = voiceJSON["ru-RU"].command;
                outPutSpeech = voiceJSON["ru-RU"].outPutSpeech;
            }else if(locale==="pt-BR"){
                commandArr   = voiceJSON["pt-BR"].command;
                outPutSpeech = voiceJSON["pt-BR"].outPutSpeech;
            }
        commandFun(app,commandArr,outPutSpeech,accessToken);
        }else{
            app.ask(outPutSpeech[31]);
            app.askForSignIn();
        }
        function commandFun(app,commandArr,outPutSpeech,accessToken) {
            const userId      = JSON.parse(accessToken).userId;
            const HOSTNAME    = JSON.parse(accessToken).region;
            let command = app.getArgument(COMMAND_ARGUMENT);
            console.log('the conmmand is ----------'+command)
            const intent = createCommand(command,userId,app,commandArr,outPutSpeech);
            console.log("intent---"+intent);
            if (intent !== undefined) {
                if (intent === null) { 
                    query(userId,appKey,appSecret,HOSTNAME,app,outPutSpeech);
                }
                else {
                    let commandString = String(command);
                    push(userId,appKey,appSecret,intent,HOSTNAME,app,commandString,commandArr,outPutSpeech);
                }
            }
        }
    }
    let actionMap = new Map();
    actionMap.set(NAME_ACTION, mainFun);
    app.handleRequest(actionMap);
});
/**
 *  指令转译
 *  bonaCt
 * */
function createCommand(command,userId,app,commandArr){
    command = String(command);
    if(command === commandArr[0] || command === commandArr[1]){
        _command = 106;
        _workMode = 1;
    }else if(command === commandArr[4]){
        _command = 102;
    }else if(command === commandArr[3]){
        _command = 106;
        _workMode = 4;
    }else if(command === commandArr[2]){
        _command = 106;
        _workMode = 6;
    }else if(command === commandArr[5]){
        _command = 104;
    }else if(command === commandArr[6]){
        _command = 99;
    }else if(command === commandArr[7]){
        _command = 106;
        _workMode = 3;
    }else if(command === commandArr[8]){
         _command = 106;
        _workMode = 8;
    }else if(command ===commandArr[9]){
        app.tell(outPutSpeech[35]);
    }else{
        app.ask(outPutSpeech[32]);
    }
    if (!isNaN(parseInt(_command))) {
        return intent =  setCommand(userId,_command,_workMode);
    }else {
        app.ask(_command+'is not a num' );
    }
}
function setCommand(userId,transitCmd,workMode) {
    if (transitCmd === 106) {
        return JSON.stringify({
            version: '1.0',
            control: {
                targetId: userId,
                targetType: 8,
                broadcast: 0
            },
            value: {
                transitCmd: String(transitCmd),
                mode: String(workMode)
            }
        });
    }
    else if (transitCmd === 99){
        return null;
    }
    else{
        return JSON.stringify({
            version: '1.0',
            control: {
                targetId: userId,
                targetType: 8,
                broadcast: 0
            },
            value:{
                transitCmd: String(_command)
            }
        });
    }
}
/**
 *  push
 *  https发送有人服务器
 * */
function push(userId,appKey,appSecret,command,HOSTNAME,app,commandString,commandArr,outPutSpeech) {
    let t = String(timeStamp());
    const sign = signature(userId,appKey,appSecret,command,t);
    const json = querystring.stringify({
        appKey:  appKey,
        content: command,
        nonce_str: t,
        userId: userId,
        sign: sign
    });
    console.log("push--json---- ",json);
    const https_option = {
        hostname:HOSTNAME,
        path:'/baole-web/common/third/sendTranslateMsg.do',
        headers:{
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': json.length,
            'Accept': 'application/json',
            'Accept-Encoding': 'utf-8',
            'User-agent': 'blapp'
        },
        method:'POST',
    };
    req = https.request(https_option, (res) => {
        res.on('data', function (chunk) {
            console.log(chunk);
            const result = typeof JSON.parse(chunk).result !== undefined ? JSON.parse(chunk).result : "500";
            // console.log('push - Response: ' + chunk + ' result =  ' + String(result));
            if (String(result) === "500" || String(result) === "501" || String(result) === "502")// errorCode
            {
                app.tell(outPutSpeech[33]);
            }
            else {
                if( commandString === commandArr[0] ){
                    app.tell(outPutSpeech[0]);
                }else if( commandString === commandArr[1]){
                    app.tell(outPutSpeech[1]);
                }else if( commandString === commandArr[3]){
                    app.tell(outPutSpeech[3]);
                }else if( commandString === commandArr[2]){
                    app.tell(outPutSpeech[2]);
                }else if( commandString === commandArr[5]){
                    app.tell(outPutSpeech[5]);
                }else if( commandString === commandArr[4]){
                    app.tell(outPutSpeech[4]);
                }else if(commandString === commandArr[7]){
                    app.tell(outPutSpeech[6]);
                }else if(commandString === commandArr[8]){
                    app.tell(outPutSpeech[7]);
                }
                console.log('push success');
                // setTimeout(()=>returnQuery(userId, appKey,appSecret,HOSTNAME,app),3000);
            }
        });
        res.on('end',function(){
            console.log('响应结束');
        });
    }).write(json);
}
/**
 *  query robot's state
 *
 * */
function query(userId, appKey,appSecret,HOSTNAME,app,outPutSpeech){
    let t = String(timeStamp());
    const sign = signature(userId, appKey, appSecret, null,t);
    const json = querystring.stringify({
        appKey: appKey,
        userId: userId,
        nonce_str: t,
        sign: sign
    });
    console.log("query--json--- ",json);
    const https_option = {
        hostname: HOSTNAME,
        path: '/baole-web/common/third/getUserDefaultRobotInfo.do',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': json.length,
            'Accept': 'application/json',
            'Accept-Encoding': 'utf-8',
            'User-agent': 'blapp'
        },
        method: 'POST',
    };
    req = https.request(https_option, (res) => {
        res.on('data', function (chunk) {
            console.log("queryChunk----"+chunk);
            const queryData = JSON.parse(chunk).data;
            const result = typeof JSON.parse(chunk).result !== undefined ? JSON.parse(chunk).result : "500";
            console.log(String(result));
            if (String(result) === "500" || String(result) === "501" || String(result) === "502")
            {
                app.tell(outPutSpeech[33]);
            }else{
                let query_workState = parseInt(queryData.workState);
                let query_error     = parseInt(queryData.error);
                let query_battery   = queryData.battery;
                if ( query_error === 0 || isNaN(query_error)){
                    if(query_workState===1){
                        app.tell( outPutSpeech[34] + query_battery +outPutSpeech[8]);
                    }else if(query_workState===4){
                        app.tell( outPutSpeech[34] + query_battery +outPutSpeech[9]);
                    }else if(query_workState===5){
                        app.tell( outPutSpeech[34] + query_battery +outPutSpeech[10]);
                    }else if(query_workState===6){
                        app.tell( outPutSpeech[34] + query_battery +outPutSpeech[11]);
                    }else if(query_workState===3){
                        app.tell( outPutSpeech[34] + query_battery +outPutSpeech[12]);
                    }else if(query_workState===2){
                        app.tell( outPutSpeech[34] + query_battery +outPutSpeech[13]);
                    }else if(query_workState===8){
                        app.tell(outPutSpeech[14]);
                    }else if(query_workState===0){
                        app.tell(outPutSpeech[33]);
                    }
                }else if(query_error ===1){
                    app.tell(outPutSpeech[15]);
                }else if(query_error ===3){
                    app.tell(outPutSpeech[16]);
                }else if(query_error ===24 || query_error ===12){
                    app.tell(outPutSpeech[17]);
                }else if(query_error ===11 || query_error ===22){
                    app.tell(outPutSpeech[18]);
                }else if(query_error ===23){
                    app.tell(outPutSpeech[19]);
                }else if(query_error ===14){
                    app.tell(outPutSpeech[20])
                }else if(query_error ===13){
                    app.tell(outPutSpeech[21])
                }else if(query_error ===17 || query_error===20){
                    app.tell(outPutSpeech[22])
                }else if(query_error ===18 || query_error===21){
                    app.tell(outPutSpeech[23])
                }else if(query_error ===19){
                    app.tell(outPutSpeech[24])
                }else if(query_error ===8){
                    app.tell(outPutSpeech[25])
                }else if(query_error ===7){
                    app.tell(outPutSpeech[26])
                }else if(query_error ===5){
                    app.tell(outPutSpeech[27])
                }else if(query_error ===6){
                    app.tell(outPutSpeech[28])
                }else if(query_error ===4){
                    app.tell(outPutSpeech[29])
                }else if(query_error ===9){
                    app.tell(outPutSpeech[30])
                }
            }
        });
        res.on('end',function(){
            console.log('响应结束');
        });
    }).write(json);
}
/**
 *  时间戳
 * */
function timeStamp() {
    return Math.floor(new Date().getTime()/1000);
}
/**
 *  加密
 * */
function signature(userId, appKey,appSecret, content,timeStamp) {
    let string = content !== null ?
        'appKey=' + appKey + '&content=' + (content) + '&nonce_str=' + timeStamp + '&userId=' + userId + "&key=" + appSecret
        : 'appKey=' + appKey + '&nonce_str=' + timeStamp + '&userId=' + userId + "&key=" + appSecret;
    return String(crypto.createHash('md5').update(string).digest('hex')).toUpperCase();
}

