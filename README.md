# gmail_tracking

Server to go with GMail Tracking Add-on for tracking GMail threads via an embedded image in the e-mail body.

Note: In order to work correctly, the server needs to have a publicly accessible IP address that can be configured in GMail Tracker add-on. This address is where the image will be served and tracked.

1. Clone source
2. Build `yarn install`
3. Run `npm start`

App should run on port 3189

In GMail Tracker Add-on, set your Tracker Server URL to the IP address or domain of wherver you host the server. For now, make sure you do not add a trailing slash at the end, or it won't form the URL correctly.
