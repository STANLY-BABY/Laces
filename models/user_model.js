const mongoose = require("mongoose");
const { USER_COLLECTION } = require("../config");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  phone: Number,
  password: String,
  isAllowed: {
    type: Boolean,
  },
  wallet:{
    type:Number,
    default:0
  },
  referalCode:{
    type:String,
  },
  isDeleted:{
    type:Boolean,
  },
});

module.exports.user_model = mongoose.model(
  "user_model",
  userSchema,
  USER_COLLECTION
);

