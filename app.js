const express = require('express');
//path is used with ejs path setting
const path = require('path');
const Campground = require('./models/campground');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const Joi = require('joi');
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const Review = require('./models/review');
const session = require('express-session');
const flash = require('connect-flash');

//All routes of Crud applications:
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

//Authentication:
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
//------------------------------------------//
//mongoose setup:
// in seeds folder>>index.js
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});
//------------------------------------------//
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

//setting up cookies:
const sessionConfig = {
    secret: 'thisisasecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));


//Setting up Authentication:
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//setting up flash messages:
app.use(flash());
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
//------------------------------------------//
//EJS setup:
app.set('view engine', 'ejs');
//By default ejs files are in views folder.
app.set('views', path.join(__dirname, 'views'));
//ejs-mate
app.engine('ejs', ejsMate);
//------------------------------------------//
//Get is used to send something to Webpage.
app.get('/', (req, res) => {
    res.render('home');
})
//------------------------------------------//
//CRUD Operations on Yelp Camp:
app.use('/campgrounds', campgroundRoutes);
//------------------------------------------//

//Review Model routes:
app.use('/campgrounds/:id/reviews', reviewRoutes);
//------------------------------------------//

//Authetication Routes:
// in routes/user.js
app.use('/', userRoutes);
//------------------------------------------//
//handling errors
app.all('*', (req, res, next) => {
    next(new ExpressError('Page not Found', 404));
})
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = " Something went wrong!"
    res.status(statusCode).render('error', { err });
})
//------------------------------------------//
app.listen(3000, () => {
    console.log('Server on port 3000');
})