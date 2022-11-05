const mongoose = require("mongoose");
const { CART_COLLECTION} = require("../config");
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    //required: true,
  },
  cartItems: {
    type: Array,
    //required: true
  },
  couponDiscount: Number,
  cartTotalAmount : {
    type:Number,
  }
});

module.exports.cart_model = mongoose.model("cart_model", cartSchema,CART_COLLECTION);