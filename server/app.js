'use strict';
require('app-module-path').addPath(__dirname);
const express = require('express');
const bunyan = require('bunyan');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3189;
const logger = bunyan.createLogger({ name: 'gmail-tracker' });
app.set('trust proxy');

const parseUserAgent = (userAgent) => {
  const start = userAgent.indexOf("(");
  const end = userAgent.indexOf(")");
  return userAgent.substr(start, end);
}

const processMessage = (req, res, next) => {
  const { id } = req.query;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = parseUserAgent(req.headers['user-agent']);
  logger.info(`Request received for image. Gmail threadId ${id}. x-forwarded-for: ${req.headers['x-forwarded-for']}, remoteAddr: ${req.connection.remoteAddress}`);
  try {
    const timestamp = new Date(Date.now());
    let threads = JSON.parse(fs.readFileSync(`${__dirname}/data/threads.json`, 'utf8'));
    if (threads[id]) {
      const length = threads[id].length;
      if (length > 0) {
        const lastView = threads[id][length - 1];
        const lastTimestamp = new Date(lastView.timestamp);
        const secSince = Math.abs(timestamp - lastTimestamp) / 1000;
        if (secSince > 15) threads[id].push({ ip, userAgent, timestamp: timestamp.toISOString() });
      }
      else threads[id].push({ ip, userAgent, timestamp: timestamp.toISOString() });
    }
    else {
      logger.info(`No record found. First time request for threadId ${id}`)
      threads[id] = [];
    }
    fs.writeFileSync(`${__dirname}/data/threads.json`, JSON.stringify(threads), 'utf8');
    return next();
  }
  catch (e) { next(e) }
}

const register = async (req, res, next) => {
  const { id } = req.query;
  const timestamp = new Date(Date.now());
  setTimeout(() => {
    try {
      const threads = JSON.parse(fs.readFileSync(`${__dirname}/data/threads.json`, 'utf8'));
      if (threads[id] && threads[id].length) {
        const length = threads[id].length;
        const lastView = threads[id][length - 1];
        const lastViewTimestamp = new Date(lastView.timestamp);
        const sinceRegister = Math.abs(timestamp - lastViewTimestamp) / 1000;
        logger.info(`Last view record logged ${sinceRegister} sec after the register call`)
        //if the last timestamp was less than 10 seconds since the last register call, remove it
        if (sinceRegister < 10) threads[id].pop();
        fs.writeFileSync(`${__dirname}/data/threads.json`, JSON.stringify(threads), 'utf8');
      }
    }
    catch (e) { next(e) }
  }, 2000);
  return next();
}

app.use('/img', processMessage, express.static(`${__dirname}/img.jpg`));
app.use('/register', register, (req, res) => res.sendStatus(200));
app.use('/stats', (req, res) => {
  const { id } = req.query;
  const threads = JSON.parse(fs.readFileSync(`${__dirname}/data/threads.json`, 'utf8'));
  const threadViews = threads[id];
  if(threadViews && threadViews.length) {
    const count = threads[id].length;
    const lastView = threads[id][count - 1];
    res.json({ lastView, count });
  }
  else res.json([]);  
});
app.listen(port);
logger.info(`Gmail tracking server running on port ${port}`);