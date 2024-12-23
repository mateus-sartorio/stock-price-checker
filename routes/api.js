'use strict';

const crypto = require("crypto");

require('dotenv').config();

async function getUser(usersCollection, ipHash) {
  let user = await usersCollection.findOne({ ipHash });

  if(!user) {
    await usersCollection.insertOne({
      ipHash,
      likes: []
    });

    user = await usersCollection.findOne({ ipHash });
  }

  return user;
}

async function likeStock(stocksCollection, usersCollection, stock, ipHash) {
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

async function getSinglePriceResponse(stocksCollection, usersCollection, stock, like, ipHash) {
  const response = await fetch(`${process.env.FREECODECAMP_API_BASE_URL}/v1/stock/${stock}/quote`);
  const stockData = await response.json();

  if(stockData === "Invalid symbol") {
    throw new Error("invalid symbol");
  }

  const user = await getUser(usersCollection, ipHash);
  
  if(like && !user.likes.includes(stock)) {
    await likeStock(stocksCollection, usersCollection, stock, ipHash);
  }

  const dbStock = await stocksCollection.findOne({ stock });

  return {
    stockData: {
      stock,
      price: stockData.latestPrice,
      likes: dbStock?.likes ?? 0
    }
  };
}

async function getComparePricesResponse(stocksCollection, usersCollection, stocks, like, ipHash) {
  const responses = await Promise.all(stocks.map(s => fetch(`${process.env.FREECODECAMP_API_BASE_URL}/v1/stock/${s}/quote`)));
  const stocksData = await Promise.all(responses.map(r => r.json()));
  
  if(stocksData.some(sd => sd === "Invalid symbol")) {
    throw new Error("invalid symbol");
  }

  const user = await getUser(usersCollection, ipHash);
  
  if(like) {
    for(const s of stocks) {
      if(!user.likes.includes(s)) {
        await likeStock(stocksCollection, usersCollection, s, ipHash);
      }
    }
  }

  const dbStock1 = await stocksCollection.findOne({ stock: stocks[0] });
  const dbStock2 = await stocksCollection.findOne({ stock: stocks[1] });

  return {
    stockData: [
      {
        stock: stocks[0],
        price: stocksData[0].latestPrice,
        rel_likes: (dbStock1?.likes ?? 0) - (dbStock2?.likes ?? 0)
      },
      {
        stock: stocks[1],
        price: stocksData[1].latestPrice,
        rel_likes: (dbStock2?.likes ?? 0) - (dbStock1?.likes ?? 0)
      }
    ]
  }
}

module.exports = function (app, dbClient) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        const { stock, like } = req.query;

        const ip = req.header("x-forwarded-for");
        const ipHash = crypto.createHash('md5').update(ip).digest('hex');

        const dbName = ip === 'test' ? "stock-price-checker-test" : "stock-price-checker";
          
        const database = dbClient.db(dbName);
      
        const stocksCollection = database.collection("stocks");
        const usersCollection = database.collection("users");

        let responsePayload;
        if(Array.isArray(stock)) {
          const stocks = stock.map(s => s.trim().toUpperCase());
          responsePayload = await getComparePricesResponse(stocksCollection, usersCollection, stocks, like === 'true', ipHash);
        }
        else {
          const parsedStock = stock.trim().toUpperCase();
          responsePayload = await getSinglePriceResponse(stocksCollection, usersCollection, parsedStock, like === 'true', ipHash);
        }

        res.json(responsePayload);
      }
      catch(e) {
        const errorPayload = {
          stockData: {
            error: e.message,
            likes: 0
          }
        };

        res.json(errorPayload);
      }
    });

  app.route('/api/clear').post(async function (req, res) {
    const ip = req.header("x-forwarded-for");

    if(ip === 'test') {
      const dbName = "stock-price-checker-test";
      const database = dbClient.db(dbName);
    
      const stocksCollection = database.collection("stocks");
      const usersCollection = database.collection("users");
      
      stocksCollection.deleteMany();
      usersCollection.deleteMany();

      res.end();
    }
  });
};