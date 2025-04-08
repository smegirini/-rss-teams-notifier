"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTeamsNotifier = startTeamsNotifier;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../database/db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Teams Webhook URL
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
// Teams에 알림 보내기
function sendNotificationsToTeams() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 알림이 필요한 항목 조회
            const connection = yield db_1.pool.getConnection();
            try {
                const [rows] = yield connection.query('SELECT * FROM feed_items WHERE is_notified = FALSE ORDER BY pub_date DESC LIMIT 10');
                const items = rows;
                if (items.length > 0) {
                    console.log(`Sending ${items.length} notifications to Teams`);
                    for (const item of items) {
                        yield sendSingleNotification(item);
                        // 알림 상태 업데이트
                        yield connection.query('UPDATE feed_items SET is_notified = TRUE, notified_at = NOW() WHERE id = ?', [item.id]);
                    }
                    console.log('Notifications sent successfully');
                }
                else {
                    console.log('No new items to notify');
                }
            }
            finally {
                connection.release();
            }
        }
        catch (error) {
            console.error('Error in sendNotificationsToTeams:', error);
        }
    });
}
// 단일 알림 전송
function sendSingleNotification(item) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield axios_1.default.post(TEAMS_WEBHOOK_URL, message, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            });
            if (response.status === 200) {
                console.log(`Teams notification sent: ${item.title}`);
            }
            else {
                console.error(`Failed to send notification: ${response.status} ${response.statusText}`);
            }
        }
        catch (error) {
            console.error('Error sending notification to Teams:', error);
            throw error;
        }
    });
}
// 스케줄러 실행
function startTeamsNotifier() {
    const intervalMinutes = parseInt(process.env.TEAMS_NOTIFY_INTERVAL || '60', 10);
    console.log(`Teams notifier will run every ${intervalMinutes} minutes`);
    // 초기 실행
    sendNotificationsToTeams();
    // 주기적 실행 설정
    setInterval(sendNotificationsToTeams, intervalMinutes * 60 * 1000);
}
