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
var router = express.Router();

/* GET home page. */

router.get("/",async function(req, res, next) {
  console.log("admin");
let totalSales= await getTotalSales();
let userCount=await getUserCount();
let salesAmount=await getSalesAmount();
// console.log("totals",salesAmount[0].total);
  res.render("admin/adminhome", { admin: true,total:totalSales,user:userCount,totalamount:salesAmount[0]?.total});
});
router.post("/adminsignin", (req, res) => {
  const adminName= req.body.adminName;
  const admin={name:adminName}
  const accessTokenAdmin= jwt.sign(admin,process.env.ACCEESS_TOKEN_ENV_ADMIN)
  res.json({accessTokenAdmin:accessTokenAdmin})
  res.render("admin/adminsignin");
});

function authenticateTokenAdmin(req,res,next) {
  
}

router.get('/stats/day',(req,res)=>{
  getStatDay().then((graph)=>{
    res.status(200).json(graph)
  }) 
})
router.get('/stats/week',(req,res)=>{
  getStatWeekly().then((graph)=>{
    res.status(200).json(graph)
  })
})
router.get('/stats/month',(req,res)=>{
  getStatmonth().then((graph)=>{
    res.status(200).json(graph)
  })
})

router.get('/stats/sales',(req,res)=>{
  getSalesMode().then((graph)=>{
    res.status(200).json(graph)
  })
})
router.get('/stats/saleStatus',(req,res)=>{
  getSalesStatus().then((graph)=>{
    res.status(200).json(graph)
  })
})

//home
router.get("/home", (req, res, next) => {});
//Admin Product Page
router.get("/products", (req, res) => {
  getProducts().then((data) => {
    res.render("admin/adminviewproducts", {
      data: data,
    });
  });
});

//addproduct
router.get("/addproduct", (req, res, next) => {
  category_model.find({}).lean().then((data)=>{
    
    res.render("admin/addproduct", { admin: true,data:data });
  })
});
router.post("/addproduct", (req, res) => {
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

router.get("/products", async(req, res) => {
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
router.get("/deleteProduct/:id", (req, res) => {

  deleteproduct(req.params.id).then(() => {
    res.redirect("/admin/products");
  });
});

router.get("/editProduct/:id", (req, res) => {
  getProduct(req.params.id).then((product) => {
    res.render("admin/editproduct", { product: product });
  });
});

router.post("/editProduct/:id", (req, res) => {
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
router.get('/Categories',(req,res,next)=>{
  return new Promise((resolve,reject) => {
    category_model.find({}).lean().then((data) => {    
      res.render('admin/categories',{categories:data})
      
    })
  })
});

router.get('/addCategory',(req,res)=>{

  res.render('admin/addCategory')
})
router.post('/addCategory',(req,res)=>{
  
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
router.get("/deleteCategory/:id",(req,res) => {

  // console.log(req.params.id);
  const id = req.params.id;

  category_model.deleteOne({_id:Types.ObjectId(id)}).then((data) => {

    res.redirect("/admin/Categories")
  })
});

router.get("/editCategory/:id",(req,res) => {

   const id = req.params.id;

  // console.log(id);

  category_model.find({_id:Types.ObjectId(id)}).lean().then((data) => {
    //console.log("hiii",data)
    res.render("admin/editCategory",{data:data})


  })

});
router.post("/editCategory/:id",(req,res) => {

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
      // console.log("ksahksah",products);
      products.forEach(elements => {
        const finalPrice = Math.round(elements.price * (100-categoryDiscount)/100 *(100-elements.productDiscount)/100) 
        console.log("dghfjagc",finalPrice);
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



router.get("/customers", (req, res) => {
  return new Promise((resolve, reject) => {
    listUser({}).then((data) => {
      res.render("admin/customers",{data:data})
      resolve()
    });
  });
});

router.get("/allowUser/:id", (req, res) => {
  allowedUser(req.params.id).then(() => {
    res.redirect("/admin/customers");
  });
});

router.get("/deleteUser/:id", (req, res) => {
  deleteUser(req.params.id).then(() => {
    res.redirect("/admin/customers");
  });
});

router.get('/orders',(req,res)=>{
  order_model.find({}).lean().then((data)=>{
    res.render('admin/orders',{data:data})
  })
})
router.get('/orderdetails/:id',(req,res)=>{
  orderDetailsAdmin(req.params.id).then((data)=>{
    res.render('admin/orderdetails',{
      data:data[0],
    })
  })
})

router.get('/coupons',(req,res)=>{
  coupons_model.find({}).lean().then((data)=>{
    res.render('admin/coupons',{data:data})
  })
})

router.get('/addCoupons',(req,res)=>{
  res.render('admin/addCoupons')
})

router.post('/addCoupons',(req,res)=>{
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

router.get("/deleteCoupons/:id",(req,res) => {
  // console.log(req.params.id);
  const id = req.params.id;
  coupons_model.deleteOne({_id:Types.ObjectId(id)}).then((data) => {
    res.redirect("/admin/coupons")
  })
});



router.post("/order/changeStatus", (req, res) => {
  console.log("asdfasdfasdf", req.body.orderId, req.body.status)
  order_model.updateOne({_id : req.body.orderId},{$set: {orderStatus : req.body.status}}).then((data) => {
    console.log(data)
     res.status(200).json(true)
  })
})

router.get('/banner',(req,res)=>{
  banner_model.find({isDelete:"false"}).lean().then((data)=>{
    res.render('admin/banner',{data:data})
  })
})

router.get('/addBanner',(req,res)=>{
  res.render('admin/addBanner')
})

router.post('/addBanner',(req,res)=>{
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

    router.get("/deleteBanner/:id", (req, res) => {

      deleteBanner(req.params.id).then(() => {
        res.redirect("/admin/banner");
      });
    });

module.exports = router;

