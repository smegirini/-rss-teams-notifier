import { testConnection } from './database/db';
import { startRssCollector } from './services/rss-collector';
import { startTeamsNotifier } from './services/teams-notifier';

// 애플리케이션 시작 함수
async function startApp(): Promise<void> {
  try {
    // 데이터베이스 연결 테스트
    await testConnection();
    
    // RSS 수집기 시작
    startRssCollector();
    
    // Teams 알림 전송기 시작
    startTeamsNotifier();
    
    console.log('Application started successfully');
  } catch (error) {
    console.error('Application startup failed:', error);
    process.exit(1);
  }
}

// 애플리케이션 시작
startApp();
