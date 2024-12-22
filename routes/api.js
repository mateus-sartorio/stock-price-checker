'use strict';

require('dotenv').config();

module.exports = function (app, dbClient) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const dbCollection = dbClient.db("information-security").collection("stocks");

      try {
        const { stock, like } = req.query;

        const response = await fetch(`${process.env.FREECODECAMP_API_BASE_URL}/v1/stock/${stock}/quote`);
        
        if(like === 'true') {
          const dbStock = await dbCollection.findOne({
            stock
          });

          if(!dbStock) {
            await dbCollection.insertOne({
              stock,
              likes: 1
            });
          }
          else {
            await dbCollection.updateOne({ stock }, {
              $inc: { likes: 1 }
            })
          }
        }

        const dbStock = await dbCollection.findOne({ stock });
        
        const data = await response.json();

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