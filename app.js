/* KoreanBridge MVP – plain JS SPA */

// Router-like navigation between views and drawers
const views = {
  home: document.getElementById('view-home'),
  learning: document.getElementById('view-learning'),
  media: document.getElementById('view-media'),
  community: document.getElementById('view-community'),
  kculture: document.getElementById('view-kculture'),
};

const drawers = {
  rewards: document.getElementById('view-rewards'),
  travel: document.getElementById('view-travel'),
  dictionary: document.getElementById('view-dictionary'),
};

function showView(name) {
  Object.values(views).forEach((el) => el.classList.remove('view-active'));
  const el = name === 'home' ? views.home : views[name];
  if (el) el.classList.add('view-active');
}

function openDrawer(name) {
  Object.values(drawers).forEach((el) => el.classList.remove('open'));
  const el = drawers[name];
  if (el) el.classList.add('open');
}

function closeDrawer() {
  Object.values(drawers).forEach((el) => el.classList.remove('open'));
}

function setHash(target) {
  if (!target) return;
  if (location.hash.replace('#','') !== target) {
    location.hash = `#${target}`;
  } else {
    applyFromHash();
  }
}

document.querySelectorAll('.js-nav').forEach((el) => {
  el.addEventListener('click', () => {
    const target = el.getAttribute('data-target');
    setHash(target);
  });
});

// CTA button navigation
document.getElementById('cta-start').addEventListener('click', () => {
  setHash('learning');
});

document.querySelectorAll('[data-close]').forEach((btn) =>
  btn.addEventListener('click', closeDrawer)
);

// Seasonal background changes weekly
(function applySeasonalBackground() {
  // Determine day of year to rotate daily across 4 JPGs
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const images = ['spring.jpg','summer.jpg','fall.jpg','winter.jpg'];
  const idx = dayOfYear % images.length;
  const seasonClass = ['spring','summer','fall','winter'][idx];
  document.body.classList.add(`season-${seasonClass}`);
  const url = `./assets/${images[idx]}`;
  // preload next as well for smooth swap tomorrow
  const preload = new Image();
  preload.src = `./assets/${images[(idx+1)%images.length]}`;
  // Apply jpg override when file exists
  fetch(url, { method: 'HEAD' })
    .then((res) => {
      if (res.ok) {
        document.documentElement.style.setProperty('--season-image', `url('${url}')`);
        document.body.classList.add('bg-hero');
      }
    })
    .catch(() => {});
})();

// Hash routing (deep link)
function applyFromHash() {
  const hash = location.hash.replace('#', '') || 'home';
  if (hash in views || hash === 'home') {
    showView(hash);
    closeDrawer();
  } else if (hash in drawers) {
    showView('home');
    openDrawer(hash);
  } else {
    showView('home');
  }
}
window.addEventListener('hashchange', applyFromHash);
applyFromHash();

// Supabase와 연동되는 새로운 코인 관리 코드

let currentCoins = 0; // 코인 값을 앱 내에서 기억하기 위한 변수

// 페이지가 처음 로드될 때 Supabase에서 코인 값을 가져옵니다.
async function initializeCoins() {
  const { data, error } = await window.supabaseClient
    .from('korean_coin') // 사용자가 만든 테이블 이름
    .select('coin')
    .eq('id', 1) // id가 1인 데이터 한 줄을 선택합니다.
    .single();

  if (error) {
    console.error('코인 정보 로딩 실패:', error);
  } else if (data) {
    currentCoins = data.coin;
    updateCoinBadge(currentCoins);
  }
}

// 화면의 코인 배지를 업데이트하는 함수
function updateCoinBadge(value) {
  const v = Math.max(0, Number(value) || 0);
  const badge = document.getElementById('coin-badge');
  badge.textContent = String(v);
  badge.classList.remove('bump');
  void badge.offsetWidth; // 애니메이션 재시작을 위한 트릭
  badge.classList.add('bump');
}

async function saveCoinsToSupabase(value) {
  console.log('1. saveCoinsToSupabase 함수가 호출되었습니다. 저장할 코인 값:', value);

  const v = Math.max(0, Number(value) || 0);
  currentCoins = v;

  const { error } = await window.supabaseClient
    .from('korean_coin')
    .update({ coin: v })
    .eq('id', 1);

  if (error) {
    console.error('2. 코인 정보 저장 실패! Supabase 에러:', error);
  } else {
    console.log('3. 코인 정보 저장 성공! Supabase에 저장된 값:', v);
  }
}

// `setCoins`는 이제 두 가지 일을 합니다: 화면 업데이트 및 DB 저장
function setCoins(value) {
  updateCoinBadge(value);
  saveCoinsToSupabase(value);
}

// `getCoins`는 이제 앱 내 변수에서 값을 가져옵니다.
function getCoins() {
  return currentCoins;
}

initializeCoins(); // 페이지 시작 시 코인 초기화 함수 실행

document.getElementById('earn-coin').addEventListener('click', () => {
  setCoins(getCoins() + 1);
});
document.getElementById('spend-coin').addEventListener('click', () => {
  setCoins(getCoins() - 1);
});

// Batchim remover (final consonant stripping)
// Hangul syllable decomposition: U+AC00..U+D7A3
function removeBatchim(text) {
  let result = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) {
      result += ch;
      continue;
    }
    const syllableIndex = code - 0xac00;
    const initialIndex = Math.floor(syllableIndex / (21 * 28));
    const vowelIndex = Math.floor((syllableIndex % (21 * 28)) / 28);
    const base = 0xac00 + (initialIndex * 21 + vowelIndex) * 28; // no final consonant
    result += String.fromCharCode(base);
  }
  return result;
}

document.getElementById('btn-batchim').addEventListener('click', () => {
  const input = /** @type {HTMLTextAreaElement} */ (document.getElementById('batchim-input'));
  const out = document.getElementById('batchim-output');
  out.textContent = removeBatchim(input.value);
});
document.getElementById('btn-copy').addEventListener('click', async () => {
  const out = document.getElementById('batchim-output').textContent || '';
  try {
    await navigator.clipboard.writeText(out);
    alert('Copied');
  } catch (_) {}
});

// Dictionary tool reuse
document.getElementById('dict-run').addEventListener('click', () => {
  const input = /** @type {HTMLInputElement} */ (document.getElementById('dict-input'));
  document.getElementById('dict-output').textContent = removeBatchim(input.value);
});

// Loanword mini game
const loanwords = [
  { ko: '노트북', en: 'laptop' },
  { ko: '핸드폰', en: 'phone' },
  { ko: '아이스크림', en: 'ice cream' },
  { ko: '버스', en: 'bus' },
];
let currentLoan = 0;
function renderLoanword() {
  document.getElementById('loanword').textContent = loanwords[currentLoan].ko;
}
renderLoanword();
document.getElementById('loanword-check').addEventListener('click', () => {
  const guess = /** @type {HTMLInputElement} */ (document.getElementById('loanword-guess')).value.trim().toLowerCase();
  const { en } = loanwords[currentLoan];
  const result = document.getElementById('loanword-result');
  if (!guess) return;
  if (guess === en.toLowerCase()) {
    result.textContent = '✅ Correct!';
    currentLoan = (currentLoan + 1) % loanwords.length;
    renderLoanword();
    setCoins(getCoins() + 1);
  } else {
    result.textContent = `❌ Hint: ${en[0].toUpperCase()}...`;
  }
});

// Media likes/comments demo
let likeCount = 0;
let dislikeCount = 0;
document.getElementById('like').addEventListener('click', () => {
  likeCount += 1; document.getElementById('like-count').textContent = String(likeCount);
});
document.getElementById('dislike').addEventListener('click', () => {
  dislikeCount += 1; document.getElementById('dislike-count').textContent = String(dislikeCount);
});
document.getElementById('comment-add').addEventListener('click', () => {
  const input = /** @type {HTMLInputElement} */ (document.getElementById('comment-input'));
  if (!input.value.trim()) return;
  const li = document.createElement('li');
  li.textContent = input.value.trim();
  document.getElementById('comment-list').appendChild(li);
  input.value = '';
});

// Dictionary: Loanword Splitter
const knownLoans = ['노트북','핸드폰','티셔츠','커피','콜라','버스','카메라','아이스크림'];
const splitBtn = document.getElementById('loan-split-run');
if (splitBtn) {
  splitBtn.addEventListener('click', () => {
    const text = /** @type {HTMLInputElement} */ (document.getElementById('loan-split-input')).value.trim();
    const box = document.getElementById('loan-split-output');
    if (!text) { box.textContent = ''; return; }
    const tokens = text.split(/\s+/);
    box.innerHTML = tokens.map(t => {
      const isLoanClass = knownLoans.includes(t) ? 'is-loanword' : '';
      return `<span class="token ${isLoanClass}">${t}</span>`;
    }).join(' ');
  });
}

// Dictionary: Chosung Quiz
function toChosung(word){
  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  let res='';
  for (const ch of word) {
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) { res += ch; continue; }
    const idx = code - 0xac00;
    const choIndex = Math.floor(idx / (21 * 28));
    res += CHO[choIndex];
  }
  return res;
}
const quizWords = ['노트북','핸드폰','코리안','한국어','부산','거제','전통','음식','드라마','음악'];
let quizIndex = 0;
function renderQuiz(){
  const q = document.getElementById('chosung-question');
  if (q) q.textContent = toChosung(quizWords[quizIndex]);
}
renderQuiz();
const quizCheck = document.getElementById('chosung-check');
if (quizCheck) {
  quizCheck.addEventListener('click', () => {
    const guess = /** @type {HTMLInputElement} */ (document.getElementById('chosung-guess')).value.trim();
    const result = document.getElementById('chosung-result');
    if (!guess) return;
    const answer = quizWords[quizIndex];
    if (guess === answer) {
      result.textContent = '🎉 정답!';
      setCoins(getCoins() + 2);
    } else {
      result.textContent = `힌트: ${answer[0]}…`;
    }
  });
}
const quizNext = document.getElementById('chosung-next');
if (quizNext) {
  quizNext.addEventListener('click', () => {
    quizIndex = (quizIndex + 1) % quizWords.length;
    const input = /** @type {HTMLInputElement} */ (document.getElementById('chosung-guess'));
    if (input) input.value = '';
    const result = document.getElementById('chosung-result');
    if (result) result.textContent = '';
    renderQuiz();
  });
}

// Community friend search (mock)
document.getElementById('friend-btn').addEventListener('click', () => {
  const q = /** @type {HTMLInputElement} */ (document.getElementById('friend-search')).value.trim();
  const ul = document.getElementById('friend-results');
  ul.innerHTML = '';
  if (!q) return;
  const mock = ['haneul', 'seojun', 'minji', 'yuna', 'dohyun']
    .filter((n) => n.includes(q.toLowerCase()));
  mock.forEach((n) => {
    const li = document.createElement('li');
    li.textContent = `@${n}`;
    ul.appendChild(li);
  });
});

// K‑Culture carousel controls
const track = document.getElementById('kculture-track');
document.getElementById('kc-prev').addEventListener('click', () => {
  track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
});
document.getElementById('kc-next').addEventListener('click', () => {
  track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
});

// Simple i18n
const i18n = {
  en: {
    title: 'KoreanBridge',
    language: 'Language',
    ctaStart: 'Start Learning for Free',
    quotes: [
      { text: 'The language of our country differs from Chinese and cannot communicate with Chinese characters. I have therefore created 28 new letters so that everyone may easily learn and use them daily.', author: '— King Sejong' },
      { text: 'This month the king personally made 28 letters, which are composed of initial, medial, and final sounds and can express everything in Chinese and our language. Though simple, their permutations are infinite — this is Hunminjeongeum.', author: '— Jeong Inji' },
      { text: 'The golden age I dream of is a world where the people can do what they wish.', author: '— King Sejong' },
      { text: 'Untended land is not one’s territory; people not cared for are not one’s people.', author: '— King Sejong' }
    ],
    cardLearning: 'Learning',
    cardMedia: 'Media',
    cardCommunity: 'Community',
    cardKculture: 'K‑Culture',
    learningItem1: 'Consonant‑Free Story',
    learningItem2: 'Loanword Vocabulary Game',
    learningDesc1: 'Type Korean text and remove final consonants (batchim) to practice reading.',
    learningDesc2: 'Guess the English meaning of a Korean loanword.',
    mediaItem1: 'Video Upload',
    mediaItem2: 'Likes & Comments',
    mediaNote: 'This is a demo. Files are not uploaded.',
    communityItem1: 'Find Friends',
    communityItem2: 'SNS Integration',
    snsNote: 'Connect your social accounts (demo only).',
    kcultureItem1: 'Drama',
    kcultureItem2: 'Music',
    kcultureItem3: 'Tradition',
    kcultureItem4: 'Food',
    navRewards: 'Rewards',
    navTravel: 'Travel',
    navDictionary: 'Dictionary',
    rewardsDesc: 'Earn coins as you learn. This demo stores your coins in the browser.',
    btnEarn: 'Earn 1 Coin',
    btnSpend: 'Spend 1 Coin',
    travelHint: 'Find hidden spots in Busan, Geoje, and Gyeongnam!',
    dictTool1: 'Batchim Remover',
    btnConvert: 'Convert',
    btnCopy: 'Copy',
    btnCheck: 'Check',
    btnAdd: 'Add',
    btnNext: 'Next',
    btnSearch: 'Search',
  },
  ko: {
    title: '코리안브릿지',
    language: '언어',
    ctaStart: '무료로 시작하기',
    quotes: [
      { text: '나라의 말이 중국과 달라 한자와는 서로 통하지 아니하므로… 새로 스물여덟 글자를 만드니, 쉬이 익혀 날마다 쓰게 하고자 함이라.', author: '— 세종대왕' },
      { text: '임금이 친히 언문 28자를 지었는데… 글자는 비록 간단하지만 전환이 무궁하니, 이것을 훈민정음이라 한다.', author: '— 정인지' },
      { text: '내가 꿈꾸는 태평성대는 백성이 하려고 하는 일을 원만하게 하는 세상이다.', author: '— 세종대왕' },
      { text: '가꾸지 않은 땅은 내 영토가 아니고, 보살피지 않은 백성은 내 백성이 아니다.', author: '— 세종대왕' }
    ],
    cardLearning: '학습',
    cardMedia: '미디어',
    cardCommunity: '커뮤니티',
    cardKculture: 'K‑컬처',
    learningItem1: '받침 없는 이야기',
    learningItem2: '외래어 어휘 게임',
    learningDesc1: '한글 문장에서 받침을 제거해 읽기 연습을 합니다.',
    learningDesc2: '한국어 외래어의 영어 뜻을 맞혀보세요.',
    mediaItem1: '영상 업로드',
    mediaItem2: '좋아요·댓글',
    mediaNote: '데모입니다. 실제 업로드는 하지 않습니다.',
    communityItem1: '친구 찾기',
    communityItem2: 'SNS 연동',
    snsNote: '소셜 계정 연동 (데모).',
    kcultureItem1: '드라마',
    kcultureItem2: '음악',
    kcultureItem3: '전통',
    kcultureItem4: '음식',
    navRewards: '리워드',
    navTravel: '여행',
    navDictionary: '사전',
    rewardsDesc: '학습하며 코인을 모으세요. 브라우저에 저장됩니다.',
    btnEarn: '1코인 획득',
    btnSpend: '1코인 사용',
    travelHint: '부산·거제·경남의 숨은 명소를 찾아보세요!',
    dictTool1: '받침 제거기',
    btnConvert: '변환',
    btnCopy: '복사',
    btnCheck: '확인',
    btnAdd: '추가',
    btnNext: '다음',
    btnSearch: '검색',
  },
  es: {
    title: 'KoreanBridge',
    language: 'Idioma',
    ctaStart: 'Empezar gratis',
    quotes: [
      { text: 'La lengua de nuestro país es diferente del chino; por eso creé 28 letras para que todos puedan aprenderlas fácilmente y usarlas cada día.', author: '— Rey Sejong' },
      { text: 'Este mes el rey creó personalmente 28 letras… simples pero de combinaciones infinitas; se llama Hunminjeongeum.', author: '— Jeong Inji' },
      { text: 'Mi era ideal es aquella en la que el pueblo puede hacer lo que desea.', author: '— Rey Sejong' },
      { text: 'La tierra no cultivada no es territorio propio; el pueblo no cuidado no es pueblo propio.', author: '— Rey Sejong' }
    ],
    cardLearning: 'Aprendizaje',
    cardMedia: 'Medios',
    cardCommunity: 'Comunidad',
    cardKculture: 'K‑Cultura',
    learningItem1: 'Historia sin consonantes finales',
    learningItem2: 'Juego de préstamos',
    learningDesc1: 'Quita la consonante final para practicar lectura.',
    learningDesc2: 'Adivina el significado en inglés.',
    mediaItem1: 'Subir video',
    mediaItem2: 'Me gusta y comentarios',
    mediaNote: 'Demostración. No se suben archivos.',
    communityItem1: 'Buscar amigos',
    communityItem2: 'Integración SNS',
    snsNote: 'Conecta tus redes (demo).',
    kcultureItem1: 'Drama',
    kcultureItem2: 'Música',
    kcultureItem3: 'Tradición',
    kcultureItem4: 'Comida',
    navRewards: 'Recompensas',
    navTravel: 'Viaje',
    navDictionary: 'Diccionario',
    rewardsDesc: 'Gana monedas mientras aprendes. Se guardan en el navegador.',
    btnEarn: 'Ganar 1 moneda',
    btnSpend: 'Gastar 1 moneda',
    travelHint: '¡Encuentra lugares ocultos en Busan, Geoje y Gyeongnam!',
    dictTool1: 'Removedor de batchim',
    btnConvert: 'Convertir',
    btnCopy: 'Copiar',
    btnCheck: 'Verificar',
    btnAdd: 'Agregar',
    btnNext: 'Siguiente',
    btnSearch: 'Buscar',
  },
  zh: {
    title: 'KoreanBridge',
    language: '语言',
    ctaStart: '免费开始学习',
    quotes: [
      { text: '我国之语与中文不同，难以以汉字达意，故创二十八字，使人人易学，日日安用。', author: '— 世宗大王' },
      { text: '本月上亲制谚文二十八字……虽简而变换无穷，名曰训民正音。', author: '— 鄭麟趾' },
      { text: '我所梦想的太平盛世，是百姓能顺遂其愿之世。', author: '— 世宗大王' },
      { text: '不耕之地非其土，不恤之民非其民。', author: '— 世宗大王' }
    ],
    cardLearning: '学习',
    cardMedia: '媒体',
    cardCommunity: '社区',
    cardKculture: '韩流文化',
    learningItem1: '无收音故事',
    learningItem2: '外来词词汇游戏',
    learningDesc1: '输入韩语文本并去除收音以练习阅读。',
    learningDesc2: '猜外来词的英语意思。',
    mediaItem1: '上传视频',
    mediaItem2: '点赞与评论',
    mediaNote: '演示，文件不会上传。',
    communityItem1: '找朋友',
    communityItem2: '社交整合',
    snsNote: '连接社交账号（演示）',
    kcultureItem1: '电视剧',
    kcultureItem2: '音乐',
    kcultureItem3: '传统',
    kcultureItem4: '美食',
    navRewards: '奖励',
    navTravel: '旅行',
    navDictionary: '词典',
    rewardsDesc: '学习即可获得金币，数据保存在浏览器。',
    btnEarn: '获得1枚',
    btnSpend: '使用1枚',
    travelHint: '在釜山、巨济、庆南寻找隐藏景点！',
    dictTool1: '收音去除器',
    btnConvert: '转换',
    btnCopy: '复制',
    btnCheck: '检查',
    btnAdd: '添加',
    btnNext: '下一题',
    btnSearch: '搜索',
  },
  ja: {
    title: 'KoreanBridge',
    language: '言語',
    ctaStart: '無料で始める',
    quotes: [
      { text: '我が国の言葉は中国と異なり漢字では意思を通せない。そこで新たに28字を作り、誰もが容易に学び日々使えるようにした。', author: '— 世宗大王' },
      { text: '今月、王が親ら訓民正音28字を作った……簡単でありながら変化は無窮である。', author: '— 鄭麟趾' },
      { text: '私の理想は、民が望むことを円満に成し得る世の中だ。', author: '— 世宗大王' },
      { text: '耕さぬ地は己の領土にあらず、顧みぬ民は己の民にあらず。', author: '— 世宗大王' }
    ],
    cardLearning: '学習',
    cardMedia: 'メディア',
    cardCommunity: 'コミュニティ',
    cardKculture: 'Kカルチャー',
    learningItem1: 'パッチムなしの物語',
    learningItem2: '外来語ゲーム',
    learningDesc1: '韓国語の終声を外して読む練習。',
    learningDesc2: '外来語の英語意味を当てる。',
    mediaItem1: '動画アップロード',
    mediaItem2: 'いいね・コメント',
    mediaNote: 'デモであり、実際にはアップロードしません。',
    communityItem1: '友達を探す',
    communityItem2: 'SNS連携',
    snsNote: 'ソーシャル連携（デモ）',
    kcultureItem1: 'ドラマ',
    kcultureItem2: '音楽',
    kcultureItem3: '伝統',
    kcultureItem4: '料理',
    navRewards: 'リワード',
    navTravel: '旅行',
    navDictionary: '辞書',
    rewardsDesc: '学習しながらコインを獲得。ブラウザに保存。',
    btnEarn: '1コイン獲得',
    btnSpend: '1コイン使用',
    travelHint: '釜山・巨済・慶南の秘境を探そう！',
    dictTool1: '終声リムーバー',
    btnConvert: '変換',
    btnCopy: 'コピー',
    btnCheck: 'チェック',
    btnAdd: '追加',
    btnNext: '次へ',
    btnSearch: '検索',
  },
  fr: {
    title: 'KoreanBridge',
    language: 'Langue',
    ctaStart: 'Commencer gratuitement',
    quotes: [
      { text: 'Notre langue diffère du chinois; j’ai donc créé 28 lettres pour que chacun puisse les apprendre aisément et les utiliser chaque jour.', author: '— Roi Sejong' },
      { text: 'Ce mois-ci, le roi a créé lui‑même 28 lettres… simples mais aux permutations infinies; c’est le Hunminjeongeum.', author: '— Jeong Inji' },
      { text: 'L’âge d’or que je rêve est un monde où le peuple peut accomplir ce qu’il souhaite.', author: '— Roi Sejong' },
      { text: 'Une terre non cultivée n’est pas un territoire; un peuple non pris en charge n’est pas son peuple.', author: '— Roi Sejong' }
    ],
    cardLearning: 'Apprentissage',
    cardMedia: 'Médias',
    cardCommunity: 'Communauté',
    cardKculture: 'Culture K',
    learningItem1: 'Histoire sans consonne finale',
    learningItem2: 'Jeu de mots empruntés',
    learningDesc1: 'Saisir du coréen et retirer la consonne finale.',
    learningDesc2: 'Devinez le sens anglais d’un emprunt.',
    mediaItem1: 'Téléverser une vidéo',
    mediaItem2: 'J’aime et commentaires',
    mediaNote: 'Démo, aucun envoi réel.',
    communityItem1: 'Trouver des amis',
    communityItem2: 'Intégration SNS',
    snsNote: 'Connectez vos réseaux (démo).',
    kcultureItem1: 'Drama',
    kcultureItem2: 'Musique',
    kcultureItem3: 'Tradition',
    kcultureItem4: 'Gastronomie',
    navRewards: 'Récompenses',
    navTravel: 'Voyage',
    navDictionary: 'Dictionnaire',
    rewardsDesc: 'Gagnez des pièces en apprenant (stockées dans le navigateur).',
    btnEarn: 'Gagner 1 pièce',
    btnSpend: 'Dépenser 1 pièce',
    travelHint: 'Trouvez des lieux cachés à Busan, Geoje, Gyeongnam !',
    dictTool1: 'Suppression du batchim',
    btnConvert: 'Convertir',
    btnCopy: 'Copier',
    btnCheck: 'Vérifier',
    btnAdd: 'Ajouter',
    btnNext: 'Suivant',
    btnSearch: 'Rechercher',
  },
  ru: {
    title: 'KoreanBridge',
    language: 'Язык',
    ctaStart: 'Начать бесплатно',
    quotes: [
      { text: 'Язык нашей страны отличается от китайского, потому я создал 28 букв, чтобы каждый мог легко выучить и пользоваться ежедневно.', author: '— Король Седжон' },
      { text: 'В этом месяце государь лично создал 28 букв… просты, но их сочетания бесконечны; это Хунминчжонъым.', author: '— Чон Инджи' },
      { text: 'Мой идеал — когда народ может делать то, что желает.', author: '— Король Седжон' },
      { text: 'Не возделанная земля — не твоя территория; народ без заботы — не твой народ.', author: '— Король Седжон' }
    ],
    cardLearning: 'Обучение',
    cardMedia: 'Медиа',
    cardCommunity: 'Сообщество',
    cardKculture: 'K‑культура',
    learningItem1: 'История без 받침',
    learningItem2: 'Игра заимствованных слов',
    learningDesc1: 'Удаляйте конечные согласные для тренировки чтения.',
    learningDesc2: 'Угадайте английское значение заимствования.',
    mediaItem1: 'Загрузка видео',
    mediaItem2: 'Лайки и комментарии',
    mediaNote: 'Демо. Файлы не загружаются.',
    communityItem1: 'Найти друзей',
    communityItem2: 'Интеграция SNS',
    snsNote: 'Подключите соцсети (демо).',
    kcultureItem1: 'Дорама',
    kcultureItem2: 'Музыка',
    kcultureItem3: 'Традиции',
    kcultureItem4: 'Еда',
    navRewards: 'Награды',
    navTravel: 'Путешествия',
    navDictionary: 'Словарь',
    rewardsDesc: 'Получайте монеты за обучение. Хранится в браузере.',
    btnEarn: 'Получить 1',
    btnSpend: 'Потратить 1',
    travelHint: 'Ищите скрытые места в Пусане, Геодже и Кённаме!',
    dictTool1: 'Удаление 받침',
    btnConvert: 'Преобразовать',
    btnCopy: 'Копировать',
    btnCheck: 'Проверить',
    btnAdd: 'Добавить',
    btnNext: 'Далее',
    btnSearch: 'Поиск',
  },
  hi: {
    title: 'KoreanBridge',
    language: 'भाषा',
    ctaStart: 'मुफ़्त में शुरू करें',
    quotes: [
      { text: 'हमारी भाषा चीनी से भिन्न है, इसलिए मैंने 28 नए अक्षर बनाए ताकि हर कोई आसानी से सीखकर रोज़ उपयोग कर सके।', author: '— किंग सेजोंग' },
      { text: 'इस महीने राजा ने स्वयं 28 अक्षर बनाए… सरल हैं, पर संयोजन अनंत — इसे हूनमिनजोंगम कहते हैं।', author: '— जियोंग इंजी' },
      { text: 'मेरा स्वर्णयुग वही है जहाँ लोग अपनी इच्छा के कार्य कर सकें।', author: '— किंग सेजोंग' },
      { text: 'जो भूमि सँवारी नहीं वह अपनी नहीं; जिन लोगों की देखभाल नहीं वे अपने नहीं।', author: '— किंग सेजोंग' }
    ],
    cardLearning: 'सीखना',
    cardMedia: 'मीडिया',
    cardCommunity: 'समुदाय',
    cardKculture: 'के‑संस्कृति',
    learningItem1: 'बच्चिम रहित कहानी',
    learningItem2: 'उधार शब्द गेम',
    learningDesc1: 'पढ़ने का अभ्यास करने हेतु अंतिम व्यंजन हटाएँ।',
    learningDesc2: 'कोरियाई उधार शब्द का अंग्रेज़ी अर्थ बताएं।',
    mediaItem1: 'वीडियो अपलोड',
    mediaItem2: 'लाइक और टिप्पणियाँ',
    mediaNote: 'डेमो—फ़ाइल अपलोड नहीं होगी।',
    communityItem1: 'दोस्त खोजें',
    communityItem2: 'SNS एकीकरण',
    snsNote: 'सोशल अकाउंट जोड़ें (डेमो)।',
    kcultureItem1: 'ड्रामा',
    kcultureItem2: 'संगीत',
    kcultureItem3: 'परंपरा',
    kcultureItem4: 'भोजन',
    navRewards: 'पुरस्कार',
    navTravel: 'यात्रा',
    navDictionary: 'शब्दकोश',
    rewardsDesc: 'सीखते समय सिक्के कमाएँ—ब्राउज़र में संग्रहीत।',
    btnEarn: '1 सिक्का कमाएँ',
    btnSpend: '1 सिक्का खर्च',
    travelHint: 'बुसान, गोजे, ग्योंगनाम में छिपे स्थान खोजें!',
    dictTool1: 'बच्चिम हटाएँ',
    btnConvert: 'कन्वर्ट',
    btnCopy: 'कॉपी',
    btnCheck: 'जाँचें',
    btnAdd: 'जोड़ें',
    btnNext: 'अगला',
    btnSearch: 'खोज',
  },
  th: {
    title: 'KoreanBridge',
    language: 'ภาษา',
    ctaStart: 'เริ่มเรียนฟรี',
    quotes: [
      { text: 'ภาษาเกาหลีต่างจากจีน จึงสร้างอักษร 28 ตัวเพื่อให้ทุกคนเรียนรู้ง่ายและใช้ได้ทุกวัน', author: '— พระเจ้าเซจง' },
      { text: 'เดือนนี้กษัตริย์ทรงสร้างอักษร 28 ตัวด้วยพระองค์เอง… เรียบง่ายแต่พลิกแพลงได้ไม่สิ้นสุด เรียกว่า ฮุนมินจองอึม', author: '— จอง อินจี' },
      { text: 'ยุคทองที่ข้าพเจ้าฝันถึง คือโลกที่ประชาชนทำในสิ่งที่ต้องการได้', author: '— พระเจ้าเซจง' },
      { text: 'แผ่นดินที่ไม่บำรุงมิใช่ดินแดนของตน ประชาชนที่ไม่ดูแลมิใช่ประชาชนของตน', author: '— พระเจ้าเซจง' }
    ],
    cardLearning: 'การเรียนรู้',
    cardMedia: 'สื่อ',
    cardCommunity: 'ชุมชน',
    cardKculture: 'วัฒนธรรม K',
    learningItem1: 'เรื่องเล่าไร้ตัวสะกด',
    learningItem2: 'เกมคำยืม',
    learningDesc1: 'ลบตัวสะกดท้ายเพื่อฝึกอ่าน',
    learningDesc2: 'ทายความหมายภาษาอังกฤษของคำยืม',
    mediaItem1: 'อัปโหลดวิดีโอ',
    mediaItem2: 'ไลก์และความคิดเห็น',
    mediaNote: 'เดโม ไม่อัปโหลดจริง',
    communityItem1: 'ค้นหาเพื่อน',
    communityItem2: 'เชื่อมต่อ SNS',
    snsNote: 'เชื่อมบัญชีโซเชียล (เดโม)',
    kcultureItem1: 'ละคร',
    kcultureItem2: 'ดนตรี',
    kcultureItem3: 'ประเพณี',
    kcultureItem4: 'อาหาร',
    navRewards: 'รางวัล',
    navTravel: 'ท่องเที่ยว',
    navDictionary: 'พจนานุกรม',
    rewardsDesc: 'สะสมเหรียญระหว่างเรียน บันทึกในเบราว์เซอร์',
    btnEarn: 'รับ 1 เหรียญ',
    btnSpend: 'ใช้ 1 เหรียญ',
    travelHint: 'ค้นหาสถานที่ลับในปูซาน เกาะโกเจ และคยองนัม!',
    dictTool1: 'ลบตัวสะกด',
    btnConvert: 'แปลง',
    btnCopy: 'คัดลอก',
    btnCheck: 'ตรวจสอบ',
    btnAdd: 'เพิ่ม',
    btnNext: 'ถัดไป',
    btnSearch: 'ค้นหา',
  },
  fil: {
    title: 'KoreanBridge',
    language: 'Wika',
    ctaStart: 'Magsimula nang libre',
    quotes: [
      { text: 'Iba ang wika natin sa Tsino; kaya lumikha ako ng 28 titik upang madali itong matutunan at magamit araw‑araw.', author: '— Haring Sejong' },
      { text: 'Ngayong buwan, ang hari mismo ang lumikha ng 28 titik… payak ngunit walang hanggang kumbinasyon; tinawag itong Hunminjeongeum.', author: '— Jeong Inji' },
      { text: 'Ang pangarap kong ginintuang panahon ay ang mundong nagagawa ng mamamayan ang nais nila.', author: '— Haring Sejong' },
      { text: 'Ang lupang hindi inaalagaan ay hindi sariling teritoryo; ang taong hindi inaalagaan ay hindi sariling mamamayan.', author: '— Haring Sejong' }
    ],
    cardLearning: 'Pag-aaral',
    cardMedia: 'Media',
    cardCommunity: 'Komunidad',
    cardKculture: 'K‑Kultura',
    learningItem1: 'Kuwentong walang batchim',
    learningItem2: 'Laro ng hiram na salita',
    learningDesc1: 'Alisin ang hulihang katinig para magpraktis magbasa.',
    learningDesc2: 'Hulaan ang kahulugang Ingles.',
    mediaItem1: 'Mag-upload ng video',
    mediaItem2: 'Likes at komento',
    mediaNote: 'Demo lang; walang aktuwal na upload.',
    communityItem1: 'Maghanap ng kaibigan',
    communityItem2: 'SNS integration',
    snsNote: 'Ikonekta ang social accounts (demo).',
    kcultureItem1: 'Drama',
    kcultureItem2: 'Musika',
    kcultureItem3: 'Tradisyon',
    kcultureItem4: 'Pagkain',
    navRewards: 'Gantimpala',
    navTravel: 'Biyahe',
    navDictionary: 'Diksiyunaryo',
    rewardsDesc: 'Kumita ng coins habang nag-aaral; naka-save sa browser.',
    btnEarn: 'Kumita ng 1 coin',
    btnSpend: 'Gumastos ng 1 coin',
    travelHint: 'Hanapin ang mga tagong spot sa Busan, Geoje, Gyeongnam!',
    dictTool1: 'Batchim Remover',
    btnConvert: 'Convert',
    btnCopy: 'Kopyahin',
    btnCheck: 'Suriin',
    btnAdd: 'Idagdag',
    btnNext: 'Susunod',
    btnSearch: 'Hanapin',
  },
  vi: {
    title: 'KoreanBridge',
    language: 'Ngôn ngữ',
    ctaStart: 'Bắt đầu miễn phí',
    quotes: [
      { text: 'Ngôn ngữ của chúng ta khác tiếng Trung, nên ta tạo 28 chữ cái để ai cũng dễ học và dùng hàng ngày.', author: '— Vua Sejong' },
      { text: 'Tháng này nhà vua tự mình tạo 28 chữ… tuy đơn giản nhưng biến hóa vô tận; gọi là Hunminjeongeum.', author: '— Jeong Inji' },
      { text: 'Thời thái bình ta mơ ước là khi dân có thể làm điều họ muốn.', author: '— Vua Sejong' },
      { text: 'Đất không chăm bón không phải lãnh thổ của mình; dân không chăm sóc không phải dân của mình.', author: '— Vua Sejong' }
    ],
    cardLearning: 'Học tập',
    cardMedia: 'Phương tiện',
    cardCommunity: 'Cộng đồng',
    cardKculture: 'Văn hóa K',
    learningItem1: 'Câu chuyện không phụ âm cuối',
    learningItem2: 'Trò chơi từ vay mượn',
    learningDesc1: 'Xóa phụ âm cuối để luyện đọc.',
    learningDesc2: 'Đoán nghĩa tiếng Anh của từ vay.',
    mediaItem1: 'Tải video',
    mediaItem2: 'Thích và bình luận',
    mediaNote: 'Bản demo, không tải tệp.',
    communityItem1: 'Tìm bạn',
    communityItem2: 'Tích hợp SNS',
    snsNote: 'Kết nối tài khoản mạng xã hội (demo).',
    kcultureItem1: 'Phim',
    kcultureItem2: 'Âm nhạc',
    kcultureItem3: 'Truyền thống',
    kcultureItem4: 'Ẩm thực',
    navRewards: 'Phần thưởng',
    navTravel: 'Du lịch',
    navDictionary: 'Từ điển',
    rewardsDesc: 'Nhận xu khi học; lưu trong trình duyệt.',
    btnEarn: 'Nhận 1 xu',
    btnSpend: 'Tiêu 1 xu',
    travelHint: 'Tìm điểm ẩn ở Busan, Geoje, Gyeongnam!',
    dictTool1: 'Bỏ phụ âm cuối',
    btnConvert: 'Chuyển đổi',
    btnCopy: 'Sao chép',
    btnCheck: 'Kiểm tra',
    btnAdd: 'Thêm',
    btnNext: 'Tiếp',
    btnSearch: 'Tìm',
  },
};

const langSelect = document.getElementById('lang-select');
const LANG_KEY = 'kb_lang_v1';
function applyLang(lang) {
  const dict = i18n[lang] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key && dict[key]) {
      if ('value' in el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        el.setAttribute('placeholder', dict[key]);
      } else {
        el.textContent = dict[key];
      }
    }
  });
  // rotate quotes per language
  const quotes = dict.quotes || i18n.en.quotes;
  let idx = 0;
  const quoteEl = document.getElementById('hero-quote');
  const authorEl = document.getElementById('hero-author');
  function render() {
    const q = quotes[idx % quotes.length];
    quoteEl.textContent = q.text;
    authorEl.textContent = q.author;
    idx += 1;
  }
  render();
  if (window.__quoteTimer) clearInterval(window.__quoteTimer);
  window.__quoteTimer = setInterval(render, 1000 * 8); // every 8s
}
langSelect.addEventListener('change', () => {
  localStorage.setItem(LANG_KEY, langSelect.value);
  applyLang(langSelect.value);
});
// Restore saved language
const savedLang = localStorage.getItem(LANG_KEY);
if (savedLang && i18n[savedLang]) {
  langSelect.value = savedLang;
}
applyLang(langSelect.value);
