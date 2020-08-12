const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { WebClient } = require("@slack/web-api");
const simpleParser = require("mailparser").simpleParser;

const token = process.env.SlackToken;
const slack = new WebClient(token);

exports.handler = async (event) => {
  const obj = await s3
    .getObject({
      Bucket: event.Records[0].s3.bucket.name,
      Key: event.Records[0].s3.object.key,
    })
    .promise();
  await send(obj.Body.toString());
};

async function send(email) {
  const emails = new Set(extractEmails(email));
  if (!emails || !emails.size) {
    return;
  }
  const parsed = await simpleParser(email);

  const channelName = `email_${parsed.subject.replace(/[\W_]+/g, "_")}`
    .substr(0, 80)
    .replace(/^\|+|\|+$/g, "")
    .toLowerCase();
  const channel = await slack.conversations.create({ name: channelName });
  let users = [];
  let notFoundUsers = [];
  for (const emailAddress of emails) {
    try {
      const user = await slack.users.lookupByEmail({ email: emailAddress });
      users.push(user.user.id);
      console.log(`${user.user.name} invited`);
    } catch (err) {
      console.log(`${emailAddress}: Not found`);
    }
  }
  await slack.conversations.invite({
    channel: channel.channel.id,
    users: users.join(","),
  });

  await slack.chat.postMessage({
    channel: channel.channel.id,
    text: `Looks like the email thread turned in to a chat. Let's continue it on Slack :-)\n\n Here's what's been said: \n${parsed.text}`,
  });
}

function extractEmails(text) {
  return text.match(
    // eslint-disable-next-line no-control-regex
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi
  );
}
