let mode = 'random';
let separator = '-';
let currentPassword = '';
let history = [];

const WORDS = [
  'apple','bridge','castle','dragon','engine','forest','garden','harbor',
  'island','jungle','kitten','lemon','magnet','needle','orange','palace',
  'quartz','rabbit','silver','tiger','umbrella','violet','winter','yellow',
  'zebra','anchor','butter','candle','dagger','eagle','falcon','giant',
  'hammer','ivory','jasper','knight','lantern','marble','north','ocean',
  'pepper','queen','river','shadow','thunder','upper','valley','weapon',
  'xenon','yarn','zone','amber','baron','copper','delta','elder','flame',
  'gravel','honey','iron','jewel','karma','lotus','maple','noble','olive',
  'pearl','quill','raven','stone','thorn','ultra','viper','walnut','xray',
  'yoga','zephyr','arctic','blaze','coral','dawn','echo','frost','grace',
  'haven','ink','jade','keen','lunar','mist','nova','orbit','pine',
  'quest','rose','sage','trail','unity','veil','wave','xylem','yield','zinc'
];

const LOWER   = 'abcdefghijklmnopqrstuvwxyz';
const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIGUOUS = /[0Ol1I]/g;

function setMode(m) {
  mode = m;
  document.getElementById('randomPanel').classList.toggle('hidden', m !== 'random');
  document.getElementById('passphrasePanel').classList.toggle('hidden', m !== 'passphrase');
  document.getElementById('btnRandom').className     = `flex-1 py-3 rounded-2xl font-semibold text-sm transition-all ${m==='random'     ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`;
  document.getElementById('btnPassphrase').className = `flex-1 py-3 rounded-2xl font-semibold text-sm transition-all ${m==='passphrase' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`;
  generate();
}

function setSep(s) {
  separator = s;
  document.querySelectorAll('[id^="sep"]').forEach(btn => {
    btn.className = `px-4 py-2 rounded-xl border text-sm font-mono transition-all ${
      btn.id === 'sep' + s
        ? 'border-violet-500 bg-violet-600/30'
        : 'border-white/20 bg-white/5'
    }`;
  });
  generate();
}

function generateRandom() {
  const length    = parseInt(document.getElementById('lengthSlider').value);
  const useUpper  = document.getElementById('toggleUpper').checked;
  const useNums   = document.getElementById('toggleNumbers').checked;
  const useSyms   = document.getElementById('toggleSymbols').checked;
  const noAmbig   = document.getElementById('toggleAmbiguous').checked;

  let charset = LOWER;
  if (useUpper)  charset += UPPER;
  if (useNums)   charset += NUMBERS;
  if (useSyms)   charset += SYMBOLS;
  if (noAmbig)   charset = charset.replace(AMBIGUOUS, '');

  if (!charset) return 'abcdefghijklmnop';

  let pwd = '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    pwd += charset[arr[i] % charset.length];
  }
  return pwd;
}

function generatePassphrase() {
  const count = parseInt(document.getElementById('wordCountSlider').value);
  const words = [];
  const arr = new Uint32Array(count);
  crypto.getRandomValues(arr);
  for (let i = 0; i < count; i++) {
    words.push(WORDS[arr[i] % WORDS.length]);
  }
  return words.join(separator);
}

function calcStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (pwd.length >= 20) score++;

  if (score <= 2) return { label: 'Weak',   color: 'bg-red-500',    pct: 20 };
  if (score <= 3) return { label: 'Fair',   color: 'bg-orange-500', pct: 45 };
  if (score <= 4) return { label: 'Good',   color: 'bg-yellow-500', pct: 65 };
  if (score <= 5) return { label: 'Strong', color: 'bg-lime-500',   pct: 82 };
  return                  { label: 'Very Strong', color: 'bg-emerald-500', pct: 100 };
}

function generate() {
  currentPassword = mode === 'passphrase' ? generatePassphrase() : generateRandom();

  document.getElementById('passwordDisplay').textContent = currentPassword;

  const s = calcStrength(currentPassword);
  document.getElementById('strengthBar').style.width = s.pct + '%';
  document.getElementById('strengthBar').className   = `h-full rounded-full transition-all duration-500 ${s.color}`;
  document.getElementById('strengthLabel').textContent = s.label;
  document.getElementById('strengthLabel').className   = `font-semibold ${s.color.replace('bg-','text-')}`;

  // Add to history
  if (currentPassword && currentPassword !== '—') {
    history.unshift(currentPassword);
    if (history.length > 5) history.pop();
    renderHistory();
  }
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!history.length) {
    list.innerHTML = '<p class="text-slate-500 text-center">None yet</p>';
    return;
  }
  list.innerHTML = history.map((p, i) => `
    <div class="flex items-center justify-between gap-2 p-2 bg-white/5 rounded-xl">
      <span class="truncate flex-1">${p}</span>
      <button onclick="copyText('${p.replace(/'/g,"\\'")}', this)" class="text-slate-500 hover:text-violet-400 transition-all px-2">📋</button>
    </div>
  `).join('');
}

function clearHistory() {
  history = [];
  renderHistory();
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = '✅';
    setTimeout(() => btn.textContent = orig, 1500);
  } catch {
    prompt('Copy:', text);
  }
}

async function copyPassword() {
  if (!currentPassword) return;
  const btn = document.getElementById('copyBtn');
  try {
    await navigator.clipboard.writeText(currentPassword);
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy', 1500);
  } catch {
    prompt('Copy:', currentPassword);
  }
}

// Slider live update
document.getElementById('lengthSlider').addEventListener('input', e => {
  document.getElementById('lengthVal').textContent = e.target.value;
  generate();
});
document.getElementById('wordCountSlider').addEventListener('input', e => {
  document.getElementById('wordCountVal').textContent = e.target.value;
  generate();
});

// Toggle listeners
['toggleUpper','toggleNumbers','toggleSymbols','toggleAmbiguous'].forEach(id => {
  document.getElementById(id).addEventListener('change', generate);
});

// Init
generate();
