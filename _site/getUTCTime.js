let moment = require('moment');
let data = new Date();
let utc = moment.utc(data).local().format();
console.log(utc);