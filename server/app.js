'use strict';
require('app-module-path').addPath(__dirname);
const express = require('express');
const bunyan = require('bunyan');
const fs = require('fs');
const app = express();
const port = 3189;
const logger = bunyan.createLogger({name: 'gmail-tracker'});
app.set('trust proxy');
const processMessage = (req, res, next) => {
  const { id } = req.query;    
  try {
    let messages = JSON.parse(fs.readFileSync(`${__dirname}/data/messages.json`, 'utf8'));
    let count = messages[id] || 0;
    messages[id] = count+1;
    fs.writeFileSync(`${__dirname}/data/messages.json`, JSON.stringify(messages), 'utf8');
    return next();
  }
  catch (e) { next(e) }
}
app.use('/img', processMessage, express.static(`${__dirname}/img.jpg`));
app.use('/stats', express.static(`${__dirname}/data/messages.json`));
app.listen(port);
logger.info(`Gmail tracking server running on port ${port}`);