var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')
require('dotenv').config();
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { result } = require('lodash');

const credential = {
  email: process.env.adminEmail,
  password: process.env.adminPassword
}

const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect('/admin/adminlog')
  }
}

/* GET users listing. */
router.get('/adminlog', (req, res) => {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin/view-users')
  } else {
    res.render('admin/adminlog', { admin: true, 'logInErr': req.session.adminLogInErr })
    req.session.adminLogInErr = false
  }
})
router.post('/adminlog', (req, res) => {
  if (req.body.email == credential.email && req.body.password == credential.password) {
    user = req.session.adminLoggedIn = true;
    res.redirect('/admin/view-users')
  } else {
    req.session.adminLogInErr = 'Invalid Username or Password'
    res.redirect('/admin/adminlog')
  }
})
router.get('/', verifyLogin, function (req, res, next) {
  productHelper.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin: true, products, user });
  })
});
router.get('/view-category', verifyLogin, (req, res) => {
  productHelper.getAllCategory().then((category) => {
    res.render('admin/view-category', { admin: true, category, user })
  })
})
router.get('/add-category', verifyLogin, (req, res) => {
  res.render('admin/add-category', { admin: true, user })
})
router.post('/add-category', (req, res) => {
  console.log(req.body);
  console.log(req.files.Image);

  productHelper.addCategory(req.body).then((result) => {
    let image = req.files.Image

    image.mv('./public/category-image/' + result + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/view-category')
      } else {
        console.log(err);
      }
    })
  })
});

router.get('/edit-category/:id', verifyLogin, async (req, res) => {
  let category = await productHelper.getCategoryDetails(req.params.id)
  res.render('admin/edit-category', { admin: true, category, user })
});

router.post('/edit-category/:id', (req, res) => {
  let id = req.params.id;
  let image = req.files?.Image;

  if (image) {
    fs.unlink(
      './public/category-image/' + id + '.jpg',
      (err, done) => {
        if (!err) {
          image.mv(
            './public/category-image/' + id + '.jpg',
            (err, done) => {
            }
          )
        } else {
        }
      }
    )
  }

  productHelper.updateCategory(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-category')
  })
})

router.get('/delete-category/', verifyLogin, (req, res) => {
  let catId = req.query.id

  fs.unlink(
    './public/category-image/' + catId + '.jpg',
    (err, done) => {
      if (!err) {
        console.log('image removed');
      } else {
      }
    }
  )

  productHelper.deleteCategory(catId).then((response) => {
    res.redirect('/admin/view-category')
  })
})
router.get('/view-users', verifyLogin, (req, res) => {
  productHelper.getAllusers().then((users) => {
    res.render('admin/view-users', { admin: true, users, user })
  })
});

router.get('/add-product', verifyLogin, (req, res) => {
  productHelper.getAllCategory().then((category) => {
    imageId = new ObjectId()
    res.render('admin/add-product', { admin: true, user, category, imageId })
  })
})
router.post('/add-product', (req, res) => {
  console.log(req.body);
  console.log(req.files.Image);
  console.log(req.body.imageId);
  imageId = req.body.imageId

  productHelper.addProduct(req.body, (result) => {
    // let image = req.files?.Image
    // let image2 = req.files?.Image2
    // let image3 = req.files?.Image3
    let image1 = req.files.image1;
    let image2 = req.files?.image2;
    let image3 = req.files?.image3;

    const path = `./public/product-image/${result}`;

    fs.mkdir(path, (err) => {
      if (err) {
        throw err;
      }
    });

    image1.mv(`./public/product-image/${result}/${imageId}_1.jpg`, (err, done) => {
      if (!err) {
        image2.mv(`./public/product-image/${result}/${imageId}_2.jpg`, (err, done) => {
          if (!err) {
            image3.mv(`./public/product-image/${result}/${imageId}_3.jpg`, (err, done) => {
              if (!err) {
                res.redirect('/admin/')
              } else {
                console.log(err);
              }
            })
          } else {
            console.log(err);
          }
        })

      } else {
        console.log(err);
      }
    })



  })

})

router.get('/delete-product/', verifyLogin, async (req, res) => {
  let proId = req.query.id


  productHelper.deleteProduct(proId).then((response) => {
    if (response) {
      const path = `./public/product-image/${proId}`;
      // To delete whole  product image folder

      try {
        fs.rmdirSync(path, { recursive: true });

      } catch (err) {
      }
      res.redirect("/admin/");
    } else {
      res.redirect("/admin/");
    }
  });
})
router.get('/edit-product/:id', verifyLogin, async (req, res) => {
  let product = await productHelper.getProductDetails(req.params.id)
  res.render('admin/edit-product', { admin: true, product })
});

router.post('/edit-product/:id', async (req, res) => {
  let id = req.params.id;
  let product = await productHelper.getProductDetails(req.params.id)
  let image = req.files?.Image;
  let image2 = req.files?.Image2;
  let image3 = req.files?.Image3;
  console.log(id);
  console.log(product.imageId);
  imageId = product.imageId

  if (image) {
    fs.unlink(
      `./public/product-image/${id}/${imageId}_1.jpg`,
      (err, done) => {
        if (!err) {
          image.mv(
            `./public/product-image/${id}/${imageId}_1.jpg`,
            (err, done) => {
            }
          );
        } else {
        }
      }
    );
  }
  if (image2) {
    fs.unlink(
      `./public/product-image/${id}/${imageId}_2.jpg`,
      (err, done) => {
        if (!err) {
          image2.mv(
            `./public/product-image/${id}/${imageId}_2.jpg`,
            (err, done) => {
            }
          );
        } else {
        }
      }
    );
  }
  if (image3) {
    fs.unlink(
      `./public/product-image/${id}/${imageId}_3.jpg`,
      (err, done) => {
        if (!err) {
          image3.mv(
            `./public/product-image/${id}/${imageId}_3.jpg`,
            (err, done) => {
            }
          );
        } else {
        }
      }
    );
  }

  productHelper.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/')
  })
})


router.post("/block-user", verifyLogin, (req, res) => {
  productHelper.blockUser(req.body.id).then((response) => {
    if (response) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  });
});


router.post("/unblock-user", verifyLogin, (req, res) => {
  productHelper.unblockUser(req.body.id).then((response) => {
    if (response) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  });
});

router.get('/delete-user/:id', verifyLogin, (req, res) => {
  let userId = req.params.id
  productHelper.deleteUser(userId).then((response) => {
    res.redirect('/admin/view-users')
  })
});
router.get('/edit-user/:id', verifyLogin, async (req, res) => {
  let user = await productHelper.getUserDetails(req.params.id)
  res.render('admin/edit-user', { user, admin: true })
})
router.post('/edit-user/:id', (req, res) => {
  productHelper.updateUser(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-users')
  })
})
router.get('/logout', (req, res) => {
  req.session.admin = null
  req.session.adminLoggedIn = false
  res.redirect('/admin/adminlog')
})

router.get('/admin-orders', verifyLogin, (req, res) => {
  productHelper.viewOrders().then((response) => {
    if (response) {
      res.render('admin/admin-orders', { allOrders: response, admin: true, user: req.session.adminLoggedIn })
    }
  })
})

router.get('/admin-product-details/:id', async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('admin/admin-product-details', { products, admin: true, user: req.session.adminLoggedIn })
})

router.post('/status-update', (req, res) => {
  let status = req.body.status;
  let orderId = req.body.orderId;
  productHelper.changeStatus(status, orderId).then((reponse) => {

  })
})

router.get('/admin-dashboard', verifyLogin, async (req, res) => {
  let currentDaySale = await productHelper.currentDaySale()
  let totalUsers = await productHelper.getTotalUsers()
  let topSelling = await productHelper.getTopSelling()
  res.render('admin/admin-dashboard', { admin: true, user: req.session.adminLoggedIn, currentDaySale, totalUsers, topSelling })
})

router.get('/getChartDates', async (req, res) => {
  let dailySales = await productHelper.getdailySales()
  let yearlySales = await productHelper.yearlySale()
  res.json({ dailySales, yearlySales })
})

router.get('/product-offer', verifyLogin, async (req, res) => {
  let allProducts = await productHelper.getAllProducts()
  let offerList = await productHelper.getProductOffer()
  res.render('admin/product-offer', { admin: true, user: req.session.adminLoggedIn, allProducts, offerList })
})

router.post('/product-offer', (req, res) => {
  console.log(req.body);
  productHelper.addProductOffer(req.body).then((resp) => {
    res.redirect('/admin/product-offer')
  })
})

router.post("/delete-product-offer", verifyLogin, async (req, res, next) => {
  let proId = req.body.proId
  let offerProId = req.body.offerId
  let origPrice = req.body.origPrice
  await productHelper.deleteProductOffer(proId, offerProId, origPrice)
  res.json({ status: true })
});

router.get('/category-offer',verifyLogin,async (req,res)=>{
  let allCategory = await productHelper.getAllCategory()
  let allCatOffers = await productHelper.getCategoryOffer()
  console.log(allCatOffers);
  res.render('admin/category-offer',{allCategory,admin: true, user: req.session.adminLoggedIn,allCatOffers})
})

router.post('/category-offer',(req,res)=>{
  productHelper.addCategoryOffer(req.body).then((resp)=>{
    res.redirect('/admin/category-offer')
  })
})

router.post("/delete-category-offer", verifyLogin,async (req, res, next) => {
  console.log('called');
  productHelper.deleteCategoryOffer(req.body.offerId).then((resp)=>{
    res.redirect('/admin/category-offer')
  })
});

router.get('/coupon',verifyLogin,async (req,res)=>{
  console.log('called');
  allCoupons = await productHelper.getAllCoupons()
  console.log(allCoupons);
  res.render('admin/coupon',{admin: true, user: req.session.adminLoggedIn,allCoupons})
})

router.post("/add-coupon", (req, res) => {
  console.log(req.body);
  productHelper.addCoupon(req.body).then(() => {
    res.redirect("/admin/coupon");
  });
});

router.get("/delete-coupon/:id", (req, res) => {
  productHelper.deleteCoupon(req.params.id).then(() => {
    res.redirect("/admin/coupon");
  });
});

router.get('/report',verifyLogin,async (req,res)=>{
  productHelper.monthlyReport().then((data)=>{
    res.render('admin/report',{admin: true,user: req.session.adminLoggedIn,data})
  })
})

router.post("/report",verifyLogin, (req, res) => {
  productHelper.salesReport(req.body).then((data) => {
    res.render("admin/report", {
      admin: true,
      data,
      user: req.session.adminLoggedIn
    });
  });
});

module.exports = router;
