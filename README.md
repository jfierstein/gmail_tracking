# gmail_tracking

Server to go with [GMail Tracking Add-on](https://script.google.com/d/1CA95IMUgNaVmVY9O7rc1gl1IKzMrhO5WYEoXbpbtNZXnh7YpHR7XzJjh/edit?usp=sharing) for tracking GMail threads via an embedded image in the e-mail body.

# Description

The above link is a public Google App Script which I have shared that will integrate with GMail in the browser as an add-on. It cannot be published to the add-on store in its current form due to add-ons published to the store requiring all fetch URLs to be whitelisted in Google's app manifest ahead of time, which means the add-on can't be configured for different URLs as it is right now.

Note: In order to work correctly, the server needs to have a publicly accessible IP address that can be configured in the GMail Tracker add-on. This address is where the image will be served and tracked from. See below.

# How does it work?

Google assigns each thread, or email chain in your GMail inbox a unique identifier which the add-on embeds into the tracked email as query string parameter for a 1x1 pixel image in an HTML `<img>` tag. The `src` for the embedded image points to the URL where the application in this repository is hosted. The URL can be configured per Google account when the GMail Add-on starts up for the first time.

Example: `<img src="http://myhost.com/img?id=123456789" />`

Whenever the e-mail is opened, the browser will attempt to fetch the image from the source URL. The server will accept the request, process the query string parameter to determine which message was opened, then finish serving the request. The static image returned by the server is a JPEG image containing one white pixel.

# How to run the server

## Clone the source

`git clone https://github.com/jfierstein/gmail_tracking.git`

## Run with Docker

`docker build -t gmail-tracking .`

`docker run --name gmail-tracking -d -p 3189:3189 -v /docker/gmail_tracking/data/:/server/data gmail-tracking`

`echo "{}" > server/data/threads.json`

## Run with latest NodeJS

`yarn install`

`echo "{}" > server/data/threads.json`

`npm start`


