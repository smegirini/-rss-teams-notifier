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
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./database/db");
const rss_collector_1 = require("./services/rss-collector");
const teams_notifier_1 = require("./services/teams-notifier");
// 애플리케이션 시작 함수
function startApp() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 데이터베이스 연결 테스트
            yield (0, db_1.testConnection)();
            // RSS 수집기 시작
            (0, rss_collector_1.startRssCollector)();
            // Teams 알림 전송기 시작
            (0, teams_notifier_1.startTeamsNotifier)();
            console.log('Application started successfully');
        }
        catch (error) {
            console.error('Application startup failed:', error);
            process.exit(1);
        }
    });
}
// 애플리케이션 시작
startApp();
