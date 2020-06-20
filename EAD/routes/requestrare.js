const express=require('express');
const router = express.Router();
const User=require('../models/User')
const Profile=require('../models/Profile')

const Shelf=require('../models/Shelf')
const RareRequest=require('../models/RareRequest')
const async = require('async')

router.get('/shelf',(req,res)=>{
  console.log(req.user.email);
  Shelf.find({user:req.user.id}).select('book -_id').populate('book','Title').then(x=>{
    console.log(x[0]);
    return res.render('dummyshelf',{book:x})
  })


})

router.get('/request',(req,res)=>{
    req.session.name = 'asdfgb'
    Shelf.find({user:req.user.id}).select('book -_id').populate('book','Title').then(x=>{
      console.log(x[0]);
      return res.render('dummyviewshelf',{book:x})
    })


})

router.post('/request',(req,res)=>{

console.log('posted');
console.log(req.body);
RareRequest.findOne({recipient:req.session.otherUserShelfUserId,book:req.body.bookid,requester:req.user.id}).then(a=>{
  if(a==null){
    // var datee = new Date()
    // datee.setDate(datee.getDate() + req.body.noofdays);
    var k  = new RareRequest({
      recipient:req.session.otherUserShelfUserId,
      book:req.body.bookid,
      period:req.body.noofdays,
      notetoowner:req.body.notetoowner,
    // '5e5a9d624f4f426bfc199fb1'
      requester:req.user.id,
      status:0

    })
    k.save()
    .then(x=>{
      console.log('saved');
      return res.sendStatus(200)
    })
    .catch(err=>{
      console.log(err);
      return res.sendStatus(500)
    })

  }else{
    console.log('alredyrequested');
  }
}

)


})

router.get('/viewrequest',(req,res)=>{

console.log('found');
RareRequest.find({recipient:req.user.id,status:'0'}).populate({path:'requester',model:'User',populate:{path:'profile',model:'Profile'}}).populate('book','Title ImageURLL Author').then(x=>{
// RareRequest.find({recipient:req.user.id,status:0}).populate('book','Title ImageURLS').then(x=>{
console.log(x);
  return res.render('dummyviewrequest',{requests:x,layout:'navbar2'})
})
})
// router.get('/viewsentrequest',(req,res)=>{
//
// console.log('found');
// RareRequest.find({requester:req.user.id}).populate({path:'recipient',model:'User',populate:{path:'profile',model:'Profile'}}).populate('book','Title ImageURLL Author').then(x=>{
// // RareRequest.find({recipient:req.user.id,status:0}).populate('book','Title ImageURLS').then(x=>{
// console.log(x);
// var y = x.recipient;
// x.recipient = x.requester;
// y=x.requester
//   return res.render('sentRequests',{requests:x,layout:'navbar2'})
// })
// })

router.post('/viewrequest',(req,res)=>{
  console.log('posted');

  console.log(req.body);

  RareRequest.findOne({book:req.body.bookid,recipient:req.user.id}).then(async x=>{
    console.log(x);
    console.log(req.body.status);
    var till_date = new Date();
    till_date.setDate(till_date.getDate() + x.period);
    x.status=req.body.status
    x.save()
    var softcopylink = '';

    Shelf.findOne({user:req.user.id}).then(softCopy=>{
      softcopylink = softCopy.softcopy
    })
    if(req.body.status == 1){
      var add  = new Shelf({
        book:req.body.bookid,
        user:req.body.requester,
        owner:'1',
        paid:0,
        softcopy:softcopylink,
        period:till_date

      });
      add.save().then(a=>{
        return res.sendStatus(200)

      })
    }else{
      console.log('jhgfdsa');
      return res.sendStatus(200)

    }
  })
  .catch(err=>{
    console.log(err);
    return res.sendStatus(500)
  })


})


module.exports  = router
