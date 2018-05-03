'use strict';
//This file is used by Docker during execution.
//His job is to replace constants by environments variables.

let fs = require('fs');
let fileName = 'app.js';
let path = process.env.BASE_NGINX + '/' + process.env.APP + '/' + fileName;

let file = fs.readFileSync(path, 'utf8');

let apiUrl = process.env.SERVER_URL ? process.env.SERVER_URL : 'http://localhost:1337/franz-manager-api';

file = file.replace(/%SERVER_URL%/g, apiUrl);

fs.writeFileSync(path, file, 'utf8');
