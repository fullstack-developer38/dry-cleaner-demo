/* pos connectors */
(function () {
  const D = window.D, E = D.esc, A = D.acts;
  const WHO = 'Platform admin (MFA)';
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* adapters */
  const ADP = {
    wbs: { id: 'wbs-pos', name: 'WBS POS adapter', sub: 'VB6 / SQL Server 2008 R2', kind: 'Local agent', cls: 'B', latest: '1.0.1' },
    android: { id: 'android-pos', name: 'Android POS adapter', sub: 'Android POS, WBS picks after award', kind: 'Cloud or agent', cls: 'A/B', latest: '1.0.1' },
  };
  D.ADP = ADP;
  const CANON = ['Dropped off', 'In process', 'Ready', 'Picked up', 'Delivered', 'Cancelled'];
  const CAPS = [['customers', 'Customers'], ['invoices', 'Invoices + lines'], ['catalog', 'Services + prices'], ['payments', 'Payments'], ['deposits', 'Deposits'],
    ['partial', 'Partial payment'], ['refunds', 'Refunds + voids'], ['loyalty', 'Loyalty balances'], ['rack', 'Rack data'], ['delivery', 'Delivery data']];
  const DEGRADE = {
    customers: 'Customer sign-in is matched by email only', invoices: 'Tickets are not shown for this store', catalog: 'Prices come from the invoice lines only',
    payments: 'Online payment is not offered for this store', deposits: 'Deposit lines are hidden at checkout', partial: 'Only the full balance can be paid online',
    refunds: 'Refunds are done at the POS, the portal shows why', loyalty: 'Points card shows "not available from this store\'s POS"',
    rack: 'Rack shows "not available from this store\'s POS"', delivery: 'Delivery booking is hidden for this store',
  };
  const capsFor = (a) => (a === 'wbs'
    ? { customers: true, invoices: true, catalog: true, payments: true, deposits: true, partial: true, refunds: true, loyalty: true, rack: true, delivery: true }
    : { customers: true, invoices: true, catalog: true, payments: true, deposits: true, partial: true, refunds: true, loyalty: false, rack: false, delivery: true });
  const LIMITS = {
    wbs: ['Loyalty is read from the POS. Points are earned by POS rules only.', 'Card terminals (Clover, Ingenico, Dejavoo) run POS-side through this adapter.', 'One currency per location, as set in the mapping. Other currencies are rejected (UCON24).'],
    android: ['No rack locations in this POS.', 'Loyalty balances are not exposed by its API. The app says so.', 'Only the currency set on the POS device is accepted. Others are rejected, never converted (UCON24).'],
  };
  const MAPS = {
    wbs: { src: 'POS status code', status: [['10', 'Dropped off'], ['20', 'In process'], ['30', 'Ready'], ['40', 'Picked up'], ['50', 'Delivered'], ['90', 'Cancelled']],
      items: [['SU2', 'svc.suit.2pc'], ['SHL', 'svc.shirt.press'], ['DRS', 'svc.dress.silk'], ['OVC', 'svc.coat.wool'], ['CMF', 'svc.comforter.king'], ['TRS', 'svc.trousers']],
      money: 'float dollars to integer cents, round half up, once in the adapter' },
    android: { src: 'Order state', status: [['OPEN', 'Dropped off'], ['IN_PROGRESS', 'In process'], ['READY_FOR_PICKUP', 'Ready'], ['COMPLETED', 'Picked up'], ['DELIVERED', 'Delivered'], ['CANCELED', 'Cancelled']],
      items: [['sku_1001', 'svc.suit.2pc'], ['sku_1002', 'svc.shirt.press'], ['sku_1007', 'svc.dress.silk'], ['sku_1011', 'svc.coat.wool']],
      money: 'already minor units with an ISO currency code, no conversion' },
  };
  function mapDoc(a, v, at) {
    const t = MAPS[a], doc = { status: clone(t.status), items: clone(t.items) };
    return { ver: v, doc, draft: null, valid: null, hist: [{ ver: v, doc: clone(doc), by: 'Setup in M1', at, note: 'first mapping for this location' }],
      seen: { status: t.status.map((x) => x[0]), items: t.items.map((x) => x[0]) }, held: {} };
  }
  function useed(s) {
    const now = Date.now();
    const curOf = (loc) => { for (const t of s.tenants) for (const l of t.locations) if (l.id === loc) return [l.mkt.cur]; return ['USD']; };
    const row = (loc, tenant, merchant, name, tag, a, v, o) => Object.assign({ loc, tenant, merchant, name, tag, a, ver: '1.0.0', on: true, st: 'online', sync: now - 4000, q: 0, err: '',
      curs: curOf(loc), caps: capsFor(a), maps: { [a]: mapDoc(a, v, now - 3 * 864e5) } }, o);
    const rows = [
      row('L-DT', 'T-MAPLE', 'Maple Avenue Cleaners', 'Downtown', 'Pilot store 1', 'wbs', 7),
      row('L-WS', 'T-MAPLE', 'Maple Avenue Cleaners', 'Westside', 'Pilot store 2', 'wbs', 7, { sync: now - 9000 }),
      row('L-PS', 'T-HARBOR', 'Harbor Press Cleaners', 'Pier St', 'Synthetic', 'wbs', 3, { sync: now - 12000 }),
      row('L-HC', 'T-HARBOR', 'Harbor Press Cleaners', 'Hillcrest', 'Synthetic', 'wbs', 3, { sync: now - 7000 }),
      row('L-MS', 'T-CEDAR', 'Cedar Lane Cleaners', 'Main St', 'Synthetic CA', 'wbs', 2, { sync: now - 15000 }),
      row('L-PAR', 'T-PARIS', 'Pressing de la Seine', 'Paris 11e', 'Synthetic FR', 'wbs', 1, { sync: now - 6000 }),
      row('L-SEL', 'T-SEOUL', 'Hangang Cleaners', 'Seoul Mapo', 'Synthetic KR', 'wbs', 1, { sync: now - 8000 }),
      row('L-TYO', 'T-TOKYO', 'Sakura Cleaning', 'Tokyo Shibuya', 'Synthetic JP', 'wbs', 1, { sync: now - 5000 }),
      row('L-AND', 'T-AND', 'Android POS test merchant', 'Staging store', 'Staging', 'android', 2, { sync: now - 3000 }),
    ];
    // unmapped codes: held, never defaulted
    const ps = rows[2].maps.wbs; ps.seen.status.push('35'); ps.seen.items.push('ALT'); ps.held = { 35: 2, ALT: 1 };
    rows[2].err = 'Unmapped status code 35 and item code ALT: 3 events held, alert sent';
    return { rows, reports: { 'wbs-pos@1.0.0': { pass: 38, of: 38, at: now - 2 * 864e5 }, 'android-pos@1.0.0': { pass: 38, of: 38, at: now - 864e5 } }, harness: null, both: null, leak: null, drill: null, busy: '' };
  }
  const seed0 = D.seed;
  D.seed = function () { const s = seed0(); s.ucon = useed(s); return s; };

  D.ui.ucon = { capSel: 'L-DT', mapSel: 'L-PS', hSel: 'wbs-pos@1.0.0', msg: '' };
  const U = () => D.ui.ucon;
  const R = (loc) => D.s.ucon.rows.find((r) => r.loc === loc);
  const MP = (r) => r.maps[r.a];
  D.capOn = (loc, key) => { const r = D.s && D.s.ucon && R(loc); return !r || !!r.caps[key]; };
  D.rackText = (i) => (D.capOn('L-DT', 'rack') ? 'Rack ' + (i.rack || '-') : "Rack: not available from this store's POS");

  /* row view */
  function view(r) {
    const s = D.s;
    if (r.loc !== 'L-DT' || !r.on || r.st === 'upgrading') return r;
    const st = s.conn.state, q = s.conn.outbox.length;
    return Object.assign({}, r, { st, q, sync: s.conn.lastSync, err: st === 'offline' ? 'Cloud unreachable (store internet). POS keeps trading, changes queued.' : r.err });
  }
  function pill(v) {
    if (!v.on) return '<span class="pill plain">Disabled</span>';
    if (v.st === 'upgrading') return '<span class="pill info">Upgrading</span>';
    if (v.st === 'stopped') return `<span class="pill bad">Stopped &middot; ${v.q} queued</span>`;
    if (v.st === 'offline') return `<span class="pill bad">Offline &middot; ${v.q} queued</span>`;
    if (v.st === 'recovering') return '<span class="pill warn">Recovering</span>';
    if (v.err) return '<span class="pill warn">Online &middot; events held</span>';
    return '<span class="pill ok">Online</span>';
  }
  D.adapterCount = () => { const rows = D.s.ucon.rows.map(view); return { ok: rows.filter((v) => v.on && v.st === 'online').length, all: rows.length }; };
  D.adapterPill = (loc) => { const r = D.s.ucon && R(loc); return r ? pill(view(r)) : '<span class="pill ok">Online</span>'; };
  D.adapterLabel = (loc) => { const r = D.s.ucon && R(loc); return r ? `${ADP[r.a].id} ${r.ver}, mapping v${MP(r).ver}` : ''; };
  D.capOff = (loc) => { const r = D.s.ucon && R(loc); return r ? CAPS.filter(([k]) => !r.caps[k]).map(([, l]) => l) : []; };

  /* live ticks */
  setInterval(() => {
    const s = D.s; if (!s || !s.ucon) return;
    for (const r of s.ucon.rows) if (r.loc !== 'L-DT' && r.on && r.st === 'online' && Math.random() < 0.6) r.sync = Date.now() - Math.floor(Math.random() * 2500);
  }, 4000);

  /* json preview */
  function json(o, ind = '') {
    if (Array.isArray(o)) return '[' + o.map((x) => json(x, ind)).join(', ') + ']';
    if (o && typeof o === 'object') {
      const n = ind + '  ';
      return '{\n' + Object.entries(o).map(([k, v]) => `${n}<span class="k">"${E(k)}"</span>: ${json(v, n)}`).join(',\n') + '\n' + ind + '}';
    }
    if (typeof o === 'string') return `<span class="s">"${E(o)}"</span>`;
    return `<span class="n">${E(String(o))}</span>`;
  }

  /* panels */
  function inventory() {
    const s = D.s, u = s.ucon;
    return `<section class="panel"><div class="panel-h"><h3>Adapter inventory</h3><div class="ids"><span class="id">UCON05</span><span class="id">UCON12</span></div></div>
      <div class="tbl-wrap"><table class="t"><thead><tr><th>Merchant / location</th><th>Adapter</th><th>State</th><th>Last sync</th><th class="r">Queue</th><th>Last error</th><th class="r">Lifecycle</th></tr></thead><tbody>
      ${u.rows.map((r) => {
        const v = view(r), ad = ADP[r.a], m = MP(r), busy = !!r.busy, newer = r.ver !== ad.latest;
        return `<tr${v.err && v.on ? ' class="warnrow"' : ''}>
          <td><b>${E(r.merchant)}</b><div class="muted" style="font-size:12px">${E(r.name)} &middot; ${E(r.tag)}</div></td>
          <td style="min-width:190px"><b style="font-size:13px">${ad.name}</b><div class="muted" style="font-size:11.5px">${ad.sub}, ${ad.kind.toLowerCase()}</div><div class="mono muted" style="font-size:11px;white-space:nowrap">Class ${ad.cls} &middot; ${ad.id} ${r.ver} &middot; map v${m.ver}</div></td>
          <td>${pill(v)}</td>
          <td class="num" style="white-space:nowrap">${v.on ? D.ago(v.sync) : '<span class="muted">paused</span>'}</td>
          <td class="r num">${v.q}</td>
          <td style="font-size:12px;min-width:160px;max-width:230px">${v.err && v.on ? E(v.err) : '<span class="muted">None</span>'}</td>
          <td class="r"><div class="lc">${r.loc === 'L-DT'
            ? '<button class="btn sm" disabled title="Live demo store. Use the Store internet switch to see Offline Safe Mode">Disable</button>'
            : `<button class="btn sm ${r.on ? 'warn' : ''}" data-act="ucToggle" data-arg="${r.loc}" ${busy ? 'disabled' : ''}>${r.on ? 'Disable' : 'Enable'}</button>`}
            ${newer ? `<button class="btn sm" data-act="ucUpgrade" data-arg="${r.loc}" ${busy || !r.on ? 'disabled' : ''} title="Upgrade to ${ad.latest}">Upgrade ${ad.latest}</button>` : ''}
            ${r.prevVer ? `<button class="btn sm" data-act="ucVerBack" data-arg="${r.loc}" ${busy ? 'disabled' : ''} title="Back to the last known good version">Roll back to ${r.prevVer}</button>` : ''}</div></td></tr>`;
      }).join('')}
      </tbody></table></div>
      ${U().msg ? `<div class="panel-b" style="border-top:1px solid var(--line);font-size:13px;background:var(--warn-soft);color:var(--warn)">${E(U().msg)}</div>` : ''}</section>`;
  }

  function caps() {
    const u = U(), r = R(u.capSel) || R('L-DT'), ad = ADP[r.a];
    const off = CAPS.filter(([k]) => !r.caps[k]);
    const man = { interface: '1.0', adapter: `${ad.id} ${r.ver}`, location: r.loc, mode: 'read/write', entities: CAPS.filter(([k]) => r.caps[k]).map(([k]) => k), limits: LIMITS[r.a].length };
    return `<section class="panel"><div class="panel-h"><h3>Capability manifest</h3><div class="ids"><span class="id">UCON06</span><span class="id">AT69</span></div></div>
      <div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
        <label class="field" for="uc-cap">Location<select id="uc-cap" data-bind="ucon.capSel" data-rerender>${D.s.ucon.rows.map((x) => `<option value="${x.loc}" ${x.loc === r.loc ? 'selected' : ''}>${E(x.merchant)} - ${E(x.name)} (${ADP[x.a].id})</option>`).join('')}</select></label>
        <p class="muted" style="margin:0;font-size:12.5px">Declared by the adapter at handshake. In test you can switch an entity off to check that every screen degrades honestly.</p>
        <div class="capg">${CAPS.map(([k, l]) => `<button class="sw" data-act="ucCap" data-arg="${r.loc}:${k}" aria-pressed="${!!r.caps[k]}"><i></i>${l}</button>`).join('')}</div>
        <div style="font-size:12.5px"><b>What the platform does</b>${off.length ? `<ul style="margin:4px 0 0;padding-left:18px">${off.map(([k]) => `<li>${E(DEGRADE[k])}</li>`).join('')}</ul>` : '<div class="muted">Every entity is supplied, nothing is hidden.</div>'}</div>
        <div style="font-size:12.5px"><b>Known limits</b><ul style="margin:4px 0 0;padding-left:18px">${LIMITS[r.a].map((x) => `<li>${E(x)}</li>`).join('')}</ul></div>
        <pre class="json">${json(man)}</pre></div></section>`;
  }

  function mapping() {
    const u = U(), r = R(u.mapSel) || R('L-PS'), m = MP(r), t = MAPS[r.a], d = m.draft || m.doc;
    const st = new Map(d.status), it = new Map(d.items);
    const codes = [...new Set([...m.seen.status, ...d.status.map((x) => x[0])])], items = [...new Set([...m.seen.items, ...d.items.map((x) => x[0])])];
    const maxv = Math.max(...m.hist.map((h) => h.ver)), prev = m.hist.filter((h) => h.ver !== m.ver).slice(-1)[0];
    const sel = (code) => `<select class="mt-sel" data-uc="status" data-loc="${r.loc}" data-code="${E(code)}" aria-label="Canonical status for ${E(code)}"><option value="">Not mapped</option>${CANON.map((c) => `<option ${st.get(code) === c ? 'selected' : ''}>${c}</option>`).join('')}</select>`;
    return `<section class="panel"><div class="panel-h"><h3>Mapping configuration</h3><div class="ids"><span class="id">UCON04</span><span class="id">AT67</span></div></div>
      <div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:end">
          <label class="field" for="uc-map" style="flex:1 1 220px">Location<select id="uc-map" data-bind="ucon.mapSel" data-rerender>${D.s.ucon.rows.map((x) => `<option value="${x.loc}" ${x.loc === r.loc ? 'selected' : ''}>${E(x.merchant)} - ${E(x.name)}</option>`).join('')}</select></label>
          <span class="pill info">Active v${m.ver}${m.draft ? ' &middot; draft open' : ''}</span></div>
        <div class="tbl-wrap"><table class="t"><thead><tr><th>${t.src}</th><th>Canonical status</th><th class="r">Held</th></tr></thead><tbody>
          ${codes.map((c) => { const miss = !st.get(c); return `<tr${miss ? ' class="err"' : ''}><td class="mono">${E(c)}</td><td>${sel(c)}${miss ? '<div style="font-size:11.5px;color:var(--bad)">Not mapped. Events are held, never given a default.</div>' : ''}</td><td class="r num">${m.held[c] || 0}</td></tr>`; }).join('')}
        </tbody></table></div>
        <div class="tbl-wrap"><table class="t"><thead><tr><th>Source item code</th><th>Canonical service</th></tr></thead><tbody>
          ${items.map((c) => { const miss = !it.get(c); return `<tr${miss ? ' class="err"' : ''}><td class="mono">${E(c)}</td><td><input class="mt-sel mono" data-uc="item" data-loc="${r.loc}" data-code="${E(c)}" value="${E(it.get(c) || '')}" placeholder="svc.code" aria-label="Canonical service for ${E(c)}">${miss ? '<div style="font-size:11.5px;color:var(--bad)">Not mapped. Lines are held.</div>' : ''}</td></tr>`; }).join('')}
        </tbody></table></div>
        <div class="muted" style="font-size:12px">Money: ${t.money}. Times carry an explicit time zone.</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <button class="btn sm" data-act="ucValidate" data-arg="${r.loc}">Validate</button>
          <button class="btn sm pri" data-act="ucPublish" data-arg="${r.loc}" ${m.draft && m.valid && m.valid.ok ? '' : 'disabled'}>Publish v${maxv + 1}</button>
          <button class="btn sm" data-act="ucRollback" data-arg="${r.loc}" ${prev ? '' : 'disabled'}>${prev ? 'Roll back to v' + prev.ver : 'Roll back'}</button>
          ${m.draft ? `<button class="btn sm" data-act="ucDiscard" data-arg="${r.loc}">Discard draft</button>` : ''}</div>
        ${m.valid ? `<div style="font-size:12.5px;color:${m.valid.ok ? 'var(--ok)' : 'var(--bad)'}">${E(m.valid.text)}</div>` : ''}
        <div style="font-size:12.5px"><b>History</b>${m.hist.slice().reverse().map((h) => `<div class="row" style="padding:4px 0;border-bottom:1px solid var(--line)"><span><span class="mono">v${h.ver}</span> ${E(h.note)}<br><span class="muted">${E(h.by)} &middot; ${D.clock(h.at)}</span></span>${h.ver === m.ver ? '<span class="pill ok">Active</span>' : ''}</div>`).join('')}</div>
      </div></section>`;
  }

  function sample(shape) {
    if (shape === 'wbs') return { raw: { TicketNo: 5001, StatusCode: 30, CustNo: 7731, Total: 64.5, Rack: 'A-03' }, src: { pos: 'wbs-pos', record: '5001' } };
    return { raw: { orderId: 'a8f3c2e1-55d0', state: 'READY_FOR_PICKUP', totalMoney: { amount: 6450, currency: 'USD' }, customerId: 'cus_7Q2M', updatedAt: '2026-11-14T15:02:11Z' }, src: { pos: 'android-pos', record: 'a8f3c2e1-55d0' } };
  }
  function proof() {
    const one = (sh, loc, inv, rack) => {
      const r = R(loc), smp = sample(sh);
      const canon = { invoice: inv, status: 'Ready', total: { minor: 6450, currency: 'USD' }, rack: rack || 'not supplied by this POS', source: smp.src };
      return `<div style="display:flex;flex-direction:column;gap:8px;min-width:0"><div class="row"><b style="font-size:13px">${ADP[sh].name}</b><span class="mono muted" style="font-size:11px">${ADP[sh].id} ${r.ver} &middot; map v${MP(r).ver}</span></div>
        <div class="eyebrow">Record the adapter reads</div><pre class="json">${json(smp.raw)}</pre>
        <div class="eyebrow">Canonical record</div><pre class="json">${json(canon)}</pre></div>`;
    };
    return `<section class="panel"><div class="panel-h"><h3>Two real POS systems, one app</h3><div class="ids"><span class="id">AT66</span><span class="id">UCON21</span><span class="id">UCON03</span></div></div>
      <div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
        <p class="muted" style="margin:0;font-size:12.5px">The WBS POS and the Android POS that WBS picks after award run side by side in staging. Different ids, status codes and money formats go in. The same canonical record comes out.</p>
        <div class="grid g2" style="gap:14px">${one('wbs', 'L-PS', 'INV-PS-5001', 'A-03')}${one('android', 'L-AND', 'INV-AND-5001', null)}</div>
        <div class="appcard"><div class="row"><span class="eyebrow">Customer app &middot; build 1.0.0, same binary for both stores</span><span class="pill ok">Working</span></div>
          <div class="row" style="margin-top:6px"><b class="mono">Pier St No. 5001 &middot; Ready</b><b>$64.50 due</b></div><div class="muted" style="font-size:12px">Rack A-03 &middot; served by wbs-pos</div>
          <div class="row" style="margin-top:6px"><b class="mono">Android store No. 5001 &middot; Ready</b><b>$64.50 due</b></div><div class="muted" style="font-size:12px">Rack: not available from this store's POS &middot; served by android-pos</div></div>
        <p class="muted" style="margin:0;font-size:12.5px">No app binary change, no backend fork, no canonical data migration. Limits the Android POS declares (rack, loyalty) are shown, never filled in.</p>
      </div></section>`;
  }

  const SUITES = [['Connection', 4], ['Read', 7], ['Reversible write', 6], ['Duplicate and replay', 6], ['Offline queue and recovery', 6], ['Mapping validation', 5], ['Capability checks', 4]];
  function harness() {
    const u = U(), s = D.s.ucon, h = s.harness, builds = ['wbs-pos@1.0.0', 'wbs-pos@1.0.1', 'android-pos@1.0.0', 'android-pos@1.0.1'];
    const doneN = h ? h.res.reduce((a, x, i) => a + (x === 'pass' ? SUITES[i][1] : 0), 0) : 0;
    const lk = s.leak, dr = s.drill, bo = s.both;
    return `<section class="panel"><div class="panel-h"><h3>Contract test harness</h3><div class="ids"><span class="id">UCON13</span><span class="id">AT65</span><span class="id">AT79</span></div></div>
      <div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:end">
          <label class="field" for="uc-h" style="flex:1 1 200px">Adapter build<select id="uc-h" data-bind="ucon.hSel" data-rerender>${builds.map((b) => `<option value="${b}" ${b === u.hSel ? 'selected' : ''}>${b.replace('@', ' ')}${s.reports[b] ? ' (report on file)' : ' (new build)'}</option>`).join('')}</select></label>
          <button class="btn pri" data-act="ucHarness" ${h && h.running ? 'disabled' : ''}>${h && h.running ? 'Running...' : 'Run contract tests'}</button>
          <button class="btn" data-act="ucBoth" ${h && h.running ? 'disabled' : ''}>Run on both adapters</button></div>
        ${bo ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Suite</th><th class="r">wbs-pos 1.0.0</th><th class="r">android-pos 1.0.0</th></tr></thead><tbody>${SUITES.map(([n, c]) => `<tr><td>${n}</td><td class="r num">${c}/${c}</td><td class="r num">${c}/${c}</td></tr>`).join('')}</tbody></table></div>
          <div style="font-size:12.5px;color:var(--ok)">Same canonical results from both adapters. Differences only where a limit is declared (rack, loyalty).</div>` : ''}
        <ul class="suites">${SUITES.map(([n, c], i) => { const st = h ? h.res[i] : ''; return `<li class="${st}"><span class="d"></span><span>${n}</span><span class="cnt">${st === 'pass' ? c + '/' + c : c + ' checks'}</span></li>`; }).join('')}</ul>
        ${h ? `<div class="hbar"><i style="width:${Math.round(doneN / 38 * 100)}%"></i></div><div style="font-size:12.5px;${h.running ? '' : 'color:var(--ok)'}">${h.running ? `${E(h.build.replace('@', ' '))}: ${doneN} of 38 passed so far` : `${E(h.build.replace('@', ' '))}: 38 of 38 passed. Report kept as acceptance evidence (HTML + JUnit).`}</div>` : '<p class="muted" style="margin:0;font-size:12.5px">An adapter build cannot be enabled in production until it has a passing report.</p>'}
      </div></section>
      <section class="panel"><div class="panel-h"><h3>Framework checks</h3><div class="ids"><span class="id">UCON02</span><span class="id">UCON11</span></div></div>
        <div class="panel-b" style="display:flex;flex-direction:column;gap:14px">
          <div class="row"><span style="font-size:13px"><b>No POS names outside adapters</b> <span class="id">AT68</span></span><button class="btn sm" data-act="ucLeak" ${lk && lk.running ? 'disabled' : ''}>Scan code</button></div>
          ${lk ? `<div style="font-size:12.5px">${lk.running ? 'Scanning platform code for POS table, column and status names...' : `<span style="color:var(--ok)">0 found outside adapters.</span> <span class="muted">${lk.ids} POS identifiers checked across ${lk.areas} areas. Inside adapters/wbs-pos and adapters/android-pos is allowed.</span>`}</div>` : ''}
          <div class="row"><span style="font-size:13px"><b>Isolation drill</b> <span class="id">AT71</span></span><button class="btn sm" data-act="ucDrill" ${dr && dr.running ? 'disabled' : ''}>Stop Westside agent</button></div>
          ${dr ? `<div style="font-size:12.5px">${E(dr.text)}</div>` : ''}
          <p class="muted" style="margin:0;font-size:12.5px">AT68 looks for POS table, column and status names in the API, apps, website, portal, Super Admin, payments and delivery code. The drill stops one store's agent while another store keeps trading, then checks that the queue replays in order.</p>
          <div style="font-size:12.5px"><b>Offline Safe Mode, once for every adapter</b><ol style="margin:4px 0 0;padding-left:18px"><li>Settle unknown payments</li><li>Replay money events in order</li><li>Replay status events</li><li>Reconcile against the POS</li><li>Reopen online payment and dispatch</li></ol></div>
      </div></section>`;
  }

  D.views.connectors = {
    render(el) {
      const s = D.s, n = D.adapterCount(), q = s.ucon.rows.map(view).reduce((a, v) => a + v.q, 0);
      const k = (l, v, sub) => `<section class="panel kpi"><div class="eyebrow">${l}</div><div class="v">${v}</div><div class="s">${sub}</div></section>`;
      el.innerHTML = `
      <div class="view-head"><div><div class="eyebrow">Super Admin &middot; Connectors</div><h2>Universal POS connector</h2>
        <p>Every POS plugs in through an adapter. Apps, portal and Super Admin only see the canonical model. Two real POS systems are connected: the WBS POS and an Android POS that WBS picks after award.</p></div>
        <div class="ids"><span class="id">UCON01-UCON24</span><span class="id">AT65-AT80</span></div></div>
      <div class="grid g4">${k('Adapters reporting', `${n.ok}/${n.all}`, n.ok === n.all ? 'All locations healthy' : 'See the table below')}${k('On the WBS POS adapter', s.ucon.rows.filter((r) => r.a === 'wbs').length, `2 pilot stores, ${s.ucon.rows.filter((r) => r.a === 'wbs' && /^Synthetic/.test(r.tag)).length} synthetic`)}
        ${k('Second adapter', 'Android POS', 'Production adapter, POS picked by WBS after award')}${k('Queued events', q, q ? 'Waiting at local agents' : 'Nothing waiting')}</div>
      <div style="margin-top:16px">${inventory()}</div>
      <div class="grid g2" style="margin-top:16px">${caps()}${mapping()}</div>
      <div style="margin-top:16px">${proof()}</div>
      <div class="grid g2" style="margin-top:16px">${harness()}</div>`;
    },
  };

  /* actions */
  const live = (s0) => D.s === s0;
  A.ucToggle = async (loc) => {
    const s0 = D.s, r = R(loc); if (!r || r.loc === 'L-DT' || r.busy) return;
    const ad = ADP[r.a];
    if (r.on) {
      r.on = false; if (r.a === 'wbs') r.q = 3;
      D.log('ADMIN', `Adapter ${ad.id} ${r.ver} disabled for ${r.name}. Online payment and dispatch paused for ${r.name} only. Its POS keeps trading and changes wait at the agent.`, { cls: 'warn', edge: 'portal-api' });
      D.audit(WHO, 'Adapter disabled', `${r.tenant}/${r.loc}`, `${ad.id} ${r.ver}`);
      return;
    }
    r.busy = true; r.on = true; r.st = 'recovering';
    D.log('ADMIN', `Adapter enabled for ${r.name}. Handshake: interface 1.0, ${ad.id} ${r.ver}, mapping v${MP(r).ver}, capability manifest read.`, { edge: 'portal-api' });
    D.audit(WHO, 'Adapter enabled', `${r.tenant}/${r.loc}`, `${ad.id} ${r.ver}`);
    await D.wait(700); if (!live(s0)) return;
    if (r.q) { D.log('CONN', `${r.name}: replaying ${r.q} queued event(s) in order, money first, then status`, { cls: 'fin' }); await D.wait(700); if (!live(s0)) return; }
    r.q = 0; r.st = 'online'; r.sync = Date.now(); r.busy = false;
    D.log('API', `${r.name}: recovery check passed, online payment reopened. No other location was touched.`, { cls: 'ok' });
  };
  A.ucUpgrade = async (loc) => {
    const s0 = D.s, r = R(loc); if (!r || r.busy || !r.on) return;
    const ad = ADP[r.a], to = ad.latest, key = `${ad.id}@${to}`;
    if (!D.s.ucon.reports[key]) {
      U().msg = `Upgrade blocked: ${ad.id} ${to} has no passing contract test report yet. Run the harness on that build first.`;
      U().hSel = key;
      D.log('ADMIN', `Upgrade of ${r.name} to ${ad.id} ${to} blocked: no passing contract test report`, { cls: 'warn', edge: 'portal-api' });
      return;
    }
    U().msg = ''; r.busy = true; r.st = 'upgrading'; r.prevVer = r.ver;
    D.log('ADMIN', `Upgrade ${r.name}: ${ad.id} ${r.ver} to ${to}. Contract report on file (38 of 38 passed).`, { edge: 'portal-api' });
    D.audit(WHO, 'Adapter upgrade', `${r.tenant}/${r.loc}`, `${r.ver} to ${to}`);
    const steps = [`${r.name}: agent drains its queue, then pauses new reads`, `${r.name}: signed package ${ad.id}-${to} verified and installed, service restarted`, `${r.name}: handshake on ${to}, mapping v${MP(r).ver} and capability manifest unchanged`];
    for (const t of steps) { await D.wait(650); if (!live(s0)) return; D.log('CONN', t); }
    r.ver = to; r.st = 'online'; r.sync = Date.now(); r.busy = false;
    D.log('API', `${r.name} runs ${ad.id} ${to}. Every other location stays on its pinned version.`, { cls: 'ok' });
  };
  A.ucCap = (arg) => {
    const [loc, k] = String(arg).split(':'), r = R(loc); if (!r) return;
    r.caps[k] = !r.caps[k];
    const l = CAPS.find((x) => x[0] === k)[1];
    D.log('ADMIN', `${r.name}: capability "${l}" ${r.caps[k] ? 'declared again' : 'declared off'} in the ${ADP[r.a].id} manifest. ${r.caps[k] ? 'Screens show it again.' : 'Screens now show it as a limit. Nothing is dropped or made up.'}`, { cls: r.caps[k] ? '' : 'warn', edge: 'portal-api' });
    D.audit(WHO, 'Capability test change', `${r.tenant}/${r.loc}`, `${k} ${r.caps[k] ? 'on' : 'off'}`);
  };

  /* mapping editor */
  A.ucSetMap = (loc, kind, code, val) => {
    const r = R(loc), m = MP(r); if (!m.draft) m.draft = clone(m.doc);
    const list = m.draft[kind === 'item' ? 'items' : 'status'], hit = list.find((x) => x[0] === code);
    val = String(val || '').trim();
    if (hit) { if (val) hit[1] = val; else list.splice(list.indexOf(hit), 1); } else if (val) list.push([code, val]);
    m.valid = null; D.render();
  };
  document.addEventListener('change', (e) => { const t = e.target; if (t && t.dataset && t.dataset.uc) A.ucSetMap(t.dataset.loc, t.dataset.uc, t.dataset.code, t.value); });
  A.ucValidate = (loc) => {
    const r = R(loc), m = MP(r), d = m.draft || m.doc, st = new Map(d.status), it = new Map(d.items), errs = [];
    for (const c of new Set([...m.seen.status, ...d.status.map((x) => x[0])])) if (!CANON.includes(st.get(c))) errs.push(`status ${c} is not mapped`);
    for (const c of new Set([...m.seen.items, ...d.items.map((x) => x[0])])) if (!/^svc\.[a-z0-9_.]+$/.test(it.get(c) || '')) errs.push(`item ${c} needs a svc. code`);
    if (/card|pan|cvv|expir/i.test(JSON.stringify(d))) errs.push('card-like field found');
    m.valid = errs.length ? { ok: false, text: 'Not valid: ' + errs.join('; ') + '.' } : { ok: true, text: `Valid. ${d.status.length} status codes, ${d.items.length} item codes. Dry run on the last 200 events: nothing unmapped, no totals changed.` };
    if (!m.draft) m.valid.text += ' No draft to publish.';
    D.log('ADMIN', `${r.name}: mapping draft ${m.valid.ok ? 'validated' : 'failed validation'}`, { cls: m.valid.ok ? '' : 'warn', edge: 'portal-api' });
  };
  const diff = (a, b) => {
    const out = [];
    for (const k of ['status', 'items']) { const A0 = new Map(a[k]), B0 = new Map(b[k]); for (const [c, v] of B0) if (A0.get(c) !== v) out.push(`${c} to ${v}`); for (const c of A0.keys()) if (!B0.has(c)) out.push(`${c} removed`); }
    return out.join(', ') || 'no change';
  };
  A.ucPublish = async (loc) => {
    const s0 = D.s, r = R(loc), m = MP(r); if (!m.draft || !m.valid || !m.valid.ok) return;
    const ver = Math.max(...m.hist.map((h) => h.ver)) + 1, note = diff(m.doc, m.draft);
    m.hist.push({ ver, doc: clone(m.draft), by: WHO, at: Date.now(), note: 'published: ' + note });
    m.ver = ver; m.doc = m.draft; m.draft = null; m.valid = null;
    D.log('ADMIN', `${r.name}: mapping v${ver} published (${note}). No code deployed.`, { cls: 'ok', edge: 'portal-api' });
    D.audit(WHO, 'Mapping published', `${r.tenant}/${r.loc}`, `v${ver}: ${note}`);
    await D.wait(500); if (!live(s0)) return;
    const held = Object.values(m.held).reduce((a, x) => a + x, 0);
    D.log('CONN', `${r.name}: agent picked up mapping v${ver} in 2 s${held ? `, ${held} held event(s) released in order` : ''}`, { cls: held ? 'fin' : '' });
    m.held = {}; r.err = ''; r.sync = Date.now();
  };
  A.ucRollback = (loc) => {
    const r = R(loc), m = MP(r), prev = m.hist.filter((h) => h.ver !== m.ver).slice(-1)[0]; if (!prev) return;
    const from = m.ver;
    m.ver = prev.ver; m.doc = clone(prev.doc); m.draft = null; m.valid = null;
    m.hist.push({ ver: prev.ver, doc: clone(prev.doc), by: WHO, at: Date.now(), note: `rolled back from v${from}` });
    D.log('ADMIN', `${r.name}: mapping rolled back from v${from} to v${prev.ver}. Agent switched in 2 s, no code deployed.`, { cls: 'warn', edge: 'portal-api' });
    D.audit(WHO, 'Mapping rolled back', `${r.tenant}/${r.loc}`, `v${from} to v${prev.ver}`);
  };
  A.ucDiscard = (loc) => { const m = MP(R(loc)); m.draft = null; m.valid = null; D.render(); };

  /* version rollback */
  A.ucVerBack = async (loc) => {
    const s0 = D.s, r = R(loc); if (!r || r.busy || !r.prevVer) return;
    const ad = ADP[r.a], to = r.prevVer, from = r.ver;
    r.busy = true; r.st = 'upgrading';
    D.log('ADMIN', `${r.name}: roll back ${ad.id} ${from} to ${to} (last known good). Queue and checkpoints are kept.`, { cls: 'warn', edge: 'portal-api' });
    D.audit(WHO, 'Adapter rolled back', `${r.tenant}/${r.loc}`, `${from} to ${to}`);
    await D.wait(700); if (!live(s0)) return;
    r.ver = to; r.prevVer = null; r.st = 'online'; r.sync = Date.now(); r.busy = false;
    D.log('CONN', `${r.name}: ${ad.id} ${to} running again, handshake ok. No other location touched.`, { cls: 'ok' });
  };

  /* both adapters */
  A.ucBoth = async () => {
    const s0 = D.s, s = D.s.ucon; if (s.harness && s.harness.running) return;
    s.both = null;
    await A.ucHarness('wbs-pos@1.0.0'); if (!live(s0)) return;
    await A.ucHarness('android-pos@1.0.0'); if (!live(s0)) return;
    s.both = { at: Date.now(), same: true };
    D.log('TEST', 'Same harness on both adapters: 38 of 38 each. Canonical invoice records match; only declared limits differ (rack, loyalty). App build and backend unchanged.', { cls: 'ok' });
    D.audit('Contract harness', 'Cross-adapter run', 'wbs-pos + android-pos', '38/38 and 38/38');
  };

  /* contract tests */
  A.ucHarness = async (build) => {
    const s0 = D.s, s = D.s.ucon; if (s.harness && s.harness.running) return;
    const b = typeof build === 'string' && build.includes('@') ? build : U().hSel;
    U().hSel = b; U().msg = '';
    s.harness = { build: b, running: true, res: SUITES.map(() => '') };
    D.log('TEST', `Contract tests started for ${b.replace('@', ' ')} on a test location`);
    for (let i = 0; i < SUITES.length; i++) {
      s.harness.res[i] = 'run'; D.render();
      await D.wait(520); if (!live(s0)) return;
      s.harness.res[i] = 'pass';
      D.log('TEST', `${SUITES[i][0]}: ${SUITES[i][1]} of ${SUITES[i][1]} passed`, { cls: 'ok' });
    }
    s.harness.running = false; s.reports[b] = { pass: 38, of: 38, at: Date.now() };
    D.log('TEST', `${b.replace('@', ' ')}: 38 of 38 passed. Report saved for acceptance evidence.`, { cls: 'ok' });
    D.audit('Contract harness', 'Report saved', b, '38 of 38 passed');
  };
  A.ucLeak = async () => {
    const s0 = D.s, s = D.s.ucon; s.leak = { running: true };
    D.log('TEST', 'Scanning api, apps, website, portal, Super Admin, payments and delivery for POS table, column and status names');
    D.render(); await D.wait(1100); if (!live(s0)) return;
    s.leak = { running: false, ids: 412, areas: 7, outside: 0 };
    D.log('TEST', '0 POS identifiers found outside adapters. Matches inside adapters/wbs-pos and adapters/android-pos are allowed.', { cls: 'ok' });
  };
  A.ucDrill = async () => {
    const s0 = D.s, s = D.s.ucon, r = R('L-WS'); if ((s.drill && s.drill.running) || !r.on) return;
    s.drill = { running: true, text: 'Westside agent stopped. Downtown keeps trading.' };
    r.st = 'stopped'; r.q = 0;
    D.log('CONN', 'Westside agent stopped (drill). Westside paused for online payment and dispatch. Other locations unaffected.', { cls: 'err' });
    const evs = ['cash payment $18.00 on ticket 2209', 'ticket 2214 set to Ready', 'ticket 2216 dropped off'];
    for (const e of evs) {
      await D.wait(700); if (!live(s0)) return;
      r.q++; s.drill.text = `Westside agent stopped. ${r.q} event(s) queued at the store. Downtown keeps trading.`;
      D.log('CONN', `Westside POS: ${e}. Queued durably (${r.q} pending)`, { cls: 'warn' });
    }
    await D.wait(700); if (!live(s0)) return;
    r.st = 'recovering'; D.log('CONN', 'Westside agent restarted. Replay in order: money first, then status.');
    await D.wait(800); if (!live(s0)) return;
    r.q = 0; r.st = 'online'; r.sync = Date.now();
    s.drill = { running: false, text: 'Westside recovered: 3 events replayed in order, 0 lost, 0 duplicated. Downtown never paused.' };
    D.log('API', 'Westside recovery check passed. 3 replayed, 0 lost, 0 duplicated.', { cls: 'ok' });
  };
})();
