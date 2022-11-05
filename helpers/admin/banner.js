const { Types } = require("mongoose");
const { resolve } = require("path");
const { reject } = require("promise");
const banner_model = require("../../models/banner_model");

module.exports ={
deleteBanner:(id)=>{
    return new Promise((resolve, reject) => {
        banner_model
        .updateOne(
            {
                _id:Types.ObjectId(id),
            },
            {
                $set:{
                    isDelete:true,
                },
            }
        )
        .then((data)=>{
            console.log(data);
            
        })
        resolve()
    })
},
  getBanner:()=>{
    return new Promise((resolve, reject) => {
        banner_model.find({isDelete:"false"})
        .lean()
        .then((data)=>{
            console.log(data);
            resolve(data)
        })
    })
  }


}
