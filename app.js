/* KoreanBridge MVP – plain JS SPA */

// --- 1. CORE APP NAVIGATION (VIEWS & DRAWERS) ---

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

// Hash routing (deep link)
function setHash(target) {
  if (!target) return;
  if (location.hash.replace('#','') !== target) {
    location.hash = `#${target}`;
  } else {
    applyFromHash();
  }
}

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

// --- 2. INITIALIZATION & EVENT LISTENERS ---

// Standard navigation buttons
document.querySelectorAll('.js-nav').forEach((el) => {
  el.addEventListener('click', () => {
    const target = el.getAttribute('data-target');
    setHash(target);
  });
});

// Drawer close buttons
document.querySelectorAll('[data-close]').forEach((btn) =>
  btn.addEventListener('click', closeDrawer)
);

// Hash change listener
window.addEventListener('hashchange', applyFromHash);

// --- 3. SUPABASE AUTHENTICATION & DATA MANAGEMENT ---

const supabase = window.supabaseClient;
let user = null;
let profile = null;

// --- New UI Elements for Modal ---
const authModal = document.getElementById('auth-modal');
const closeModalButton = document.getElementById('close-modal-button');
const authNavContainer = document.getElementById('auth-nav-container');
const authNavText = document.getElementById('auth-nav-text');

// --- Modal Control Functions ---
function openAuthModal() {
  authModal.style.display = 'block';
}

function closeAuthModal() {
  authModal.style.display = 'none';
}

// --- Auth Action Functions (signUp, logIn, logOut) ---
async function signUp() {
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert('Error signing up: ' + error.message);
  } else {
    alert('Sign up successful! Please check your email to verify.');
    closeAuthModal(); // Close modal on success
  }
}

async function logIn() {
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert('Error logging in: ' + error.message);
  } else {
    console.log('Login successful!', data.user);
    alert('Welcome back!');
    closeAuthModal(); // Close modal on success
  }
}

async function logOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert('Error logging out: ' + error.message);
  } else {
    console.log('Successfully logged out!');
    // UI will be updated by onAuthStateChange
  }
}

// --- User Profile & Coin Management ---
async function fetchUserProfile() {
  if (!user) return;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error);
  } else if (data) {
    profile = data;
    updateCoinBadge(getCoins());
  }
  // The SQL trigger now handles profile creation, so no need for JS fallback.
}

function updateCoinBadge(value) {
  const badge = document.getElementById('coin-badge');
  badge.textContent = String(value);
  badge.classList.remove('bump');
  void badge.offsetWidth;
  badge.classList.add('bump');
}

async function setCoins(value) {
  if (!user || !profile) {
    alert('Please log in to save your coins!');
    openAuthModal(); // Prompt user to log in
    return;
  }
  const newCoins = Math.max(0, Number(value) || 0);
  profile.coins = newCoins;
  updateCoinBadge(newCoins);
  const { error } = await supabase.from('profiles').update({ coins: newCoins }).eq('id', user.id);
  if (error) console.error('Error saving coins:', error);
}

function getCoins() {
  return profile?.coins ?? 0;
}

// --- Core Auth State Change Handler (The "Brain") ---
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session && session.user) {
    // --- USER IS LOGGED IN ---
    user = session.user;
    
    // Update bottom nav button to be a "Logout" button
    authNavText.textContent = 'Logout';
    authNavText.dataset.i18n = 'logout';
    authNavContainer.removeEventListener('click', openAuthModal);
    authNavContainer.addEventListener('click', logOut);
    
    // Fetch profile and update coin display
    await fetchUserProfile();

  } else {
    // --- USER IS LOGGED OUT ---
    user = null;
    profile = null;
    
    // Update bottom nav button to be a "Login" button
    authNavText.textContent = 'Login';
    authNavText.dataset.i18n = 'login';
    authNavContainer.removeEventListener('click', logOut);
    authNavContainer.addEventListener('click', openAuthModal);

    // Reset coin display
    updateCoinBadge(0);
  }
  // Refresh language translations to update the button text
  applyLang(langSelect.value);
});


// --- 4. OTHER FEATURES & DEMOS ---

// Coin earn/spend buttons
document.getElementById('earn-coin').addEventListener('click', () => {
  setCoins(getCoins() + 1);
});
document.getElementById('spend-coin').addEventListener('click', () => {
  setCoins(getCoins() - 1);
});

// Seasonal background
(function applySeasonalBackground() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const images = ['spring.jpg','summer.jpg','fall.jpg','winter.jpg'];
  const idx = dayOfYear % images.length;
  const seasonClass = ['spring','summer','fall','winter'][idx];
  document.body.classList.add(`season-${seasonClass}`);
  const url = `./assets/${images[idx]}`;
  const preload = new Image();
  preload.src = `./assets/${images[(idx+1)%images.length]}`;
  document.documentElement.style.setProperty('--season-image', `url('${url}')`);
  document.body.classList.add('bg-hero');
})();

// i18n Language functionality
const i18n = {
    en: {
        login: 'Login', logout: 'Logout', 
        welcomeTitle: 'Welcome to KoreanBridge', emailLabel: 'Email', passwordLabel: 'Password', signUp: 'Sign Up',
        // ... (rest of your English translations)
    },
    ko: {
        login: '로그인', logout: '로그아웃',
        welcomeTitle: '코리안브릿지에 오신 것을 환영합니다', emailLabel: '이메일', passwordLabel: '비밀번호', signUp: '회원가입',
        // ... (rest of your Korean translations)
    },
    // ... (other languages)
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
  // ... (rest of your applyLang function for quotes)
}
langSelect.addEventListener('change', () => {
  localStorage.setItem(LANG_KEY, langSelect.value);
  applyLang(langSelect.value);
});
const savedLang = localStorage.getItem(LANG_KEY);
if (savedLang && i18n[savedLang]) {
  langSelect.value = savedLang;
}

// --- 5. INITIAL PAGE LOAD ---
applyFromHash();
applyLang(langSelect.value);

// Modal event listeners (must be after function definitions)
closeModalButton.addEventListener('click', closeAuthModal);
window.addEventListener('click', (event) => {
  if (event.target === authModal) {
    closeAuthModal();
  }
});

// NOTE: All other game/feature specific code from your original file 
// (Batchim remover, Loanword game, etc.) should remain below this point.
// I have removed them for brevity, but you should KEEP them in your file.