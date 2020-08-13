# mail-to-slack

When email threads evolve in to instant messaging-like replies and you wish you had started it in Slack instead, CC mail-to-slack@yourdomain.com in the thread to move the conversation to a new Slack channel

## Prerequisites
1. An AWS account
2. A domain name
3. [https://github.com/awslabs/aws-sam-cli](SAM-CLI) installed

## Setup
* Follow [https://docs.aws.amazon.com/ses/latest/DeveloperGuide/receiving-email-getting-started.html](these instructions) to set up email recieving with AWS SES
  *  take note of the RuleSet name
* run `sam deploy --guided -t template.json`

## Note
The channel created will be public for your organisation, so think twice if the email thread contains confidential information

