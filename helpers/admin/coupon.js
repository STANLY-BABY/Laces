const { Types } = require("mongoose");
const { resolve } = require("path");
const { reject } = require("promise");
const coupons_model = require("../../models/coupons_model");

module.exports ={
deleteCoupons:(id)=>{
    return new Promise((resolve, reject) => {
        coupons_model
        .updateOne(
            {
                _id:Types.ObjectId(id),
            },
            {
                $set:{
                    inDelete:true,
                },
            }
        )
        .then((data)=>{
            console.log(data);
            
        })
        resolve()
    })
},
  validateCouponCode:(couponcode)=>{
    console.log("C",couponcode);
    return new Promise((resolve,reject)=> {
        coupons_model.findOne({couponCode:couponcode}).then((data)=> {
            console.log(data);
            resolve(data);
        })
    }) 
  },
  getCouponCode:()=>{
    return new Promise((resolve, reject) => {
        coupons_model.find({})
        .lean()
        .then((coupon)=>{
            console.log(coupon);
            resolve(coupon)
        })
    })
  }


}
