const { log } = require('debug/src/browser');
var db = require('../config/connection')
var collection = require('../config/collections');
const async = require('hbs/lib/async');
var objectId = require('mongodb').ObjectId
const moment = require('moment')

module.exports = {
  addProduct: (product, callback) => {
    console.log(product);
    db.get().collection('product').insertOne(product).then((data) => {
      callback(data.insertedId)
    })
  },
  getAllProducts: () => {
    return new Promise(async (res, rej) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      res(products)
    })
  },
  deleteProduct: (proId) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then((response) => {
        console.log(response);
        res(response)
      })
    })
  },
  getProductDetails: (proId) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
        res(product)
      })
    })
  },
  getAllusers: () => {
    return new Promise(async (res, rej) => {
      let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
      res(users)
    })
  },
  getUserDetails: (userId) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
        res(user)
      })
    })
  },
  deleteUser: (userId) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: objectId(userId) }).then((response) => {
        res(response)
      })
    })
  },
  updateProduct: (proId, proDetails) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.PRODUCT_COLLECTION)
        .updateOne({ _id: objectId(proId) }, {
          $set: {
            Name: proDetails.Name,
            Description: proDetails.Description,
            Price: proDetails.Price,
            Category: proDetails.Category
          }
        }).then((response) => {
          res(response)
        })
    })
  },
  updateUser: (userId, userDetails) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.USER_COLLECTION)
        .updateOne({ _id: objectId(userId) }, {
          $set: {
            Name: userDetails.Name,
            Emailaddress: userDetails.Emailaddress
          }
        }).then((response) => {
          res(response)
        })
    })
  },
  getAllCategory: () => {
    return new Promise(async (res, rej) => {
      let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
      res(category)
    })
  },
  addCategory: (category) => {
    console.log(category);
    return new Promise((res, rej) => {
      db.get().collection('category').insertOne(category).then((data) => {

        res(data.insertedId)
      })
    })
  },
  deleteCategory: (catId) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {
        console.log(response);
        res(response)
      })
    })
  },

  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: objectId(userId) }, { $set: { userBlocked: true } })
        .then((data) => {
          resolve(data);
        });
    });
  },


  unblockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: objectId(userId) }, { $set: { userBlocked: false } })
        .then((data) => {
          resolve(data);
        });
    });
  },
  getCategoryDetails: (catId) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(catId) }).then((cat) => {
        res(cat)
      })
    })
  },
  updateCategory: (catId, catDetails) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.CATEGORY_COLLECTION)
        .updateOne({ _id: objectId(catId) }, {
          $set: {
            Category: catDetails.Category,
          }
        }).then((response) => {
          res(response)
        })
    })
  },
  getCatWise: (data) => {
    return new Promise(async (res, rej) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: data }).toArray()
      res(products, data)
    })

  },
  viewOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION).find({}).sort({ 'Date': -1 }).toArray()
      resolve(orders)
    })
  },
  changeStatus: (status, orderId) => {
    return new Promise(async (resolve, reject) => {
      if (status == 'Cancelled') {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
          {
            $set: {
              status: status,
              cancelled: true,
              delivered: false
            }
          })
      } else if (status == 'Delivered') {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
          {
            $set: {
              status: status,
              cancelled: false,
              delivered: true
            }
          })
      } else {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
          {
            $set: {
              status: status
            }
          }).then((response) => {
            resolve(true)
          })
      }

    })

  },
  getdailySales: () => {
    return new Promise(async (resolve, reject) => {
      let dailySale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": "Delivered"
          }
        },
        {
          $unwind: "$products"
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalAmount: { $sum: "$products.totalAmount" },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: -1 }
        },
        {
          $limit: 7
        }
      ]).toArray()
      resolve(dailySale)
    })
  },
  addProductOffer: (data) => {
    return new Promise(async (resolve, reject) => {
      data.discount = parseInt(data.discount)
      discount = parseInt(data.discount)
      data.startDate = new Date(data.startDate)
      data.expiryDate = new Date(data.expiryDate)
      

      let offerExist = await db.get().collection(collection.PRODUCT_OFFER).findOne({ "data.offerProduct": data.offerProduct })
      if (offerExist) {
        await db.get().collection(collection.PRODUCT_OFFER).updateOne({ "data.offerProduct": data.offerProduct }, {
          $set: {
            "data.discount": data.discount,
            "data.startDate": data.startDate,
            "data.expiryDate": data.expiryDate,
          }
        })
      }
      else {
        await db.get().collection(collection.PRODUCT_OFFER).insertOne({ data })
      }

      let products = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
        {
          $match: { Name: data.offerProduct }
        }
      ]).toArray()


      await products.map(async (product) => {
        let productPrice = product.Price
        productPrice = parseInt(productPrice)
        let discountPrice = productPrice - ((productPrice * discount) / 100)
        discountPrice = parseInt(discountPrice.toFixed(2))

        let proId = product._id
        await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
          {
            _id: proId,
          },
          {
            $set: {
              Price: discountPrice
            }
          })
      })
      resolve({ status: true })

    })
  },
  getProductOffer: () => {
    return new Promise(async (resolve, reject) => {
      let offerList = await db.get().collection(collection.PRODUCT_OFFER).aggregate([
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "data.offerProduct",
            foreignField: "Name",
            as: "products"
          }
        },
        {
          $unwind: "$products"
        },
        {
          $project: {
            offerProduct: "$data.offerProduct",
            discount: "$data.discount",
            startDate: "$data.startDate",
            expiryDate: "$data.expiryDate",
            offerPrice: "$products.Price",
            productPrice: "$products.originalPrice",
            productId: "$products._id"
          }
        }
      ]).toArray()

      resolve(offerList)
    })
  },
  deleteProductOffer: (offerProId, offerId, origPrice) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
        {
          _id: objectId(offerProId)
        },
        {
          $set: {
            Price: origPrice
          }
        }).then((resp) => {
          db.get().collection(collection.PRODUCT_OFFER).deleteOne({ _id: objectId(offerId) })
        })
      resolve()
    })
  },
  currentDaySale: () => {
    return new Promise(async (res, rej) => {
      let curDate = new Date
      let date = moment(curDate).format('YYYY/MM/DD').toString()
      // curDate = curDate.toISOString().split('T')[0]
      let todaySale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": "Delivered"
          }
        },
        {
          $project: {
            Date:1, totalAmount: 1
          }
        },
        {
          $match: { Date: date }
        },
        {
          $group: {
            _id: "$Date",
            total: { $sum: '$totalAmount' }
          }
        }
      ]).toArray()
      let data = 0;

      todaySale.map(val => data = val.total)
      res(data)
    })
  },
  yearlySale: () => {
    let d = new Date
    let currentYear = d.getFullYear();
    currentYear = currentYear + ''
    return new Promise(async (res, rej) => {
      let yearlySale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": "Delivered"
          }
        },
        {
          $project: {
            date: { $dateToString: { format: "%Y", date: "$date" } }, totalAmount: 1
          }
        },
        {
          $group: {
            _id: "$date",
            total: { $sum: '$totalAmount' }
          }
        }
      ]).toArray()
      res(yearlySale)
    })
  },
  getTotalUsers: () => {
    return new Promise(async (resolve, reject) => {
      let totalUsers = await db.get().collection(collection.USER_COLLECTION).find({}).count()
      resolve(totalUsers)
    })
  },
  getTopSelling: () => {
    return new Promise(async (resolve, reject) => {
      let topSelling = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $unwind: "$products"
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
            subTotal: "$products.totalAmount"
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "products"
          }
        },
        {
          $unwind: "$products"
        },
        {
          $project: {
            quantity: 1,
            products: "$products",
            productName: "$products.Name"
          }
        },
        {
          $group: {
            _id: "$productName",
            totalQty: { $sum: "$quantity" },
          }
        },
        {
          $sort: { totalQty: -1 }
        },
        {
          $limit: 5
        }
      ]).toArray()
      resolve(topSelling)
    })
  },
  checkOfferExpiry: (date) => {
    console.log('today', date);
    return new Promise(async (resolve, reject) => {
      // let offerExist = await db.get().collection(collection.PRODUCT_OFFER).find({
      //   "data.expiryDate": {
      //     $lte: date
      //   },
      // }).toArray()
      // console.log(offerExist);
      // if (offerExist) {
      //   offerExist.map(async (data) => {
      //     await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
      //       {
      //         'Name': data.data.offerProduct
      //       },
      //       {
      //         $set: {
      //           Price: ''
      //         }
      //       }).then((resp) => {
      //         db.get().collection(collection.PRODUCT_OFFER).deleteMany({
      //           "data.expiryDate": {
      //             $lte: date
      //           }
      //         })
      //       })
      //   })
      // }

      await db.get().collection(collection.COUPON_OFFER).deleteMany({
        "endDateIso": {
          $lte: date
        }
      })

      resolve(true)
    })
  },
  addCategoryOffer: (data) => {
    return new Promise(async (resolve, reject) => {
      discount = parseInt(data.discount)
      data.startDate = new Date(data.startDate)
      data.expiryDate = new Date(data.expiryDate)

      let offerExist = await db.get().collection(collection.CATEGORY_OFFER).findOne({ "data.offerCategory": data.offerCategory })
      console.log(data);
      if (offerExist) {
        await db.get().collection(collection.CATEGORY_OFFER).updateOne({ "data.offerCategory": data.offerCategory }, {
          $set: {
            "data.discount": data.discount,
            "data.startDate": data.startDate,
            "data.expiryDate": data.expiryDate,
          }
        })
      }
      else {
        await db.get().collection(collection.CATEGORY_OFFER).insertOne({ data })
      }
      resolve({ status: true })
    })
  },
  getCategoryOffer: () => {
    return new Promise(async (resolve, reject) => {
      let offerList = await db.get().collection(collection.CATEGORY_OFFER).find({}).toArray()

      resolve(offerList)
    })
  },
  startCategoryOffer: (date) => {
    let catStartDateIso = new Date(date);
    return new Promise(async (res, rej) => {
      let data = await db.get().collection(collection.CATEGORY_OFFER).find({ 'data.startDate': { $lte: catStartDateIso } }).toArray();
      console.log('datedata', data);
      if (data.length > 0) {
        await data.map(async (onedata) => {
          console.log('sa', onedata);
          let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: onedata.data.offerCategory, offer: { $exists: false } }).toArray();
          console.log(products);
          await products.map(async (product) => {
            let actualPrice = product.Price
            let newPrice = (((product.Price) * (onedata.data.discount)) / 100)
            newPrice = newPrice.toFixed()
            console.log(actualPrice, newPrice, onedata.data.catOfferPercentage);
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) },
              {
                $set: {
                  actualPrice: actualPrice,
                  Price: (actualPrice - newPrice),
                  offer: true,
                  catOfferPercentage: onedata.data.catOfferPercentage
                }
              })
          })
        })
        res();
      } else {
        res()
      }

    })

  },
  deleteCategoryOffer: (id) => {
    console.log(id);
    return new Promise(async (res, rej) => {
      let categoryOffer = await db.get().collection(collection.CATEGORY_OFFER).findOne({ _id: objectId(id) })
      let catName = categoryOffer.data.offerCategory
      console.log(categoryOffer);
      console.log(catName);
      let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: catName }, { offer: { $exists: true } }).toArray()
      if (product) {
        db.get().collection(collection.CATEGORY_OFFER).deleteOne({ _id: objectId(id) }).then(async () => {
          await product.map((product) => {
            console.log(product);
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) }, {
              $set: {
                Price: product.originalPrice
              },
              $unset: {
                offer: "",
                catOfferPercentage: '',
                actualPrice: ''
              }
            }).then(() => {
              res()
            })
          })
        })
      } else {
        res()
      }

    })

  },
  addCoupon: (data) => {
    return new Promise(async (res, rej) => {
      // let startDateIso = new Date(data.Starting)
      let endDateIso = new Date(data.Expiry)
      let expiry = await moment(data.Expiry).format('YYYY-MM-DD')
      // let starting = await moment(data.Starting).format('YYYY-MM-DD')
      let dataobj = {
        Coupon: data.Coupon,
        couponCategory: data.couponCategory,
        Offer: parseInt(data.Offer),
        // Starting: starting,
        Expiry: expiry,
        // startDateIso: startDateIso,
        endDateIso: endDateIso,
        Users: []
      }
      console.log(dataobj);
      db.get().collection(collection.COUPON_OFFER).insertOne(dataobj).then(() => {
        res()
      }).catch((err) => {
        res(err)
      })

    })
  },
  getAllCoupons: () => {
    return new Promise((res, rej) => {
      let coupons = db.get().collection(collection.COUPON_OFFER).find().toArray()
      res(coupons)
    })

  },
  deleteCoupon: (id) => {
    return new Promise((res, rej) => {
      db.get().collection(collection.COUPON_OFFER).deleteOne({ _id: objectId(id) }).then(() => {
        res()
      })
    })

  },
  monthlyReport: () => {
    return new Promise(async (res, rej) => {
      let today = new Date()
      let end = moment(today).format('YYYY/MM/DD')
      let start = moment(end).subtract(30, 'days').format('YYYY/MM/DD')
      let orderSuccess = await db.get().collection(collection.ORDER_COLLECTION).find({ Date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } }).toArray()
      
      let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({ Date: { $gte: start, $lte: end } }).toArray()
      let orderSuccessLength = orderSuccess.length
      let orderTotalLength = orderTotal.length
      let orderFailLength = orderTotalLength - orderSuccessLength
      let total = 0;
      let paypal = 0;
      let razorpay = 0;
      let cod = 0;
      for (let i = 0; i < orderSuccessLength; i++) {
        total = total + orderSuccess[i].totalAmount;
        if(orderSuccess[i].paymentMethod=='paypal'){
          paypal++;
      }else if(orderSuccess[i].paymentMethod=='razorpay'){
          razorpay++;
      }else if(orderSuccess[i].paymentMethod=='COD'){
          cod++;
      }
      }
      var data = {
        start: start,
        end: end,
        totalOrders: orderTotalLength,
        successOrders: orderSuccessLength,
        failedOrders: orderFailLength,
        totalSales: total,
        cod: cod,
        paypal: paypal,
        razorpay: razorpay,
        currentOrders: orderSuccess
      }
      // console.log(data);
      res(data)
    })
  },
  getOrderMethodsCount:()=>{
        
    return new Promise(async(resolve,reject)=>{
        
        let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            
            {
                $group:{
                        _id:"$paymentMethod",
                        count:{$sum:1}
                }
            },
            {
                $sort:{_id:1}
            }

        ]).toArray()
        resolve(data)
    })

},
salesReport:(date)=>{
  return new Promise(async(res,rej)=>{
      
      let end= moment(date.EndDate).format('YYYY/MM/DD')
      let start=moment(date.StartDate).format('YYYY/MM/DD')

      let orderSuccess= await db.get().collection(collection.ORDER_COLLECTION).find({Date:{$gte:start,$lte:end},status:{ $ne: 'Cancelled' }}).toArray()
      let orderTotal = await db.get().collection(collection.ORDER_COLLECTION).find({Date:{$gte:start,$lte:end}}).toArray()
      let orderSuccessLength = orderSuccess.length
      let orderTotalLength = orderTotal.length
      let orderFailLength = orderTotalLength - orderSuccessLength
      let total=0;
      let paypal=0;
      let razorpay=0;
      let cod=0;
      for(let i=0;i<orderSuccessLength;i++){
          total=total+orderSuccess[i].totalAmount;
          if(orderSuccess[i].paymentMethod=='paypal'){
              paypal++;
          }else if(orderSuccess[i].paymentMethod=='razorpay'){
              razorpay++;
          }else{
              cod++;

          }
      }
      var data = {
         start: start,
         end: end,
         totalOrders: orderTotalLength,
         successOrders: orderSuccessLength,
         failedOrders: orderFailLength,
         totalSales: total,
         cod: cod,
         paypal: paypal,
         razorpay: razorpay,
         currentOrders: orderSuccess
     }
 res(data)
 })

},

}