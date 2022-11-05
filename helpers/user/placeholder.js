const session = require("express-session");
const { ObjectId } = require("mongodb");
const { Types } = require("mongoose");
const { resolve } = require("path");
const { reject } = require("promise");
const Razorpay=require('razorpay');
const address_model = require("../../models/address_model");
const { cart_model } = require("../../models/cart_model");
const coupons_model = require("../../models/coupons_model");
const orderaddress_model = require("../../models/orderaddress_model");
const { db, collection } = require("../../models/order_model");
const order_model = require("../../models/order_model");
const { user_model } = require("../../models/user_model");
const { wishlist_model } = require("../../models/wishlist_model");
var instance = new Razorpay({
  key_id: 'rzp_test_Pfz2F7IixpeiKd',
  key_secret: 'XZPTkwgnjEJGuawRSE7Qkg2O',
});


module.exports = {
  createOrderAddress: (body,id) => {
    console.log("asdfasdf", body, id);
    return new Promise((resolve, reject) => {
        const {
      firstname,
      lastname,
      address,
      city,
      state,
      pincode,
      email,
      phonenumber,
    } = body;
    orderaddress_model.create({
        userId:id,
      firstname: firstname,
      lastname: lastname,
      address: address,
      city: city,
      state: state,
      pincode: pincode,
      email: email,
      phonenumber: phonenumber,
    }).then((data)=>{
      console.log(data)
      resolve(data)})    
    })
  },
  ///
orderDetailsAdmin:(id)=>{
  return new Promise((resolve, reject) => {
    order_model.aggregate([
      {
        $match:{_id:Types.ObjectId(id)}
      },
      {
        $lookup:{
          from:"address",
          localField:"address",
          foreignField:"_id",
          as:"orderAddress"
        },

      },
      {
        $lookup:{
          from:"products",
          localField:"products.productId",
          foreignField:"_id",
          as:"orderProduct"
        },
      }
     
    ]).then((data)=>{
      resolve(data)
    })

    })
},

orderDetailsUser:(userId)=>{
  return new Promise((resolve, reject) => {
    order_model.aggregate([
      {
          $match: {
            userId: Types.ObjectId(userId),
          },
        },
      {
        $lookup:{
          from:"address",
          localField:"address",
          foreignField:"_id",
          as:"orderAddress"
        },

      },
      {
        $lookup:{
          from:"products",
          localField:"products.productId",
          foreignField:"_id",
          as:"orderProduct"
        },
      }
     
    ]).then((data)=>{
      resolve(data)
    })

    })
},
///
  getOrderDetails:(id,body)=>{
    return new Promise((resolve, reject) => {
        cart_model.aggregate([
            {
                $match:{
                    userId:Types.ObjectId(id)
                },
            },
            // {
            //     $unwind:"$cartItems"
            // },
            // {
            //     $lookup:{
            //         from:"products",
            //         localField:"cartItems.productId",
            //         foreignField:"_id",
            //         as:"products"
            //     },

            // },
            // {
            //     $unwind:"$products"
            // },
        ])
        .then((data)=>{
            resolve(data[0])
            
        })
    })
  },

  getwishlist:(userId)=>{
    return new Promise((resolve, reject) =>{
      try{
      wishlist_model.aggregate([
        {
          $match:{
            userId:Types.ObjectId(userId),
          },
        },
        {
          $lookup:{
            from:"products",
            localField:"wishlistItems",
            foreignField:"_id",
            as:"wishlist",
          },
        },
        // {
// $unwind:"wishlist"
//         },
      ])
      .then((data)=>{
        resolve(data);
      })
    } catch(error){
  console.error(error);
    }  
  })
  },
  addwishlist:(userId,productid)=>{
return new Promise((resolve, reject) => {
 wishlist_model.findOne({userId:Types.ObjectId(userId)})
 .then((wishlist)=>{
   if(wishlist){
     console.log("update",productid.productId);
     wishlist_model.updateOne({
       userId:Types.ObjectId(userId)
     },
     {
       $addToSet:{
         wishlistItems: Types.ObjectId(productid.productId),
       } 
     }).then(()=> {
      resolve()

     });
    }else{
      wishlist_model.create({
        userId:Types.ObjectId(userId),
        wishlistItems:[Types.ObjectId(productid.productId)],
      }).then((data)=>{
        resolve()
      })

 }
 })
})
},
removeFromWishlist: (wishlistId, productId) => {
  return new Promise((resolve, reject) => {
    wishlist_model
      .updateOne(
        {
          _id: Types.ObjectId(wishlistId),
          "wishlistItems.productId": Types.ObjectId(productId),
        },
        {
          $pull: {
            wishlistItems: { productId: Types.ObjectId(productId) },
          },
        }
      )
      .then((status) => {
        console.log(status);
        resolve(status);
      });
  });
},

  orderCompleted:(Total,data,id,body,address)=>{
    console.log("data is : ",data)
    return new Promise((resolve,reject)=> {
        order_model.create({
userId:id,
userName:body.name,
paymentMethod:body.payment_method,
paymentStatus:"Placed",
products:data.cartItems,
sub_total:Total.sub_total,
totalAmount:Total.total,
totalDiscount:Total.total_discount,
couponDiscount:Total.couponDiscount,
orderStatus: "Order Placed",
address : address,
date:new Date(), 
        }).then((data)=>{
            console.log("geeeeeeee",data);
            resolve(data)
        })
    })
  },
  generateRazorpay: (orderId, totalAmount) => {
    console.log(orderId);
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalAmount, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        resolve(order);
});
})
  },
  verifyPayment:(details)=>{
    return new Promise((resolve, reject) => {
      const crypto=require('crypto');
      let hmac=crypto.createHmac('sha256','XZPTkwgnjEJGuawRSE7Qkg2O')
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
      hmac=hmac.digest('hex')
      if (hmac==details['payment[razorpay_signature]']) {
        resolve()
      }else{
        reject()
      }
    })
  },
  changePaymentStatus:(orderId)=>{
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION)
      .updateOne({_id:ObjectId(orderId)},
      {
        $set:{
          status:'placed'
        }
      }
      ).then(()=>{
        resolve()
      })
    })

  },
  // createSavedAddress: (body,id) => {
  //   console.log(id);
  //   console.log("body",body);
  //   return new Promise((resolve, reject) => {
  //       const {
  //     firstname,
  //     lastname,
  //     address,
  //     city,
  //     state,
  //     pincode,
  //     email,
  //     phonenumber,
  //   } = body;
  //   console.log("first",firstname);
  //   address_model.create({
  //       userId:id,
  //     firstname: firstname,
  //     lastname: lastname,
  //     address: address,
  //     city: city,
  //     state: state,
  //     pincode: pincode,
  //     email: email,
  //     phonenumber: phonenumber,
  //   }).then(()=>resolve())    
  //   })
  // },
showOrderAddress:()=>{
return new Promise((resolve, reject) => {
  orderaddress_model
  .find({})
  .lean()
  .then((data)=>{
    console.log("address",data);
    resolve(data)
  })
})
},
createSavedAddress: (body) => {
  console.log(body)
  return new Promise((resolve, reject) => {
    address_model.create(body).then((data) => {
      console.log(data)
      resolve(data)
    }).catch((err) => {
      console.log(err)
    })
  })
},
getSavedAddress: (userId) => {
  return new Promise((resolve, reject) => {
    address_model.find({userId: Types.ObjectId(userId)}).lean().then((data) => {
      resolve(data);
    })
  })
},
getEditSavedAddress:(_id)=>{
return new Promise((resolve, reject) => {
  address_model.findOne({_id : Types.ObjectId(_id)}).lean().then((data)=>{
    resolve(data)
  })
})
},
postEditSavedAddress:(_id,body)=>{
console.log(_id,body);
const {firstname,lastname,address,city,state,pincode,email,phonenumber}=body
console.log("asdfasdfasdf",firstname,lastname,address,city,state,pincode,email,phonenumber, _id)
return new Promise((resolve, reject) => {
  address_model
  .updateOne(
    {
      _id:Types.ObjectId(_id)
    },
    {
      $set:{
        firstname: firstname,
        lastname: lastname,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        email: email,
        phonenumber: phonenumber,
      }
    }
  )
  .then((result)=>{
    console.log("change",result);
    resolve(result)
  })
})
},
addToWallet: (userId, amount) => {
  return new Promise((resolve, reject) => {
    console.log(userId, amount)
    user_model.updateOne({_id: userId},{$inc: {wallet : amount}}).then((data) => {
      console.log(data)
      resolve();
    })
  })
},
getSavedAddressDetails: (_id) => {
  return new Promise((resolve, reject) => {
    console.log("fdffsfg",_id);
    address_model.find({_id: Types.ObjectId(_id)}).lean().then((data) => {
      console.log("swsdcs",data);
      resolve(data);
    })
  })
},
getUserOrder:(_id)=>{
  return new Promise((resolve, reject) => {
    console.log("fdffsfg",_id);
    order_model.find({userId:Types.ObjectId(_id)}).lean().then((data)=>{

      resolve(data)
    })
  })
},
getOrders:(userId)=>{
return new Promise((resolve, reject) => {
  
})
}



}


