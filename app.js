var createError = require('http-errors');
var express = require('express');
var path=require('path')
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileUpload=require('express-fileupload')

var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
const hbs = require('express-handlebars');
const handlebars = require('handlebars')
const mongoose = require('mongoose');
const sessions=require('express-session');
require('dotenv').config
var app = express();
mongoose.connect(`mongodb+srv://stanlybaby:${process.env.MONGO_PASSWORD}@cluster0.qtvdyvg.mongodb.net/laces?retryWrites=true&w=majority`)
mongoose.connection.on("error", err => {
  console.log("err", err)
})
mongoose.connection.on("connected", (err, res) => {
  console.log("mongoose is connected")
})


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));
handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});
handlebars.registerHelper('times', function(from, n, block) {
  var accum = '';
  for(var i = from; i <= n; ++i)
      accum += block.fn(i);
  return accum;
});

app.use('/admin', adminRouter);
app.use('/', usersRouter);
app.use('/auth', authRouter)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
app.get('/error',(req,res)=>{
  res.render('user/error')
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if(err.status===400){
    console.log("bad request")
    res.send("bad request")
  }
  if (err.status===404) {
    res.render('user/error')
  }
  res.render('error');
});

module.exports = app;
 