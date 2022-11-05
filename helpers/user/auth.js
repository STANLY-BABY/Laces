const createHttpError = require("http-errors");
const { ObjectId, Db } = require("mongodb");
const { Types } = require("mongoose");
const { product_model } = require("../../models/product_model");
const { user_model } = require("../../models/user_model");
const {cart_model} = require('../../models/cart_model');
const { response } = require("express");
const jwt = require("jsonwebtoken");
const address_model = require("../../models/address_model");
const { wishlist_model } = require("../../models/wishlist_model");

module.exports = {
  verifyLogin: (req, res, next) => {
    const token = req.cookies.token;
    verifyAccessToken(token)
      .then(() => {
        next();
      })
      .catch((err) => {
        console.error("Error is ", err.message);
        res.clearCookie("token");
        res.redirect("/auth");
        // next(err);
      });
  },
  createUser: (body) => {
    body.isAllowed = true;
    return new Promise((resolve, reject) => {
      user_model
        .create(body)
        .then(() => resolve())
        .catch((err) => {
          if (err.name === "MongoServerError" && err.code === 11000) {
            reject(createHttpError.Conflict("Email already exist"));
          } else {
            reject(createHttpError.InternalServerError());
          }
        });
    });
  },
  getUser: (email) => {
    return new Promise((resolve, reject) => {
      user_model
        .findOne({
          email: email,
        })
        .then((user) =>
          user
            ? resolve(user)
            : reject(createHttpError.NotFound("User doesn't exist"))
        );
    });
  },
getUserData:(userId)=>{
return new Promise((resolve, reject) => {
  user_model
  .find({
    _id :Types.ObjectId(userId)
  })
  .lean()
  .then((data)=>{
    resolve(data)
  })
})
},

  getUserByPhone: (phone) => {
    return new Promise((resolve, reject) => {
      user_model
        .findOne({
          phone: phone,
        })
        .then((user) =>{
        console.log("user",user);
          user
            ? resolve(user)
            : reject(createHttpError.NotFound("User doesn't exist"))}
        );
    });
  },

  //listuser
  listUser: () => {
    return new Promise((resolve, reject) => {
      user_model
        .find({})
        .lean()
        .then((data) => {
          console.log(data);
          resolve(data);
        });
    });
  },
  //end
  //allow or block user
  allowedUser: (id) => {
    return new Promise((resolve, reject) => {
      user_model.findOne({ _id: Types.ObjectId(id) }).then((data) => {
        // console.log(data);
        if (data.isAllowed) {
          user_model
            .updateOne(
              {
                _id: Types.ObjectId(id),
              },
              {
                $set: {
                  isAllowed: false,
                },
              }
            )
            .then((data) => {
              console.log(
                "asdflshgliashglahgliahihgfhgiahighfadfgfdffffffffffffffffffffff"
              );
              resolve(data);
            });
        } else {
          console.log("reached");
          user_model
            .updateOne(
              {
                _id: Types.ObjectId(id),
              },
              {
                $set: {
                  isAllowed: true,
                },
              }
            )
            .then((data) => {
              console.log(data);
              resolve(data);
            });
        }
      });
    });
  },

  deleteUser: (id) => {
    return new Promise((resolve, reject) => {
      user_model
        .updateOne(
          {
            _id: Types.ObjectId(id),
          },
          {
            $set: {
              isDeleted: true,
            },
          }
        )
        .then((data) => {
          resolve();
        });
    });
  },
  getProducts: (sortValue = 'name', sort = 1) => {
    sortValue.toString()
    console.log(sortValue, sort)
    return new Promise((resolve, reject) => {
      let query = {};
      query[ sortValue.toLowerCase() ] = parseInt(sort)
      product_model
        .find({ isDelete: false }).sort(query)
        .lean()
        .then((data) => {
          resolve(data);
        });
    });
  },
  proudctDetails: (id) => {
    return new Promise((resolve, reject) => {
      product_model
        .findOne({ _id: ObjectId(id) })
        .lean()
        .then((data) => {
          resolve(data);
        });
    });
  },
  ///////////////////////////////cart////////////////////////////
  addToCart: (proId, userId) => {
    return new Promise((resolve, reject) => {
      cart_model
        .findOne({ userId: Types.ObjectId(userId) })
        .then((userCart) => {
          //console.log(userCart);

          if (userCart) {
            cart_model
              .findOne({
                userId: Types.ObjectId(userId),
                "cartItems.productId": Types.ObjectId(proId),
              })
              .then((product) => {
                console.log("product is string", product);
                if (product) {
                  cart_model
                    .updateOne(
                      {
                        userId: Types.ObjectId(userId),
                        "cartItems.productId": Types.ObjectId(proId),
                      },
                      {
                        $inc: {
                          "cartItems.$.quantity": 1,
                        },
                      }
                    )
                    .then((status) => {
                      resolve(status);
                    });
                } else {
      
                  productObj = {
                    productId: Types.ObjectId(proId),
                    quantity: 1,
                  };

                  cart_model
                    .updateOne(
                      {
                        userId: Types.ObjectId(userId),
                      },
                      {
                        $push: {
                          cartItems: productObj,
                        },
                      },
                      {
                        upsert: true,
                      }
                    )
                    .then(() => {
                      resolve();
                    });
                }
              });
          } else {
            let cartObj = {
              userId: Types.ObjectId(userId),
              cartItems: {
                productId: Types.ObjectId(proId),
                quantity: 1,
              },
              couponDiscount: 0
            };
            cart_model.create(cartObj).then((response) => {
              resolve();
            });
          }
        });
    });
  },

  getCart: (userId) => {
    return new Promise((resolve, reject) => {
      try {
        cart_model
          .aggregate([
            {
              $match: {
                userId: Types.ObjectId(userId),
              },
            },
            {
              $unwind: "$cartItems",
            },
            {
              $lookup: {
                from: "products",
                localField: "cartItems.productId",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $unwind: "$product",
            },
          ])
          //   .toArray()
          .then((data) => {
            resolve(data);
          });
      } catch (error) {
        console.error(error);
      }
    });
  },
  getCartCount:(userId)=>{
    return new Promise((resolve, reject) => {
      cart_model.findOne({userId: Types.ObjectId(userId)}).count().then((count)=>{
        resolve(count)
      })
    })
  },
    getTotalAmount: (userId) => {
    return new Promise((resolve, reject) => {
      try {
        cart_model
          .aggregate([
            {
              $match: {
                userId: Types.ObjectId(userId),
              },
            },
            {
              $unwind: "$cartItems",
            },
            {
              $lookup: {
                from: "products",
                localField: "cartItems.productId",
                foreignField: "_id",
                as: "cart",
              },
            },
            {
              $unwind: "$cart",
            },
            {
              $unset: ["userId"],
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $multiply: [
                      "$cartItems.quantity",
                      { $toInt: "$cart.productDiscountPrice" },
                    ],
                  },
                },
                couponDiscount: {$first: "$couponDiscount"},
                total_discount: {
                  $sum: {
                    $multiply: [
                      "$cartItems.quantity",
                      {
                        $subtract: [
                          "$cart.price",
                          { $toInt: "$cart.productDiscountPrice" },
                        ],
                      },
                    ],
                  }, //
                },
                sub_total: {
                  $sum: {
                    $multiply: [
                      "$cartItems.quantity",
                      { $toInt: "$cart.price" },
                    ],
                  }, //
                },
              },
            },
            {
              $set: {total : {$subtract : ["$total", "$couponDiscount"]}}
            },  
            {
              $unset: ["_id"],
            },
          ])
          .then((data) => {
            console.log("cart", data);
            let val = data[0];
console.log(val);
            resolve(val);
          });
      } catch (error) {
        console.error(error);
      }
    });
  },
  changeCartQuantity: (cartId, productId, count) => {
    console.log(cartId, productId, count);
    count = Number(count);
    return new Promise((resolve, reject) => {
      cart_model
        .updateOne(
          {
            _id: Types.ObjectId(cartId),
            "cartItems.productId": Types.ObjectId(productId),
          },
          {
            $inc: {
              "cartItems.$.quantity": count,
            },
          }
        )
        .then((status) => {
          resolve(status);
        });
    });
  },
  removeFromCart: (cartId, productId) => {
    return new Promise((resolve, reject) => {
      cart_model
        .updateOne(
          {
            _id: Types.ObjectId(cartId),
            "cartItems.productId": Types.ObjectId(productId),
          },
          {
            $pull: {
              cartItems: { productId: Types.ObjectId(productId) },
            },
          }
        )
        .then((status) => {
          console.log(status);
          resolve(status);
        });
    });
  },
  
  getCartValue: (id) => {
    console.log("hhh", id);
    return new Promise((resolve, reject) => {
      cart_model.find({ userId: Types.ObjectId(id) }).then((data) => {
        console.log(data);
        let total = data[0].cartTotalAmount;
        console.log(total);
        resolve(total);
      });
    });
  },

///////////////////////////////////cart closing///////////////////////////////////////
placeOrder:(order)=>{

},
// getCartProductList:(userId)=>{
//   console.log(userId);
//   return new Promise((resolve, reject) => {
// response(cart.products)
//   })
// }
validateReferalCode : (referalCode) => {
  console.log(referalCode)
  return new Promise((resolve, reject) => {
    user_model.findOne({referalCode : referalCode}).then((user) => {
      console.log(user)
      user ? resolve(user) : reject(createHttpError.Unauthorized("Invalid Refral Code"))
    })
  })
},



}

function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
      if (err) {
        const Error =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        reject(createHttpError.Unauthorized(Error));
      } else {
        resolve(user);
      }
    });
  });

}