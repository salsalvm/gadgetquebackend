var db = require('../config/connection')
var collection = require('../config/collections');
const moment = require('moment')
const bcrypt = require('bcrypt');
const async = require('hbs/lib/async');
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { resolve } = require('path');
const { reject } = require('lodash');
var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (res, rej) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                return res(data)
            })
            if(userData.referedBy != ''){
                console.log('inside called',userData.referedBy);
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userData.referedBy)},{ $inc: { wallet: 100} })
            }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (res, rej) => {
            let loginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Emailaddress: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        response.blocked = user.userBlocked
                        response.user = user
                        response.status = true
                        res(response)
                    } else {
                        console.log('Login failed');
                        res({ status: false })
                    }
                })
            } else {
                console.log('user not found');
                res({ status: false })
            }
        })
    },
    emailCheck: (email, mob) => {
        return new Promise(async (res, rej) => {
            let found = await db.get().collection(collection.USER_COLLECTION).findOne({ $or: [{ Emailaddress: email }, { Mobile: mob }] })
            console.log(found);
            res(found)
        })
    },
    checkPhone: (data) => {
        return new Promise(async (res, rej) => {
            let found = await db.get().collection(collection.USER_COLLECTION).findOne({ Mobile: data })
            res(found)
        })
    },
    doOtpLogin: (userData) => {
        return new Promise(async (res, rej) => {
            let loginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Mobile: userData })
            if (user) {
                response.blocked = user.userBlocked
                response.user = user
                response.status = true
                res(response)
            } else {
                console.log('user not found');
                res({ status: false })
            }
        })
    },
    productView: (proId) => {
        return new Promise((res, rej) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                res(product)
            })
        })

    },
    checkBlock: (user) => {
        return new Promise(async (res, rej) => {
            let result = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(user._id) })
            res(result.userBlocked)
            console.log('checking..', result.userBlocked);
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (res, rej) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            res()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then((response) => {
                            res()
                        })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    res()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (res, rej) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{proList:'$products'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id','$$proList']
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray()
            res(cartItems)
        })
    },
    getCartCount: (userId) => {
        let count = 0
        return new Promise(async (res, rej) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            res(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((res, rej) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        res({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        res({ status: true })
                    })

            }
        })
    },
    removeCartProduct: (details) => {
        return new Promise((res, rej) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    res({ removeProduct: true })
                })
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (res, rej) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.Price' }] } }
                    }
                }
            ]).toArray()
            console.log(total);
            res(total[0]?.total)
        })
    },
    placeOrder: (order, products, total, Method, user, code) => {
        return new Promise((res, rej) => {
            let status = Method === 'COD' ? 'placed' : 'Cancelled'
            var cancelled = false;
            if(status == 'Cancelled'){
                var cancelled = true;
            }else if(status == 'placed'){
                var cancelled = false;
            }
            console.log(order);
            products[0].totalAmount = total
            let dateIso = new Date()
            let date = moment(dateIso).format('YYYY/MM/DD')
            let time = moment(dateIso).format('HH:mm:ss')
            let orderObj = {
                deliveryDetails: {
                    mobile: order.address.mobile,
                    address: order.address.address,
                    type: order.address.type,
                    pincode: order.address.pincode
                },
                userName: order.Name,
                userId: user._id,
                paymentMethod: Method,
                products: products,
                totalAmount: total,
                status: status,
                DateISO: dateIso,
                Date: date,
                Time: time,
                Coupon: code,
                cancelled: cancelled
            }
            let usersId = user._id
            if (code != 'undefined') {
                db.get().collection(collection.COUPON_OFFER).updateOne({ Coupon: code }, {
                    $push: {
                        Users: {
                            userId: objectId(usersId)
                        }
                    }
                })
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                res(response.insertedId)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (res, rej) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            res(cart.products)
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (res, rej) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: objectId(userId) }).sort({ 'DateISO': -1 })
                .toArray()
            res(orders);
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (res, rej) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, totalAmount: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            res(orderItems)
        })
    },
    cancelOrder: (orderId) => {
        return new Promise((res, rej) => {
            db.get()
                .collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) }, { $set: { status: 'Cancelled', cancelled: true } })
                .then((data) => {
                    res(data);
                });
        })
    },
    changePassword: (details) => {
        return new Promise(async (res, rej) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(details.userId) })
            if (user) {
                bcrypt.compare(details.currentPass, user.Password).then(async (status) => {
                    if (status) {
                        details.newPass = await bcrypt.hash(details.newPass, 10)
                        db.get().collection(collection.USER_COLLECTION)
                            .updateOne({ _id: objectId(details.userId) },
                                {
                                    $set: {
                                        Password: details.newPass
                                    }
                                }
                            ).then((resp) => {
                                if (resp) {
                                    res({ status: true })
                                } else {
                                    res({ status: false, errPass: 'password not updated' })
                                }
                            })
                    } else {
                        res({ status: false, errPass: 'Please enter current Password correctly' })
                    }
                })
            }
        })
    },
    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let allAddress = await db.get().collection(collection.USER_COLLECTION).aggregate(
                [{
                    $match: {
                        _id: objectId(userId)
                    }
                },
                {
                    $project: {
                        address: 1,
                        _id: 0
                    }
                },
                {
                    $unwind: '$address'
                }
                ]).toArray()
            resolve(allAddress);
        })
    },
    deleteAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).updateOne(
                {
                    _id: objectId(userId),
                    "address.addressId": objectId(addressId)
                },
                {
                    $pull: {
                        address: {
                            "addressId": objectId(addressId)
                        }
                    }
                }).then((response) => {

                    resolve(response)
                })
        })
    },
    getOneAddress: (addressId, userId) => {
        return new Promise(async (resolve, reject) => {
            let oneAddress = await db.get().collection(collection.USER_COLLECTION).aggregate(
                [
                    {
                        $match: {
                            _id: objectId(userId)
                        }
                    },
                    {
                        $unwind: "$address"
                    },
                    {
                        $match: {
                            "address.addressId": objectId(addressId)
                        }
                    },

                ]).toArray()

            resolve(oneAddress);
        })
    },
    editAddress: (userId, data, addressId) => {
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.USER_COLLECTION).updateOne(
                {
                    _id: objectId(userId),
                    "address.addressId": objectId(addressId)
                },
                {
                    $set: {
                        "address.$.type": data.type,
                        "address.$.name": data.name,
                        "address.$.mobile": data.mobile,
                        "address.$.pincode": data.pincode,
                        "address.$.address": data.address,
                    }
                }
            ).then((resp) => {

                resolve(resp)
            })
        })
    },
    addAddress: (userId, data) => {
        let address = {
            addressId: new objectId(),
            name: data.name,
            mobile: data.mobile,
            address: data.address,
            type: data.type,
            pincode: data.pincode
        }
        return new Promise((res, rej) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(userId) },
                    {
                        $push: { address: address }
                    }
                ).then((response) => {
                    res(response)
                })
        })

    },
    generateRazorpay: (orderId, total) => {
        return new Promise((res, rej) => {
            var options = {
                amount: total * 100,
                currency: 'INR',
                receipt: '' + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {

                    res(order)
                }
            })
        })
    },
    verifyPayment: (details) => {
        return new Promise(async (res, rej) => {
            const {
                createHmac
            } = await import('crypto');
            let hmac = createHmac('sha256', 'K83L9clYzmjnYYtnOfRZWl5N');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                console.log('suucc inside');
                res()
            } else {
                rej()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((res, rej) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed',
                        cancelled: false
                    }
                }
            ).then(() => {
                res()
            })
        })
    },
    checkCouponOffer: (code, userId) => {
        return new Promise(async (resolve, reject) => {
            let couponExist = await db.get().collection(collection.COUPON_OFFER).findOne({ Coupon: code })
            if (couponExist) {

                let isUsed = await db.get().collection(collection.COUPON_OFFER).findOne(
                    {
                        Coupon: code,
                        Users: {
                            $elemMatch: {
                                userId: objectId(userId)
                            }
                        }
                    })

                if (isUsed) {

                    resolve({ isUsed: true })
                }
                else {
                    resolve({ status: true, couponExist })
                }

            }
            else {
                resolve({ status: false })
            }
        })
    },
    checkReferal: (referal) => {
        return new Promise(async (res, rej) => {
          let refer = await db.get().collection(collection.USER_COLLECTION).find({ refer: referal }).toArray();
          if(refer){
              res(refer)
          }else{
              res(err)
          }
        });
      },
      applyWallet:(val,userId)=>{
        let value=parseInt(val)
        console.log(val);
      return new Promise((res,rej)=>{
          db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{ $inc: { wallet: -value }}).then((response)=>{
              res(response)
      })
      }) 
  },
  clearCart: (id)=>{
      console.log('ccxcvax',id);
    return new Promise((res,rej)=>{
    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(id) }).then((response)=>{
        res(response)
    })
    })
  },
  relatedDetails: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      let category = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: categoryId })
        .toArray();
      resolve(category);
    });
  },
  getOneUser: (id)=>{
      return new Promise(async (resolve,reject)=>{
          let user = await
           db.get().collection(collection.USER_COLLECTION)
           .findOne({_id: objectId(id)})
           resolve(user)
      })
  }

}