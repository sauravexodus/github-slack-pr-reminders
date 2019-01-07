const channelMap =  require('./channelMappings.json');

export interface ChannelMap {
  [key: string]: {
    prs: {
      title: string;
      url: string;
      createdAt: string;
    }[];
    channelId: string;
  }
}

export const getChannelMaps = (): ChannelMap => {
  return Object.entries(channelMap).reduce((map, [key, value]: [string, any]) => {
    map[key] = {
      prs: [],
      channelId: value.channelId
    }
    return map;
  }, {} as ChannelMap)
}