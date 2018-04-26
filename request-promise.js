const rp = require('request-promise-native');

rp('http://localhost:8080/api-docs')
    .then(function (htmlString) {
        console.log(htmlString);
    })
    .catch(function (err) {
        console.error(err);
    });