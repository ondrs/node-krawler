# node Krawler [![Build Status](https://travis-ci.org/ondrs/node-krawler.png?branch=master)](https://travis-ci.org/ondrs/node-krawler)

Fast and lightweight promise/event based web crawler with built-in cheerio, xml and json parser.
And of course ... the best :)

## How to install
```
npm install krawler
```

## Basic example

```javascript
var urls = [
    'http://ondraplsek.cz'
];

var crawler = new Krawler;

crawler
    .queue(urls)
    .on('data', function($, url, response) {
        // $ - cheerio instance
        // url of the current webpage
        // response object from mikeal/request
    })
    .on('err', function(err, url) {
        // there has been an 'err' on 'url'
    })
    .on('end', function() {
        // all URLs has been fetched
    });
```


## Options

Krawler provides following API:

```javascript
var crawler = new Krawler({
    maxConnections: 10, // number of max simultaneously opened connections, default 10
    parser: 'cheerio',  // web page parser, default 'cheerio'
                        // another options are xml, json or false (no parser will be used, raw data will be returned)
    forceUTF8: false,   // if Krawler should convert source string to utf8, default false
});
```

mikeal/request is used for fetching web pages so any desired option from this package can be passed to Krawler's constructor.

## Advanced Example

```javascript
var urls = [
    'https://graph.facebook.com/nodejs',
    'https://graph.facebook.com/facebook',
    'https://graph.facebook.com/cocacola',
    'https://graph.facebook.com/google',
    'https://graph.facebook.com/microsoft',
];

var crawler = new Krawler({
    maxConnections: 5,
    parser: 'json',
    forceUTF8: true
});

crawler
    .on('data', function(json, url, response) {
        // do something with json...
    })
    .on('err', function(err, url) {
        // there has been an 'err' on 'url'
    })
    .on('end', function() {
        // all URLs has been fetched
    });
```


## Promises

If your program flow is based on promises you can easily attach Krawler to your promise chain.
Method fetchUrl() returns a Q.promise. When the promise is full filled, callback function is called with a result object.

Object has two properties

* data - parsed/raw content of the web page base on parser setting
* response - response object from mikeal/request


```javascript
var crawler = new Krawler;

findUrl()
.then(function(url) {
    return crawler.fetchUrl(url);
})
.then(function(result) {
    // in this case result.data in a cheerio instance
    return processData(result.data);
})
// and so on ...

