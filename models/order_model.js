const mongoose =require('mongoose');
const orderSchema =new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    userName:String,
    paymentMethod:String,
    paymentStatus:String,
    orderStatus:String,
    products:Array,
    sub_total:Number,
    totalAmount:Number,
    totalDiscount:Number,
    couponDiscount:Number,
    address : mongoose.Schema.Types.ObjectId,
    status:String,
    date:Date,
});
module.exports=mongoose.model("order_model",orderSchema,"orders");              