# ⚠️ Pull Request Reminders on Slack

## 🗜 Requirements

1. Create a slack bot and obtain the OAuth token. (e.g `xoxb-##################...####`)
2. Github OAuth token
3. Organization name

## 🚦 Running the code

1. Create a `channelMappings.json` file inside `channelMaps` folder.
2. Run the build script: `npm run build:commonjs` 
3. Run the script: `SLACK_TOKEN='' GITHUB_TOKEN='' ORG_NAME='' node lib/index.js`

Tip: You can put this code into a `run.sh` file 

## 💻 How to use
1. Put this code in a pubsub and trigger it from a cron service.
2. Use this as a heroku worker with the heroku scheduler [plugin](https://elements.heroku.com/addons/scheduler). (Free but needs you add a credit card 🤷‍♂️)

## Creating the mappings file
Mappings file is source of mapping between the github developer username and slack channel id.

Use slack api to find out channel ids for your slack users.

1. List down user ids: https://slack.com/api/users.list
2. Get channel for each user: https://slack.com/api/conversations.open

### More details
https://api.slack.com/methods

### Sample

`channelMappings.json` should look something like:

```
{
  "johnnyblaze": {
    "channelId": "DX12989821"
  }
}
```

## Future implementation

1. Convert this into a one click installable slack app.
2. Figure out a way to exempt developers from reminders who have already shared a review.

## 🍺 Contributing
1. Fork the project.
2. Clone it locally.
3. Open a PR 🎉 targeting the source branch