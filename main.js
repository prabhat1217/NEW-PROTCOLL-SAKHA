const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// ---- Data files: next to the portable EXE (travels on a pendrive) or in Documents (survives uninstall) ----
function dataDir() {
  const cand = [];

  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    cand.push(
      path.join(
        process.env.PORTABLE_EXECUTABLE_DIR,
        'PROTOCOL-SAKHA-DATA'
      )
    );
  }

  cand.push(
    path.join(
      app.getPath('documents'),
      'PROTOCOL-SAKHA-DATA'
    )
  );

  for (const c of cand) {
    try {
      fs.mkdirSync(c, { recursive: true });
      fs.accessSync(c, fs.constants.W_OK);
      return c;
    } catch (e) {}
  }

  return app.getPath('userData');
}

function saveData(str) {
  try {
    const d = dataDir();
    const f = path.join(d, 'data.json');
    const t = f + '.tmp';

    fs.writeFileSync(t, str);
    fs.renameSync(t, f);

    const b = path.join(d, 'backups');
    fs.mkdirSync(b, { recursive: true });

    fs.writeFileSync(
      path.join(
        b,
        'data-' + new Date().toISOString().slice(0, 10) + '.json'
      ),
      str
    );

    const fl = fs
      .readdirSync(b)
      .filter(x => /^data-\d{4}-\d\d-\d\d\.json$/.test(x))
      .sort();

    while (fl.length > 30) {
      fs.unlinkSync(path.join(b, fl.shift()));
    }

    return true;
  } catch (e) {
    return false;
  }
}

ipcMain.on('pdr-data-read', ev => {
  try {
    const f = path.join(dataDir(), 'data.json');

    ev.returnValue = fs.existsSync(f)
      ? fs.readFileSync(f, 'utf8')
      : null;
  } catch (e) {
    ev.returnValue = null;
  }
});

ipcMain.on('pdr-data-save', (ev, str) => {
  saveData(str);
});

ipcMain.on('pdr-data-save-sync', (ev, str) => {
  ev.returnValue = saveData(str);
});

ipcMain.on('pdr-open-dir', () => {
  shell.openPath(dataDir());
});

app.setName('PROTOCOL SAKHA');

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function createWindow() {
  Menu.setApplicationMenu(null);

  const w = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 900,
    minHeight: 600,

    title: 'PROTOCOL SAKHA',
    backgroundColor: '#071329',
    autoHideMenuBar: true,

    // Correct icon path
    icon: path.join(__dirname, 'icon.ico'),

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false
    }
  });

  w.maximize();

  // Correct packaged web path
  w.loadFile(
    path.join(__dirname, 'www', 'index.html')
  );

  w.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?:|mailto:|whatsapp:)/.test(url)) {
      shell.openExternal(url);
    }

    return {
      action: 'deny'
    };
  });

  w.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file:')) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  w.on('page-title-updated', e => {
    e.preventDefault();
    w.setTitle('PROTOCOL SAKHA');
  });
}

// Synchronous prompt(): blocks the page until the small dialog is answered
ipcMain.on('pdr-prompt', (ev, { message, def }) => {
  const parent = BrowserWindow.fromWebContents(ev.sender);

  let answered = false;

  const win = new BrowserWindow({
    parent,
    modal: true,
    width: 480,
    height: 240,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'PROTOCOL SAKHA',
    autoHideMenuBar: true,
    backgroundColor: '#0b1b35',

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setMenu(null);

  const safe = v =>
    JSON.stringify(v).replace(/</g, '\\u003c');

  const type =
    /password|pin|recovery/i.test(message)
      ? 'password'
      : 'text';

  const html = `<!doctype html>
<meta charset="utf-8">
<body style="margin:0;padding:18px;font:15px 'Nirmala UI','Shruti',Arial,sans-serif;background:#0b1b35;color:#eaf2ff">

<div id="m" style="margin-bottom:12px;line-height:1.5"></div>

<input
  id="i"
  type="${type}"
  style="width:100%;padding:9px;font-size:15px;border:1px solid #3b659b;border-radius:6px;background:#07162c;color:#fff;box-sizing:border-box"
>

<div style="text-align:right;margin-top:16px">
  <button id="c" style="padding:8px 18px;margin-right:8px">
    Cancel
  </button>

  <button id="o" style="padding:8px 22px;background:#1d5eae;color:#fff;border:0;border-radius:4px">
    OK
  </button>
</div>

<script>
const { ipcRenderer } = require('electron');

const i = document.getElementById('i');

document.getElementById('m').innerText = ${safe(message)};

i.value = ${safe(def)};

i.focus();
i.select();

const done = v =>
  ipcRenderer.send('pdr-prompt-done', v);

document.getElementById('o').onclick = () =>
  done(i.value);

document.getElementById('c').onclick = () =>
  done(null);

i.onkeydown = e => {
  if (e.key === 'Enter') done(i.value);
  if (e.key === 'Escape') done(null);
};
</script>
</body>`;

  ipcMain.once('pdr-prompt-done', (e, v) => {
    answered = true;
    ev.returnValue = v;
    win.close();
  });

  win.on('closed', () => {
    if (!answered) {
      ipcMain.removeAllListeners('pdr-prompt-done');
      ev.returnValue = null;
    }
  });

  win.loadURL(
    'data:text/html;charset=utf-8,' +
    encodeURIComponent(html)
  );
});

app.whenReady().then(createWindow);

app.on('second-instance', () => {
  const w = BrowserWindow.getAllWindows()[0];

  if (w) {
    if (w.isMinimized()) {
      w.restore();
    }

    w.focus();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
