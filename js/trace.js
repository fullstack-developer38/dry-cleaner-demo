/* system map, trace, architecture tab */
(function () {
  const D = window.D, E = D.esc;
  D.ui.trace = { money: false };

  const N = {
    app: [16, 12, 96, 32, 'Customer app + web'], portal: [122, 12, 96, 32, 'Merchant + Admin'], drv: [228, 12, 96, 32, 'Driver PWA'],
    api: [92, 78, 156, 34, 'Cloud API + journal'], gw: [258, 78, 74, 34, 'Gateways|Auth.Net \u00b7 CyberSource'],
    conn: [92, 166, 156, 34, 'WBS POS adapter|local agent \u00b7 outbound only'], sql: [12, 244, 116, 34, 'SQL Server 2008 R2|compat 90 \u00b7 localhost'],
    pos: [142, 244, 96, 34, 'VB6 POS'], term: [250, 244, 82, 34, '3 terminals|Clover \u00b7 Ing \u00b7 Djv'],
  };
  const EDG = {
    'app-api': [64, 44, 140, 78], 'portal-api': [170, 44, 170, 78], 'drv-api': [276, 44, 200, 78],
    'api-gw': [248, 95, 258, 95], 'api-conn': [170, 112, 170, 166], 'conn-sql': [120, 200, 70, 244],
    'pos-sql': [142, 261, 128, 261], 'pos-term': [238, 261, 250, 261],
  };
  function nodeState(k) {
    const s = D.s;
    if (k === 'conn') return s.conn.state === 'online' ? 'ok' : s.conn.state === 'recovering' ? 'warn' : 'bad';
    if (k === 'gw') return s.gateway ? 'ok' : 'bad';
    if (k === 'term') return s.link ? 'ok' : 'warn';
    if (k === 'drv') return s.driverOnline ? 'ok' : 'warn';
    if (k === 'app') return s.holds.global || s.holds.tenant['T-MAPLE'] || s.conn.state !== 'online' ? 'warn' : 'ok';
    return 'ok';
  }
  D.mapSVG = function (big) {
    const now = Date.now();
    const col = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' };
    let h = `<svg viewBox="0 0 340 290" role="img" aria-label="System map: apps and portals talk to the cloud API; the store connector reaches out to the cloud over HTTPS and talks to SQL Server on the store network">`;
    h += `<rect x="4" y="4" width="332" height="122" rx="10" fill="var(--accent-soft)" opacity=".45"/>`;
    h += `<text x="12" y="122" font-size="8" fill="var(--muted)" font-family="var(--f-mono)">CLOUD (WBS-owned accounts)</text>`;
    h += `<line x1="4" y1="140" x2="336" y2="140" stroke="var(--bad)" stroke-dasharray="4 3" stroke-width="1.2"/>`;
    h += `<text x="12" y="136" font-size="8" fill="var(--bad)" font-family="var(--f-mono)">STORE FIREWALL: outbound only</text>`;
    h += `<text x="180" y="136" font-size="8" fill="var(--bad)" font-family="var(--f-mono)">SQL never exposed</text>`;
    h += `<text x="12" y="286" font-size="8" fill="var(--muted)" font-family="var(--f-mono)">STORE LAN (pilot: Downtown)</text>`;
    for (const [k, [x1, y1, x2, y2]] of Object.entries(EDG)) {
      const hot = now - (D.flashing[k] || 0) < 950;
      const down = k === 'api-conn' && !D.s.link;
      h += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hot ? 'var(--accent)' : down ? 'var(--bad)' : 'var(--muted)'}" stroke-opacity="${hot || down ? 1 : 0.55}" stroke-width="${hot ? 3.2 : 1.6}" ${down ? 'stroke-dasharray="3 4"' : ''} ${hot ? 'class="hotedge"' : ''}/>`;
      if (down) h += `<text x="178" y="142" font-size="12" fill="var(--bad)" font-weight="700">\u00d7</text>`;
    }
    for (const [k, [x, y, w, hh, label]] of Object.entries(N)) {
      const st = nodeState(k);
      const legacy = k === 'sql' || k === 'pos';
      h += `<g><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${legacy ? 2 : 7}" fill="${legacy ? '#c0c0c0' : 'var(--surface)'}" stroke="${legacy ? '#808080' : 'var(--line)'}"/>`;
      const [l1, l2] = label.split('|'), ink = legacy ? '#000080' : 'var(--ink)';
      if (!l2) h += `<text x="${x + w / 2}" y="${y + hh / 2 + 3.5}" text-anchor="middle" font-size="9.5" font-weight="600" fill="${ink}" font-family="var(--f-body)">${l1}</text>`;
      else h += `<text x="${x + w / 2}" y="${y + hh / 2 - 1}" text-anchor="middle" font-size="9.5" font-weight="600" fill="${ink}" font-family="var(--f-body)">${l1}</text>`
        + `<text x="${x + w / 2}" y="${y + hh / 2 + 9}" text-anchor="middle" font-size="7.2" fill="${ink}" opacity=".8" font-family="var(--f-body)">${l2}</text>`;
      h += `<circle cx="${x + w - 6}" cy="${y + 6}" r="3.2" fill="${col[st]}"/></g>`;
    }
    if (D.s.conn.outbox.length) h += `<text x="170" y="214" text-anchor="middle" font-size="8.5" fill="var(--warn)" font-family="var(--f-mono)">outbox: ${D.s.conn.outbox.length} queued</text>`;
    return h + '</svg>';
  };

  D.views.trace = {
    render(el) {
      const s = D.s, t = D.ui.trace;
      const items = s.log.filter((l) => !t.money || l.cls === 'fin' || ['GW', 'TERM', 'SQL'].includes(l.src)).slice(0, 120);
      const guards = Object.keys(s.guards).length;
      const st = s.conn.state === 'online' ? '<span class="pill ok">Store online</span>' : s.conn.state === 'recovering' ? '<span class="pill warn">Recovering</span>' : '<span class="pill bad">Store offline</span>';
      el.innerHTML = `
      <section class="panel map">
        <div class="panel-h"><h3>System map</h3>${st}</div>
        <div class="panel-b" style="padding:8px 10px">${D.mapSVG()}</div>
        <div class="panel-b muted" style="padding-top:0;font-size:12px;display:flex;flex-wrap:wrap;gap:4px 14px">
          <span>Outbox <b class="num">${s.conn.outbox.length}</b></span><span>Guards held <b class="num">${guards}</b></span>
          <span>Open exceptions <b class="num">${s.cloud.exc.filter((e) => e.state === 'open').length}</b></span><span>Last sync ${D.ago(s.conn.lastSync)}</span>
        </div>
      </section>
      <section class="panel">
        <div class="panel-h"><h3>Live trace</h3>
          <div class="ctl"><button class="btn sm" data-act="traceMoney" aria-pressed="${t.money}">${t.money ? 'Showing money only' : 'Money only'}</button><button class="btn sm" data-act="traceClear">Clear</button></div></div>
        <div class="log" id="logbox">${items.length ? items.map((l) => `
          <div class="log-i ${l.cls} ${Date.now() - l.t < 1300 ? 'new' : ''}"><span class="ts">${D.clockS(l.t)}</span><span class="src ${l.src}">${l.src}</span>
          <div style="min-width:0"><div class="msg">${E(l.msg)}</div>${l.op ? `<div class="op">${E(l.op)}</div>` : ''}</div></div>`).join('') :
          '<p class="muted" style="padding:14px;margin:0">Every request, guard, POS write and webhook appears here as you use the demo. Try paying ticket 1042 in the customer app.</p>'}
        </div>
      </section>`;
    },
  };
  D.acts.traceMoney = () => { D.ui.trace.money = !D.ui.trace.money; D.render(); };
  D.acts.traceClear = () => { D.s.log = []; D.render(); };

  /* architecture tab */
  const card = (title, ids, body) => `<section class="panel"><div class="panel-h"><h3>${title}</h3><div class="ids">${ids.map((i) => `<span class="id">${i}</span>`).join('')}</div></div><div class="panel-b" style="font-size:13.5px">${body}</div></section>`;
  D.views.arch = {
    title: 'Architecture',
    render(el) {
      el.innerHTML = `
      <div class="view-head"><div><h2>How the pieces fit</h2><p>The existing POS stays the source of truth. The WBS POS adapter runs as a small local agent in the store and reaches out to the cloud. Nothing on the internet can open a connection to the store or to SQL Server.</p></div></div>
      <section class="panel" style="margin-bottom:16px"><div class="panel-h"><h3>Universal POS connector</h3><div class="ids"><span class="id">UCON01</span><span class="id">UCON02</span><span class="id">UCON03</span><span class="id">UCON08</span></div></div>
        <div class="panel-b" style="font-size:13.5px;display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center"><p style="margin:0;flex:1 1 420px">Apps, portal and Super Admin are built once against one canonical model. Each POS connects through an adapter that implements Adapter Interface 1.0: the WBS POS adapter (Class B, local agent) and a second production adapter for the Android POS that WBS picks after award (Class A or B). Mapping, capability manifests, Offline Safe Mode and the exactly-once journal live in the framework, so every adapter gets them.</p>
          <button class="btn" data-act="goTab" data-arg="connectors">Open Connectors</button></div></section>
      <div class="grid g2">
        <section class="panel"><div class="panel-b">${D.mapSVG(true)}</div></section>
        <section class="panel"><div class="panel-h"><h3>Online payment, step by step</h3><div class="ids"><span class="id">PAY02</span><span class="id">FIN01</span><span class="id">CON13</span></div></div>
          <div class="panel-b"><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:5px;font-size:13.5px">
            <li>Customer signs in and opens a Ready ticket. The server checks ownership and tenant.</li>
            <li>The connector reads the live balance and rowversion from SQL Server. Cached numbers are never charged.</li>
            <li>A financial guard row is set on the ticket. The patched POS payment form checks it, so the counter and the app can't collect at the same time.</li>
            <li>Authorize.net Accept Hosted takes the card. Our servers only see a token and the result.</li>
            <li>The result is verified server-side and written to a durable journal before anything else.</li>
            <li>The connector posts the payment in one SQL transaction with an operation id, so a retry can never post twice.</li>
            <li>The guard is released. The ticket stays Ready until pickup or delivery.</li>
          </ol></div></section>
      </div>
      <div class="grid g3" style="margin-top:16px">
        ${card('Legacy POS safety', ['CON01', 'CON03', 'CON08', 'DIS04'], `<p style="margin:0 0 8px">No POS rewrite and no POS, SQL Server or Windows upgrade. Changes are read with SQL Change Tracking, small triggers in a separate <span class="mono">imd</span> schema, or a read-only mode that adds nothing to the database; WBS picks one in discovery. The invoice guard lives in the store agent. The VB6 changes are narrow (payment form check, terminal buttons, claim code on the receipt), delivered with source and a rollback script.</p><p style="margin:0" class="muted">Runs on the POS PC, or on a companion PC on the store LAN if the POS PC has no modern TLS, using the same 32-bit ODBC driver as the POS. Short transactions under 1 second, bounded batches, SQL Server 2008 R2 with the database at compatibility level 90, SQL locks and end-of-day jobs are retried with backoff, never treated as an internet outage.</p>`)}
        ${card('Offline Safe Mode', ['SCP08', 'CON06', 'CON09', 'PAY10'], `<p style="margin:0 0 8px">If the store link drops, the POS keeps running on the LAN. Changes go into an encrypted local outbox. Apps show last-synced data with a timestamp, and online payment pauses for that store only.</p><p style="margin:0" class="muted">On reconnect: settle unknown payments first, replay financial events, replay status, reconcile, then reopen payments.</p>`)}
        ${card('Card terminals', ['TER01', 'TER08', 'TER09', 'TER10'], `<p style="margin:0 0 8px">Three mandatory routes, all in the fixed price: Clover, Ingenico and Dejavoo. Each is started from the POS invoice screen and posts back through the same guard and journal. No route stands in for another, and refunds go back through the original provider.</p><p style="margin:0" class="muted">Processor: Fiserv. Clover runs under the WBS-owned Clover developer account (D02), Dejavoo through its SPIn API. Exact models come from WBS (D01). Terminals never approve offline.</p>`)}
        ${card('One backend, many tenants', ['SCP02', 'DAT09', 'SEC02', 'GLB-014'], `<p style="margin:0">Customer app, website, merchant portal, driver PWA and Super Admin share one API on the canonical model, in English, French, Korean and Japanese. Each market's tenants stay in their own hosting region. Every query is scoped by tenant and location on the server. A changed URL or id returns 403 with no data.</p>`)}
        ${card('Payments and PCI scope', ['PAY01', 'PAY12', 'SEC07'], `<p style="margin:0">One payment interface, two providers: Authorize.Net hosted forms in the US and Canada, CyberSource Unified Checkout everywhere else, with Apple Pay and Google Pay where the account allows. No card number, CVV or track data in our apps, servers, logs or the POS database. Webhooks are signature-checked and deduplicated.</p>`)}
        ${card('What is simulated here', ['Prototype'], `<p style="margin:0">This page runs entirely in your browser with sample data. No real cards, terminals, gateways or POS data are used. The flows, rules and failure handling match what I would build.</p>`)}
      </div>`;
    },
  };
})();
