# REQUEST-SLIM

Extremely lite request lib without any dependencies ! ONLY FOR SIMPLE REQUEST FUNCTIONS !

## Usage

### For Node
```javascript
require('request-slim')
import Request from 'requset-slim';
```

### For Browser
```javascript
require('request-slim/dist/request-broswer');
import Request from 'request-slim/dist/request-broswer';
```

### Usage

```javascript
const Request = require('request-slim');

// create a request object
const request = new Request({
    /**
     * common header fields.
     */
    headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.108 Safari/537.36',
    },
    /**
     *  default response data type for all request 
     */
    dataType: 'application/json',
    /**
     *  default request data type for all requst.
     */
    type: 'application/json',
    /**
     * common request paramas.
     */
    options: {
    },
});

// GET request
await request.request({
    /**
     * method, default to 'GET'.
     */
    method: 'GET',
    url: 'https://www.google.com',
    /**
     * query params for GET request.
     */
    data: {
        a: 123,
    },
    headers: {
        'HOST': 'www.google.com',
    },
    /**
     * request content type
     */
    type: 'form' || 'json' || 'text' || 'application/json',
    /**
     * response content type
     */
    dataType: 'form' || 'json' || 'text' || 'application/json',
}).then(() => {/* ... */});


// POST request
request.request({
    method: 'POST',
    url: 'https://www.google.com',
    /**
     * body data for POST request.
     */
    data: {
        a: 123,
    },
});
```
