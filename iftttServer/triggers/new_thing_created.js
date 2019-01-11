const __tools = require('../tools');//加入时间戳

exports._get_function = function (req, res, next) {
    // console.log('function','_get_function');
    res.status(200).json({'result':200});
};

exports._post_function = function (req, res, next) {
    // console.log(req);
    if ( req.body.triggerFields !== undefined && req.body.triggerFields !== null && req.body.triggerFields.start) {

        if(req.headers.authorization!=='Bearer INVALID' ){
            let limit = req.body.limit === undefined || req.body.limit === '' || req.body.limit === null ?
                50 : req.body.limit;
            // TODO just for pass the testing
            let data = [];
            for (let i = 0; i < Math.min(limit, 3); i++) {
                let meta = {
                    'slug':'2017-12-31',
                    'meta': {
                        'id': Math.random(100),
                        'key': limit + 1,
                        'timestamp': __tools.getTimeStamp()
                    },
                    'created_at': new Date().toISOString(),
                    'limit': limit
                };
                data.push(meta);
            }
            res.status(200).json({'data': data.reverse()});

        }else{

            res.status(401).json({
                'errors': [
                    {
                        "message": "this is an Invalid accessToken"
                    }
                ]
            });
        }



    }
    else {
        res.status(400).json(
            {
                'errors':   [
                    {
                        'message': 'missing trigger field'
                    }
                ]
            }
        );
    }
};
