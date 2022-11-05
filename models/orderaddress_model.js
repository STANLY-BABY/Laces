
const mongoose = require("mongoose"); 
  
const orderAddressSchema = new mongoose.Schema({ 
  userId: mongoose.Schema.Types.ObjectId, 
  firstname: String,
  lastname:String,
  address:String,
  city:String,
  state: String, 
  pincode: Number,
  email:{String
  },
  phonenumber: { 
    type: Number, 
    required: true, 
  }, 

}); 
 
module.exports = mongoose.model("orderaddress_model", orderAddressSchema, "address");

