var createError = require('http-errors');
require('dotenv').config()
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var hbs = require('express-handlebars');
var logger = require('morgan');
var fileUpload = require('express-fileupload')
var db = require('./config/connection')
var session = require('express-session')
const {v4 : uuidv4} = require('uuid')



db.connect((err)=>{
  if(err){
  console.log('connection error'+err);
}else{
  console.log('Database Connected...');
}
})
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({helpers: {

  inc: function (value, options) {

      return parseInt(value) + 1;

  }
},extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials'}))

app.use(session({
  secret : uuidv4(),
  resave : false,
  saveUninitialized : true
}));
app.use(fileUpload())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
