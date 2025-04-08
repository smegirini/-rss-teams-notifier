document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const loadingMessage = document.getElementById('loading-message');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const paginationContainer = document.getElementById('pagination-container'); // 페이지네이션 컨테이너
    let allNewsItems = []; // 모든 뉴스 데이터를 저장할 배열
    let uniqueCategories = new Set(); // 고유 카테고리 저장 Set
    let currentCategory = 'all'; // 현재 선택된 카테고리
    let currentPage = 1;     // 현재 페이지
    const itemsPerPage = 20;  // 페이지당 항목 수 (API 기본값과 일치)

    // 뉴스 데이터 가져오기 함수 (페이지, 카테고리별 필터링 추가)
    function fetchNews(page = 1, category = 'all') {
        currentPage = page;
        currentCategory = category;
        loadingMessage.style.display = 'block';
        newsContainer.innerHTML = '';
        newsContainer.appendChild(loadingMessage);
        paginationContainer.innerHTML = '';

        // API URL 구성 (카테고리 파라미터 추가)
        const apiUrl = `/api/news?page=${page}&limit=${itemsPerPage}&category=${category}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                allNewsItems = data.items || [];
                const paginationData = data.pagination;

                // 첫 페이지 로드 시 또는 카테고리 변경 시에만 카테고리 버튼 업데이트
                // (API가 카테고리 정보를 주므로, 여기서 카테고리 분석 불필요)
                // TODO: 모든 카테고리 목록을 가져오는 별도 API 구현 권장
                if (page === 1) {
                   uniqueCategories.clear();
                   uniqueCategories.add('news'); // 임시 고정
                   uniqueCategories.add('tech'); // 임시 고정
                   createCategoryFilters(uniqueCategories);
                }

                displayNews(allNewsItems); // 수정: 받은 데이터를 인자로 전달
                createPaginationControls(paginationData);

            })
            .catch(error => {
                console.error('Error fetching news:', error);
                displayMessage(`뉴스를 불러오는 중 오류가 발생했습니다: ${error.message}`);
            })
            .finally(() => {
                if (loadingMessage) {
                    loadingMessage.style.display = 'none';
                }
            });
    }

    // 카테고리 필터 버튼 생성 함수
    function createCategoryFilters(categories) {
        categoryFiltersContainer.querySelectorAll('.filter-button:not([data-category="all"])').forEach(btn => btn.remove());
        const sortedCategories = Array.from(categories).sort(); // 카테고리 정렬

        sortedCategories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.category = category;
            button.textContent = category;
            // 클릭 시 해당 카테고리의 첫 페이지 로드
            button.addEventListener('click', () => fetchNews(1, category)); 
            categoryFiltersContainer.appendChild(button);
        });
        // 현재 선택된 카테고리에 active 클래스 적용
         categoryFiltersContainer.querySelectorAll('.filter-button').forEach(button => {
            button.classList.toggle('active', button.dataset.category === currentCategory);
        });
         // 전체 버튼 이벤트 리스너 추가
        const allButton = categoryFiltersContainer.querySelector('[data-category="all"]');
        if (allButton && !allButton.dataset.listenerAttached) { // 중복 부착 방지
            allButton.addEventListener('click', () => fetchNews(1, 'all'));
            allButton.dataset.listenerAttached = 'true';
        }
    }

    // 뉴스 표시 함수 (필터링 로직 제거, 매개변수 추가)
    function displayNews(itemsToDisplay) { // 수정: 매개변수 추가
        newsContainer.innerHTML = ''; // 기존 카드 제거
        
        // 활성 카테고리 버튼 스타일 업데이트
        categoryFiltersContainer.querySelectorAll('.filter-button').forEach(button => {
            button.classList.toggle('active', button.dataset.category === currentCategory);
        });

        if (!itemsToDisplay || itemsToDisplay.length === 0) { // 수정: 매개변수 사용
            displayMessage(`${currentCategory === 'all' ? '표시할 뉴스가 없습니다.' : `'${currentCategory}' 카테고리에 해당하는 뉴스가 없습니다.`}`);
        } else {
            itemsToDisplay.forEach(item => { // 수정: 매개변수 사용
                const card = createNewsCard(item);
                newsContainer.appendChild(card);
            });
        }
         if (loadingMessage) {
             loadingMessage.style.display = 'none';
         }
    }
    
    // 페이지네이션 컨트롤 생성 함수
    function createPaginationControls(paginationData) {
        paginationContainer.innerHTML = ''; // 기존 컨트롤 제거
        if (!paginationData || paginationData.totalPages <= 1) return; // 페이지가 1개 이하면 생성 안함

        const { currentPage, totalPages } = paginationData;

        // 이전 버튼
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-button';
        prevButton.textContent = '이전';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => fetchNews(currentPage - 1, currentCategory));
        paginationContainer.appendChild(prevButton);

        // 페이지 번호 버튼 (간단 버전: 모든 페이지 표시)
        // TODO: 페이지 수가 많을 경우 ... 처리 추가
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'pagination-button';
            pageButton.textContent = i;
            pageButton.classList.toggle('active', i === currentPage);
            pageButton.addEventListener('click', () => fetchNews(i, currentCategory));
            paginationContainer.appendChild(pageButton);
        }

        // 다음 버튼
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-button';
        nextButton.textContent = '다음';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => fetchNews(currentPage + 1, currentCategory));
        paginationContainer.appendChild(nextButton);
    }

    // 뉴스 카드 HTML 요소 생성 함수
    function createNewsCard(item) {
        const card = document.createElement('div');
        card.className = 'news-card';
        const pubDate = new Date(item.pub_date).toLocaleString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
        });
        const description = item.description && item.description.length > 150
            ? item.description.substring(0, 150) + '...'
            : item.description || '내용 없음';
        card.innerHTML = `
            <div class="meta">
                <span class="source-category">${item.source_name} (${item.category})</span>
                <span class="date">${pubDate}</span>
            </div>
            <h2>${item.title}</h2>
            <p>${description}</p>
            <a href="${item.link}" target="_blank">자세히 보기</a>
        `;
        return card;
    }

    // 메시지 표시 함수
    function displayMessage(message) {
        newsContainer.innerHTML = `<p style="text-align: center; grid-column: 1 / -1;">${message}</p>`;
         if (loadingMessage) loadingMessage.style.display = 'none'; // 메시지 표시 시 로딩 제거
         paginationContainer.innerHTML = ''; // 메시지 표시 시 페이지네이션 제거
    }

    // 초기 뉴스 로드 (첫 페이지, 전체 카테고리)
    fetchNews(1, 'all');
});
