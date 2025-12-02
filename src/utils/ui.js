export function showBlocker(message = 'Unsupported.', options = {}) {
    const div = document.createElement('div');
    div.style.cssText = `
    position:fixed;inset:0;display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    background:rgba(0,0,0,0.85);color:#fff;z-index:9999;
    padding:24px;text-align:center;font:16px system-ui;
    overflow-y:auto;
  `;
    div.innerHTML = `<div style="max-width:480px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;text-align:left">${message}</div>`;
    if (options.dismiss) {
        const btn = document.createElement('button');
        btn.textContent = options.dismissLabel || 'Close';
        btn.style.cssText = buttonStyle();
        btn.onclick = () => div.remove();
        div.appendChild(btn);
    }
    document.body.appendChild(div);
    return () => div.remove();
}

export function showOverlayButton({ label = 'Start', onClick }) {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
    position:fixed;inset:0;display:flex;align-items:center;
    justify-content:center;background:linear-gradient(180deg,
    rgba(0,0,0,0.55),rgba(0,0,0,0.35));z-index:9998;
  `;
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = buttonStyle();
    btn.onclick = async () => {
        btn.disabled = true;
        try {
            await onClick();
        } finally {
            wrap.remove();
        }
    };
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
    return () => wrap.remove();
}

export function showToast(message, ms = 2500) {
    const t = document.createElement('div');
    t.style.cssText = `
    position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
    background:#111;color:#fff;padding:10px 16px;border-radius:10px;
    font:14px system-ui;z-index:10000;box-shadow:0 4px 20px rgba(0,0,0,.4);
    max-width:80%;text-align:center;
  `;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
    return () => t.remove();
}

function buttonStyle() {
    return `
    padding:14px 26px;border-radius:14px;border:none;
    background:#0ea5e9;color:#fff;font:600 16px system-ui;
    cursor:pointer;box-shadow:0 8px 28px rgba(14,165,233,.55);
    transition:.25s;letter-spacing:.5px;
  `;
}