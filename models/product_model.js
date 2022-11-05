const mongoose = require("mongoose");
const { PRODUCT_COLLECTION} = require("../config");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required:true,
    
    },
    description:{
        type: String, 
        
    },
    price:{
        type:Number,
        
    },
    brand:{
        type: String,
       
    },
    category:{
        type: String,
        
    },

    stocks:{
        type:Number,
        
    },
    isDelete: {
        type:Boolean,
    },
    productDiscount:{
        type:Number,
    },
    productDiscountPrice:{
        type:Number,
    },
    img_ext: {
        type:String
    },
})
module.exports.product_model = mongoose.model('product_model', productSchema, PRODUCT_COLLECTION)