const statusSVG = {
  operational: `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-circle-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>`,
  slow: `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-clock-hour-3"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 12h3.5" /><path d="M12 7v5" /></svg>`,
  downtime: `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-barrier-block"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7m0 1a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1z" /><path d="M7 16v4" /><path d="M7.5 16l9 -9" /><path d="M13.5 16l6.5 -6.5" /><path d="M4 13.5l6.5 -6.5" /><path d="M17 16v4" /><path d="M5 20h4" /><path d="M15 20h4" /><path d="M17 7v-2" /><path d="M7 7v-2" /></svg>`,
  offline: `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-off"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9.58 5.548c.24 -.11 .492 -.207 .752 -.286c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 .957 -.383 1.824 -1.003 2.454m-2.997 1.033h-11.343c-2.572 -.004 -4.657 -2.011 -4.657 -4.487c0 -2.475 2.085 -4.482 4.657 -4.482c.13 -.582 .37 -1.128 .7 -1.62" /><path d="M3 3l18 18" /></svg>`
};

const services = [
  {
    name: 'Website',
    checkUrl: 'https://economix.lol',
    isAPI: false
  },
  {
    name: 'API',
    checkUrl: 'https://api.economix.lol/api/ping',
    downtimeUrl: 'https://api.economix.lol/api/get_raw_downtime',
    isAPI: true
  }
];

const SLOW_THRESHOLD = 1000; // ms

// Build service rows
const container = document.getElementById('servicesContainer');
services.forEach((svc, idx) => {
  const row = document.createElement('div');
  row.className = 'service';
  row.id = 'svc-' + idx;
  row.innerHTML = `
        <span class="name">${svc.name}</span>
        <span class="badge operational">
          <span class="status-icon">${statusSVG.operational}</span>
          <span class="badge-text">Checking...</span>
        </span>
      `;
  container.appendChild(row);
  svc.dom = {
    root: row,
    badge: row.querySelector('.badge'),
    icon: row.querySelector('.status-icon'),
    text: row.querySelector('.badge-text')
  };
});

async function checkService(svc) {
  let status = 'operational';
  let color = '#4caf50';
  try {
    const start = performance.now();
    const res = await fetch(svc.checkUrl, { mode: 'cors', cache: 'no-store' });
    const duration = performance.now() - start;
    if (!res.ok) throw new Error('HTTP ' + res.status);

    if (svc.isAPI) {
      const downRes = await fetch(svc.downtimeUrl, { mode: 'cors', cache: 'no-store' });
      const json = await downRes.json();
      if (json.downtime) {
        status = 'downtime';
        color = '#9e9e9e';
      }
    }

    if (status === 'operational' && duration > SLOW_THRESHOLD) {
      status = 'slow';
      color = '#ff9800';
    }
  } catch (err) {
    console.warn('Fetch error for', svc.name, err);
    status = 'offline';
    color = '#f44336';
  }

  // Update DOM
  svc.dom.badge.className = 'badge ' + status;
  svc.dom.icon.innerHTML = statusSVG[status];
  svc.dom.text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  svc.dom.root.style.borderLeftColor = color;
  return status;
}

async function updateAll() {
  const results = await Promise.all(services.map(checkService));
  let main = 'operational';
  if (results.includes('offline')) main = 'offline';
  else if (results.includes('downtime')) main = 'downtime';
  else if (results.includes('slow')) main = 'slow';

  const mainEl = document.getElementById('mainStatus');
  const iconEl = mainEl.querySelector('.status-icon');
  const textEl = mainEl.querySelector('.status-text');

  mainEl.className = 'main-status status-' + main;
  iconEl.innerHTML = statusSVG[main];
  textEl.textContent = {
    operational: 'All Systems Operational',
    slow: 'Partial Outage – Some services are slow',
    downtime: 'API Downtime Detected',
    offline: 'Major Outage – Some services are offline'
  }[main];
}

// Initial + auto-refresh every 5 seconds
updateAll();
setInterval(updateAll, 5000);