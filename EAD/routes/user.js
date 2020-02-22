const express=require('express');
const { check, validationResult } = require('express-validator');

const router = express.Router();
const bodyparser=require('body-parser');
const bcrypt=require('bcryptjs');
const passport=require('passport');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

const User=require('../models/User')
const Token=require('../models/Token')
var urlencodedparser=bodyparser.urlencoded({extended:true});
bodyParser = require('body-parser').json();


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/users/login');
}
function IsAuth(req,res,next){
  if(!req.isAuthenticated())
    return next()
  res.redirect('/users/dashboard')
}

router.get('/login',(req,res)=>res.render('login'));
router.get('/signup',(req,res)=>res.render('signup',{errors:[],check:0}));

router.post('/checkemail',function (req,res){
  console.log(';checking');
  console.log(req.body)
  User.findOne({email:req.body.email}).then(user=>{
    console.log(user);
    if(user==null){
      return res.send('1')
      console.log(user)
    }else{
      if(user.method=='normal'){
        console.log(user);
      return res.send('0')
    }else{
      return res.send('-1')
    }
    }
  })
});


router.post('/signup',urlencodedparser,[
                                          check('password').not().isEmpty().withMessage('password is required'),
                                          check('password').isLength({min:6}).withMessage('Please enter a password at least 6 character.'),
                                          check('password').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/,).withMessage('Passwordmust contain one uppercase letter one lower case letter and one special character  '),
                                          check('password1').not().equals('password').withMessage('Passwords do not match'),
                                          check("email").not().isEmpty().withMessage('Email is required'),
                                          check('email').isEmail().withMessage('Enter valid email'),
],async (req,res)=>{
  console.log(req.body);

  const password=req.body.password;
  const password1=req.body.password1;
  const email=req.body.email;

  let errors =validationResult(req);


  await User.findOne({email:email}).then(function(user){
    console.log(user)
    if (user!=null){
    console.log('Email already in use')
    error = {
      param:'email',
      msg:'Email already in use',
      value:email

    }
    errors.errors.push(error)
}
  });


  if (errors.errors.length>0){
    return res.render('signup.ejs',{
      errors:errors

    });
  }else{

    let newUser = new User({

      email:email,
      password:password,
      method:'normal'

    });
bcrypt.genSalt(10,(err,salt)=>bcrypt.hash(newUser.password,salt,(err,hash)=>
{
  if (err){
    console.log(err)
  } ;
  newUser.password=hash;
  console.log('created')

    newUser.save(function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }

        // Create a verification token for this user
        var token = new Token({ _userId: newUser._id, token: crypto.randomBytes(16).toString('hex') });

        // Save the verification token
        token.save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }

            // Send the email
            var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'bookrest.com@gmail.com',
        pass: 'ead@0139'
    }
});
            var mailOptions = { from: 'no-reply@Bookrest.com', to: newUser.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/users/confirmation\/' + token.token + '.\n' };
            transporter.sendMail(mailOptions, function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }

                return res.render('msg',{msg:newUser.email,msg1:'A verification email has been sent to'});
            });
        });
    })


}))

  // return res.redirect('/users/login');
  }

});


router.post('/login',IsAuth,urlencodedparser,(req,res,next)=>{
  console.log(req.body)
passport.authenticate('local',{
  successRedirect:'/users/dashboard',
  failureRedirect:'/users/login',
  failureFlash:true
})(req,res,next);

});



router.get('/logout',(req,res)=>{
  req.logout()
  res.redirect('/users/signup')
})

router.get('/dashboard',(req,res)=>{

  res.render('dashboard',{user:req.user.email})
})

router.get('/confirmation/:token',function (req, res, next) {
  // console.log(req)
  //   req.assert('email', 'Email is not valid').isEmail();
  //   req.assert('email', 'Email cannot be blank').notEmpty();
  //   req.assert('token', 'Token cannot be blank').notEmpty();
  //   req.sanitize('email').normalizeEmail({ remove_dots: false });
  //
  //   // Check for validation errors
  //   var errors = req.validationErrors();
  //   if (errors) return res.status(400).send(errors);
console.log('came')
    // Find a matching token
    Token.findOne({ token: req.params.token }, function (err, token) {
        if (!token) return res.render('msg',{  msg: 'We were unable to find a valid token. Your token my have expired.',msg1:'Not Verified' });

        // If we found a token, find a matching user
        User.findOne({ _id: token._userId }, function (err, user) {
            if (!user) return res.render('msg',{ msg: 'We were unable to find a user for this token.',msg1:'Not Verified' });
            if (user.isVerified) return res.render('msg',{  msg: 'This user has already been verified.',msg1:'Not Verified' });

            // Verify and save the user
            user.isVerified = true;
            user.save(function (err) {
                if (err) { return res.render('msg',{ msg: err.message,msg1:'Not Verified' }); }
              return res.render('msg',{msg:"The account has been verified. Please log in.",msg1:'Verified'});
            });
        });
    });
});

router.post('/resend',function(req,res,next){

  // req.assert('email', 'Email is not valid').isEmail();
  //   req.assert('email', 'Email cannot be blank').notEmpty();
  //   req.sanitize('email').normalizeEmail({ remove_dots: false });
  //
  //   // Check for validation errors
  //   var errors = req.validationErrors();
  //   if (errors) return res.status(400).send(errors);

    User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
        if (user.isVerified) return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });

        // Create a verification token, save it, and send email
        var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });

        // Save the token
        token.save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }

            // Send the email
            var transporter = nodemailer.createTransport({ service: 'Sendgrid', auth: { user: process.env.SENDGRID_USERNAME, pass: process.env.SENDGRID_PASSWORD } });
            var mailOptions = { from: 'no-reply@codemoto.io', to: user.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
            transporter.sendMail(mailOptions, function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send('A verification email has been sent to ' + user.email + '.');
            });
        });

    });

})

router.get('/google',passport.authenticate('google',{
  scope:['profile','email']
}));

router.get('/google/redirect',passport.authenticate('google'),(req,res)=>{
  console.log('im here');
  return res.redirect('/users/dashboard')
})


module.exports = router;