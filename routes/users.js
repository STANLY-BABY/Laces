const { verify } = require("crypto");
var express = require("express");
const session = require("express-session");
const { Types, SchemaTypes } = require("mongoose");
const { token } = require("morgan");
const { resolve } = require("promise");
const { render, response } = require("../app");
const { getAllCategories } = require("../helpers/admin/category");
const { getProductLimit, getProductCategory } = require("../helpers/admin/product");
const auth = require("../helpers/user/auth");
const paypal = require('../paypal-api')

const {
  getProducts,
  proudctDetails,
  addToCart,
  getTotalAmount,
  changeCartQuantity,
  removeFromCart,
  verifyLogin,
  getUser,
  getUserData,

} = require("../helpers/user/auth");
const {
  getOrderDetails,
  orderCompleted,
  getwishlist,
  addwishlist,
  generateRazorpay,
  verifyPayment,
  changePaymentStatus,
  showOrderAddress,
  createOrderAddress,
  addAddres,
  getSavedAddress,
  getSavedAddressDetails,
  createSavedAddress,
  getEditSavedAddress,
  postEditSavedAddress,
  getUserOrder,
  orderDetailsUser,
} = require("../helpers/user/placeholder");
const { cart_model } = require("../models/cart_model");
const { product_model } = require("../models/product_model");
const order_model = require("../models/order_model");
const { validateCouponCode, getCouponCode } = require("../helpers/admin/coupon");
const coupon = require("../helpers/admin/coupon");
const { getBanner } = require("../helpers/admin/banner");
const { wishlist_model } = require("../models/wishlist_model");
const { CANCELLED } = require("dns");

var router = express.Router();

// const verifyLogin = (req, res, next) => {
//   console.log(req.session.userId);
//   if (req.session.userId) {
//     next();
//   } else {
//     res.redirect("/home");
//   }
// };
/* GET users listing. */
router.get("/", verifyAccess, function (req, res, next) {
  res.render("user/userhome");
});
router.get("/usersignin", (req, res) => {
  res.render("auth");
});

router.get("/home", (req, res) => {
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  getBanner().then((banner)=>{
  getProductLimit(4).then((products) => {
    res.render("user/userhome", {
      user: user,
      products:products,
      banner:banner
    })
    });
  });
});


router.post('/address/add', async (req, res) => {
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  req.body.userId = Types.ObjectId( user.userId);
  console.log('data : ',req.body);
    await createSavedAddress(req.body).then(() => {
      res.status(200).json(true) 
    })
})


router.get('/offers',(req,res)=>{
  res.render('user/offers')
})

///
router.get('/userprofile',verifyLogin,(req,res)=>{
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  getUserData(user.userId).then((data)=>{
    res.render('user/userprofile',{
      user:user,
      data:data[0],
    })
  })
})

router.get("/savedaddress",verifyLogin, (req, res) => {
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    res.render("user/savedAddress", {
      user:user,
    });
});
// router.post('/savedaddress/add',(req,res)=>{
//   let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
//   addSavedAddress(user.userId,req.body).then(()=>{
//     res.send("succes")
//   })
// })
///
router.get("/wishlist", verifyLogin, (req, res) => {
let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
getwishlist(user.userId).then((data) => {
      res.render("user/wishlist", {
        user:user,
        data: data[0],
      });
    });
  });
  router.post('/wishlist/add',verifyLogin,(req,res)=>{
    let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    addwishlist(user.userId,req.body).then(()=>{
      res.redirect('/')
    })
  })

  router.get('/wishlist/remove/:id',verifyLogin,(req,res)=>{
    console.log("wish",req.params.id);
    let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    console.log(user);
    const id = req.params.id;
  wishlist_model.updateOne({userId:Types.ObjectId(user.userId)},
    {
      $pull:{ 
        wishlistItems:Types.ObjectId(id)
      }
    }).then((data)=>{
      console.log(data);
      res.redirect("/wishlist");
    })
  })
//
router.get("/products", async(req, res) => {
  let category=await getAllCategories()
  getProducts(req.query.sortValue, req.query.sort).then((data) => {
    res.render("user/userproductlist", {
      user: true,
      data: data,
      category:category
    });
  });
});
router.get('/products/categories',(req,res)=>{
  getProductCategory().then((products)=>{
    res.render("user/userproductlist",{
      user:true,
      products:products
    })
  })
})

router.get("/productView/:id", (req, res) => {
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  proudctDetails(req.params.id).then((data) => {
    res.render("user/productdetail", {
      data: data,
      user: user,
    });
  });
});
//cart
router.get("/cart", verifyLogin, (req, res) => {
let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
getCouponCode().then((coupon)=>{
getwishlist(user.userId).then((wishlist) => {
  auth.getCart(user.userId).then((data) => {
    getTotalAmount(user.userId).then((total) => {
      res.render("user/cart", {
        coupon:coupon,
        user: user,
        wishlist:wishlist[0]?.wishlist,
        data: data,
        total: total,
        userid:user.userId,
      });
      });
    });
  })
  });
});

router.post("/cart/coupon",verifyLogin,async (req,res)=> {
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  console.log("dscdsc",req.body.code);
  let total= await getTotalAmount(user.userId) 
  validateCouponCode(req.body.code.toUpperCase()).then((data)=>{
    if(data){
      if (total.total < data.minAmount) {
        res.status(401).json("min amount is not satisfied")
      }else{
        cart_model.updateOne({userId:req.body.id},{couponDiscount : data.couponDiscount}).then((cart)=>{
          res.status(200).json(true)
        })
      }}else{
      res.status(401).json("invalid coupon code")
      console.log("invalid coupon");
    }
  })
})
// checkout
router.get("/add-to-cart/:id", (req, res) => {
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  auth.addToCart(req.params.id, user.userId).then(() => {
    res.status(200).json(true)
  });
});

router.post("/cart/remove", (req, res) => {
  const { cart, product } = req.body;
  let user = req.cookies.user ? req.cookies.user : null;
  removeFromCart(cart, product).then((data) => {
    if (data) {
      res.redirect("/cart");
    } else {
      res.send("some error occured");
    }
  });
});
router.post("/cart/changeQuantity", (req, res) => {
  const { cart, product, user, count } = req.body;
  changeCartQuantity(cart, product, count).then((data) => {
    getTotalAmount(user).then((total) => {
      data.total = total;
      
      res.status(200).json(data);
    });
  });
});
//address

router.get('/orders',verifyLogin,(req,res)=>{
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  orderDetailsUser(user.userId).then((data) => {
  
    res.render('user/orders',{
      user:user,
      data:data
    })
})
})

router.get("/place-order", verifyLogin, (req, res) => {
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  auth.getCart(user.userId).then((data) => {
    getSavedAddress(user.userId).then((address)=>{
    getTotalAmount(user.userId).then((total) => {
      console.log('asdfasdfasdfsdf:',total)
      res.render("user/deliveryOption", {
        data: data,
        address:address,
        total: total.total,
        totalDiscount:total.total_discount,
        couponDiscount:total.couponDiscount,
        user : user,
      });
    });
  });
})
});
router.post("/place-order", async (req, res) => {
      let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    console.log(req.body)
    let address = await getSavedAddressDetails(req.body.address)
    let order_address = await createOrderAddress(address[0], user.userId);
    console.log("order_address",order_address)
    let Total = await getTotalAmount(user.userId);
    let usersData = await getOrderDetails(user.userId, req.body)
    orderCompleted(Total,usersData,user.userId,req.body,order_address._id).then((data)=>{
      if(req.body.payment_method=='cash_on_delivery'){
        res.status(200).json({method : "cash_on_delivery"})
      } else if (req.body.payment_method=='paypal') {
        res.status(200).json({method : "paypal"})
      }else{
        generateRazorpay(data._id,Total.total*100).then((response)=>{
          res.status(200).json(response)
        })
      }
      cart_model.deleteOne({
        userId:Types.ObjectId(user.userId)
      }).then((data)=>{
       
      })
    })
    //res.redirect('/cart')
});

router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
  verifyPayment(req.body).then(()=>{
    changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment Success');
      res.status(200).json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.status(200).json({status:false,errMsg:''})
  })
})


router.post("/api/orders", async (req, res) => {
  try {
    let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    let total = await getTotalAmount(user.userId);
    total = (total.total / 80).toFixed(2)
    console.log('total is ', total)
    const order = await paypal.createOrder(total);
    console.log(order)
    res.status(200).json(order);
  } catch (err) {
    console.log(err.message)
    res.status(500).send(err.message);
  }
});

router.post("/api/orders/:orderID/capture", async (req, res) => {
  const { orderID } = req.params;
  try {
    const captureData = await paypal.capturePayment(orderID);
    res.json(captureData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get('/orders/cancel/:id',verifyLogin,(req,res)=>{
  console.log("order",req.params.id);
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  console.log(user);
  const id = req.params.id;
  order_model.updateOne(
  {_id:Types.ObjectId(req.params.id)},
  {
    $set:{ 
      orderStatus:'CANCELLED'
    }
  }).then((data)=>{
    console.log("nnnn",data);
    res.redirect("/orders");
  })
})



router.get('/address/add',(req,res)=>{
  res.render("user/addAddress")
})

router.get('/address',verifyLogin,(req,res)=>{
  let user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  getSavedAddress(user.userId).then((data)=>{
    console.log(data);
  res.render("user/userAddress",{
    data:data,
    user:user,
  })
})
})
router.get('/editAddress/:id',verifyLogin,(req,res)=>{
  let user =req.cookies.user ? JSON.parse(req.cookies.user) : null;
  getEditSavedAddress(req.params.id).then((data)=>{
    res.render("user/editAddress",{
      data:data,
      user:user,
    })
  })
})

router.post('/editAddress/:id',verifyLogin,(req,res)=>{
  let user =req.cookies.user ? JSON.parse(req.cookies.user) : null;
  postEditSavedAddress(req.params.id,req.body).then((result)=>{
    console.log(result);
    res.redirect('/address')
  })
})

//logout
module.exports = router;
async function verifyAccess(req, res, next) {
  if (req.cookies.token) {
    let token = req.cookies.token;
    try {
      await verifyAccessToken(token);
      next;
    } catch (err) {
      res.redirect("/home");
    }
  } else {
    res.redirect("/auth");
  }
}

router.get("/newarrivals", (req, res) => {
  res.render("user/newArrivals");
});

function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
      if (err) {
        const Error =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        reject(createHttpError.Unauthorized(Error));
      } else {
        resolve();
      }
    });
  });
}




