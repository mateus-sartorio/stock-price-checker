'use strict';

const crypto = require("crypto");

require('dotenv').config();

module.exports = function (app, dbClient) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const stocksCollection = dbClient.db("stock-price-checker").collection("stocks");
      const usersCollection = dbClient.db("stock-price-checker").collection("users");

      try {
        const { stock, like } = req.query;

        const ip = req.header("x-forwarded-for");

        const ipHash = crypto.createHash('md5').update(ip).digest('hex');

        const response = await fetch(`${process.env.FREECODECAMP_API_BASE_URL}/v1/stock/${stock}/quote`);
        const data = await response.json();

        if(data === "Invalid symbol") {
          throw new Error("Invalid symbol");
        }

        let dbUser = await usersCollection.findOne({ ipHash });

        if(!dbUser) {
          await usersCollection.insertOne({
            ipHash,
            likes: []
          });

          dbUser = await usersCollection.findOne({ ipHash });
        }
        
        if(like === 'true' && !dbUser.likes.includes(stock)) {
          const dbStock = await stocksCollection.findOne({ stock });

          if(!dbStock) {
            await stocksCollection.insertOne({
              stock,
              likes: 1
            });
          }
          else {
            await stocksCollection.updateOne({ stock }, {
              $inc: { likes: 1 }
            })
          }

          await usersCollection.updateOne({ ipHash }, {
            $push: { likes: stock }
          });
        }

        const dbStock = await stocksCollection.findOne({ stock });

        const responsePayload = {
          stockData: {
            stock,
            price: data.latestPrice,
            likes: dbStock?.likes ?? 0
          }
        };

        res.json(responsePayload);
      }
      catch(e) {
        console.log("error: ", e);
      }
    });
};