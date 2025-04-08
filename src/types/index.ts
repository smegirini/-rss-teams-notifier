export interface FeedSource {
  name: string;
  url: string;
  category: string;
}

export interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  guid?: string;
  source_name: string;
  category: string;
}
