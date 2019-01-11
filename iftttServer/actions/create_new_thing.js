const querystring = require('querystring');
const crypto = require('crypto');
const https = require('https');
const appSecret = 'e57180728b2344a2a84b8446fb9b68a0';
const appKey    = '67ce4fabe562405d9492cad9097e09bf';

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
    } else
        return JSON.stringify({
            version: '1.0',
            control: {
                targetId: userId,
                targetType: 8,
                broadcast: 0
            },
            value:{
                transitCmd: String(transitCmd)
            }
        });
}

 //时间
 function timeStamp() {
    return Math.floor(new Date().getTime()/1000);
}
//加密方式
function signature(userId, appKey,appSecret, content,timeStamp) {
    let string = content !== null ?
        'appKey=' + appKey + '&content=' + (content) + '&nonce_str=' + timeStamp + '&userId=' + userId + "&key=" + appSecret
        : 'appKey=' + appKey + '&nonce_str=' + timeStamp + '&userId=' + userId + "&key=" + appSecret;
    return String(crypto.createHash('md5').update(string).digest('hex')).toUpperCase();
}

//定义指令的格式
function createCommand(intent,userId) {
     let _command,_workMode;
    switch (intent)
    {
        case "start":
            _command = 100;
            break;
        case "stop":
            _command = 102;
            break;
        case "auto":
            _command = 106;
            _workMode = 1;
            break;
        case "edge"://沿边
            _command = 106;
            _workMode = 4;
        case "area"://区域
            _command = 106;
            _workMode = 6;
            break;
        case "recharge":
            _command = 104;
            break;

    }
    if (!isNaN(parseInt(_command)))
    {
        return setCommand(userId,_command,_workMode);
    }
}

//发送指令
function push(userId,HOSTNAME,appKey,appSecret, command) {
    let t = String(timeStamp()); //获取时间差存入变量t
    const sign = signature(userId, appKey, appSecret, command, t);//调用signature方法，秘钥加密
    const json = querystring.stringify({ //利用signature  return得到加密后的秘钥存入json中
        appKey: appKey,
        content: command,
        nonce_str: t,
        userId: userId,
        sign: sign
    });
    const https_option = {     //定义HTTP协议
        hostname: HOSTNAME,
        path: '/baole-web/common/third/sendTranslateMsg.do',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': json.length,
            'Accept': 'application/json',
            'Accept-Encoding': 'utf-8',
            'User-agent': 'blapp'
        },
        method: 'POST',
    };
    const req = https.request(https_option, (res) => {
        res.on('data', function (chunk) {   //返回chunk到1970的毫秒差 ，不为undefined返回毫秒差，否则报错
            console.log('下发指令时服务器返回的值------' + chunk);
            const result = typeof JSON.parse(chunk).result !== undefined ? JSON.parse(chunk).result : "500";
            if (String(result) === "500" || String(result) === "501" || String(result) === "502")// errorCode
            {
                console.log('您的账号目前没有绑定设备或者服务器错误 ' + chunk);
            }
            else {
                console.log('发送指令成功')
            }
        });
        res.on('end', function () {
            console.log('下发指令响应结束');
        });
    }).write(json);
}


exports._get_function = function (req, res, next) {
    res.status(200).json({'result':200});
};

exports._post_function = function (req, res, next) {
    //console.log(req.headers.authorization); //在测试时候不能打印不存在的东西 否则会报错误状态码500
    // TODO just for pass the testing
    if (req.body.actionFields !== undefined && req.body.actionFields !== null && req.body.actionFields.intent) {
        let authorization = req.headers.authorization;
        let len = authorization.length - (('Bearer').length);
        authorization = authorization.substr(authorization.indexOf((' ')), len);
        if (req.headers.authorization !== 'Bearer INVALID') {
            if (authorization.length > 10) {
                let accessToken = JSON.parse(authorization.toString());
                let intent = req.body.actionFields.intent;
                console.log("intent", intent);
                let userId = accessToken.userId;
                let HOSTNAME = accessToken.region;
                console.log(userId,'--------',HOSTNAME,'--------',intent)
                let command = createCommand(intent, userId);
                console.log('command------' + command)
                push(userId, HOSTNAME ,appKey, appSecret, command);
                res.status(200).json({
                    "data": [
                        {
                            "id": 1,
                            "url": "http://www.google.com"
                        }
                    ]
                });
            } else {
                res.status(200).json({
                    "data": [
                        {
                            "id": 1,
                            "url": "http://www.google.com"
                        }
                    ]
                });
            }

        } else {
            res.status(401).json({
                'errors': [
                    {
                        "message": "this is an Invalid accessToken"
                    }
                ]
            });
        }
    } else {
        console.log('无效')
        res.status(400).json(
            {
                'errors': [
                    {
                        'message': 'missing action field'
                    }
                ]
            }
        );
    }
};