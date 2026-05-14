/**
 * English Matching Game Framework
 * 제작: Web Publisher (Adaptive AI Version)
 * 기능:
 * - Easy / Hard 모드 지원
 * - 전체 게임 타이머
 * - 성공 / 실패 결과 분기
 * - 정답 시 시간 보너스
 */

// --- 전역 변수 ---
let all_data = [];
let current_page = 0;
let miss_count = 0;
let match_count = 0;

let selected_kr = null;
let selected_en = null;

let timer_interval = null;
let time_left = 0;

let game_over = false;

// 페이지당 문제 수
const items_per_page = 5;

// 모드별 시간 설정
const GAME_MODES = {
    easy: 6,
    hard: 3,
    word_easy: 3,
    word_hard: 1.5
};

let current_mode = 'easy';
let time_per_item = GAME_MODES.easy;

// 사운드
const snd_correct = new Audio('../common/audio/correct.mp3');
const snd_wrong = new Audio('../common/audio/wrong.mp3');

function play_sound(type) {
    const snd = type === 'correct'
        ? snd_correct
        : snd_wrong;

    snd.pause();
    snd.currentTime = 0;
    snd.play();
}

/**
 * 게임 초기화
 */
async function initGame(json_path, limit, mode = 'easy') {

    try {

        // 초기화
        all_data = [];
        current_page = 0;
        miss_count = 0;
        match_count = 0;

        selected_kr = null;
        selected_en = null;

        game_over = false;

        document.getElementById('miss_count').textContent = '0';

        // 모드 설정
        current_mode = GAME_MODES[mode]
            ? mode
            : 'easy';

        time_per_item = GAME_MODES[current_mode];

        // 데이터 로드
        const response = await fetch(json_path);

        if (!response.ok) {
            throw new Error('데이터 로드 실패');
        }

        const raw_data = await response.json();

        // 랜덤 제한
        if (limit > 0) {

            all_data = [...raw_data]
                .sort(() => Math.random() - 0.5)
                .slice(0, limit);

        } else {

            all_data = raw_data;
        }

        // 전체 시간 계산
        time_left = all_data.length * time_per_item;

        update_timer_ui();

        // 타이머 시작
        start_total_timer();

        // 페이지 수 표시
        const total_pages =
            Math.ceil(all_data.length / items_per_page);

        document.getElementById('total_pages')
            .textContent = total_pages;

        // 첫 페이지 로드
        loadPage(current_page);

    } catch (error) {

        console.error('Game Init Error:', error);
    }
}

/**
 * 전체 타이머 시작
 */
function start_total_timer() {

    if (timer_interval) {
        clearInterval(timer_interval);
    }

    timer_interval = setInterval(() => {

        if (game_over) {
            clearInterval(timer_interval);
            return;
        }

        time_left--;

        update_timer_ui();

        // 시간 종료
        if (time_left <= 0) {

            time_left = 0;

            update_timer_ui();

            clearInterval(timer_interval);

            showResult(false);
        }

    }, 1000);
}

/**
 * 타이머 UI 업데이트
 */
function update_timer_ui() {

    const timer_el =
        document.getElementById('timer_sec');

    if (!timer_el) return;

    timer_el.textContent = time_left;

    // 마지막 10초 빨간색
    timer_el.style.color =
        time_left <= 10
            ? '#fa5252'
            : '#4dabf7';
}

/**
 * 결과 표시
 */
function showResult(is_success) {

    game_over = true;

    clearInterval(timer_interval);

    if (is_success) {

        const success_overlay =
            document.getElementById(
                'result_overlay_success'
            );

        if (success_overlay) {

            success_overlay.style.display = 'flex';

            document.getElementById('total_miss')
                .textContent = miss_count;
        }

    } else {

        const fail_overlay =
            document.getElementById(
                'result_overlay_fail'
            );

        if (fail_overlay) {

            fail_overlay.style.display = 'flex';
        }
    }
}

/**
 * 페이지 로드
 */
function loadPage(page_idx) {

    const kr_col = document.getElementById('kr_col');
    const en_col = document.getElementById('en_col');

    kr_col.innerHTML = '';
    en_col.innerHTML = '';

    match_count = 0;

    document.getElementById('current_page')
        .textContent = page_idx + 1;

    const page_data = all_data.slice(
        page_idx * items_per_page,
        (page_idx + 1) * items_per_page
    );

    const shuffled_kr =
        [...page_data].sort(() => Math.random() - 0.5);

    const shuffled_en =
        [...page_data].sort(() => Math.random() - 0.5);

    shuffled_kr.forEach(item => {

        kr_col.appendChild(
            create_item(item.kr, item.en, 'kr')
        );

    });

    shuffled_en.forEach(item => {

        en_col.appendChild(
            create_item(item.en, item.en, 'en')
        );

    });
}

/**
 * 아이템 생성
 */
function create_item(text, id, type) {

    const div = document.createElement('div');

    div.className = 'item';
    div.textContent = text;
    div.dataset.id = id;

    div.onclick = () => select_item(div, type);

    return div;
}

/**
 * 아이템 선택
 */
function select_item(el, type) {

    if (game_over) return;

    if (
        el.classList.contains('correct') ||
        el.classList.contains('incorrect')
    ) {
        return;
    }

    if (type === 'kr') {

        if (selected_kr) {
            selected_kr.classList.remove('selected');
        }

        selected_kr = el;

    } else {

        if (selected_en) {
            selected_en.classList.remove('selected');
        }

        selected_en = el;
    }

    el.classList.add('selected');

    if (selected_kr && selected_en) {
        check_match();
    }
}

/**
 * 정답 체크
 */
function check_match() {

    const is_match =
        selected_kr.dataset.id === selected_en.dataset.id;

    if (is_match) {

        play_sound('correct');

        const s_kr = selected_kr;
        const s_en = selected_en;

        s_kr.classList.remove('selected');
        s_en.classList.remove('selected');

        s_kr.classList.add('correct');
        s_en.classList.add('correct');

        // 정답 보너스 시간
        time_left += 1;

        update_timer_ui();

        setTimeout(() => {

            s_kr.classList.add('is_disabled');
            s_en.classList.add('is_disabled');

        }, 500);

        match_count++;

        if (match_count === page_items_count()) {

            setTimeout(nextPage, 1200);
        }

        reset_selection();

    } else {

        play_sound('wrong');

        miss_count++;

        document.getElementById('miss_count')
            .textContent = miss_count;

        selected_kr.classList.add('incorrect');
        selected_en.classList.add('incorrect');

        const s_kr = selected_kr;
        const s_en = selected_en;

        setTimeout(() => {

            s_kr.classList.remove(
                'incorrect',
                'selected'
            );

            s_en.classList.remove(
                'incorrect',
                'selected'
            );

        }, 500);

        reset_selection();
    }
}

/**
 * 현재 페이지 문제 수
 */
function page_items_count() {

    const remaining =
        all_data.length -
        (current_page * items_per_page);

    return remaining < items_per_page
        ? remaining
        : items_per_page;
}

/**
 * 다음 페이지
 */
function nextPage() {

    current_page++;

    if (
        current_page * items_per_page
        < all_data.length
    ) {

        loadPage(current_page);

    } else {

        // 전체 성공
        showResult(true);
    }
}

/**
 * 선택 초기화
 */
function reset_selection() {

    selected_kr = null;
    selected_en = null;
}