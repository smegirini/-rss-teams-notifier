import express from 'express';
import path from 'path';
import { pool } from './database/db'; // 기존 DB 연결 가져오기
import { RowDataPacket } from 'mysql2'; // 타입 임포트 추가

const app = express();
const port = 3001; // 웹 서버 포트 (3000 -> 3001 변경)

// 정적 파일 제공 (public 디렉토리)
// __dirname은 현재 파일(web-server.ts)이 있는 디렉토리 (dist/ 내부에 있을 수 있음)
// path.join을 사용하여 상위 디렉토리의 public 폴더를 정확히 지정
app.use(express.static(path.join(__dirname, '..', 'public')));

// API 엔드포인트: 뉴스 데이터 가져오기 (페이지네이션 및 카테고리 필터링 추가)
app.get('/api/news', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = (page - 1) * limit;
    const category = req.query.category as string || 'all'; // 카테고리 파라미터 추가

    // WHERE 절과 파라미터 배열 동적 구성
    let countWhereClause = '';
    let dataWhereClause = '';
    const queryParams = [];
    const countQueryParams = [];

    if (category !== 'all') {
      countWhereClause = 'WHERE category = ?';
      dataWhereClause = 'WHERE category = ?';
      queryParams.push(category);
      countQueryParams.push(category);
    }

    // 1. 전체 항목 수 조회 (카테고리 필터링 적용)
    const countSql = `SELECT COUNT(*) as totalItems FROM feed_items ${countWhereClause}`;
    const [countRows] = await connection.query<RowDataPacket[]>(
      countSql,
      countQueryParams
    );
    const totalItems = countRows[0].totalItems;

    // 2. 해당 페이지 항목 조회 (카테고리 필터링 적용)
    queryParams.push(limit, offset); // LIMIT, OFFSET 파라미터 추가
    const dataSql = `SELECT id, title, description, link, pub_date, source_name, category 
       FROM feed_items 
       ${dataWhereClause}
       ORDER BY pub_date DESC
       LIMIT ? 
       OFFSET ?`;
    const [items] = await connection.query(
      dataSql,
      queryParams
    );

    const totalPages = Math.ceil(totalItems / limit);

    // 페이지네이션 정보와 함께 데이터 반환
    res.json({
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        currentCategory: category // 현재 적용된 카테고리 정보 추가 (프론트 확인용)
      }
    });

  } catch (error) {
    console.error('Error fetching news data:', error);
    res.status(500).json({ message: '데이터를 가져오는 중 오류가 발생했습니다.' });
  } finally {
    if (connection) connection.release();
  }
});

// 기본 경로 ('/') 요청 시 index.html 제공
app.get('/', (req, res) => {
  // dist 디렉토리에서 실행될 것을 고려하여 경로 설정
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 수정: 호스트 주소 0.0.0.0 추가하여 모든 네트워크 인터페이스에서 접속 허용
app.listen(port, '0.0.0.0', () => {
  console.log(`Web server listening on port ${port} for all network interfaces`);
});