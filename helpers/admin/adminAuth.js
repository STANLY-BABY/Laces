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
}