var mongoose =require('mongoose');
var categorySchema = new mongoose.Schema({
    category:{
        type:String,
    },
    categoryDescription:{
        type:String,
    },
    isdeleted:{
type:Boolean
    },
    categoryDiscount:{
        type:Number,
    },          
})
module.exports.category_model = mongoose.model('category_model', categorySchema)