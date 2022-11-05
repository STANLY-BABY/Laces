const { Types } = require("mongoose");
const { resolve } = require("path");
const { reject } = require("promise");
const { product_model } = require("../../models/product_model");
const { category_model } = require("../../models/category_model");
module.exports = {
  deleteproduct: (id) => {
    return new Promise((resolve, reject) => {
      product_model
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
  getProduct: (id) => {
    return new Promise((resolve, reject) => {
      product_model
        .findOne({ _id: Types.ObjectId(id) })
        .lean()
        .then((data) => {
          resolve(data);         
        });
    });
  },
  getProductLimit:(limit)=>{
    return new Promise((resolve, reject) => {
    product_model.find({isDelete:"false"}).limit(limit).lean().then((products)=>{
      resolve(products);
    })  
    })
  },
  getProductCategory:(categoryName)=>{
    return new Promise((resolve, reject) => {
      category_model.find({isDelete:"false",category:categoryName}).lean().then((products)=>{
      resolve(products);
    })  
    })
  },

  postEditProduct: (id, body) => {
    console.log(id, body);
    return new Promise((resolve, reject) => {
        const { Name, brands, category, description, Stock,productDiscount,Price,img_ext} = body;
        category_model.findOne({category:category}).then((data)=> {
          console.log("dddddd",data.categoryDiscount);
          const cDiscount = data.categoryDiscount;
          const finalPrice = Price*(100-cDiscount)/100 * (100-productDiscount)/100;
          console.log("ggggggggsdsdsvdsvdvd",finalPrice);
        product_model
          .updateOne(
            {
              _id: Types.ObjectId(id),
            },
            {
              $set: {
                name: Name,
                brand: brands,
                category: category,
                description: description,
                stocks: Stock,
                productDiscount:productDiscount,
                price: Price,
                productDiscountPrice:finalPrice,
                img_ext: img_ext,
              },
            }
          )
          .then((result) => {
            console.log("innn", result);
            resolve(result);
          });
      });
  });

  },
};
  