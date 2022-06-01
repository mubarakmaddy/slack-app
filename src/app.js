import { RTMClient } from "@slack/rtm-api";
import {
  SLACK_OAUTH_TOKEN,
  BOT_SPAM_CHANNEL,
  SLACK_SIGNING_SECRET,
  SLACK_BOT_TOKEN,
  SLACK_APP_TOKEN,
  SLACK_CLIENT_SECRET,
  SLACK_CLIENT_ID,
} from "./constants";
import { WebClient } from "@slack/web-api";
const { createEventAdapter } = require("@slack/events-api");
const axios = require("axios").default;
axios.defaults.baseURL = "http://localhost:5090";

// const packageJson = require("../package.json");

// const rtm = new RTMClient(SLACK_OAUTH_TOKEN);
// const web = new WebClient(SLACK_OAUTH_TOKEN);
// const slackEvents = createEventAdapter(SLACK_OAUTH_TOKEN);

// // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
// slackEvents.on("message", (event) => {
//   console.log(
//     `Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`
//   );
// });

// // All errors in listeners are caught here. If this weren't caught, the program would terminate.
// slackEvents.on("error", (error) => {
//   console.log(error.name); // TypeError
// });

// (async () => {
//   const server = await slackEvents.start(3030);
//   console.log(`Listening for events on ${server.address().port}`);
// })();

// // rtm.start().catch(console.error);

// // rtm.on("ready", async () => {
// //   console.log("bot started");
// //   sendMessage(
// //     BOT_SPAM_CHANNEL,
// //     `Bot version ${packageJson.version} is online.`
// //   );
// // });

// // rtm.on("slack_event", async (eventType, event) => {
// //   if (event && event.type === "message") {
// //     if (event.text === "!hello") {
// //       hello(event.channel, event.user);
// //     }
// //   }
// // });

// function hello(channelId, userId) {
//   sendMessage(channelId, `Heya! <@${userId}>`);
// }

// async function sendMessage(channel, message) {
//   await web.chat.postMessage({
//     channel: channel,
//     text: message,
//   });
// }

const { App, ExpressReceiver, LogLevel } = require("@slack/bolt");

const installations = [
  {
    teamId: "T03H221TLRX",
    botToken: "xoxb-123abc",
    botId: "B1251",
    botUserId: "U03GLFMC0DT",
  },
];

const databaseData = {};
const database = {
  set: async (key, data) => {
    databaseData[key] = data;
  },
  get: async (key) => {
    return databaseData[key];
  },
};

const authorizeFn = async (req, next) => {
  // Fetch team info from database
  for (const team of installations) {
    // Check for matching teamId and enterpriseId in the installations array
    if (team.teamId === req.teamId) {
      // This is a match. Use these installation credentials.
      next();
    }
  }

  throw new Error("No matching authorizations");
};

// TODO: include this in receiver {authorize: authorizeFn,}

// Create an ExpressReceiver
const receiver = new ExpressReceiver({
  signingSecret: SLACK_SIGNING_SECRET,
  clientId: SLACK_CLIENT_ID,
  clientSecret: SLACK_CLIENT_SECRET,
  stateSecret: "my-secret",
  scopes: ["chat:write"],
  // installerOptions: {
  //   // If below is true, /slack/install redirects installers to the Slack authorize URL
  //   // without rendering the web page with "Add to Slack" button.
  //   // This flag is available in @slack/bolt v3.7 or higher
  //   directInstall: true,
  // },
  installationStore: {
    storeInstallation: async (installation) => {
      // replace database.set so it fetches from your database
      if (
        installation.isEnterpriseInstall &&
        installation.enterprise !== undefined
      ) {
        // support for org wide app installation
        return await database.set(installation.enterprise.id, installation);
      }
      if (installation.team !== undefined) {
        // single team app installation
        return await database.set(installation.team.id, installation);
      }
      throw new Error("Failed saving installation data to installationStore");
    },
    fetchInstallation: async (installQuery) => {
      // replace database.get so it fetches from your database
      if (
        installQuery.isEnterpriseInstall &&
        installQuery.enterpriseId !== undefined
      ) {
        // org wide app installation lookup
        return await database.get(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        return await database.get(installQuery.teamId);
      }
      throw new Error("Failed fetching installation");
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
      throw new Error("Failed to delete installation");
    },
  },
});

const app = new App({
  receiver,
  logLevel: LogLevel.DEBUG,
});
// const app = new App({
//   signingSecret: SLACK_SIGNING_SECRET,
//   token: SLACK_BOT_TOKEN,
//   appToken: SLACK_APP_TOKEN,
// });

// All the room in the world for your code
app.event("app_home_opened", async ({ event, client, context }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({
      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view object that appears in the app home*/
      view: {
        type: "home",
        callback_id: "home_view",

        /* body of the view */
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Hi John :wave:",
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Great to see you here! App helps you to stay up-to-date with your meetings and events right here within Slack. These are just a few things which you will be able to do:",
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "• Schedule meetings \n • Manage and update attendees \n • Get notified about changes of your meetings",
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "But before you can do all these amazing things, we need you to connect your calendar to App. Simply click the button below:",
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Connect to GreytHR",
                  emoji: true,
                },
                url: "https://3618-2405-201-a416-c083-e513-8fc2-1be8-db62.ngrok.io",
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

  const data = await axios.post("/bella-admin/v1/df_text_query", {
    text: message.text,
  });
  console.log(data.data.fulfillmentMessages);
  await say(data.data.fulfillmentMessages[0].text.text[0]);
});

app.command("/knowledge", async ({ command, ack, say }) => {
  try {
    await ack();
    say("Yaaay! that command works!");
  } catch (error) {
    console.log("err");
    console.error(error);
  }
});

// Set up other handling for other web requests as methods on receiver.router
receiver.router.get("/redirect-url", (req, res) => {
  // You're working with an express req and res now.
  res.send("yay!");
});

// // Set up other handling for other web requests as methods on receiver.router
// receiver.router.get("slack/Interactivity", (req, res) => {
//   // You're working with an express req and res now.
//   console.log('Interacting')
//   res.send("yay!");
// });

app.action({ action_id: "actionId-0" }, async ({ action, ack, context }) => {
  await ack();
  console.log(action, ack, context);
  try {
    const result = await app.client.reactions.add({
      token: context.botToken,
      name: "white_check_mark",
      timestamp: action.ts,
      channel: action.channel.id,
    });
  } catch (error) {
    console.error(error);
  }
});
(async () => {
  // Start your app
  await app.start(3050);
  console.log("⚡️ Bolt app is running!");
})();
