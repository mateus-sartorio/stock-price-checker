const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  before(function (done) {
    this.timeout(0);

    chai
    .request(server)
    .keepOpen()
    .post('/api/clear/')
    .set('x-forwarded-for', 'test')
    .end(() => {
      done();
    })
  });

  after(function (done) {
    this.timeout(0);

    chai
    .request(server)
    .keepOpen()
    .post('/api/clear/')
    .set('x-forwarded-for', 'test')
    .end(() => {
      done();
    })
  });

  test("Viewing one stock: GET request to /api/stock-prices/", function (done) {
    const input = {
      stock: "GOOG",
      like: false,
    };
    
    chai
      .request(server)
      .keepOpen()
      .get(`/api/stock-prices/?stock=${input.stock}&like=${input.like}`)
      .set('x-forwarded-for', 'test')
      .end((_err, res) => {
        assert.equal(res.status, 200);

        const output = res.body;

        assert.property(output.stockData, 'stock');
        assert.strictEqual(output.stockData.stock, 'GOOG');

        assert.property(output.stockData, 'price');
        assert.isTrue(Number.isFinite(output.stockData.price));
        assert.isTrue(output.stockData.price >= 0);

        assert.property(output.stockData, 'likes');
        assert.isTrue(output.stockData.likes === 0);

        done();
      });
  });

  test("Viewing one stock and liking it: GET request to /api/stock-prices/", function (done) {
    const input = {
      stock: "GOOG",
      like: true,
    };
    
    chai
      .request(server)
      .keepOpen()
      .get(`/api/stock-prices/?stock=${input.stock}&like=${input.like}`)
      .set('x-forwarded-for', 'test')
      .end((_err, res) => {
        assert.equal(res.status, 200);

        const output = res.body;

        assert.property(output.stockData, 'stock');
        assert.strictEqual(output.stockData.stock, 'GOOG');

        assert.property(output.stockData, 'price');
        assert.isTrue(Number.isFinite(output.stockData.price));
        assert.isTrue(output.stockData.price >= 0);

        assert.property(output.stockData, 'likes');
        assert.isTrue(output.stockData.likes === 1);

        done();
      });
  });

  test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", function (done) {
    const input = {
      stock: "MSFT",
      like: true,
    };
    
    chai
      .request(server)
      .keepOpen()
      .get(`/api/stock-prices/?stock=${input.stock}&like=${input.like}`)
      .set('x-forwarded-for', 'test')
      .end((_err, res) => {
        assert.equal(res.status, 200);

        const output = res.body;

        assert.property(output.stockData, 'stock');
        assert.strictEqual(output.stockData.stock, input.stock);

        assert.property(output.stockData, 'price');
        assert.isTrue(Number.isFinite(output.stockData.price));
        assert.isTrue(output.stockData.price >= 0);

        assert.property(output.stockData, 'likes');
        assert.isTrue(output.stockData.likes === 1);
        
        chai
          .request(server)
          .keepOpen()
          .get(`/api/stock-prices/?stock=${input.stock}&like=${input.like}`)
          .set('x-forwarded-for', 'test')
          .end((_err, res) => {
            assert.equal(res.status, 200);

            const output = res.body;

            assert.property(output.stockData, 'stock');
            assert.strictEqual(output.stockData.stock, input.stock);

            assert.property(output.stockData, 'price');
            assert.isTrue(Number.isFinite(output.stockData.price));
            assert.isTrue(output.stockData.price >= 0);

            assert.property(output.stockData, 'likes');
            assert.isTrue(output.stockData.likes === 1);

            done();
          });
      });
  });

  test("Viewing one stock: GET request to /api/stock-prices/", function (done) {
    const input = {
      stock1: "GOOG",
      stock2: "AAPL",
      like: false,
    };
    
    chai
      .request(server)
      .keepOpen()
      .get(`/api/stock-prices/?stock=${input.stock1}&stock=${input.stock2}&like=${input.like}`)
      .set('x-forwarded-for', 'test')
      .end((_err, res) => {
        assert.equal(res.status, 200);

        const output = res.body;

        assert.property(output, 'stockData');
        assert.isArray(output.stockData);

        // Stock 1
        const stock1 = output.stockData[0];

        assert.isObject(stock1);

        assert.property(stock1, 'stock');
        assert.strictEqual(stock1.stock, input.stock1);

        assert.property(stock1, 'price');
        assert.isTrue(Number.isFinite(stock1.price));
        assert.isTrue(stock1.price >= 0);

        assert.property(stock1, 'rel_likes');
        assert.isTrue(stock1.rel_likes === 1);

        // Stock 2
        const stock2 = output.stockData[1];

        assert.isObject(stock2);

        assert.property(stock2, 'stock');
        assert.strictEqual(stock2.stock, input.stock2);

        assert.property(stock2, 'price');
        assert.isTrue(Number.isFinite(stock2.price));
        assert.isTrue(stock2.price >= 0);

        assert.property(stock2, 'rel_likes');
        assert.isTrue(stock2.rel_likes === -1);

        done();
      });
  });

  test("Viewing two stocks and liking them: GET request to /api/stock-prices/", function (done) {
    const input = {
      stock1: "GOOG",
      stock2: "AAPL",
      like: true,
    };
    
    chai
      .request(server)
      .keepOpen()
      .get(`/api/stock-prices/?stock=${input.stock1}&stock=${input.stock2}&like=${input.like}`)
      .set('x-forwarded-for', 'test')
      .end((_err, res) => {
        assert.equal(res.status, 200);

        const output = res.body;

        assert.property(output, 'stockData');
        assert.isArray(output.stockData);

        // Stock 1
        const stock1 = output.stockData[0];

        assert.isObject(stock1);

        assert.property(stock1, 'stock');
        assert.strictEqual(stock1.stock, input.stock1);

        assert.property(stock1, 'price');
        assert.isTrue(Number.isFinite(stock1.price));
        assert.isTrue(stock1.price >= 0);

        assert.property(stock1, 'rel_likes');
        assert.isTrue(stock1.rel_likes === 0);

        // Stock 2
        const stock2 = output.stockData[1];

        assert.isObject(stock2);

        assert.property(stock2, 'stock');
        assert.strictEqual(stock2.stock, input.stock2);

        assert.property(stock2, 'price');
        assert.isTrue(Number.isFinite(stock2.price));
        assert.isTrue(stock2.price >= 0);

        assert.property(stock2, 'rel_likes');
        assert.isTrue(stock2.rel_likes === 0);

        done();
      });
  });
});
