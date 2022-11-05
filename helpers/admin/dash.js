const { count } = require("../../models/banner_model")
const banner_model = require("../../models/banner_model")
const { aggregate } = require("../../models/order_model")
const order_model = require("../../models/order_model")
const { user_model } = require("../../models/user_model")

module.exports={
    getTotalSales:()=>{
        return new Promise((resolve, reject) => {
            order_model.find({paymentStatus:'Placed'}).count().then((count)=>{
                resolve(count)
            })
        })
    },
    getUserCount:()=>{
        return new Promise((resolve, reject) => {
            user_model.find({isAllowed:'true'}).count().then((count)=>{
                resolve(count)
            })
        })
    }
    ,getSalesAmount:()=>{
        return new Promise((resolve, reject) => {
            order_model.aggregate([
                {
                    $group:{_id:null,total:{$sum:'$totalAmount'}}
                }
            ])
            .then((totalAmount)=>{
                resolve(totalAmount)
            })
        })
    },
    getStatDay: (timestamp) => { 
        return new Promise((resolve, reject) => { 
          timestamp = "$"+timestamp; 
          console.log(timestamp); 
          order_model.aggregate([ 
            { $group: { 
              _id: { 
                $add: [ 
                 { $dayOfYear: "$date"},  
                 { $multiply:  
                   [400, {$year: "$date"}] 
                 } 
              ]},    
              totalAmount: { $sum: "$totalAmount" }, 
              date: {$min: "$date"} 
            } 
          }, 
          { 
            $sort: {date: 1} 
          }, 
          { 
            $limit: 14, 
          } 
          ]).then((data) => { 
            console.log("cghart",data);
            let date =[] 
            let totalAmount =[]
            data.forEach((item) => { 
              date.push(item.date.toDateString()) 
              totalAmount.push(item.totalAmount) 
            }) 
            data = {date : date, totalAmount: totalAmount} 
            console.log(data) 
            resolve(data); 
          }) 
        })
    },
    getStatWeekly: (timestamp) => { 
      return new Promise((resolve, reject) => { 
        timestamp = "$"+timestamp; 
        order_model.aggregate([ 
          { $group: { 
            _id: { 
              $add: [ 
               { $week: "$date"},  
               { $multiply:  
                 [400, {$year: "$date"}] 
               } 
            ]},    
            totalAmount: { $sum: "$totalAmount" }, 
            date: {$min: "$date"} 
          } 
        }, 
        { 
          $sort: {date: 1} 
        }, 
        { 
          $limit: 14, 
        } 
        ]).then((data) => { 
          let date =[] 
          let totalAmount =[] 
          data.forEach((item) => { 
            date.push(item.date.toDateString()) 
            totalAmount.push(item.totalAmount) 
          }) 
          data = {date : date, totalAmount: totalAmount} 
          console.log(data) 
          resolve(data); 
        }) 
      })
  },
  getStatmonth: (timestamp) => { 
    return new Promise((resolve, reject) => { 
      timestamp = "$"+timestamp; 
      order_model.aggregate([ 
        { $group: { 
          _id: { 
            $add: [ 
             { $week: "$date"},  
             { $multiply:  
               [400, {$year: "$date"}] 
             } 
          ]},    
          totalAmount: { $sum: "$totalAmount" }, 
          date: {$min: "$date"} 
        } 
      }, 
      { 
        $sort: {date: 1} 
      }, 
      { 
        $limit: 14, 
      } 
      ]).then((data) => { 
        let date =[] 
        let totalAmount =[] 
        data.forEach((item) => { 
          date.push(item.date.toDateString()) 
          totalAmount.push(item.totalAmount) 
        }) 
        data = {date : date, totalAmount: totalAmount} 
        console.log(data) 
        resolve(data); 
      }) 
    })
  },
  getSalesMode: () => { 
    return new Promise((resolve, reject) => { 
      order_model.aggregate([ 
        { $group: { 
          _id: "$paymentMethod",    
          totalAmount: { $sum: "$totalAmount" },
        } 
      }, 
      { 
        $sort: {date: 1} 
      }, 
      { 
        $limit: 14, 
      } 
      ]).then((data) => { 
        let paymentMethod =[] 
        let totalAmount =[] 
        data.forEach((item) => { 
          paymentMethod.push(item._id) 
          totalAmount.push(item.totalAmount) 
        }) 
        data = {paymentMethod : paymentMethod, totalAmount: totalAmount} 
        console.log(data) 
        console.log(data) 
        resolve(data); 
      }) 
    })
  },
  getSalesStatus: () => { 
    return new Promise((resolve, reject) => { 
      order_model.aggregate([ 
        { $group: { 
          _id: "$orderStatus",    
          count: { $count:{}},
        } 
      }, 
      { 
        $sort: {date: 1} 
      }, 
      { 
        $limit: 14, 
      } 
      ]).then((data) => { 
        let orderStatus =[] 
        let count =[] 
        data.forEach((item) => { 
          orderStatus.push(item._id) 
          count.push(item.count) 
        }) 
        data = {orderStatus : orderStatus, count: count} 
        console.log(data) 
        console.log(data) 
        resolve(data); 
      }) 
    })
  },
}