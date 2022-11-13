const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = {
  adminAuth: (req, res, next) => {
    const token = req.cookies.adminToken;
    try {
      jwt.verify(token, process.env.ACCEESS_TOKEN_ENV_ADMIN, (err, user) => {
        if (err) {
          res.redirect("/admin/login")
        } else {
          next();
        }
      });
    } catch (err) {}
  },
};
