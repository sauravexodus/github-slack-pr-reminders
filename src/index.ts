import { WebClient } from '@slack/client';
import requestPromise = require('request-promise-native');
import * as jsonpath from 'jsonpath';
import * as moment from 'moment';
import { getChannelMaps, ChannelMap } from './channelMaps';

const slackToken = process.env.SLACK_TOKEN;
const githubToken = process.env.GITHUB_TOKEN;
const orgName = process.env.ORG_NAME;
const client = new WebClient(slackToken);

const fetchPendingPullRequests = (): Promise<ChannelMap> => {
  var channelMap = getChannelMaps();

  var graphOptions = { 
    method: 'POST',
    url: 'https://api.github.com/graphql',
    headers: { 
      authorization: `token ${githubToken}`,
      'content-type': 'application/json',
      accept: 'application/vnd.github.v3+json',
      'User-Agent': 'node'
    },
    body: `{"query":"query {\\n    organization(login:\\"${orgName}\\") {\\n    \\tname,\\n    \\trepositories(first: 20) {\\n        nodes {\\n          name\\n          pullRequests(first: 20, states: [OPEN]) {\\n            totalCount\\n            nodes {\\n              number\\n              reviewRequests(first: 5) {\\n                nodes {\\n                  requestedReviewer {\\n                    ...on User {\\n                      login\\n                    }\\n                  }\\n                }\\n              }\\n              resourcePath\\n              title\\n              createdAt\\n              reviews(first: 5) {\\n                nodes {\\n                  author {\\n                    login\\n                  }\\n                  state\\n                }\\n              }\\n            }\\n          }\\n        }\\n      }\\n  \\t}\\n}"}`
  };

  return requestPromise(graphOptions).then((prResults: any) => {
    const repos = jsonpath.query(JSON.parse(prResults), '$..organization..nodes[*].pullRequests');
    const reposWithPR = repos.filter(pr => pr.totalCount > 0);
    reposWithPR.forEach(repo => {
      repo.nodes.filter((pr: any) => pr.reviewRequests.nodes.length > 0)
        .map((pr: any) => {
          const requested: string[] = pr.reviewRequests.nodes.map((reviewRequest: any) => reviewRequest.requestedReviewer.login);
          requested.forEach(person => {
            if (!channelMap[person]) { return; }
            channelMap[person].prs.push({
              title: pr.title,
              url: `https://www.github.com${pr.resourcePath}`,
              createdAt: pr.createdAt
            });
          });
        });
    });
    return Promise.resolve(channelMap);
  });
};

const sendSlackMessages = (channelMap: ChannelMap): Promise<void> => {
  return Promise.all(Object.values(channelMap).filter(value => value.prs.length > 0).map((value) => {
    var text = `You have *${value.prs.length} pull request(s)* remaining.\nPlease review them to enable other developers. \n\n`
    const attachments = value.prs.map(pr => {
      const priority = getPriority(pr.createdAt);
      return {
        title: pr.title,
        text: pr.url,
        color: priority.color,
        fields: [{
          title: 'Priority',
          value: priority.priority,
          short: true
        }, {
          title: 'Pending Since',
          value: moment(pr.createdAt).fromNow(true),
          short: true
        }]
      };

    });
    return client.chat.postMessage({ channel: value.channelId, text, mrkdwn: true, attachments: attachments});
  }))
  .then(() => Promise.resolve())
};

enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

type PriorityWithColor = { priority: Priority; color: string }

const getPriority = (dateString: string): PriorityWithColor =>  {
  const diffInDays = moment().diff(moment(dateString), 'days');
  if (diffInDays < 2) {
    return { priority: Priority.Low, color: 'good' }
  } else if (diffInDays < 3) {
    return { priority: Priority.Medium, color: 'warning' }
  } else {
    return { priority: Priority.High, color: 'danger' }
  }
}

fetchPendingPullRequests()
  .then(channelMap => sendSlackMessages(channelMap))
  .then(() => console.log('Sent slack messages!'))
  .catch(error => console.error(error));
