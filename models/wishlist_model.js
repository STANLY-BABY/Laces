const mongoose = require("mongoose");
const { WISHLIST_COLLECTION} = require("../config");
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    //required: true,
  },
  wishlistItems: {
    type: Array,
    //required: true
  }
});

module.exports.wishlist_model = mongoose.model("wishlist_model", cartSchema,WISHLIST_COLLECTION);