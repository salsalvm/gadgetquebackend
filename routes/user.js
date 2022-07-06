const { log } = require('debug/src/browser');
require('dotenv').config();
var express = require('express');
const session = require('express-session');
const { route } = require('express/lib/application');
const res = require('express/lib/response');
const { redirect, render } = require('express/lib/response');
const async = require('hbs/lib/async');
const { payment } = require('paypal-rest-sdk');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')
const accountSID = process.env.accountSID;
const serviceSID = process.env.serviceSID;
const authToken = process.env.authToken;
const client = require('twilio')(accountSID, authToken)
const paypal = require('paypal-rest-sdk');
const { parse } = require('dotenv');
const createReferal = require('referral-code-generator')


paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.client_id,
  'client_secret': process.env.client_secret
});

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next();
  } else {
    res.redirect('/login')
  }
}

const verifyBlock = (req, res, next) => {
  if (req.session.user) {
    userHelpers.checkBlock(req.session.user).then((isBlock) => {
      if (!isBlock) {
        next()
      } else {
        req.session.user = null
        res.redirect('/')
      }
    })
  } else {
    next()
  }
}

/* GET home page. */
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      if (!response.blocked) {
        req.session.user = response.user
        req.session.userLoggedIn = true;
        // res.redirect('/')
        res.send({response})
      } else {
        req.session.userLogInErr = 'Sorry your account have been blocked'
        // res.redirect('/login')
        res.send({message:"Sorry your account have been blocked"})

      }
    } else {
      req.session.userLogInErr = 'Invalid Username or Password'
      // res.redirect('/login')
      res.send({message:"Invalid Username or Password"})
    }
  })
})
router.get('/', verifyBlock, async function (req, res, next) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(req.session?.user?._id)
  await productHelper.checkOfferExpiry(new Date).then((resp) => {
  })
  let todayDate = new Date().toISOString().slice(0, 10);
  await productHelper.startCategoryOffer(todayDate).then(() => {

  });
  let allCoupons = await productHelper.getAllCoupons()
  console.log(allCoupons);
  productHelper.getAllProducts().then((products) => {
    productHelper.getAllCategory().then((category) => {
      // res.render('user/view-products', { products, category, user, cartCount,allCoupons,homePage:true});
      res.send({ products, category, user, cartCount, allCoupons, homePage: true })
    })
  })
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    // res.render('user/login', { 'logInErr': req.session.userLogInErr, signupSuccess })
    res.send({logInErr: req.session.userLogInErr, signupSuccess})
    req.session.userLogInErr = false
  }
  signupSuccess = null
})

router.get('/otpLogin', (req, res) => {
  if (req.session.user) {
    // res.redirect('/')
    res.send({login:true})
  } else {
    // res.render('user/otpLogin', { 'logInErr': req.session.userLogInErr })
    res.send({logInErr: req.session.userLogInErr})
    req.session.userLogInErr = false
  }
})

var otpPhone
router.post('/otpLogin', (req, res) => {
  var phone = req.body.mobile;
  userHelpers.checkPhone(phone).then((num) => {
    if (num?.userBlocked) {
      // res.render('user/otpLogin', { otpErr1: true })
      res.send({otpErr1: true})
    } else {
      if (num) {
        client.verify
          .services(serviceSID)
          .verifications.create({
            to: `+91${req.body.mobile}`,
            channel: 'sms'
          })
          .then((resp) => {
            if (resp) {
              otpPhone = phone;
              // res.render('user/otpSubmit', { otpPhone })
              res.send({otpPhone})
            }
          })
      } else {
        // res.render('user/otpLogin', { otpErr: 'Invalid Phone Number' })
        res.send({otpErr: 'Invalid Phone Number'})
      }
    }

  })
})

router.post('/otpSubmit/:id', (req, res) => {
  const { otp } = req.body
  let otpPhone = req.params.id;
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: `+91${otpPhone}`,
      code: otp
    })
    .then((resp) => {
      if (resp.valid) {
        userHelpers.doOtpLogin(otpPhone).then((response) => {
          if (response.status) {
            req.session.user = response.user
            req.session.userLoggedIn = true;
            res.redirect('/')
          } else {
            req.session.userLogInErr = 'Invalid Username or Password'
            // res.redirect('/login')
            res.send({message:'Invalid Username or Password'})
          }
        })
      } else {
        // res.render('user/otpSubmit', { otpErr: 'Invalid otp', otpPhone })
        res.send({ otpErr: 'Invalid otp', otpPhone })
      }
    })
})

router.get('/resendOtp/:id', (req, res) => {
  otpPhone = req.params.id
  console.log('resend :' + otpPhone);
  client.verify
    .services(serviceSID)
    .verifications.create({
      to: `+91${otpPhone}`,
      channel: 'sms'
    })
    .then((resp) => {
      if (resp) {
        // res.render('user/otpSubmit', { otpPhone, reotp: 'otp has been resend' })
        res.send({otpPhone, reotp: 'otp has been resend'})
      }
    })

})

router.get('/signup', async (req, res) => {
  let refer = (await req.query.refer) ? req.query.refer : null;
  // res.render('user/signup', { refer })
  res.send({refer})
})

var userSignup;
router.post('/signup', (req, res) => {
  let refer = createReferal.alphaNumeric("uppercase", 2, 3);
  req.body.refer = refer;
  if (req.body.referedBy != '') {
    userHelpers.checkReferal(req.body.referedBy)
      .then((data) => {
        req.body.referedBy = data[0]._id;
        req.body.wallet = 100;
        userHelpers.emailCheck(req.body.Emailaddress, req.body.Mobile).then((resp) => {
          if (resp) {
            if (resp.Mobile == req.body.Mobile) {
              let check = true;
              // res.render('user/signup', { check: 'Mobile Already exist' })
              res.send({check: 'Mobile Already exist'})
            } else {
              let check = true;
              // res.render('user/signup', { check: 'Email Already exist' })
              res.send({check: 'Email Already exist'})
            }
          } else {
            userSignup = req.body;

            userHelpers.doSignup(userSignup).then((response) => {
              if (response.acknowledged) {
                console.log('test3', response);
                let valid = true;
                signupSuccess = "You Have Successfully signed up";
                res.send({response});
              } else {
                let valid = false;
                res.send({valid});
              }
            })
            // client.verify
            //   .services(serviceSID)
            //   .verifications.create({
            //     to: `+91${req.body.Mobile}`,
            //     channel: "sms",
            //   }).then((ress) => {
            //     let signupPhone = req.body.Mobile;
            //     // res.render("user/signupOtp", { signupPhone });
            //     res.send({signupPhone})
            //   })
          }
        });
      }).catch(() => {
        // res.render('user/signup', { check: 'Sorry Invalid Referal Code' })
        res.send({check: 'Sorry Invalid Referal Code'})
      })
  } else {
    userHelpers.emailCheck(req.body.Emailaddress, req.body.Mobile).then((resp) => {
      if (resp) {
        if (resp.Mobile == req.body.Mobile) {
          let check = true;
          // res.render('user/signup', { check: 'Mobile Already exist' })
          res.send({ check: 'Mobile Already exist'})
        } else {
          let check = true;
          // res.render('user/signup', { check: 'Email Already exist' })
          res.send({check: 'Email Already exist'})
        }
      } else {
        userSignup = req.body;

        userHelpers.doSignup(userSignup).then((response) => {
          if (response.acknowledged) {
            console.log('test3', response);
            let valid = true;
            signupSuccess = "You Have Successfully signed up";
            res.send({valid});
          } else {
            let valid = false;
            res.send({valid});
          }
        })

        // client.verify
        //   .services(serviceSID)
        //   .verifications.create({
        //     to: `+91${req.body.Mobile}`,
        //     channel: "sms",
        //   }).then((ress) => {
        //     let signupPhone = req.body.Mobile;
        //     // res.render("user/signupOtp", { signupPhone });
        //     res.send({signupPhone})
        //   })
      }
    })
  }

})

// var signupSuccess
// router.get("/signupOtp", (req, res) => {
//   console.log('called2');
//   res.header(
//     "Cache-Control",
//     "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
//   );
//   let phoneNumber = req.query.phonenumber;
//   let otpNumber = req.query.otpnumber;
//   client.verify
//     .services(serviceSID)
//     .verificationChecks.create({
//       to: "+91" + phoneNumber,
//       code: otpNumber,
//     })
//     .then((resp) => {
//       if (resp.valid) {
//         userHelpers.doSignup(userSignup).then((response) => {
//           if (response.acknowledged) {
//             console.log('test3', response);
//             let valid = true;
//             signupSuccess = "You Have Successfully signed up";
//             res.send({valid});
//           } else {
//             let valid = false;
//             res.send({valid});
//           }
//         })
//       }
//     });
// });

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.userLoggedIn = true;
      // res.redirect('/')
      res.send({response})
    } else {
      req.session.userLogInErr = 'Invalid Username or Password'
      // res.redirect('/login')
      res.send({loginError:true})
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user = null;
  req.session.userLoggedIn = false;
  // res.redirect('/');
  res.send({logOut:true})
})
router.get('/cart', [verifyLogin, verifyBlock], async (req, res) => {
  let user = req.session.user
  let products = await userHelpers.getCartProducts(req.session?.user?._id)
  let total = await userHelpers.getTotalAmount(req.session?.user._id)
  let cartCount = await userHelpers.getCartCount(req.session?.user?._id)
  // res.render('user/cart', { user, products, total, cartCount })
  res.send({user, products, total, cartCount})
})

router.get('/product-page/:id', verifyBlock, async (req, res) => {
  let product = await userHelpers.productView(req.params.id)
  let cartCount = await userHelpers.getCartCount(req.session?.user?._id)
  let related = await userHelpers.relatedDetails(product.Category)
  let user = req.session.user
  // res.render('user/product-page', { product, user, cartCount, related })
  res.send({product, user, cartCount, related})
})

router.get('/categoryWise/:cat', async (req, res) => {
  cat = req.params.cat
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(req.session?.user?._id)
  productHelper.getCatWise(cat).then((prodata) => {
    // res.render('user/categoryWise', { prodata, cat, user, cartCount })
    res.send({prodata, cat, user, cartCount})
  })
})

router.get('/add-to-cart/:id', (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

router.post('/change-product-quantity/', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response);
  })
})

router.post('/remove-cart-product', (req, res, next) => {
  userHelpers.removeCartProduct(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/checkout', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let addresses = await userHelpers.getAddress(req.session?.user._id);
  let products = await userHelpers.getCartProducts(req.session?.user?._id)
  let user = await userHelpers.getOneUser(req.session.user._id)
  if (!total == 0) {
    res.render('user/place-order', { total, user, addresses, products })
  } else {
    res.redirect('/');
  }
})


router.get('/place-order', async (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );

  let products = await userHelpers.getCartProductList(req.session.user._id)
  console.log('called');
  let user = await productHelper.getUserDetails(req.session.user._id)
  let address = await userHelpers.getOneAddress(
    req.query.addressId,
    req.session.user._id
  );
  const payment = req.query.payment
  if (req.session.walletTotal) {
    totalPrice = req.session.walletTotal;
  } else {
    totalPrice = await userHelpers.getTotalAmount(req.session.user._id)
  }

  totalPrice = parseInt(totalPrice)
  if (req.query.code !== 'undefined') {
    discount = parseInt(req.query.disc)
    totalPrice = totalPrice - discount
  }

  userHelpers.placeOrder(address[0], products, totalPrice, req.query.payment, user, req.query.code).then((orderId) => {
    req.session.orderId = orderId;
    if (payment == 'COD') {
      userHelpers.clearCart(user._id).then(() => {
        res.json({ codSuccess: true })
      })
    } else if (payment == 'paypal') {
      val = totalPrice / 74
      totalPrice = val.toFixed(2)
      let totals = totalPrice.toString()
      req.session.total = totals;
      console.log(totals);

      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "https://gadgetsque.xyz/success",
          "cancel_url": "https://gadgetsque.xyz/cancel"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": "Red Sox Hat",
              "sku": "001",
              "price": totals,
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": totals
          },
          "description": "Hat for the best team ever"
        }]
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          console.log(payment);
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              // res.redirect(payment.links[i].href);
              let link = payment.links[i].href;
              link = link.toString()
              res.json({ paypal: true, url: link })

            }
          }
        }
      });

    } else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }

  })
})

router.get("/success", verifyLogin, (req, res) => {
  userHelpers.clearCart(req.session.user._id).then(() => {
    userHelpers.changePaymentStatus(req.session.orderId).then(() => {
      res.render("user/success");
    });
  })
});

router.get('/cancel', verifyLogin, (req, res) => {
  userHelpers.cancelOrder(req.session.orderId).then(() => {
    res.render('user/failed');
  })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success');
      userHelpers.clearCart(req.session.user._id).then(() => {
        res.json({ status: true })
      })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false })
  })
})

router.get('/my-orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session?.user?._id)
  console.log(orders);
  res.render('user/my-orders', { user: req.session.user, orders, cartCount })
})

router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  let cartCount = await userHelpers.getCartCount(req.session?.user?._id)
  res.render('user/view-order-products', { user: req.session.user, products, cartCount })
})

var profileMsg;
router.get('/my-profile', verifyLogin, async (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let user = await productHelper.getUserDetails(req.session.user._id)
  let cartCount = await userHelpers.getCartCount(req.session?.user?._id)
  let refer = user.refer;
  let referalLink = "gadgetsque.xyz/signup?refer=" + refer;
  res.render('user/my-profile', { user, errPassMsg, cartCount, profileMsg, referalLink })
  errPassMsg = null;
  profileMsg = null;
})

router.post('/update-details', (req, res) => {
  let userId = req.body.userId;
  productHelper.updateUser(userId, req.body).then((resp) => {
    if (resp) {
      profileMsg = "Profile Updated Successfully";
      res.redirect('/my-profile')
    } else {

    }
  })
})

router.get('/my-address', verifyLogin, async (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  let addresses = await userHelpers.getAddress(req.session?.user._id);
  let cartCount = await userHelpers.getCartCount(req.session?.user?._id)
  res.render('user/my-address', { user: req.session.user, cartCount, addresses, addressMsg })
  addressMsg = null
})

router.get('/cancel-order/:id', verifyLogin, (req, res) => {
  orderId = req.params.id;
  userHelpers.cancelOrder(orderId).then((response) => {
    res.redirect('/my-orders')
  })
})

var errPassMsg = null;
router.post('/change-password', (req, res) => {
  userHelpers.changePassword(req.body).then((resp) => {
    if (resp.status) {
      profileMsg = "Password Updated Successfully";
      res.redirect('/my-profile')
    } else {
      errPassMsg = resp.errPass;
      res.redirect('/my-profile')
    }
  })
})

router.get('/delete-address/:id', verifyLogin, (req, res) => {
  userHelpers.deleteAddress(req.session?.user._id, req.params.id).then((resp) => {
    res.redirect('/my-address')
  })
})

router.get('/edit-address/:id', verifyLogin, (req, res) => {
  userHelpers.getOneAddress(req.params.id, req.session.user._id).then((resp) => {
    console.log(resp);
    res.render('user/edit-address', { address: resp })
  })
})

var addressMsg
router.post('/edit-address', (req, res) => {
  console.log(req.body)
  userHelpers.editAddress(req.session.user._id, req.body, req.body.addressId).then((resp) => {
    if (resp) {
      addressMsg = "Address Updated Successfully";
      res.redirect('/my-address')
    } else {

    }

  })
})

router.get('/add-address', verifyLogin, (req, res) => {
  res.render('user/add-address')
})

router.post('/add-address', (req, res) => {
  userHelpers.addAddress(req.session.user._id, req.body).then((resp) => {
    addressMsg = "Address Added Successfully";
    res.redirect('/my-address')
  })
})

router.post('/add-checkout-address', (req, res) => {
  userHelpers.addAddress(req.session.user._id, req.body).then((resp) => {
    res.redirect('/checkout')
  })
})

router.post('/check-coupon', verifyLogin, async (req, res) => {
  console.log(req.body);
  console.log('called');
  await userHelpers.checkCouponOffer(req.body.code, req.session.user._id).then((resp) => {
    if (resp.status) {
      res.json(resp.couponExist)
    }
    else if (resp.isUsed) {
      let isUsed = true
      res.json({ isUsed })
    }
    else {
      resp = false
      res.json(resp)
    }
  })
})

router.post("/applyWallet", async (req, res) => {
  var user = req.session.user._id;
  let ttl = parseInt(req.body.Total);
  let walletAmount = parseInt(req.body.wallet);
  let userDetails = await productHelper.getUserDetails(user);
  console.log(userDetails.wallet, walletAmount, ttl, user);
  if (userDetails.wallet >= walletAmount) {
    let total = ttl - walletAmount;
    userHelpers.applyWallet(walletAmount, user).then(async (response) => {
      let userDetails = await productHelper.getUserDetails(user);
      walletBalance = userDetails.wallet
      req.session.walletTotal = total;
      res.json({ walletSuccess: true, total, walletAmount, walletBalance });
    });
  } else {
    res.json({ valnotCurrect: true });
  }
});

router.get('/quickview/:id', async (req, res) => {
  let product = await userHelpers.productView(req.params.id)
  let cartCount = await userHelpers.getCartCount(req.session?.user?._id)
  let user = req.session.user
  res.render('user/quickView', { product, cartCount, user })
})

module.exports = router;
