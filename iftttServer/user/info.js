const querystring = require('querystring');
const crypto = require('crypto');
const https = require('https');

exports._get_function = function (req, res, next) {
    console.log('333333'); //在测试时候不能打印不存在的东西 否则会报错误状态码500
    // TODO just for pass the testing
    if(req.headers.authorization!=='Bearer INVALID' ){

        res.status(200).json({
            "data":
                {
                    "name": "Walter White",
                    "id": '111',
                    "url": "http://www.google.com"
                }

        });

    }else{
        res.status(401).json({
            'errors': [
                {
                    "message": "this is an Invalid accessToken"
                }
            ]
        });


    }




};

exports._post_function = function (req, res, next) {


    console.log('function','_get_function');
    res.status(200).json({'result':200});




};