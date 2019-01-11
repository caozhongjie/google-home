//public是express中默认的存放
const express = require('express');//建立在http模块上，核心是对http模块的再包装
const path = require('path');//解析路径的模块   可获取文件名  路径   扩展名
const favicon = require('serve-favicon');//用于请求网页的logo
const logger = require('morgan');//记录http通信时的操作日志
const cookieParser = require('cookie-parser');//cookie解析
const bodyParser = require('body-parser');//对post请求的请求体解析
const routers = require('./routers');//路由来指定不同的访问路径所对应的回调函数（指定脚本）响应客户端请求

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));//set方法用于指定变量的值  设定views变量，意为视图存放的目录
app.set('view engine', 'jade');//pug   设定view engine变量，意为网页模板引擎

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));//use是express注册中间件的方法  get  all等方法是use方法的别名
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routers);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
