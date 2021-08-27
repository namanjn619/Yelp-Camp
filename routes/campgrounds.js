const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const { campgroundSchema  } = require('../schemas.js');
const { isLoggedIn, validateCampground, isAuthor } = require('../middleware');
//------------------------------------------//
//middleware for validation:


//middleware for Authorization:

//------------------------------------------//
router.get('/', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}));

//------------------------------------------//
//creating a new camping ground
router.get('/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new');
});
//creating a new camping ground
router.post('/', isLoggedIn, validateCampground, catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    await campground.save();
    console.log(campground);
    req.flash('success', 'Successfully Created a Campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}))
//------------------------------------------//

//creating a show page
router.get('/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Can not find that Campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}))
//------------------------------------------//
//editing campgrounds:
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    if (!campground) {
        req.flash('error', 'Can not find that Campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}));

router.put('/:id', isLoggedIn,isAuthor ,validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    req.flash('success', 'Successfully Updated Campground')
    res.redirect(`/campgrounds/${campground._id}`);
})); 
//------------------------------------------//
//Deleting a campground
router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully Deleted your Review');
    res.redirect('/campgrounds');
}));

module.exports = router;