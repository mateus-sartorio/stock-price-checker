'use strict';

require('dotenv').config();

console.log("what")

module.exports = function (app, dbClient) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      console.log("got here");

      try {
        const { stock, like } = req.query;

        const response = await fetch(`${process.env.FREECODECAMP_API_BASE_URL}/v1/stock/${stock}/quote`);
        const data = await response.json();

        const responsePayload = {
          stockData: {
            stock,
            price: data.latestPrice,
            likes: 0
          }
        };

        res.json(responsePayload);
      }
      catch(e) {
        console.log("error: ", e);
      }
    });
};