const express = require("express");

const { createUser, getUser, getUserByPhone, validateReferalCode } = require("../helpers/user/auth");
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { token } = require("morgan");
const session = require("express-session");
const { resolve } = require("path");
const { addToWallet } = require("../helpers/user/placeholder");
const randomstring =require("randomstring");
require('dotenv').config()
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

router.get("/", (req, res) => {
  res.render("user/auth");
});

router.post("/signup", async (req, res) => {
  try {
    req.body.password = await bcrypt.hash(req.body.password, 10);
    console.log(req.body)
    if(req.body.referalCode){
      console.log(req.body.referalCode)
      let {_id} = await validateReferalCode(req.body.referalCode)
      console.log(_id)
      await addToWallet(_id, 100)
    }
    req.body.referalCode = randomstring.generate(7)
    await createUser(req.body);
    console.log('user created')
    res.status(200).json("Signup Success");
  } catch (err) {
    console.error(err);
    if (err.status === 409) res.status(err.status).json(err.message);
    if (err.status === 401) res.status(err.status).json(err.message)
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await getUser(email);
    console.log(user);
    req.session.userId = user._id;
    let valid = await bcrypt.compare(password, user.password);

    if (valid) {
      const payload = {
        name: user.name,
        email: user.email,
        userId: user._id,
      };
      let token = await jwt.sign(payload, process.env.ACCESS_TOKEN, {
        expiresIn: "30d",
      });
      console.log(token);
      delete payload.email
      res.status(200).json({token: token, user_details : payload});
      req.session.loggedIn = true;
      // res.status(200).cookie("token", token, {maxAge : 30 * 24 *  60 * 60 * 1000})
      res.redirect("/home");
    } else {
      res.status(401).json("Incorrect Password");
    }
  } catch (err) {
    console.error(err);
    if (err.status === 404) res.status(err.status).json(err.message);
  }
});

router.post("/send-otp", async (req, res) => {
  try{
    let user = await getUserByPhone(req.body.phone);
  client.verify.v2.services(process.env.TWILIO_SERVICE_ID)
                  .verifications
                  .create({to: `+91${req.body.phone}`, channel: 'sms'})
                  .then(verification => {console.log(verification.status);
                    res.cookie("phone",req.body.phone,{maxAge: 5 * 60 * 1000})
                    console.log("send otp success")
                  res.redirect("/auth/verify-otp")}).catch((err) => console.log(err))
                } catch (err) {
                  console.log(err)
                  res.status(401).json("User with this phone doesn't exist")
                }
  })
  
  router.get("/otp", (req, res) => {
    res.render("user/otplogin")
  })

router.get("/verify-otp", (req, res) => {
  res.render("user/verifyOtp")
})

router.post("/verify-otp", (req, res) => {
  console.log("verify-otp",req.body.otp,req.cookies.phone)
  client.verify.v2.services(process.env.TWILIO_SERVICE_ID)
      .verificationChecks
      .create({to: `+91${req.cookies.phone}`, code: req.body.otp})
      .then(async verification_check => {
        console.log(verification_check.status)
        if (verification_check.status === "approved") {
          try{
          let user = await getUserByPhone(req.cookies.phone);
          console.log(user);
          req.session.userId = user._id;
          const payload = {
            name: user.name,
            email: user.email,
            userId: user._id,
          };
          let token = await jwt.sign(payload, process.env.ACCESS_TOKEN, {
            expiresIn: "30d",
          });
          console.log(token);
          delete payload.email
          req.session.loggedIn = true;
          res.status(200).json({token: token, user_details : payload});
          // res.status(200).cookie("token", token, {maxAge : 30 * 24 *  60 * 60 * 1000})
        } catch (err) {
          res.status(401).json("User with this phone doesn't exist")
        }
        } else {
          console.log("incorrect");
          res.status(401).json("Incorrect Otp");
        }
      });
})

router.get("/logout", (req, res) => {
  req.session.userId = null;
  req.session.destroy();
  res.clearCookie("token");
  res.clearCookie("user");
  res.redirect("/auth");
});


module.exports = router;
