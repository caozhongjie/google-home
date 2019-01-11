const express = require('express');
const router = express.Router();//创建express的路由功能，可以根据需要创建多个路由

const config = require('./config');
const new_thing_created = require('./triggers/new_thing_created');
const create_new_thing = require('./actions/create_new_thing');
const info = require('./user/info');


//  router
router.use(function (req, res, next) {
    const req_service_key = req.get("IFTTT-Service-Key");
    if (req_service_key === config["ifttt-ServiceKey"] || req.headers.authorization ) {
        next();
    }
    else {
        res.status(401).json({
            'errors': [
                {
                    "message": "this is an Invalid channel key"
                }
            ]
        });
    }
});
router.get('/',function (req, res) {
    res.json({
       "message":   "welcome to ASSSSSSSSSSSSSSSSSSSSs"
    });
});

router.get('/ifttt/v1/triggers/new_thing_created',new_thing_created._get_function);
router.post('/ifttt/v1/triggers/new_thing_created',new_thing_created._post_function);

router.get('/ifttt/v1/actions/create_new_thing',create_new_thing._get_function);
router.post('/ifttt/v1/actions/create_new_thing',create_new_thing._post_function);

router.get('/ifttt/v1/user/info',info._get_function);
router.post('/ifttt/v1/user/info',info._post_function);

router.get('/ifttt/v1/status',function (req, res) {
    res.sendStatus(200);
});
router.post('/ifttt/v1/test/setup',function (req, res) {


    res.status(200).json(
        { "data":
                {
                    "accessToken":"l",
                    "status" : "success",
                    "samples": {
                        "triggers" : {
                            "new_thing_created" : {
                                "start" : "aa",
                                "stop"  : "bb"
                            }
                        },
                        "actions" : {
                           "create_new_thing" : {
                                "intent" : "aa"
                           }
                        }
                    }
                }
        }
    );
});



module.exports = router;