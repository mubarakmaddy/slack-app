const { App } = require('@slack/bolt');
const Auth = require('./auth');
const {
  SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET,
  SLACK_SIGNING_SECRET,
  SLACK_REDIRECT_URL,
} = require('./constants');

const oauthStateCheck = () => {
  console.log('oauthStateCheck');
};
const oauthSuccess = () => {
  console.log('oauthSuccess');
};
const oauthError = () => {
  console.log('oauthError');
};
const authorizeFn = () => {
  console.log('authorizeFn');
};

const app = new App({
  authorize: authorizeFn,
  receiver: Auth({
    clientId: SLACK_CLIENT_ID,
    clientSecret: SLACK_CLIENT_SECRET,
    signingSecret: SLACK_SIGNING_SECRET,
    redirectUrl: SLACK_REDIRECT_URL,
    stateCheck: oauthStateCheck,
    onSuccess: oauthSuccess,
    onError: oauthError,
    useSlackOauthV2: true,
  }),
});
(async () => {
  // Start your app
  await app.start(3050);
  console.log('⚡️ Bolt app is running!');
})();
