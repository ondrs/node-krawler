# node Krawler

## How to install
```
npm install krawler
```

## Basic example

```javascript
var crawler = new Krawler;

crawler
    .queue('http://ondraplsek.cz')
    .on('data', function($, url, response) {

        // $ - cheerio instance
        // url of the current webpage
        // response object from mikeal/request

    })
    .on('err', function(err, url) {
        // there has ben an 'err' on 'url'
    })
    .on('end', function() {
        // all URLs has been fetched
    });
```

Krawler provides three types of built in parses
    - cheerio (default)
    - xml
    - json

```javascript
```

