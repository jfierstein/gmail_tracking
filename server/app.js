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
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  try {
    let messages = JSON.parse(fs.readFileSync(`${__dirname}/data/messages.json`, 'utf8'));
    const now = new Date(Date.now());
    if(messages[id] && messages[id].lastUpdated ) {
      const lastUpdated = new Date(messages[id].lastUpdated);
      const minSinceLast = Math.abs(now - lastUpdated) / 1000;
      if(minSinceLast > 1) {
        messages[id].count += 1;
        if(!messages[id].ips.includes(ip)) messages[id].ips.push(ip);
        messages[id].lastUpdated = now.toISOString();
      }
    }
    else messages[id] = { count: 0, lastUpdated: now.toISOString(), ips: [ip] }
    fs.writeFileSync(`${__dirname}/data/messages.json`, JSON.stringify(messages), 'utf8');
    return next();
  }
  catch (e) { next(e) }
}
app.use('/img', processMessage, express.static(`${__dirname}/img.jpg`));
app.use('/stats', express.static(`${__dirname}/data/messages.json`));
app.listen(port);
logger.info(`Gmail tracking server running on port ${port}`);