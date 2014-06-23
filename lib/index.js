var async = require('async'),
  request = require('request'),
  _ = require('underscore'),
  parseString = require('xml2js').parseString;
  cheerio = require('cheerio'),
  util = require('util'),
  events = require('events'),
  Q = require('q'),
  jschardet = require('jschardet'),
  zlib = require('zlib'),
  encoding = require('encoding');

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
 * @type {string}
 * @const
 */
Krawler.prototype.VERSION = '0.3.3';

/**
 *
 * @type {Object}
 * @private
 */
Krawler.prototype.options_ = {};


/**
 *
 * @param {Array|string} urls
 * @param {Object=} queueOptions
 * @returns {Krawler}
 */
Krawler.prototype.queue = function(urls, queueOptions) {
  var self = this;

  if(queueOptions === undefined) {
    queueOptions = {};
  }

  _.extend({
    customCallback: false
  }, queueOptions);

  if(urls === undefined || !urls.length) {
    if (!_.isObject(urls)) {
      throw new Error('At least one URL must be specified.');
    }
  }

  if( !_.isArray(urls) ) {
    urls = [urls];
  } else {
    urls = _.uniq(urls);
  }

  _.each(urls, function(element) {
    if (_.isObject(element)) {
      if (!_.has(element, 'url')) {
        throw new Error('Objects must contain a url property.');
      }
    }
  });

  async.eachLimit(urls, self.options_.maxConnections, function(url, callback) {
    var queueCallback;

    if(queueOptions.customCallback) {
      queueCallback = callback;
    }

    var promise = self
      .fetchUrl(_.isObject(url) ? url.url : url)
      .then(function(resolved) {
        self.emit('data', resolved.data, url, resolved.response, queueCallback);
      }, function(err) {
        self.emit('error', err, url, queueCallback);
      });

    if(!queueOptions.customCallback) {
      promise.fin(function() {
        callback(); // call callback no mather what
      });
    }

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

  if(!opts.headers['Accept'] && !opts.headers['accept']) {

    switch (self.options_.parser) {
      case 'xml':
        opts.headers['Accept'] = [
          'application/xml',
          'text/xml;q=0.9',
          '*/*;q=0.8'
        ].join(',');
        break;

      case 'json':
        opts.headers['Accept'] = [
          'application/json',
          'application/javascript;q=0.8',
          '*/*;q=0.8'
        ].join(',');
        break;

      default :
        opts.headers['Accept'] = [
          'text/html',
          'application/xhtml+xml',
          'application/xml;q=0.9,image/webp',
          '*/*;q=0.8'
        ].join(',');
      break;
    }
  }


  request(opts, function(err, response, body) {

    if(err) {
      deferred.reject(err);
      return
    }

    if(response.statusCode >= 400 && response.statusCode < 600) {
      deferred.reject('Wrong response code: ' + response.statusCode);
      return;
    }


    if(response.headers['content-encoding'] == 'gzip') {

      self.unzip(body)
        .then(function(data) {
          return self.formatData_(data)
        })
        .then(function(data) {

          deferred.resolve({
            data: data,
            response: response
          });
        })
        .catch(deferred.reject);

    } else {

      self.formatData_(body)
        .then(function(data) {

          deferred.resolve({
            data: data,
            response: response
          });
        })
        .catch(deferred.reject);
    }


  });

  return deferred.promise;
};


/**
 * @param {string} data
 * @returns {Q.promise}
 */
Krawler.prototype.unzip = function(data) {
  var deferred = Q.defer();

  zlib.gunzip(data, function(err, data) {
    if(err) {
      deferred.reject(err);
      return;
    }

    var buffer = new Buffer(data);
    deferred.resolve(buffer.toString());
  });

  return deferred.promise;
};


/**
 *
 * @param {string} data
 * @returns {Q.promise}
 * @private
 */
Krawler.prototype.formatData_ = function(data) {
  var self = this,
    deferred = Q.defer();

  if(self.options_.forceUTF8) {
    data = self.convertToUTF8(data);
  }

  switch (self.options_.parser) {
    case 'cheerio':
      try {
        deferred.resolve(cheerio.load(data));
      } catch (e) {
        deferred.reject(e);
      }
      break;

    case 'json':
      try {
        deferred.resolve(JSON.parse(data));
      } catch (e) {
        deferred.reject(e);
      }
      break;

    case 'xml':
      parseString(data, function (err, xml) {
        if(err) {
          deferred.reject(err);
        } else {
          deferred.resolve(xml);
        }
      });
      break;

    default :
      deferred.resolve(data);
      break;
  }

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
      string = encoding.convert(string, 'utf-8', detected.encoding).toString();
    } else if(typeof string != 'string') {
      string = string.toString();
    }

  } else {
    string = string.toString('utf8'); //hope for the best
  }

  return string;
};


module.exports = Krawler;
