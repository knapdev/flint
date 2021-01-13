'use strict';

// Express
import express from 'express';
let app = express();
import path from 'path';
let __dirname = path.resolve();
app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

import http from 'http';
let server = http.createServer(app);
server.on('error', (err) => {
    console.error(err);
});
let PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
    console.log('Server running...');
});