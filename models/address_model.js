
const mongoose = require("mongoose"); 
  
const savedaddressSchema = new mongoose.Schema({ 
  userId: mongoose.Schema.Types.ObjectId, 
  firstname: String,
  lastname:String,
  address:String,
  city:String,
  state: String, 
  pincode: Number,
  email:String,
  phonenumber: Number,
}); 
 
module.exports = mongoose.model("address_model", savedaddressSchema, "savedaddress");

