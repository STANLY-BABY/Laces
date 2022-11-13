require('dotenv').config()
const { json } = require("express");
var express = require("express");
const jwt = require("jsonwebtoken");
const { token } = require("morgan");
const session = require("express-session");
const createHttpError = require("http-errors");
const { Promise, Types } = require("mongoose");
const { resolve } = require("path");
const { reject } = require("promise");
const { path } = require("../app");
const { deleteBanner } = require("../helpers/admin/banner");
const { getTotalSales, getUserCount, getSalesAmount, getStatDay, getStatWeekly, getStatmonth, getBanner, getSalesMode, getSalesStatus } = require("../helpers/admin/dash");
const product = require("../helpers/admin/product");
const {
  deleteproduct,
  getProduct,
  postEditProduct,
} = require("../helpers/admin/product");
const { getProducts, getUser, listUser ,allowedUser, deleteUser, getTotalAmount} = require("../helpers/user/auth");
const { getOrderDetails, orderDetailsAdmin } = require("../helpers/user/placeholder");
const banner_model = require("../models/banner_model");
const { category_model } = require("../models/category_model");
const coupons_model = require("../models/coupons_model");
const order_model = require("../models/order_model");
const { product_model } = require("../models/product_model");
const { adminAuth } = require('../helpers/admin/adminAuth');
var router = express.Router();

/* GET home page. */


router.get("/", adminAuth, async function(req, res, next) {
  let totalSales= await getTotalSales();
  let userCount=await getUserCount();
  let salesAmount=await getSalesAmount();
 
  res.render("admin/adminhome", { admin: true,total:totalSales,user:userCount,totalamount:salesAmount[0]?.total});
});
router.get("/login", (req, res) => {
  console.log("dsfdfsdfs");
  res.render("admin/adminsignin");
})
router.post("/login", (req, res) => { 
  console.log(req.body)
  if(req.body.email === process.env.ADMIN_ID && req.body.password === process.env.ADMIN_PASS){
    const accessTokenAdmin= jwt.sign({},process.env.ACCEESS_TOKEN_ENV_ADMIN)
    console.log(accessTokenAdmin)
    res.status(200).json(accessTokenAdmin)
  } else {
    res.status(401).json("❌Username or Password Wrong ❌")
  }
});


router.get('/stats/day',adminAuth,(req,res)=>{
  getStatDay().then((graph)=>{
    res.status(200).json(graph)
  }) 
})
router.get('/stats/week',adminAuth,(req,res)=>{
  getStatWeekly().then((graph)=>{
    res.status(200).json(graph)
  })
})
router.get('/stats/month',adminAuth,(req,res)=>{
  getStatmonth().then((graph)=>{
    res.status(200).json(graph)
  })
})

router.get('/stats/sales',adminAuth,(req,res)=>{
  getSalesMode().then((graph)=>{
    res.status(200).json(graph)
  })
})
router.get('/stats/saleStatus',adminAuth,(req,res)=>{
  getSalesStatus().then((graph)=>{
    res.status(200).json(graph)
  })
})

//home
// router.get("/home", (req, res, next) => {});
//Admin Product Page
router.get("/products",adminAuth, (req, res) => {

  getProducts().then((data) => {
    res.render("admin/adminviewproducts", {
      data: data,
    });
  });
});

//addproduct
router.get("/addproduct",adminAuth, (req, res, next) => {
  category_model.find({}).lean().then((data)=>{
    
    res.render("admin/addproduct", { admin: true,data:data });
  })
});
router.post("/addproduct",adminAuth, (req, res) => {
  const { Name, description, Price, brands, category, Stock,productDiscount,img_ext, } = req.body;
  category_model.findOne({category:category}).then((data)=> {
    const cDiscount = data.categoryDiscount;
    const finalPrice = Price*(100-cDiscount)/100 * (100-productDiscount)/100;
    product_model
      .create({
        name: Name,
        description: description,
        price: Number(Price),
        brand: brands,
        category: category,
        stocks: Number(Stock),
        price: Price,
        isDelete: false,
        productDiscount:productDiscount,
        productDiscountPrice:finalPrice,
      })
      .then((data) => {
        // const image = req.files.image;
        for(let i = 1; i <= 4; i++) {
          const image = req.files[`image${i}`];
        image.mv(`./public/product_images/${data._id}-${i}.jpg`, (err, done) => {
          if (!err)
          {
            if(i === 4){
             res.redirect("/admin/products")
           } 
         }
          else res.redirect("/admin/products");
        });
      }
  })
  
    });
});

router.get("/products",adminAuth, async(req, res) => {
  let category=await getAllCategories()

  getProducts().then((data) => {
    res.render("user/userproductlist", {
      user: true,
      data: data,
      category:category
    });
  });
});


//delete product
router.get("/deleteProduct/:id",adminAuth, (req, res) => {

  deleteproduct(req.params.id).then(() => {
    res.redirect("/admin/products");
  });
});

router.get("/editProduct/:id",adminAuth, (req, res) => {
  getProduct(req.params.id).then((product) => {
    res.render("admin/editproduct", { product: product });
  });
});

router.post("/editProduct/:id",adminAuth, (req, res) => {
  postEditProduct(req.params.id, req.body).then((result) => {
    if (result) {
      if (req.files) {
        const image = req.files.image;
        image.mv(
          `./public/product_images/${req.params.id}.jpg`,
          (err, done) => {
            if (!err) res.redirect("/admin/products");
            else console.log(err);
          }
        );
      }else{
        res.redirect('/admin/products')
      }
    }else{
      res.send("Unable to complete your request")
    }
  });
});
//category
router.get('/Categories',adminAuth,(req,res,next)=>{
  return new Promise((resolve,reject) => {
    category_model.find({}).lean().then((data) => {    
      res.render('admin/categories',{categories:data})
      
    })
  })
});

router.get('/addCategory',adminAuth,(req,res)=>{

  res.render('admin/addCategory')
})
router.post('/addCategory',adminAuth,(req,res)=>{
  
  const {category,categoryDescription,categoryDiscount} = req.body;
  category_model
    .create({
      category: category,
      categoryDescription: categoryDescription,
      isDelete: false,
      categoryDiscount:categoryDiscount,
    })
    .then((data) => {
      res.redirect("/admin/Categories")
    });
});
router.get("/deleteCategory/:id",adminAuth,(req,res) => {

  const id = req.params.id;

  category_model.deleteOne({_id:Types.ObjectId(id)}).then((data) => {

    res.redirect("/admin/Categories")
  })
});

router.get("/editCategory/:id",adminAuth,(req,res) => {

   const id = req.params.id;
  category_model.find({_id:Types.ObjectId(id)}).lean().then((data) => {
    res.render("admin/editCategory",{data:data})
  })

});
router.post("/editCategory/:id",adminAuth,(req,res) => {

  const id = req.params.id;
  const { category,categoryDescription,categoryDiscount } = req.body;

  category_model.updateOne({_id:Types.ObjectId(id)},
    {
      $set:{
        category:category,
        categoryDescription:categoryDescription,
        categoryDiscount:categoryDiscount,
      }
    }).then(async(data) => {
      const products =await product_model.find({category:category})
      products.forEach(elements => {
        const finalPrice = Math.round(elements.price * (100-categoryDiscount)/100 *(100-elements.productDiscount)/100) 
        product_model.updateOne({_id:Types.ObjectId(elements._id)},
          {
            $set:{
              productDiscountPrice:finalPrice,
            }
          }).then((data)=>{
          }).catch(error=> {
          });
      })
      res.redirect("/admin/Categories")
    })
})



router.get("/customers",adminAuth, (req, res) => {
  return new Promise((resolve, reject) => {
    listUser({}).then((data) => {
      res.render("admin/customers",{data:data})
      resolve()
    });
  });
});

router.get("/allowUser/:id",adminAuth, (req, res) => {
  allowedUser(req.params.id).then(() => {
    res.redirect("/admin/customers");
  });
});

router.get("/deleteUser/:id",adminAuth, (req, res) => {
  deleteUser(req.params.id).then(() => {
    res.redirect("/admin/customers");
  });
});

router.get('/orders',adminAuth,(req,res)=>{
  order_model.find({}).lean().then((data)=>{
    res.render('admin/orders',{data:data})
  })
})
router.get('/orderdetails/:id',adminAuth,(req,res)=>{
  orderDetailsAdmin(req.params.id).then((data)=>{
    res.render('admin/orderdetails',{
      data:data[0],
    })
  })
})

router.get('/coupons',adminAuth,(req,res)=>{
  coupons_model.find({}).lean().then((data)=>{
    res.render('admin/coupons',{data:data})
  })
})

router.get('/addCoupons',adminAuth,(req,res)=>{
  res.render('admin/addCoupons')
})

router.post('/addCoupons',adminAuth,(req,res)=>{
  const {couponName,couponDesc,couponCode,couponDiscount,minAmount} = req.body;
  coupons_model
    .create({
      couponName: couponName,
      couponDesc: couponDesc,
      couponCode:couponCode,
      couponDiscount:couponDiscount,
      minAmount: minAmount,
    })
    .then((data) => {
      res.redirect("/admin/coupons")
    });
});

router.get("/deleteCoupons/:id",adminAuth,(req,res) => {
  const id = req.params.id;
  coupons_model.deleteOne({_id:Types.ObjectId(id)}).then((data) => {
    res.redirect("/admin/coupons")
  })
});



router.post("/order/changeStatus",adminAuth, (req, res) => {
  order_model.updateOne({_id : req.body.orderId},{$set: {orderStatus : req.body.status}}).then((data) => {
     res.status(200).json(true)
  })
})

router.get('/banner',adminAuth,(req,res)=>{
  banner_model.find({isDelete:"false"}).lean().then((data)=>{
    res.render('admin/banner',{data:data})
  })
})

router.get('/addBanner',adminAuth,(req,res)=>{
  res.render('admin/addBanner')
})

router.post('/addBanner',adminAuth,(req,res)=>{
  const {bannerNo,isDelete} = req.body;
  banner_model
    .create({
      bannerNo: bannerNo,
      isDelete: false
    })
    .then((data) => {
      const image = req.files.image;
        image.mv(`./public/product_images/${data._id}.jpg`, (err, done) => {
          if (err) reject(createHttpError.InternalServerError());
      res.redirect("/admin/banner")
    });
});
    });

    router.get("/deleteBanner/:id",adminAuth, (req, res) => {

      deleteBanner(req.params.id).then(() => {
        res.redirect("/admin/banner");
      });
    });
router.get('/sales',adminAuth,(req,res)=>{
  order_model.find({orderStatus: { $ne: "CANCELLED" } }).lean().then((data)=>{
  res.render('admin/sales',{data:data})
  })
})

module.exports = router;

