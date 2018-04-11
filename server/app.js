'use strict';
require('app-module-path').addPath(__dirname);
const express = require('express');
const bunyan = require('bunyan');
const fs = require('fs');
const app = express();
const port = 3189;
const logger = bunyan.createLogger({ name: 'gmail-tracker' });
app.set('trust proxy');
const processMessage = (req, res, next) => {
  const { id } = req.query;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  logger.info(`Request received for image. Gmail threadId ${id}. x-forwarded-for: ${req.headers['x-forwarded-for']}, remoteAddr: ${req.connection.remoteAddress}`);
  try {
    let messages = JSON.parse(fs.readFileSync(`${__dirname}/data/messages.json`, 'utf8'));

    const now = new Date(Date.now());
    if (messages[id] && messages[id].lastUpdated) {
      logger.info(`Message tracking record found`);
      const lastUpdated = new Date(messages[id].lastUpdated);
      const minSinceLast = Math.abs(now - lastUpdated) / 1000;
      if (minSinceLast > 1) {
        logger.info(`More than 1 minutes since last view, incrementing count`);
        messages[id].count += 1;
        const exists = messages[id].viewedIps.find(x => x.ip === ip && x.userAgent === userAgent);
        if (!exists) messages[id].viewedIps.push({ ip, userAgent });
        messages[id].lastUpdated = now.toISOString();
      }
    }
    else {
      logger.info(`No record found. First time request for threadId ${id}`)
      messages[id] = { count: 0, lastUpdated: now.toISOString(), initialRequest: { ip, userAgent }, viewedIps: [] }
    }
    fs.writeFileSync(`${__dirname}/data/messages.json`, JSON.stringify(messages), 'utf8');
    return next();
  }
  catch (e) { next(e) }
}
app.use('/img', processMessage, express.static(`${__dirname}/img.jpg`));
const registerClient = (req, res, next) => {
  try {
    let knownClients = JSON.parse(fs.readFileSync(`${__dirname}/data/knownClients.json`, 'utf8'));
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const existing = knownClients.find(k => k.ip === ip && k.userAgent === userAgent);
    if (!existing) {
      knownClients.push({ ip, userAgent });
      fs.writeFileSync(`${__dirname}/data/knownClients.json`, JSON.stringify(knownClients), 'utf8');
    }
  }
  catch (e) { next(e) }
  return next();
}
app.use('/register', registerClient, (req, res) => res.sendStatus(200));
app.use('/stats', express.static(`${__dirname}/data/messages.json`));
app.listen(port);
logger.info(`Gmail tracking server running on port ${port}`);