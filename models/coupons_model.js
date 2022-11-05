const mongoose= require('mongoose')

const couponSchema=new mongoose.Schema({
    couponName:{
        type:String
    },
    couponDesc:{
        type:String
    },
    couponCode:{
        type:String,
        uppercase:true
    },
    couponDiscount:{
        type:Number
    },
    minAmount:{
        type:Number
    }
})
module.exports=mongoose.model("coupons_model",couponSchema,"coupon")