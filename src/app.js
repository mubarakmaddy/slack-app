const { App } = require('@slack/bolt');
const Auth = require('./auth');
const {
  SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET,
  SLACK_SIGNING_SECRET,
  SLACK_REDIRECT_URL,
} = require('./constants');

const {
  buildPutWorkspaceParams,
  buildSlackInstallation,
} = require('./helpers');

const databaseData = {};
const database = {
  set: async (key, data) => {
    databaseData[key] = data;
  },
  get: async (key) => {
    return databaseData[key];
  },
};


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
  signingSecret: SLACK_SIGNING_SECRET,
  clientId: SLACK_CLIENT_ID,
  clientSecret: SLACK_CLIENT_SECRET,
  stateSecret: 'my-secret',
  scopes: ['chat:write', 'commands'],
  installationStore: {
    storeInstallation: async (installation) => {
      // Bolt will pass your handler an installation object
      // Change the lines below so they save to your database
      if (
        installation.isEnterpriseInstall &&
        installation.enterprise !== undefined
      ) {
        // handle storing org-wide app installation
        return await database.set(installation.enterprise.id, installation);
      }
      if (installation.team !== undefined) {
        // single team app installation
        return await database.set(installation.team.id, installation);
      }
      throw new Error('Failed saving installation data to installationStore');
    },
    fetchInstallation: async (installQuery) => {
      // Bolt will pass your handler an installQuery object
      // Change the lines below so they fetch from your database
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        // handle org wide app installation lookup
        return await database.get(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        return await database.get(installQuery.teamId);
      }
      throw new Error('Failed fetching installation');
    },
    deleteInstallation: async (installQuery) => {
      // Bolt will pass your handler  an installQuery object
      // Change the lines below so they delete from your database
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        // org wide app installation deletion
        return await database.delete(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation deletion
        return await database.delete(installQuery.teamId);
      }
      throw new Error('Failed to delete installation');
    },
  },
});
// All the room in the world for your code
app.event('app_home_opened', async ({ event, client, context }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({
      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view object that appears in the app home*/
      view: {
        type: 'home',
        callback_id: 'home_view',

        /* body of the view */
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Hi John :wave:',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Great to see you here! App helps you to stay up-to-date with your meetings and events right here within Slack. These are just a few things which you will be able to do:',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '• Schedule meetings \n • Manage and update attendees \n • Get notified about changes of your meetings',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'But before you can do all these amazing things, we need you to connect your calendar to App. Simply click the button below:',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Connect to GreytHR',
                  emoji: true,
                },
                url: 'https://3618-2405-201-a416-c083-e513-8fc2-1be8-db62.ngrok.io',
              },
            ],
          },
        ],
      },
    });
  } catch (error) {
    console.error(error);
  }
});

app.message(/^[a-zA-Z0-9 ]*$/, async ({ message, say }) => {
  console.log(message.text);

  const data = await axios.post('/bella-admin/v1/df_text_query', {
    text: message.text,
  });
  console.log(data.data.fulfillmentMessages);
  await say(data.data.fulfillmentMessages[0].text.text[0]);
});

app.command('/knowledge', async ({ command, ack, say }) => {
  try {
    await ack();
    say('Yaaay! that command works!');
  } catch (error) {
    console.log('err');
    console.error(error);
  }
});

// Set up other handling for other web requests as methods on receiver.router
// receiver.router.get('/redirect-url', (req, res) => {
//   // You're working with an express req and res now.
//   res.send('yay!');
// });

(async () => {
  // Start your app
  await app.start(3050);
  console.log('⚡️ Bolt app is running!');
})();
