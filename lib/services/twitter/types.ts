// Twitter/Apify Types

export interface TwitterProfile {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  profileImageUrl: string;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
}

export interface Tweet {
  tweetId: string;
  text: string;
  createdAt: string;
  url: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
}

export interface ContractCall {
  contractAddress: string;
  tweetId: string;
  tweetUrl: string;
  tweetText: string;
  timestamp: string;
}

export interface TwitterData {
  profile: TwitterProfile;
  tweets: Tweet[];
  contractsFound: ContractCall[];
}

export interface ApifyRunResult {
  id: string;
  actorId: string;
  userId: string;
  startedAt: string;
  finishedAt: string;
  status: string;
  defaultDatasetId: string;
}

export interface ApifyTweetItem {
  // Common/apidojo format
  id?: string;
  id_str?: string;
  text?: string;
  full_text?: string;
  created_at?: string;
  user?: {
    id_str?: string;
    screen_name?: string;
    name?: string;
    description?: string;
    profile_image_url_https?: string;
    followers_count?: number;
    friends_count?: number;
    verified?: boolean;
  };
  favorite_count?: number;
  retweet_count?: number;
  reply_count?: number;
  views_count?: number;
  entities?: {
    urls?: Array<{ expanded_url?: string }>;
  };

  // quacker/twitter-scraper format
  noResults?: boolean;
  tweetId?: string;
  tweetText?: string;
  tweetUrl?: string;
  createdAt?: string;
  handle?: string;
  username?: string;
  userId?: string;
  displayName?: string;
  name?: string;
  bio?: string;
  description?: string;
  profileImageUrl?: string;
  avatar?: string;
  followersCount?: number;
  followers?: number;
  followingCount?: number;
  following?: number;
  isVerified?: boolean;
  verified?: boolean;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  viewCount?: number;
}
