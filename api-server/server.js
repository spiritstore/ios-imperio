const http = require('http');
const fs = require('fs');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'FDEcfOiXxAsC57nQzVW4210gKmGoNBjh';
const SESSION_SECRET = process.env.SESSION_SECRET || 'k8xP2mN7qR4tW9vL1sA3bC5dE0fG6hJ';
const KEYS_FILE = './keys.json';
if (!fs.existsSync(KEYS_FILE)) fs.writeFileSync(KEYS_FILE, JSON.stringify({ keys: [] }, null, 2));

const sessions = {};
function loadKeys() { try { return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')); } catch { return { keys: [] }; } }
function saveKeys(d) { fs.writeFileSync(KEYS_FILE, JSON.stringify(d, null, 2)); }
function signSession(id) { return crypto.createHmac('sha256', SESSION_SECRET).update(id).digest('hex'); }
function verifySession(id, sig) { return signSession(id) === sig; }
function randId() { return crypto.randomBytes(16).toString('hex'); }

// HTML: Login page
const LOGIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>IOS Proxy - Login</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a1a;color:#fff;min-height:100vh;display:flex;justify-content:center;align-items:center}
.box{background:rgba(255,255,255,.05);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:40px;max-width:400px;width:90%;text-align:center}
.box h1{font-size:28px;font-weight:800;background:linear-gradient(135deg,#3b82f6,#60a5fa,#93c5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
.box .tag{color:#6b7280;font-size:14px;margin-bottom:30px}
.box label{display:block;text-align:left;font-size:13px;color:#9ca3af;margin-bottom:8px;font-weight:500}
.box input{width:100%;padding:14px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.03);color:#fff;font-size:16px;outline:none;margin-bottom:8px;font-family:'SF Mono','Fira Code',monospace}
.box input:focus{border-color:#3b82f6}
.box button{width:100%;padding:16px;border:none;border-radius:14px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:18px;font-weight:700;cursor:pointer;box-shadow:0 4px 15px rgba(59,130,246,.3);margin-top:16px}
.box button:disabled{opacity:.5;cursor:not-allowed}
.box .err{color:#ff4444;font-size:13px;margin-top:12px;display:none}
.box .lock{font-size:48px;margin-bottom:16px}
.box .perm{color:#4b5563;font-size:11px;margin-top:20px}
</style>
</head>
<body>
<div class="box">
<div class="lock">🔒</div>
<h1>⬡ IOS Proxy</h1>
<div class="tag">Acesso Administrativo</div>
<label>Senha de Administrador</label>
<input type="password" id="pwd" placeholder="Digite a senha" autocomplete="off">
<button id="btn" onclick="login()">Entrar</button>
<div class="err" id="err"></div>
<div class="perm">Acesso restrito a administradores</div>
</div>
<script>
function login(){
  const b=document.getElementById('btn');
  b.disabled=true;b.textContent='Entrando...';
  const p=document.getElementById('pwd').value;
  fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})})
  .then(r=>r.json())
  .then(x=>{
    if(x.success){location.href='/'}
    else{
      document.getElementById('err').textContent=x.message;
      document.getElementById('err').style.display='block';
      b.disabled=false;b.textContent='Entrar';
    }
  })
  .catch(()=>{
    document.getElementById('err').textContent='Erro de conexão';
    document.getElementById('err').style.display='block';
    b.disabled=false;b.textContent='Entrar';
  });
}
document.getElementById('pwd').addEventListener('keyup',e=>{if(e.key==='Enter')login()});
</script>
</body>
</html>`;

// Main HTML
const MAIN_HTML = fs.readFileSync('./public/index.html', 'utf8');

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  function j(code, data) { res.writeHead(code, {'Content-Type': 'application/json'}); res.end(JSON.stringify(data)); }
  function h(html) { res.writeHead(200, {'Content-Type': 'text/html'}); res.end(html); }
  function body(cb) { let d = ''; req.on('data', c => d += c); req.on('end', () => cb(d)); }

  function checkAuth() {
    const c = req.headers.cookie || '';
    const m = c.match(/session=([^;]+)/);
    if (!m) return null;
    const parts = m[1].split(':');
    if (parts.length !== 2) return null;
    const [sid, sig] = parts;
    if (!sid || !sig || !verifySession(sid, sig)) return null;
    return sessions[sid];
  }

  function setSession() {
    const sid = randId();
    const sig = signSession(sid);
    sessions[sid] = { id: sid, created: Date.now() };
    const val = sid + ':' + sig;
    res.setHeader('Set-Cookie', `session=${val}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
  }

  function clearSession() {
    res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  }

  // Routes
  if (path === '/api/status') {
    j(200, { status: 'online', service: 'IOS Proxy License API', uptime: process.uptime() });

  } else if (path === '/api/login' && req.method === 'POST') {
    body(d => {
      try {
        const { password } = JSON.parse(d);
        if (password === ADMIN_PASS) { setSession(); j(200, { success: true }); }
        else { j(401, { success: false, message: 'Senha inválida' }); }
      } catch(e) { j(400, { success: false, message: 'Erro' }); }
    });

  } else if (path === '/api/logout' && req.method === 'POST') {
    clearSession(); j(200, { success: true });

  } else if (path === '/' || path === '/index.html') {
    if (!checkAuth()) { h(LOGIN_HTML); return; }
    h(MAIN_HTML);

  } else if (path === '/api/generate-key' && req.method === 'POST') {
    if (!checkAuth()) { j(401, { message: 'Login required' }); return; }
    body(d => {
      try {
        const { days, device_id } = JSON.parse(d);
        const dd = days || 30;
        const key = crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        const exp = new Date(Date.now() + dd*24*60*60*1000).toISOString();
        const data = loadKeys();
        data.keys.push({key, device_id: device_id||'any', created_at: new Date().toISOString(), expires_at: exp, days: dd});
        saveKeys(data);
        j(200, { key, expires_at: exp, days_remaining: dd, message: 'Key generated!' });
      } catch(e) { j(400, { message: 'Bad request' }); }
    });

  } else if (path === '/api/verify' && req.method === 'POST') {
    body(d => {
      try {
        const { key, device_id } = JSON.parse(d);
        if (!key || !device_id) { j(400, { valid: false, message: 'Key and device_id required' }); return; }
        const data = loadKeys();
        const lk = data.keys.find(k => k.key === key);
        if (!lk) { j(404, { valid: false, message: 'Invalid key', expires_at: null, days_remaining: 0 }); return; }
        const diff = Math.max(0, Math.ceil((new Date(lk.expires_at) - new Date()) / (1000*60*60*24)));
        if (diff <= 0) { j(403, { valid: false, message: 'Expired', expires_at: lk.expires_at, days_remaining: 0 }); return; }
        j(200, { valid: true, message: `Key valid — ${diff} dia(s) restante(s)`, expires_at: lk.expires_at, days_remaining: diff });
      } catch(e) { j(400, { message: 'Bad request' }); }
    });

  } else if (path === '/api/keys' && req.method === 'GET') {
    if (!checkAuth()) { j(401, { message: 'Login required' }); return; }
    j(200, loadKeys());

  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'}); res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => { console.log('Server running on port ' + PORT); });
