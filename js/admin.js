/* super admin */
(function () {
  const D = window.D, E = D.esc, M = D.money;
  const WHO = 'Platform admin (MFA)', WHO2 = 'Platform admin 2 (MFA)';
  D.adminFresh = () => ({ confirm: null, reason: '', ticket: 'SUP-1182', rotated: false, mloc: 'L-PAR', mres: null, mpend: null, mmsg: '' });
  D.ui.admin = D.adminFresh();
  const U = () => D.ui.admin;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* billing seed (ADM23) */
  function bseed() {
    return {
      plans: { STD: { name: 'Standard', fee: 4900, order: 10, cur: 'USD' }, 'STD-EU': { name: 'Standard EU', fee: 4500, order: 10, cur: 'EUR' },
        'STD-KR': { name: 'Standard KR', fee: 65000, order: 100, cur: 'KRW' }, 'STD-JP': { name: 'Standard JP', fee: 7000, order: 10, cur: 'JPY' } },
      subs: [
        { t: 'T-MAPLE', plan: 'STD', locs: 2, orders: 412, st: 'Active', acct: 'Authorize.Net, WBS account \u00b7 Visa \u2022\u20224417' },
        { t: 'T-HARBOR', plan: 'STD', locs: 2, orders: 0, st: 'Trial', acct: 'Trial until Dec 15, no card yet' },
        { t: 'T-CEDAR', plan: 'STD', locs: 1, orders: 57, st: 'Active', acct: 'Authorize.Net, WBS account \u00b7 Visa \u2022\u20220002', decline: true },
        { t: 'T-PARIS', plan: 'STD-EU', locs: 1, orders: 88, st: 'Active', acct: 'CyberSource, WBS account \u00b7 Mastercard \u2022\u20225100' },
        { t: 'T-SEOUL', plan: 'STD-KR', locs: 1, orders: 64, st: 'Active', acct: 'CyberSource, WBS account \u00b7 Visa \u2022\u20221881' },
        { t: 'T-TOKYO', plan: 'STD-JP', locs: 1, orders: 73, st: 'Active', acct: 'CyberSource, WBS account \u00b7 JCB \u2022\u20220025' },
      ],
      inv: [
        { no: 'WBS-2611-004', t: 'T-PARIS', per: 'Nov 2026', amt: 5380, cur: 'EUR', st: 'Paid' },
        { no: 'WBS-2611-003', t: 'T-CEDAR', per: 'Nov 2026', amt: 5470, cur: 'USD', st: 'Paid' },
        { no: 'WBS-2611-002', t: 'T-MAPLE', per: 'Nov 2026', amt: 13920, cur: 'USD', st: 'Paid' },
      ],
      next: 'Dec 2026', runs: {}, seq: 1,
    };
  }
  const seed0 = D.seed;
  D.seed = function () { const s = seed0(); s.billing = bseed(); return s; };

  /* markets */
  const COUNTRY = [['US', 'United States'], ['CA', 'Canada'], ['FR', 'France'], ['KR', 'South Korea'], ['JP', 'Japan']];
  const CURS = [['USD', 'USD'], ['CAD', 'CAD'], ['EUR', 'EUR'], ['KRW', 'KRW'], ['JPY', 'JPY']];
  const LANGS = [['en-US', 'English (en-US)'], ['fr-FR', 'French (fr-FR)'], ['ko-KR', 'Korean (ko-KR)'], ['ja-JP', 'Japanese (ja-JP)']];
  const TZS = ['America/Chicago', 'America/New_York', 'America/Toronto', 'Europe/Paris', 'Asia/Seoul', 'Asia/Tokyo'].map((z) => [z, z]);
  const PACKS = ['us 1.0', 'ca 1.0', 'fr-FR 1.0', 'ko-KR 1.0', 'ja-JP 1.0'].map((p) => [p, p]);
  const TAX = [['exclusive', 'Tax added on top (exclusive)'], ['inclusive', 'Prices include tax (inclusive)']];
  const LOC = (id) => { for (const t of D.s.tenants) for (const l of t.locations) if (l.id === id) return { t, l }; return null; };
  const init = (l) => { if (!l.mktHist) { l.mktHist = [{ ver: 1, cfg: clone(l.mkt), by: 'Setup in M1', at: Date.now() - 3 * 864e5, note: 'first market config' }]; l.mktVer = 1; } };
  const open = (loc) => (loc === 'L-DT' ? D.s.cloud.pay.filter((p) => ['session', 'submitted', 'unknown', 'approved', 'posting', 'pending-pos'].includes(p.state)).length
    : D.s.mkPay.filter((p) => p.loc === loc && ['session', 'submitted', 'unknown', 'approved'].includes(p.state)).length);
  const posCurs = (loc) => { const r = D.s.ucon && D.s.ucon.rows.find((x) => x.loc === loc); return r && r.curs ? r.curs : [LOC(loc).l.mkt.cur]; };
  const mdiff = (a, b) => Object.keys(b).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map((k) => `${k} ${[].concat(a[k]).join('+')} to ${[].concat(b[k]).join('+')}`).join(', ') || 'no change';

  function markets() {
    const u = U(), hit = LOC(u.mloc) || LOC('L-PAR'), t = hit.t, l = hit.l; init(l);
    const d = l.mktDraft || l.mkt, p0 = D.provFor(l.mkt.country), p1 = D.provFor(d.country);
    const sel = (key, label, opts) => `<label class="field">${label}<select data-mk="${key}">${opts.map(([v, lab]) => `<option value="${v}" ${d[key] === v ? 'selected' : ''}>${lab}</option>`).join('')}</select></label>`;
    const chips = (key, label, opts) => `<div class="field">${label}<div class="chips">${opts.map(([v]) => `<button class="chip" data-act="admMkChip" data-arg="${key}|${v}" aria-pressed="${d[key].includes(v)}">${v}</button>`).join('')}</div></div>`;
    const prev = l.mktHist.filter((h) => h.ver !== l.mktVer).slice(-1)[0], maxv = Math.max(...l.mktHist.map((h) => h.ver)), r = u.mres;
    const all = D.s.tenants.flatMap((x) => x.locations.map((y) => [y.id, `${x.name} - ${y.name}`]));
    return `<section class="panel" style="margin-top:16px"><div class="panel-h"><h3>Markets and languages</h3><div class="ids"><span class="id">ADM02</span><span class="id">GLB-OBJ-003</span><span class="id">GLB-017</span><span class="id">ADM24</span></div></div>
      <div class="panel-b mkgrid">
        <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
          <label class="field" for="adm-mloc">Merchant / location<select id="adm-mloc">${all.map(([v, lab]) => `<option value="${v}" ${v === l.id ? 'selected' : ''}>${E(lab)}</option>`).join('')}</select></label>
          <div class="mkf">${sel('country', 'Country / region', COUNTRY)}${sel('cur', 'Default currency', CURS)}${sel('lang', 'Default language', LANGS)}${sel('tz', 'Time zone', TZS)}${sel('pack', 'Country pack', PACKS)}${sel('tax', 'Tax display', TAX)}</div>
          ${chips('curs', 'Permitted currencies', CURS)}${chips('langs', 'Enabled languages', LANGS)}
          <dl class="kv" style="margin:0;font-size:12.5px"><dt>Payment provider (follows the country)</dt><dd><b>${p1}</b>${p1 !== p0 ? ` <span class="pill warn">was ${p0}</span>` : ''}</dd>
            <dt>Apple Pay</dt><dd>${l.mkt.apple ? '<span class="pill ok">Enabled</span>' : `<span class="pill plain" title="${E(l.mkt.why)}">Off</span>`}</dd>
            <dt>Google Pay</dt><dd>${l.mkt.google ? '<span class="pill ok">Enabled</span>' : `<span class="pill plain" title="${E(l.mkt.why)}">Off</span>`}</dd></dl>
          ${!l.mkt.apple || !l.mkt.google ? `<div class="muted" style="font-size:12px">${E(l.mkt.why)}. The checkout shows the wallet as unavailable with a reason; nothing falls back to another provider.</div>` : ''}
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <button class="btn sm" data-act="admMkDry">Dry run</button>
            <button class="btn sm pri" data-act="admMkAct" ${l.mktDraft && r && r.ok ? '' : 'disabled'}>Activate v${maxv + 1}</button>
            <button class="btn sm" data-act="admMkBack" ${prev ? '' : 'disabled'}>${prev ? 'Roll back to v' + prev.ver : 'Roll back'}</button>
            ${l.mktDraft ? '<button class="btn sm" data-act="admMkDiscard">Discard draft</button>' : ''}</div>
          ${r ? `<div style="font-size:12.5px"><b style="color:${r.ok ? 'var(--ok)' : 'var(--bad)'}">${r.ok ? 'Dry run passed' : 'Dry run failed'}</b><ul style="margin:4px 0 0;padding-left:18px">${r.errors.map((x) => `<li style="color:var(--bad)">${E(x)}</li>`).join('')}${r.notes.map((x) => `<li>${E(x)}</li>`).join('')}</ul></div>` : ''}
          ${u.mpend ? `<div class="panel-b" style="background:var(--warn-soft);border-radius:10px;font-size:12.5px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between"><span>Requested by ${E(u.mpend.by)} at ${D.clock(u.mpend.at)}. A second WBS admin must approve.</span><button class="btn sm pri" data-act="admMkApprove">Approve as second admin</button></div>` : ''}
          ${u.mmsg ? `<div class="muted" style="font-size:12px">${E(u.mmsg)}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;min-width:0">
          <div class="eyebrow">Active config \u00b7 v${l.mktVer} \u00b7 ${E(t.name)}</div>
          <pre class="json">${E(JSON.stringify({ country: l.mkt.country, currency: l.mkt.cur, permitted: l.mkt.curs, language: l.mkt.lang, enabled: l.mkt.langs, timeZone: l.mkt.tz, pack: l.mkt.pack, tax: l.mkt.tax, provider: p0 }, null, 2))}</pre>
          <div style="font-size:12.5px"><b>History</b>${l.mktHist.slice().reverse().map((h) => `<div class="row" style="padding:4px 0;border-bottom:1px solid var(--line)"><span><span class="mono">v${h.ver}</span> ${E(h.note)}<br><span class="muted">${E(h.by)} \u00b7 ${D.clock(h.at)}</span></span>${h.ver === l.mktVer ? '<span class="pill ok">Active</span>' : ''}</div>`).join('')}</div>
          <p class="muted" style="margin:0;font-size:12px">No code change, script or redeploy. Old invoices, payments and refunds keep their currency, tax and provider references.</p>
        </div></div></section>`;
  }

  function billing() {
    const b = D.s.billing, T = (id) => (D.s.tenants.find((x) => x.id === id) || { name: id }).name;
    const price = (pl) => `${D.fmt(pl.fee, pl.cur)} per location a month + ${D.fmt(pl.order, pl.cur)} per order`;
    return `<section class="panel" style="margin-top:16px"><div class="panel-h"><h3>Merchant billing</h3><div class="ctl"><span class="id">ADM23</span><button class="btn sm pri" data-act="admBill" ${b.runs[b.next] ? 'disabled' : ''}>${b.runs[b.next] ? 'Billed for ' + b.next : 'Run billing for ' + b.next}</button></div></div>
      <div class="tbl-wrap"><table class="t"><thead><tr><th>Merchant</th><th>Plan</th><th>Billing account</th><th>Status</th></tr></thead><tbody>
      ${b.subs.map((x) => { const pl = b.plans[x.plan]; return `<tr><td><b>${E(T(x.t))}</b><div class="muted" style="font-size:11.5px">${x.locs} location(s) \u00b7 ${x.orders} orders this month</div></td><td style="font-size:12.5px">${E(pl.name)}<div class="muted" style="font-size:11.5px">${E(price(pl))}</div></td><td style="font-size:12px">${E(x.acct)}</td>
        <td><span class="pill ${x.st === 'Active' ? 'ok' : x.st === 'Trial' ? 'info' : 'warn'}">${E(x.st)}</span>${x.note ? `<div class="muted" style="font-size:11.5px;max-width:220px">${E(x.note)}</div>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div>
      <div class="tbl-wrap"><table class="t"><thead><tr><th>Invoice</th><th>Merchant</th><th>Period</th><th class="r">Amount</th><th>Status</th></tr></thead><tbody>
      ${b.inv.slice(0, 8).map((x) => `<tr><td class="mono">${E(x.no)}</td><td>${E(T(x.t))}</td><td>${E(x.per)}</td><td class="r num">${D.fmt(x.amt, x.cur)}</td><td><span class="pill ${x.st === 'Paid' ? 'ok' : 'warn'}">${E(x.st)}</span></td></tr>`).join('')}
      </tbody></table></div>
      <div class="panel-b muted" style="font-size:12px">Charged on WBS-owned gateway accounts, never on the merchant's customer payment credentials. Each period is billed once. Plan price changes need a second WBS approver. An unpaid platform invoice never switches off the POS or customer payments by itself (ADM04, ROL12).</div></section>`;
  }

  function locHealth(t, l) {
    const s = D.s;
    if (t.state === 'Suspended') return '<span class="pill plain">Suspended</span>';
    return D.adapterPill(l.id);
  }

  D.views.admin = {
    render(el) {
      const s = D.s, u = U();
      const open = s.cloud.exc.filter((e) => e.state === 'open').length;
      const ac = D.adapterCount();
      const paused = s.holds.global;
      const k = (l, v, sub) => `<section class="panel kpi"><div class="eyebrow">${l}</div><div class="v">${v}</div><div class="s">${sub}</div></section>`;
      const conf = u.confirm;
      el.innerHTML = `
      <div class="view-head"><div><div class="eyebrow">Super Admin \u00b7 admin@platform.example \u00b7 MFA verified \u00b7 session ends in 14 min</div><h2>Platform control</h2>
        <p>Run by the platform owner, separate from store managers. It can onboard, pause and support merchants, but it can't edit invoice payments, create credit or see card data.</p></div>
        <div class="ids"><span class="id">ADM01-ADM24</span><span class="id">ROL10-ROL12</span><span class="id">SEC09</span></div></div>
      <div class="grid g4">${k('Merchants', s.tenants.length, ['Pilot', 'Synthetic', 'Staging'].map((x) => `${s.tenants.filter((t) => t.kind === x).length} ${x.toLowerCase()}`).join(' \u00b7 '))}${k('POS adapters', `${ac.ok}/${ac.all}`, ac.ok === ac.all ? 'All reporting' : 'See Connectors')}
        ${k('Open payment exceptions', open, open ? 'Needs a manager decision' : 'Nothing unresolved')}${k('Online payments', paused ? 'Paused' : 'On', paused ? 'Platform-wide hold active' : 'Per-store circuit breakers active')}</div>

      <section class="panel" style="margin-top:16px"><div class="panel-h"><h3>Merchants and locations</h3><div class="ctl"><button class="btn sm" data-act="goTab" data-arg="connectors">Connectors</button><button class="btn sm" data-act="admIso">Run cross-tenant access test</button></div></div>
        <div class="tbl-wrap"><table class="t"><thead><tr><th>Merchant</th><th>Status</th><th>Locations</th><th>Gateway</th><th>Terminals</th><th class="r">Controls</th></tr></thead><tbody>
        ${s.tenants.map((t) => { const held = s.holds.tenant[t.id]; return `<tr>
          <td><b>${E(t.name)}</b><div class="muted mono" style="font-size:11.5px">${t.id} \u00b7 ${t.kind}</div></td>
          <td><span class="pill ${t.state === 'Active' ? (held ? 'warn' : 'ok') : 'bad'}">${t.state}${held ? ' \u00b7 payments held' : ''}</span></td>
          <td>${t.locations.map((l) => `<div style="display:flex;gap:6px;align-items:center;margin:2px 0"><span style="white-space:nowrap">${E(l.name)}</span> ${locHealth(t, l)}</div>`).join('')}</td>
          <td class="mono" style="font-size:12px">${E(t.gateway)}<div class="muted" style="font-size:11px;font-family:var(--f-body)">${t.locations.map((l) => `${l.mkt.country} \u00b7 ${l.mkt.cur} \u00b7 ${l.mkt.lang}`).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div></td>
          <td style="font-size:12.5px">${t.id === 'T-MAPLE' ? 'Clover \u00b7 Ingenico \u00b7 Dejavoo<div class="muted" style="font-size:11.5px">All 3 live in each store \u00b7 models per D01</div>' : t.kind === 'Staging' ? '<span class="muted">Android POS staging, no terminals</span>' : '<span class="muted">Sandbox: all 3 routes</span>'}</td>
          <td class="r" style="white-space:nowrap"><button class="btn sm warn" data-act="admAsk" data-arg="tenant:${t.id}">${held ? 'Release hold' : 'Hold payments'}</button>
            ${t.kind === 'Synthetic' ? ` <button class="btn sm bad" data-act="admSuspend" data-arg="${t.id}">${t.state === 'Active' ? 'Suspend' : 'Reactivate'}</button>` : ''}</td></tr>`; }).join('')}
        </tbody></table></div>
        ${conf ? `<div class="panel-b" style="border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:10px;align-items:end;background:var(--warn-soft)">
          <div style="flex:1 1 260px"><b>${conf.label}</b><div class="muted" style="font-size:12.5px">Takes effect immediately on the server. Recorded with your name, time and reason.</div></div>
          <label class="field" for="adm-why" style="flex:1 1 220px">Reason (required)<input id="adm-why" data-bind="admin.reason" value="${E(u.reason)}" placeholder="e.g. Gateway incident INC-204"></label>
          <button class="btn pri" data-act="admConfirm">Confirm</button><button class="btn" data-act="admCancel">Cancel</button></div>` : ''}
      </section>

      <div class="grid g3" style="margin-top:16px">
        <section class="panel"><div class="panel-h"><h3>Emergency payment hold</h3><span class="pill ${paused ? 'warn' : 'ok'}">${paused ? 'Active' : 'Off'}</span></div><div class="panel-b" style="display:flex;flex-direction:column;gap:10px;font-size:13.5px">
          <p style="margin:0">Stops new online payments for every merchant at once. In-store POS, cash and terminals keep working. Payments already approved still post.</p>
          <button class="btn ${paused ? '' : 'warn'}" style="align-self:flex-start" data-act="admAsk" data-arg="global">${paused ? 'Release platform hold' : 'Pause all online payments'}</button></div></section>
        <section class="panel"><div class="panel-h"><h3>Support access</h3><span class="muted" style="font-size:12px">Time-limited</span></div><div class="panel-b" style="display:flex;flex-direction:column;gap:10px;font-size:13.5px">
          <div style="display:flex;gap:8px;align-items:end"><label class="field" for="adm-tk" style="flex:1">Ticket<input id="adm-tk" data-bind="admin.ticket" value="${E(u.ticket)}"></label><button class="btn" data-act="admSupport">Grant 30 min</button></div>
          ${s.support.length ? s.support.map((x) => `<div class="row"><span>${E(x.who)} \u00b7 Maple Downtown<br><span class="muted" style="font-size:12px">${E(x.ticket)} \u00b7 connector diagnostics, read-only \u00b7 ends ${D.clock(x.until)}</span></span><button class="btn sm" data-act="admRevoke" data-arg="${x.id}">Revoke</button></div>`).join('') : '<p class="muted" style="margin:0;font-size:12.5px">No one has access to merchant data right now. There is no permanent support login.</p>'}</div></section>
        <section class="panel"><div class="panel-h"><h3>Downtown devices + keys</h3></div><div class="panel-b"><dl class="kv" style="margin:0;font-size:13px">
          <dt>POS adapter</dt><dd>${E(D.adapterLabel('L-DT'))} \u00b7 ${s.conn.state}</dd><dt>Authorize.Net key</dt><dd class="mono">never displayed</dd><dt>Clover</dt><dd>paired \u00b7 \u2022\u20227731</dd><dt>Ingenico</dt><dd>paired \u00b7 \u2022\u20220452</dd><dt>Dejavoo</dt><dd>paired \u00b7 \u2022\u20222268</dd><dt>Outbox capacity</dt><dd>${s.conn.outbox.length} / 5,000</dd></dl>
          <button class="btn sm" style="margin-top:10px" data-act="admRotate" ${u.rotated ? 'disabled' : ''}>${u.rotated ? 'Rotation waiting for 2nd approver' : 'Rotate gateway key'}</button></div></section>
      </div>
      ${markets()}
      ${billing()}

      <section class="panel" style="margin-top:16px"><div class="panel-h"><h3>Platform audit</h3><span class="muted" style="font-size:12px">Includes reads and exports by platform staff</span></div>
        ${s.cloud.audit.filter((a) => a.actor.startsWith('Platform')).length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Time</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead><tbody>${s.cloud.audit.filter((a) => a.actor.startsWith('Platform')).slice(0, 20).map((a) => `<tr><td class="num">${D.clock(a.t)}</td><td>${E(a.action)}</td><td class="mono">${E(a.entity)}</td><td>${E(a.detail)}</td></tr>`).join('')}</tbody></table></div>`
        : '<div class="panel-b muted">Holds, suspensions, support sessions and key changes will appear here.</div>'}</section>`;
    },
  };

  const A = D.acts;
  A.admAsk = (arg) => {
    const s = D.s;
    if (arg === 'global') U().confirm = { scope: 'global', label: s.holds.global ? 'Release the platform-wide payment hold' : 'Pause online payments for all merchants' };
    else { const id = arg.split(':')[1], t = s.tenants.find((x) => x.id === id); U().confirm = { scope: 'tenant', id, label: (s.holds.tenant[id] ? 'Release payment hold for ' : 'Hold online payments for ') + t.name }; }
    U().reason = ''; D.render();
  };
  A.admCancel = () => { U().confirm = null; D.render(); };
  A.admConfirm = () => {
    const s = D.s, u = U(), c = u.confirm; if (!c) return;
    if (!u.reason.trim()) { u.reason = ''; const el = document.getElementById('adm-why'); if (el) { el.focus(); el.placeholder = 'A reason is required'; } return; }
    if (c.scope === 'global') s.holds.global = !s.holds.global; else s.holds.tenant[c.id] = !s.holds.tenant[c.id];
    const on = c.scope === 'global' ? s.holds.global : s.holds.tenant[c.id];
    D.log('ADMIN', `${on ? 'Payment hold applied' : 'Payment hold released'}: ${c.scope === 'global' ? 'all merchants' : c.id} \u00b7 reason "${u.reason}"`, { cls: on ? 'warn' : 'ok', edge: 'portal-api' });
    D.audit(WHO, on ? 'Payment hold applied' : 'Payment hold released', c.scope === 'global' ? 'ALL' : c.id, u.reason);
    u.confirm = null; u.reason = ''; D.render();
  };
  A.admSuspend = (id) => {
    const t = D.s.tenants.find((x) => x.id === id); t.state = t.state === 'Active' ? 'Suspended' : 'Active';
    D.log('ADMIN', `${t.name} ${t.state === 'Suspended' ? 'suspended: staff and customer logins and online payments disabled; POS records untouched' : 'reactivated'}`, { cls: 'warn', edge: 'portal-api' });
    D.audit(WHO, t.state === 'Suspended' ? 'Merchant suspended' : 'Merchant reactivated', id, 'Synthetic tenant test');
  };
  A.admSupport = () => {
    const u = U(), x = { id: 'S' + Date.now(), who: 'support.lee', ticket: u.ticket || 'SUP-?', until: Date.now() + 30 * 60e3 };
    D.s.support.unshift(x);
    D.log('ADMIN', `Support access granted to ${x.who} for Maple Downtown, 30 min, ticket ${x.ticket}. Expires automatically.`, { edge: 'portal-api' });
    D.audit(WHO, 'Support access granted', 'T-MAPLE/L-DT', `${x.who} \u00b7 ${x.ticket} \u00b7 30 min`);
  };
  A.admRevoke = (id) => { const s = D.s, x = s.support.find((y) => y.id === id); s.support = s.support.filter((y) => y.id !== id); D.log('ADMIN', `Support access for ${x.who} revoked`, { edge: 'portal-api' }); D.audit(WHO, 'Support access revoked', 'T-MAPLE/L-DT', x.who); };
  A.admRotate = () => { U().rotated = true; D.log('ADMIN', 'Gateway key rotation for Maple Downtown requested. Needs a second approver before it takes effect.', { edge: 'portal-api' }); D.audit(WHO, 'Key rotation requested', 'T-MAPLE', 'Dual approval pending'); };
  /* market config actions */
  const cur = () => { const h = LOC(U().mloc) || LOC('L-PAR'); init(h.l); return h; };
  const draft = (l) => { if (!l.mktDraft) l.mktDraft = clone(l.mkt); return l.mktDraft; };
  A.admMkSet = (key, val) => {
    const { l } = cur(), d = draft(l); d[key] = val;
    if (key === 'cur' && !d.curs.includes(val)) d.curs.push(val);
    if (key === 'lang' && !d.langs.includes(val)) d.langs.push(val);
    U().mres = null; U().mmsg = ''; D.render();
  };
  A.admMkChip = (arg) => {
    const [key, v] = String(arg).split('|'), { l } = cur(), d = draft(l), list = d[key], def = key === 'curs' ? d.cur : d.lang;
    if (list.includes(v)) { if (v === def) { U().mmsg = `${v} is the default, so it stays enabled.`; return D.render(); } list.splice(list.indexOf(v), 1); } else list.push(v);
    U().mres = null; U().mmsg = ''; D.render();
  };
  document.addEventListener('change', (e) => {
    const t = e.target; if (!t || !t.dataset) return;
    if (t.dataset.mk) A.admMkSet(t.dataset.mk, t.value);
    else if (t.id === 'adm-mloc') { Object.assign(U(), { mloc: t.value, mres: null, mpend: null, mmsg: '' }); D.render(); }
  });
  A.admMkDry = () => {
    const u = U(), { t, l } = cur(), d = l.mktDraft || l.mkt, a = l.mkt, errors = [], notes = [];
    const p0 = D.provFor(a.country), p1 = D.provFor(d.country), pc = posCurs(l.id), n = open(l.id);
    if (!l.mktDraft) notes.push('No changes in the draft.');
    if (!d.curs.includes(d.cur)) errors.push('The default currency must be one of the permitted currencies.');
    if (!d.langs.includes(d.lang)) errors.push('The default language must be enabled.');
    const bad = d.curs.filter((c) => !pc.includes(c));
    if (bad.length) errors.push(`The POS at this location records ${pc.join(', ')} only (adapter capability manifest). ${bad.join(', ')} would create amounts the POS cannot hold, so the change is rejected.`);
    if ((d.cur !== a.cur || p0 !== p1) && n) errors.push(`${n} payment(s) at this location are not settled yet. Currency and provider changes wait until they settle.`);
    if (p0 !== p1) notes.push(`Provider changes from ${p0} to ${p1}. Needs a second WBS approver (ROL12), and the new account and wallets are checked before activation.`);
    if (d.cur !== a.cur && !bad.length) notes.push(`Existing invoices keep ${a.cur}. ${d.cur} applies only to invoices created after activation.`);
    if (d.tz !== a.tz) notes.push('Delivery windows and reports use the new time zone from the activation time. Stored times stay in UTC.');
    if (d.lang !== a.lang || JSON.stringify(d.langs) !== JSON.stringify(a.langs)) notes.push(`Languages: ${d.langs.join(', ')} (default ${d.lang}). A language change never changes currency, tax or ids.`);
    if (d.pack !== a.pack) notes.push(`Country pack ${d.pack}: address and phone formats, tax display and receipt settings.`);
    if (d.tax !== a.tax) notes.push('Tax display only. The POS stays the tax authority (GLB-019).');
    u.mres = { ok: !errors.length && !!l.mktDraft, errors, notes, key: JSON.stringify(d), dual: p0 !== p1 || d.cur !== a.cur };
    D.log('ADMIN', `${t.name} ${l.name}: market config dry run ${errors.length ? 'failed: ' + errors[0] : 'passed'}`, { cls: errors.length ? 'warn' : '', edge: 'portal-api' });
    D.audit(WHO, 'Market dry run', `${t.id}/${l.id}`, errors.length ? 'failed' : 'passed');
  };
  const apply = (by) => {
    const u = U(), { t, l } = cur(), ver = Math.max(...l.mktHist.map((h) => h.ver)) + 1, note = mdiff(l.mkt, l.mktDraft);
    l.mktHist.push({ ver, cfg: clone(l.mktDraft), by, at: Date.now(), note: 'activated: ' + note });
    l.mkt = clone(l.mktDraft); l.mktVer = ver; l.mktDraft = null; u.mres = null; u.mpend = null;
    D.log('ADMIN', `${t.name} ${l.name}: market config v${ver} active (${note}). No code change or redeploy.`, { cls: 'ok', edge: 'portal-api' });
    D.audit(by, 'Market config activated', `${t.id}/${l.id}`, `v${ver}: ${note}`);
  };
  A.admMkAct = () => {
    const u = U(), { t, l } = cur(), r = u.mres;
    if (!l.mktDraft || !r || !r.ok || r.key !== JSON.stringify(l.mktDraft)) { u.mmsg = 'Run a dry run on this exact draft first.'; return D.render(); }
    if (r.dual) { u.mpend = { by: WHO, at: Date.now() }; D.log('ADMIN', `${t.name} ${l.name}: market change requested. Waiting for a second WBS admin.`, { cls: 'warn', edge: 'portal-api' }); D.audit(WHO, 'Market change requested', `${t.id}/${l.id}`, 'Dual approval pending'); return; }
    apply(WHO);
  };
  A.admMkApprove = () => { if (!U().mpend) return; apply(WHO2); };
  A.admMkBack = () => {
    const { t, l } = cur(), prev = l.mktHist.filter((h) => h.ver !== l.mktVer).slice(-1)[0]; if (!prev) return;
    const from = l.mktVer;
    l.mkt = clone(prev.cfg); l.mktVer = prev.ver; l.mktDraft = null; U().mres = null; U().mpend = null;
    l.mktHist.push({ ver: prev.ver, cfg: clone(prev.cfg), by: WHO, at: Date.now(), note: `rolled back from v${from}` });
    D.log('ADMIN', `${t.name} ${l.name}: market config rolled back from v${from} to v${prev.ver} (last known good).`, { cls: 'warn', edge: 'portal-api' });
    D.audit(WHO, 'Market config rolled back', `${t.id}/${l.id}`, `v${from} to v${prev.ver}`);
  };
  A.admMkDiscard = () => { const { l } = cur(); l.mktDraft = null; Object.assign(U(), { mres: null, mpend: null, mmsg: '' }); D.render(); };

  /* billing run */
  A.admBill = async () => {
    const b = D.s.billing, per = b.next;
    if (b.runs[per]) { D.log('ADMIN', `Billing for ${per} already ran. Nothing is charged twice.`); return; }
    b.runs[per] = true;
    D.log('ADMIN', `Billing run for ${per} started (scheduled job, one invoice per merchant and period)`, { edge: 'portal-api' });
    for (const x of b.subs) {
      await D.wait(350);
      const pl = b.plans[x.plan], name = (D.s.tenants.find((t) => t.id === x.t) || {}).name;
      if (x.st === 'Trial') { D.log('ADMIN', `${name}: trial until Dec 15, no invoice`); continue; }
      const amt = pl.fee * x.locs + pl.order * x.orders, no = `WBS-2612-${String(b.seq++).padStart(3, '0')}`;
      if (x.decline) {
        b.inv.unshift({ no, t: x.t, per, amt, cur: pl.cur, st: 'Retry 1 of 3' });
        x.st = 'Past due'; x.note = 'Card declined. Retry in 3 days, 7-day grace, then manual review. POS and customer payments keep working.';
        D.log('GW', `${name}: ${D.fmt(amt, pl.cur)} declined on the WBS billing account. Retry 1 of 3 scheduled. No suspension without approval.`, { cls: 'warn', edge: 'api-gw' });
      } else {
        b.inv.unshift({ no, t: x.t, per, amt, cur: pl.cur, st: 'Paid' });
        D.log('GW', `${name}: invoice ${no} ${D.fmt(amt, pl.cur)} charged in ${pl.cur} on the WBS ${x.acct.split(',')[0]} account`, { cls: 'ok', edge: 'api-gw' });
      }
    }
    D.audit(WHO, 'Billing run', 'ALL', per);
  };

  A.admIso = async () => {
    const tries = [
      ['Maple manager token', 'GET /v1/merchants/T-HARBOR/invoices/2001'],
      ['Customer C-1001 token', 'GET /v1/invoices/1043?customer=C-2207'],
      ['Driver Marco R. token', 'GET /v1/customers/C-1001/payments'],
      ['Counter staff token', 'POST /v1/refunds {invoice:1042}'],
    ];
    D.log('ADMIN', 'Cross-tenant and role escalation test started', { edge: 'portal-api' });
    for (const [who, req] of tries) { await D.wait(450); D.log('API', `${who}: ${req} \u2192 403 Forbidden, no data returned, attempt logged`, { cls: 'ok', edge: 'portal-api' }); }
    D.audit(WHO, 'Isolation test', 'ALL', '4 of 4 unauthorized requests denied');
  };
})();
