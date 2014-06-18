# node Krawler [![Build Status](https://travis-ci.org/ondrs/node-krawler.png?branch=master)](https://travis-ci.org/ondrs/node-krawler)

Fast and lightweight promise/event based web krawler with built-in cheerio, xml and json parser.
And of course ... the best :)

## How to install
```
npm install krawler
```

## Basic example

```javascript
var Krawler = require('krawler')

var urls = [
    'http://ondraplsek.cz'
];

var krawler = new Krawler;

krawler
    .queue(urls)
    .on('data', function($, url, response) {
        // $ - cheerio instance
        // url of the current webpage
        // response object from mikeal/request
    })
    .on('error', function(err, url) {
        // there has been an 'error' on 'url'
    })
    .on('end', function() {
        // all URLs has been fetched
    });
```


## Options

Krawler provides following API:

```javascript
var krawler = new Krawler({
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

var krawler = new Krawler({
    maxConnections: 5,
    parser: 'json',
    forceUTF8: true
});

krawler
    .queue(urls)
    .on('data', function(json, url, response) {
        // do something with json...
    })
    .on('error', function(err, url) {
        // there has been an 'error' on 'url'
    })
    .on('end', function() {
        // all URLs has been fetched
    });
```


## Queue options

After Krawler emits the 'data' event, it automatically continues to a next url address. It does not care if the result was processed or not.
If you would like to have a full control over the result handling, you can turn on the custom callback option.
Then you can control the program flow by invoking your callback. Don't forget to call it in every case, otherwise the queue will stuck.

var queueOptions = {
    customCallback: true
};

krawler
    .queue(urls, queueOptions)
    .on('data', function($, url, response, callback) {

        // expensive operation
        downloadAllInternet
            .then(function() {
                // ...
            })
            .fin(callback); // always call the callback
    })
    .on('error', function(err, url, callback) {
        // there has been an 'error' on 'url'
        callback();
    })
    .on('end', function() {
        // all URLs has been fetched
    });
```

## Objects Example

Instead of pure strings or an array of strings, one can also pass an object or
an array of objects who each have the url as a property named 'url'. This enables you to access the properties of the url object later in the process. Example:

```javascript
var Krawler = require('krawler')

var urls = [
    { name: 'SomeSite', url: 'http://ondraplsek.cz' }
];

var krawler = new Krawler;

krawler
    .queue(urls)
    .on('data', function($, url, response) {
        // $ - cheerio instance
        // url - the object which also contains the url property
        // response - object from mikeal/request
        // you can access object properties here, e.g. url.name = 'SomeSite'
    })
    .on('error', function(err, url) {
        // there has been an 'error' on 'url'
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
var krawler = new Krawler;

findUrl()
.then(function(url) {
    return krawler.fetchUrl(url);
})
.then(function(result) {
    // in this case result.data in a cheerio instance
    return processData(result.data);
})
// and so on ...
```

