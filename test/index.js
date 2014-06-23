var Krawler = require(__dirname + '/../lib/index');
var expect = require('chai').expect;

describe('Krawler tests', function() {

  this.timeout(10000);

  it('should fetch and parse HTML page', function(done) {

    var crawler = new Krawler;

    crawler
      .fetchUrl('http://www.google.com')
      .done(function(result) {
        /** @type {cheerio} */
        var $ = result.data;
        expect($('title').text()).to.be.equal('Google');
        done();
      });
  });

  it('should fetch and parse XML page', function(done) {

    var crawler = new Krawler({
      parser: 'xml'
    });

    crawler
      .fetchUrl('http://www.w3schools.com/xml/note.xml')
      .done(function(result) {
        /** @type {Object} */
        var xml = result.data;
        expect(xml).to.be.instanceOf(Object);
        done();
      });
  });

  it('should fetch and parse JSON page', function(done) {

    var crawler = new Krawler({
      parser: 'json'
    });

    crawler
      .fetchUrl('https://graph.facebook.com/facebook')
      .done(function(result) {
        /** @type {Object} */
        var json = result.data;
        expect(json).to.be.instanceOf(Object);
        done();
      });
  });

  it('should fetch raw page', function(done) {

    var crawler = new Krawler({
      parser: false
    });

    crawler
      .fetchUrl('http://www.google.com')
      .done(function(result) {
        var str = result.data;
        expect(str).to.be.equal(str.toString());
        done();
      });
  });


  it('should fetch several HTML pages in queue', function(done) {

    var urls = [],
      fetched = [],
      crawler = new Krawler;

    for(var i = 0; i < 3; ++i) {
      urls.push('https://www.google.cz/?q=' + i);
    }

    crawler
      .queue(urls)
      .on('data', function(data, url, response) {
        fetched.push(url);
      })
      .on('error', function(err, url) {
        done(err);
      })
      .on('end', function() {
        expect(urls.length).to.be.equal(fetched.length);
        done();
      });

  });


  it('should fetch several HTML pages in queue with custom queue callback', function(done) {

    var urls = [],
      fetched = [],
      queueOptions = {
        customCallback: true
      },
      counter = 0;
      crawler = new Krawler;

    for(var i = 0; i < 3; ++i) {
      urls.push('https://www.google.cz/?q=' + i);
    }


    crawler
      .queue(urls, queueOptions)
      .on('data', function(data, url, response, callback) {
        fetched.push(url);
        setTimeout(function() {
          ++counter;
          callback();
        }, 3000);
      })
      .on('error', function(err, url, callback) {
        done(err);
      })
      .on('end', function() {
        expect(urls.length).to.be.equal(fetched.length);
        expect(urls.length).to.be.equal(counter);
        done();
      });

  });


  it('should fetch single HTML page in queue', function(done) {

    var crawler = new Krawler;
    var resultUrl;

    crawler
      .queue('http://www.google.cz')
      .on('data', function(data, url, response) {
        resultUrl = url;
      })
      .on('error', function(err, url) {
        done(err);
      })
      .on('end', function() {
        expect(resultUrl).to.equal('http://www.google.cz');
        done();
      });

  });


  it('forceutf8 - from latin-1', function(done) {

    var crawler = new Krawler({
      forceUTF8: true
    });

    crawler
      .fetchUrl('http://czyborra.com/charsets/iso8859.html')
      .done(function(result) {
        /** @type {cheerio} */
        var $ = result.data;
        expect($.html()).to.have.string('Jörg');
        done();
      });

  });

  it('should fetch single object with a url property', function(done) {

    var crawler = new Krawler;
    var singleObject = {
      name: 'foo',
      url: 'http://www.google.com'
    }
    var resultObject;

    crawler
      .queue(singleObject)
      .on('data', function(data, url, response) {
        resultObject = url;
      })
      .on('error', function(err, url) {
        done(err);
      })
      .on('end', function() {
        expect(resultObject.name).to.equal('foo');
        done();
      });

  });

  it('should fetch an array of objects with url properties', function(done) {

    var urls = [{
        name: 'foo',
        url: 'http://www.google.com'
      },
      {
        name: 'bar',
        url: 'http://www.google.cz'
      }],
      fetched = [],
      crawler = new Krawler;

    crawler
      .queue(urls)
      .on('data', function(data, url, response) {
        fetched.push(url);
      })
      .on('error', function(err, url) {
        done(err);
      })
      .on('end', function() {
        expect(urls.length).to.equal(fetched.length);
        done();
      });

  });

  it('should fail if objects lacks a url property', function () {
    var crawler = new Krawler;
    var singleObject = {
      name: 'foo'
    };
    expect(function() { crawler.queue(singleObject)}).to.throw(Error);
  });

  it.skip('should get gzipped content', function () {
    // TODO: ...
  });

});

