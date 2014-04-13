var async = require('async'),
  request = require('request'),
  _ = require('underscore'),
  parseString = require('xml2js').parseString;
  cheerio = require('cheerio'),
  util = require('util'),
  events = require('events'),
  Q = require('q'),
  jschardet = require('jschardet'),
  Iconv = require('iconv').Iconv;

/**
 *
 * @param {Object=} options
 * @constructor
 */
function Krawler(options) {

  events.EventEmitter.call(this);

  if(options === undefined) {
    options = {};
  }

  this.options_ = _.extend({
    maxConnections: 10,
    parser: 'cheerio',
    forceUTF8: false,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Krawler/' + this.VERSION +';)'
    }
  }, options);
}

util.inherits(Krawler, events.EventEmitter);

/**
 *
 * @type {number}
 * @const
 */
Krawler.prototype.VERSION = 0.2.1;

/**
 *
 * @type {Object}
 * @private
 */
Krawler.prototype._options = {};


/**
 *
 * @param {Array|string} urls
 * @returns {Krawler}
 */
Krawler.prototype.queue = function(urls) {
  var self = this;

  if(urls === undefined || !urls.length) {
    throw 'At least one URL must be specified.'
  }

  if( !_.isArray(urls) ) {
    urls = [urls];
  } else {
    urls = _.uniq(urls);
  }

  async.eachLimit(urls, self.options_.maxConnections, function(url, callback) {

    self.fetchUrl(url)
      .then(function(resolved) {
        self.emit('data', resolved.data, url, resolved.response);
      }, function(err) {
        self.emit('error', err, url);
      })
      .fin(function() {
        callback(); // call callback no mather what
      });

  }, function(err) {
    // no error can
    self.emit('end');
  });

  return this;
};


/**
 *
 * @param {string} url
 * @returns {Q.promise}
 */
Krawler.prototype.fetchUrl = function(url) {
  var deferred = Q.defer(),
    self = this;

  var opts = _.extend(self.options_, {url: url});

  if(opts.forceUTF8) {

    if(opts.headers) {
      if (!opts.headers['Accept-Charset'] && !opts.headers['accept-charset']) opts.headers['Accept-Charset'] = 'utf-8;q=0.7,*;q=0.3';
    } else {
      opts.headers = {
        'Accept-Charset': 'utf-8;q=0.7,*;q=0.3'
      };
    }
    if (!opts.encoding) opts.encoding = null;
  }

  request(opts, function(err, response, body) {

    if(err) {
      deferred.reject(err);
    } else if(response.statusCode !== 200) {
      deferred.reject('Wrong response code: ' + response.statusCode);
    } else {

      try {

        var data = body;

        if(self.options_.forceUTF8) {
          data = self.convertToUTF8(data);
        }

        switch (self.options_.parser) {
          case 'cheerio':            
            try {
              deferred.resolve({
                data: cheerio.load(data),
                response: response
              });
            } catch (e) {
              deferred.reject(e);
            }
          break;
          
          case 'json':            
            try {
              deferred.resolve({
                data: JSON.parse(data),
                response: response
              });
            } catch (e) {
              deferred.reject(e);
            }
          break;
          
          case 'xml':
            parseString(data, function (err, xml) {
              if(err) {
                deferred.reject(err);
              } else {
                deferred.resolve({
                  data: xml,
                  response: response
                });
              }              
            });
          break;

          default :
            deferred.resolve({
              data: data,
              response: response
            });
          break;
        }

      } catch (e) {
        deferred.reject(e);
      }

    }
  });

  return deferred.promise;
};


/**
 *
 * @param {string} string
 * @returns {string}
 */
Krawler.prototype.convertToUTF8 = function(string) {

  //TODO check http header or meta equiv?
  var detected = jschardet.detect(string);

  if(detected && detected.encoding) {

    if(detected.encoding != 'utf-8' && detected.encoding != 'ascii') {

      var iconv = new Iconv(detected.encoding, 'UTF-8//TRANSLIT//IGNORE');
      string = iconv.convert(string).toString();

    } else if(typeof string != 'string') {
      string = string.toString();
    }

  } else {
    string = string.toString('utf8'); //hope for the best
  }

  return string;
};


module.exports = Krawler;
