/**
 * English Matching Game Framework
 * 제작: Web Publisher (Adaptive AI Version)
 * 기능: 랜덤 추출(20문장/전체) 및 페이징 로직
 */

// --- 전역 변수 ---
let allData = [];           // 결정된 학습 데이터 (20개 혹은 전체)
let currentPage = 0;        // 현재 페이지
let missCount = 0;          // 오답 횟수
let matchCount = 0;         // 현재 페이지 정답 개수
let selectedKr = null;
let selectedEn = null;

const itemsPerPage = 5;     // 페이지당 문장 수 (고정)
const sndCorrect = new Audio('../audio/correct2.mp3');
const sndWrong = new Audio('../audio/wrong.mp3');

function playSound(type) {
    const snd = type === 'correct' ? sndCorrect : sndWrong;
    snd.pause();           // 재생 중이었다면 멈춤
    snd.currentTime = 0;   // 시작 위치로 초기화
    snd.play();            // 재생
}

/**
 * 게임 초기화 함수
 * @param {string} jsonPath - 데이터 JSON 파일 경로
 * @param {number} limit - 추출할 문장 수 (0이면 전체)
 */
async function initGame(jsonPath, limit) {
    try {
        // 1. 변수 초기화
        allData = [];
        currentPage = 0;
        missCount = 0;
        document.getElementById('miss_count').textContent = '0';

        // 2. 데이터 가져오기
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error('데이터 로드 실패');
        
        const rawData = await response.json();

        // 3. 모드별 데이터 가공 (랜덤 추출 로직)
        if (limit > 0) {
            // 데이터를 무작위로 섞은 후 limit 개수만큼만 선택
            allData = [...rawData].sort(() => Math.random() - 0.5).slice(0, limit);
        } else {
            // 전체 데이터 사용
            allData = rawData;
        }

        // 4. 총 페이지 수 UI 반영
        const totalPages = Math.ceil(allData.length / itemsPerPage);
        document.getElementById('total_pages').textContent = totalPages;
        
        // 5. 첫 페이지 렌더링
        loadPage(currentPage);
    } catch (error) {
        console.error("Game Init Error:", error);
        alert("데이터를 가져오는 중 오류가 발생했습니다. (JSON 경로 및 서버 환경을 확인하세요)");
    }
}

// --- 페이지 렌더링 ---
function loadPage(pageIdx) {
    const krCol = document.getElementById('kr_col');
    const enCol = document.getElementById('en_col');
    
    // 이전 내용 청소
    krCol.innerHTML = '';
    enCol.innerHTML = '';
    matchCount = 0;
    
    // 현재 페이지 번호 표시
    document.getElementById('current_page').textContent = pageIdx + 1;

    // 현재 페이지용 데이터 슬라이싱
    const pageData = allData.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage);
    
    // 좌우 각각 다시 셔플하여 배치
    const shuffledKr = [...pageData].sort(() => Math.random() - 0.5);
    const shuffledEn = [...pageData].sort(() => Math.random() - 0.5);

    shuffledKr.forEach(item => krCol.appendChild(createItem(item.kr, item.en, 'kr')));
    shuffledEn.forEach(item => enCol.appendChild(createItem(item.en, item.en, 'en')));
}

// --- 아이템 엘리먼트 생성 ---
function createItem(text, id, type) {
    const div = document.createElement('div');
    div.className = 'item';
    div.textContent = text;
    div.dataset.id = id;
    div.onclick = () => selectItem(div, type);
    return div;
}

// --- 아이템 선택 로직 ---
function selectItem(el, type) {
    // 이미 정답/오답 처리 중인 카드는 무시
    if (el.classList.contains('correct') || el.classList.contains('incorrect')) return;

    if (type === 'kr') {
        if (selectedKr) selectedKr.classList.remove('selected');
        selectedKr = el;
    } else {
        if (selectedEn) selectedEn.classList.remove('selected');
        selectedEn = el;
    }
    el.classList.add('selected');

    // 양쪽 다 선택되었을 때만 매칭 확인
    if (selectedKr && selectedEn) checkMatch();
}

// --- 정답 확인 ---
function checkMatch() {
    const isMatch = selectedKr.dataset.id === selectedEn.dataset.id;

    if (isMatch) {
        // [추가] 정답 효과음 재생
        playSound('correct');

        const sKr = selectedKr;
        const sEn = selectedEn;
        
        sKr.classList.add('correct');
        sEn.classList.add('correct');
        matchCount++;
        
        if (matchCount === pageItemsCount()) {
            setTimeout(nextPage, 600);
        }
        resetSelection();
    } else {
        // [추가] 오답 효과음 재생
        playSound('wrong');

        missCount++;
        document.getElementById('miss_count').textContent = missCount;
        
        selectedKr.classList.add('incorrect');
        selectedEn.classList.add('incorrect');
        
        const sKr = selectedKr;
        const sEn = selectedEn;
        
        setTimeout(() => {
            sKr.classList.remove('incorrect', 'selected');
            sEn.classList.remove('incorrect', 'selected');
        }, 500);
        resetSelection();
    }
}

/**
 * 현재 페이지에서 맞춰야 할 아이템 개수 계산
 * (마지막 페이지가 5개 미만일 경우 대응)
 */
function pageItemsCount() {
    const remaining = allData.length - (currentPage * itemsPerPage);
    return remaining < itemsPerPage ? remaining : itemsPerPage;
}

// --- 페이지 전환 ---
function nextPage() {
    currentPage++;
    if (currentPage * itemsPerPage < allData.length) {
        loadPage(currentPage);
    } else {
        showResult();
    }
}

// --- 결과창 표시 ---
function showResult() {
    const overlay = document.getElementById('result_overlay');
    const totalMiss = document.getElementById('total_miss');
    if (overlay) {
        overlay.style.display = 'flex';
        totalMiss.textContent = missCount;
    }
}

// --- 선택 초기화 ---
function resetSelection() {
    selectedKr = null;
    selectedEn = null;
}