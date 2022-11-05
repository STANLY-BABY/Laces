const { Types } = require("mongoose");
const { resolve } = require("path");
const { reject } = require("promise");
const { category_model } = require("../../models/category_model");

module.exports = {
  deletecategory: (id) => {
    return new Promise((resolve, reject) => {
      _model
        .updateOne(
          {
            _id: Types.ObjectId(id),
          },
          {
            $set: {
              isDelete: true,
            },
          }
        )
        .then((dat) => {
          console.log(dat);
        });
      resolve();
    });
  },
  getCategory: (id) => {
    return new Promise((resolve, reject) => {
      category_model
        .findOne({ _id: Types.ObjectId(id) })
        .lean()
        .then((data) => {
          resolve(data);
        });
    });
  },
  getAllCategories:()=>{
    return new Promise((resolve,reject) => {
      category_model.find({}).lean().then((data) => {    
        resolve(data)
      })
    })
  },

  postEditCategory: (id, body) => {
    console.log(id, body);
    const { category, categoryDescription } = body;

    return new Promise((resolve, reject) => {
      category_model
        .updateOne(
          {
            _id: Types.ObjectId(id),
          },
          {
            $set: {
              category: category,
              categoryDescription: categoryDescription,
              categoryDiscount
            },
          }
        )
        .then((result) => {
          console.log("innn", result);
          resolve(result);
        });
    });
  },
};
