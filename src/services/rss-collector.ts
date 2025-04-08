import Parser from 'rss-parser';
import { pool } from '../database/db';
import { FeedSource, FeedItem } from '../types';
import dotenv from 'dotenv';

dotenv.config();

// RSS 파서 인스턴스 생성
const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'content'],
      ['dc:creator', 'creator']
    ]
  }
});

// RSS 피드 목록
const googleNewsQuery = encodeURIComponent('타이어 OR 자동차');
const feedList: FeedSource[] = [
  { name: '구글 뉴스 (한국)', url: `https://news.google.com/rss/search?q=${googleNewsQuery}&hl=ko&gl=KR&ceid=KR:ko`, category: 'news' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', category: 'tech' }
  // 필요한 피드 추가
];

// RSS 피드 가져오기 및 저장
async function fetchAndStoreFeed(): Promise<void> {
  try {
    for (const feed of feedList) {
      console.log(`Fetching feed from: ${feed.name} (${feed.url})`);
      
      try {
        const feedData = await parser.parseURL(feed.url);
        console.log(`Found ${feedData.items.length} items in ${feed.name}`);
        
        for (const item of feedData.items) {
          const feedItem: FeedItem = {
            title: item.title || 'No Title',
            description: item.contentSnippet || item.content || '',
            link: item.link || '',
            pubDate: item.isoDate ? new Date(item.isoDate) : new Date(),
            guid: item.guid || item.link,
            source_name: feed.name,
            category: feed.category
          };
          
          await storeFeedItem(feedItem);
        }
      } catch (error) {
        console.error(`Error fetching feed from ${feed.name}:`, error);
        // 개별 피드 오류는 건너뛰고 계속 진행
        continue;
      }
    }
    
    console.log('Feed collection completed');
  } catch (error) {
    console.error('Error in fetchAndStoreFeed:', error);
  }
}

// 피드 항목 저장 (중복 확인 후)
async function storeFeedItem(item: FeedItem): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    // 이미 저장된 항목인지 확인
    const [rows] = await connection.query(
      'SELECT id FROM feed_items WHERE guid = ? OR link = ?',
      [item.guid || item.link, item.link]
    );
    
    const existingItems = rows as any[];
    
    if (existingItems.length === 0) {
      // 새 항목이면 저장
      await connection.query(
        'INSERT INTO feed_items (title, description, link, pub_date, source_name, category, guid, is_notified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          item.title,
          item.description,
          item.link,
          item.pubDate,
          item.source_name,
          item.category,
          item.guid || item.link,
          false
        ]
      );
      console.log(`새 항목 저장: ${item.title}`);
    }
  } catch (error) {
    console.error('Error storing feed item:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 스케줄러 실행
function startRssCollector(): void {
  const intervalMinutes = parseInt(process.env.RSS_FETCH_INTERVAL || '30', 10);
  console.log(`RSS collector will run every ${intervalMinutes} minutes`);
  
  // 초기 실행
  fetchAndStoreFeed();
  
  // 주기적 실행 설정
  setInterval(fetchAndStoreFeed, intervalMinutes * 60 * 1000);
}

export { startRssCollector };
