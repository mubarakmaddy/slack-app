const { InstallProvider } = require("@slack/oauth");
const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET } = require("./constants");
const { createServer } = require("http");

// initialize the installProvider
const installer = new InstallProvider({
  clientId: SLACK_CLIENT_ID,
  clientSecret: SLACK_CLIENT_SECRET,
  stateSecret: "my-state-secret",
  renderHtmlForInstallPath: (url) =>
    `<html><body><a href="${url}">Install my app!</a></body></html>`,
});

const server = createServer(async (req, res) =>  {
    // our installation path is /slack/install
    if (req.url === '/slack/install') {
      // call installer.handleInstallPath and write a cookie using beforeRedirection
      await installer.handleInstallPath(req, res, {
        beforeRedirection: async (req, res) => {
          req.setHeader('Cookie', 'mycookie=something');
          return true; // return true to continue with the OAuth flow
        }
      });
    }
    // our redirect_uri is /slack/oauth_redirect
    if (req.url === '/slack/oauth_redirect') {
      // call installer.handleCallback but check our custom cookie before
      // wrapping up the install flow
      await installer.handleCallback(req, res, {
        beforeInstallation: async (opts, req, res) => {
          if (checkCookieForInstallElibility(req)) {
            // the user is allowed to install the app
            return true;
          } else {
            // user is not allowed to install! end the http response and return false
            // to stop the installation
            res.end();
            return false;
          }
        }
      });
    }
  })

server.listen(3050);
