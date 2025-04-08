import axios from 'axios';
import { pool } from '../database/db';
import dotenv from 'dotenv';

dotenv.config();

// Teams Webhook URL
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  link: string;
  pub_date: Date;
  source_name: string;
  category: string;
}

// Teams에 알림 보내기
async function sendNotificationsToTeams(): Promise<void> {
  try {
    // 알림이 필요한 항목 조회
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM feed_items WHERE is_notified = FALSE ORDER BY pub_date DESC LIMIT 10'
      );
      
      const items = rows as NotificationItem[];
      
      if (items.length > 0) {
        console.log(`Sending ${items.length} notifications to Teams`);
        
        for (const item of items) {
          await sendSingleNotification(item);
          
          // 알림 상태 업데이트
          await connection.query(
            'UPDATE feed_items SET is_notified = TRUE, notified_at = NOW() WHERE id = ?',
            [item.id]
          );
        }
        
        console.log('Notifications sent successfully');
      } else {
        console.log('No new items to notify');
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in sendNotificationsToTeams:', error);
  }
}

// 단일 알림 전송
async function sendSingleNotification(item: NotificationItem): Promise<void> {
  try {
    // Teams 메시지 포맷 (카드 형식)
    const message = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0076D7",
      "summary": `${item.source_name}: ${item.title}`,
      "sections": [{
        "activityTitle": `${item.source_name} - ${item.category}`,
        "activitySubtitle": new Date(item.pub_date).toLocaleString('ko-KR'),
        "facts": [{
          "name": "제목:",
          "value": item.title
        }],
        "text": item.description || '내용 없음'
      }],
      "potentialAction": [{
        "@type": "OpenUri",
        "name": "자세히 보기",
        "targets": [{
          "os": "default",
          "uri": item.link
        }]
      }]
    };
    
    if (!TEAMS_WEBHOOK_URL) {
      throw new Error('Teams webhook URL is not configured');
    }
    
    const response = await axios.post(TEAMS_WEBHOOK_URL, message, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
    if (response.status === 200) {
      console.log(`Teams notification sent: ${item.title}`);
    } else {
      console.error(`Failed to send notification: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending notification to Teams:', error);
    throw error;
  }
}

// 스케줄러 실행
function startTeamsNotifier(): void {
  const intervalMinutes = parseInt(process.env.TEAMS_NOTIFY_INTERVAL || '60', 10);
  console.log(`Teams notifier will run every ${intervalMinutes} minutes`);
  
  // 초기 실행
  sendNotificationsToTeams();
  
  // 주기적 실행 설정
  setInterval(sendNotificationsToTeams, intervalMinutes * 60 * 1000);
}

export { startTeamsNotifier };
