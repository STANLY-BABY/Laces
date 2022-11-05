const mongoose= require('mongoose')

const bannerSchema=new mongoose.Schema({
    bannerNo:{
        type:String
    },
    isDelete:{
        type:Boolean
    }
})
module.exports=mongoose.model("banner_model",bannerSchema,"banner")