/* customer app + website */
(function () {
  const D = window.D, E = D.esc;
  const login0 = () => ({ step: 'email', code: '', tries: 5, err: '', sentAt: 0, expect: '', last: 0, locked: false });
  const fresh = () => ({ signed: true, tab: 'home', screen: null, inv: null, push: null, busy: false, lang: 'en', store: 'L-DT',
    pay: { stage: 'amount', mode: 'full', custom: '20.00', op: null, err: '' }, dlv: { win: 0, err: '', pick: {} }, login: login0(), prefs: { ready: true, pay: true, dlv: true },
    claim: { code: '', tries: 5, err: '', ok: '' }, tip: { sel: 300, op: null, busy: false } });
  D.ui.cust = fresh();
  D.custReset = () => { D.ui.cust = fresh(); };
  const U = () => D.ui.cust;
  const STEPS = ['Dropped off', 'In process', 'Ready', 'Picked up'];
  const WINS = ['Today \u00b7 5:00\u20137:00 PM', 'Wed Nov 4 \u00b7 9:00\u201311:00 AM', 'Wed Nov 4 \u00b7 5:00\u20137:00 PM', 'Thu Nov 5 \u00b7 5:00\u20137:00 PM'];
  D.WINS = WINS;
  const GIMG = [['suit', 'suit'], ['shirt', 'shirt'], ['dress', 'dress'], ['coat', 'coat'], ['tie', 'shirt']];
  D.garmentImg = (n) => { const k = GIMG.find(([w]) => String(n).toLowerCase().includes(w)); return `assets/images/${k ? k[1] : 'bags'}.jpg`; };

  /* language + store */
  const L = () => U().lang;
  const tt = (k, v) => D.t(L(), k, v);
  const isMk = () => U().store !== 'L-DT';
  const loc = () => D.locOf(U().store) || D.locOf('L-DT');
  const cur = () => (isMk() ? loc().mkt.cur : 'USD');
  const M = (c) => D.fmt(c, cur(), L());
  const prov = () => D.provFor(loc().mkt.country);
  const stName = (st) => tt('st_' + st);
  const iname = (x) => (x.code ? D.svcName(x.code, L()) : x.n);
  const imgOf = (x) => D.garmentImg(x.code ? D.svcEn(x.code) : x.n);
  const bgi = (x) => `background-image:url('${imgOf(x)}')`;
  const short = (n) => String(n).split(',')[0];
  const agoT = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 5 ? tt('ago_now') : s < 60 ? tt('ago_s', { n: s }) : tt('ago_m', { n: Math.round(s / 60) }); };
  const dropped = (i) => i.dropped || (i.at ? new Intl.DateTimeFormat(D.locale(L()), { month: 'short', day: 'numeric', timeZone: loc().mkt.tz }).format(new Date(i.at)) : '');
  const rack = (i) => (isMk() ? 'Rack ' + (i.rack || '-') : D.rackText(i));
  const first = () => (isMk() ? D.s.mk[U().store].cust.split(' ')[0] : 'Jordan');
  const storeName = () => (isMk() ? `${loc().tenant.name} \u00b7 ${loc().name}` : 'Maple Avenue Cleaners \u00b7 Downtown');
  const STORES = () => [['L-DT', 'Maple Avenue Cleaners, Downtown (US)'], ...Object.keys(D.s.mk).map((k) => { const l = D.locOf(k); return [k, `${l.tenant.name}, ${l.name} (${l.mkt.country})`]; })];
  const pillFor = (st) => ({ Ready: 'ok', 'In process': 'info', 'Dropped off': 'plain', 'Picked up': 'plain', Delivered: 'plain' }[st] || 'plain');
  const byId = (a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
  const myInv = () => (isMk() ? Object.values(D.s.mk[U().store].inv).sort(byId)
    : Object.values(D.s.cloud.inv).filter((i) => i.cust === 'C-1001' || D.s.cloud.claimed[i.id] === 'C-1001').sort(byId));
  const invOf = (id) => (isMk() ? D.mkInv(U().store, id) : D.s.cloud.inv[id]);
  const authInv = (id) => (isMk() ? D.mkInv(U().store, id) : D.s.pos.invoices[id]);
  const elig = (id) => (isMk() ? D.mkElig(U().store, id) : D.payElig(id));
  const findPay = (op) => (isMk() ? D.mkFind(op) : D.findPay(op));
  const activeDlv = (id) => (isMk() ? null : D.s.cloud.dlv.find((d) => d.inv.includes(id) && !['Cancelled', 'Rejected', 'Delivered'].includes(d.state)));
  const qty = (i) => i.items.reduce((a, x) => a + x.q, 0);
  const icon = {
    home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    orders: '<path d="M7 4h10v17l-5-3-5 3zM9.5 8h5M9.5 11.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    rewards: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    alerts: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  };

  function banner() {
    const s = D.s;
    if (s.holds.global || s.holds.tenant[isMk() ? loc().tenant.id : 'T-MAPLE']) return `<div class="stale" role="status">${tt('banner_hold')}</div>`;
    if (isMk()) return '';
    if (s.conn.state === 'offline') return `<div class="stale" role="status">${tt('banner_off', { t: D.clock(s.conn.lastSync) })}</div>`;
    if (s.conn.state === 'recovering') return `<div class="stale" role="status">${tt('banner_rec')}</div>`;
    return '';
  }
  const syncLine = (i) => `<div class="muted" style="font-size:11.5px">${tt(isMk() || D.s.conn.state === 'online' ? 'verified' : 'last_verified', { ago: agoT(i.syncedAt), v: i.ver })}</div>`;

  function topbar() {
    return `<div class="lsw"><div class="seg" role="group" aria-label="${E(tt('lang'))}">${D.LANGS.map(([k, lab]) => `<button data-act="custLang" data-arg="${k}" aria-pressed="${L() === k}">${lab}</button>`).join('')}</div>
      <select id="cust-store" aria-label="${E(tt('store'))}">${STORES().map(([k, l]) => `<option value="${k}" ${k === U().store ? 'selected' : ''}>${E(l)}</option>`).join('')}</select></div>`;
  }

  function home() {
    const ready = myInv().filter((i) => i.status === 'Ready');
    const open = myInv().filter((i) => ['Dropped off', 'In process'].includes(i.status));
    const Lo = isMk() ? null : D.s.cloud.loy['C-1001'];
    return `${topbar()}
      <div class="row" style="padding-top:4px"><div><div class="eyebrow">${E(storeName())}</div><h2 style="font-size:22px">${E(tt('hi', { n: first() }))}</h2></div>
        <button class="btn sm" data-act="custSignOut">${tt('sign_out')}</button></div>
      ${banner()}
      ${ready.map((i) => { const d = activeDlv(i.id); return `
        <div class="card" style="display:flex;flex-direction:column;gap:10px">
          <div class="media" style="${bgi(i.items[0])}"><span class="media-cap">${E(tt('ready_cap', { q: qty(i) }))}</span></div>
          <div class="tag"><small>${tt('ready_pickup')} \u00b7 ${E(rack(i))}</small><div class="row"><span class="tno">${E(tt('ticket_no', { id: i.id }))}</span><b>${E(tt('due', { a: M(D.bal(i)) }))}</b></div></div>
          ${d ? `<div class="row"><span style="font-size:13px">Delivery ${E(d.win)}</span><span class="pill ${d.state === 'Out for delivery' ? 'info' : 'warn'}">${E(d.state)}</span></div>` : ''}
          <div style="display:flex;gap:8px"><button class="btn pri" style="flex:1;justify-content:center" data-act="custPay" data-arg="${i.id}" ${D.bal(i) > 0 ? '' : 'disabled'}>${D.bal(i) > 0 ? tt('pay_now') : tt('paid')}</button>
          <button class="btn" style="flex:1;justify-content:center" data-act="custOpen" data-arg="${i.id}">${tt('details')}</button></div>
        </div>`; }).join('') || `<div class="card muted">${tt('nothing_ready')}</div>`}
      ${Lo ? `<div class="card row" data-act="custTab" data-arg="rewards" style="cursor:pointer"><div><div class="eyebrow">${tt('rewards')}</div><b class="num" style="font-size:18px">${E(tt('pts', { n: Lo.points.toLocaleString() }))}</b></div>
        <div style="text-align:right"><div class="eyebrow">${tt('credit')}</div><b class="num">${M(Lo.credit)}</b></div></div>` : ''}
      ${isMk() ? '' : `<button class="card row" style="text-align:left;font-size:13px" data-act="custClaimOpen"><span>${E(tt('claim_cta'))}</span><span class="muted">&rsaquo;</span></button>`}
      <div class="eyebrow">${tt('in_shop')}</div>
      ${open.map((i) => `<button class="card row" style="text-align:left" data-act="custOpen" data-arg="${i.id}"><span class="thumb" style="${bgi(i.items[0])}"></span><span style="flex:1"><b class="mono">${E(tt('ticket_no', { id: i.id }))}</b><br><span class="muted" style="font-size:12px">${E(tt('items_dropped', { q: qty(i), d: dropped(i) }))}</span></span><span class="pill ${pillFor(i.status)}">${E(stName(i.status))}</span></button>`).join('')}`;
  }

  function orders() {
    return `<h2 style="font-size:20px;padding-top:4px">${tt('orders')}</h2>${banner()}
      ${myInv().map((i) => `<button class="card" style="text-align:left;display:flex;flex-direction:column;gap:6px" data-act="custOpen" data-arg="${i.id}">
        <div class="row"><span style="display:flex;align-items:center;gap:10px"><span class="thumb" style="width:38px;height:38px;${bgi(i.items[0])}"></span><b class="mono">${E(tt('ticket_no', { id: i.id }))}</b></span><span class="pill ${pillFor(i.status)}">${E(stName(i.status))}</span></div>
        <div class="row muted" style="font-size:12px"><span>${E(tt('items_dropped', { q: qty(i), d: dropped(i) }))}</span><span class="num">${D.bal(i) > 0 ? E(tt('due', { a: M(D.bal(i)) })) : tt('paid')}</span></div></button>`).join('')}`;
  }

  function tipBox(i) {
    const u = U(), tip = D.s.tips.find((t) => t.inv === i.id);
    return `<div class="card"><div class="row"><b>${tt('tip_title')}</b><span class="muted" style="font-size:11.5px">Marco R.</span></div>
      ${tip ? `<div style="font-size:13px;color:var(--ok);margin-top:6px">${E(tt('tip_sent', { a: M(tip.amt) }))}</div><div class="muted mono" style="font-size:11px">${E(tip.ref || '')}</div>`
      : `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${[200, 300, 500].map((a) => `<button class="btn sm" data-act="custTipSel" data-arg="${a}" aria-pressed="${u.tip.sel === a}" style="${u.tip.sel === a ? 'border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)' : ''}">${M(a)}</button>`).join('')}
        <button class="btn sm pri" data-act="custTip" data-arg="${i.id}" ${u.tip.busy ? 'disabled' : ''}>${E(tt('pay_amt', { a: M(u.tip.sel) }))}</button></div>
        <div class="muted" style="font-size:11.5px;margin-top:6px">${E(tt('tip_note', { p: 'Authorize.Net', c: 'USD' }))}</div>`}</div>`;
  }

  function detail() {
    const i = invOf(U().inv), el = elig(i.id), d = activeDlv(i.id);
    const stepIx = i.status === 'Delivered' ? 3 : STEPS.indexOf(i.status);
    const pays = i.pays.map((p) => `<dt>${p.amt < 0 ? 'Refund' : p.kind} \u00b7 ${E(p.via)}</dt><dd>${p.amt < 0 ? '+' + M(-p.amt) : '-' + M(p.amt)}</dd>`).join('');
    return `
      <button class="btn sm" style="align-self:flex-start" data-act="custBack">${tt('back')}</button>
      <div class="tag"><small>${E(stName(i.status))} \u00b7 ${E(rack(i))} \u00b7 ${E(dropped(i))}</small><div class="tno">${E(tt('ticket_no', { id: i.id }))}</div></div>
      ${!isMk() && D.s.cloud.claimed[i.id] ? `<div class="pill info" style="align-self:flex-start">${E(tt('claimed_note'))}</div>` : ''}
      ${banner()}
      <div><div class="timeline">${STEPS.map((_, k) => `<div class="${k <= stepIx ? 'on' : ''}"></div>`).join('')}</div>
        <div class="row muted" style="font-size:10.5px;margin-top:4px"><span>${E(stName('Dropped off'))}</span><span>${E(stName('In process'))}</span><span>${E(stName('Ready'))}</span><span>${E(stName(i.status === 'Delivered' ? 'Delivered' : 'Picked up'))}</span></div></div>
      <div class="thumbs">${i.items.slice(0, 4).map((x) => `<figure><span style="${bgi(x)}"><b>${x.q}\u00d7</b></span><figcaption>${E(short(iname(x)))}</figcaption></figure>`).join('')}</div>
      <div class="card"><dl class="kv" style="margin:0">
        ${i.items.map((x) => `<dt>${x.q} \u00d7 ${E(iname(x))}</dt><dd>${M(x.q * x.p)}</dd>`).join('')}
        ${i.fees.map((f) => `<dt>${E(f.n)}</dt><dd>${M(f.amt)}</dd>`).join('')}
        <dt class="tot">${tt('total')}</dt><dd class="tot">${M(i.total + D.feeSum(i))}</dd>${pays}
        <dt class="tot">${tt('bal_due')}</dt><dd class="tot">${M(D.bal(i))}</dd></dl>
        ${isMk() ? `<div class="muted" style="font-size:11.5px;margin-top:6px">${E(cur())} \u00b7 ${D.DEC[cur()]} decimals \u00b7 ${E(loc().mkt.tax === 'inclusive' ? 'tax included, as the POS calculated it' : 'tax as calculated by the POS')}</div>` : ''}
        <div style="margin-top:8px">${syncLine(i)}</div></div>
      ${d ? `<div class="card"><div class="row"><b>Delivery ${E(d.id)}</b><span class="pill ${d.state === 'Delivered' ? 'ok' : 'warn'}">${E(d.state)}</span></div>
        <div class="muted" style="font-size:12.5px;margin-top:4px">${E(d.win)} \u00b7 fee ${M(d.fee)}${d.state === 'Requested' || d.state.startsWith('Intent') ? '<br>Not confirmed yet. The store will confirm the window.' : ''}</div></div>` : ''}
      ${!isMk() && i.status === 'Delivered' ? tipBox(i) : ''}
      <button class="btn pri" style="justify-content:center;padding:11px" data-act="custPay" data-arg="${i.id}" ${el.ok ? '' : 'disabled'}>${E(tt('pay_amt', { a: D.bal(i) > 0 ? M(D.bal(i)) : '' }))}</button>
      ${el.ok ? '' : `<div class="muted" style="font-size:12.5px;margin-top:-6px">${E(el.why)}</div>`}
      ${!isMk() && i.status === 'Ready' && !d ? `<button class="btn" style="justify-content:center;padding:10px" data-act="custDlv" data-arg="${i.id}">${tt('req_dlv')}</button>` : ''}
      <div class="muted" style="font-size:12px">${tt('not_closed')}</div>`;
  }

  function wallets() {
    const m = loc().mkt, W = [['Apple Pay', m.apple], ['Google Pay', m.google]], off = W.filter((w) => !w[1]).map((w) => w[0]);
    return `<div class="wal">${W.map(([w, on]) => `<button class="wbtn ${w === 'Apple Pay' ? 'ap' : 'gp'}" data-act="custWallet" data-arg="${w}" ${on ? '' : 'disabled'} title="${on ? w : E(tt('wallet_off'))}">${w}</button>`).join('')}</div>
      ${off.length ? `<div class="muted" style="font-size:11.5px">${off.join(', ')}: ${E(tt('wallet_off'))}</div>` : ''}
      <div class="or"><span>${E(tt('or_card'))}</span></div>`;
  }

  function payScreen() {
    const u = U(), i = invOf(u.inv), bal = D.bal(i), P = u.pay;
    const amt = P.mode === 'full' ? bal : D.toMinor(P.custom, cur());
    if (P.stage === 'amount') return `
      <button class="btn sm" style="align-self:flex-start" data-act="custBack">${tt('back')}</button>
      <h2 style="font-size:20px">${E(tt('pay_ticket', { id: i.id }))}</h2>
      <div class="card"><dl class="kv" style="margin:0"><dt>${tt('ticket_total')}</dt><dd>${M(i.total + D.feeSum(i))}</dd><dt>${tt('already_paid')}</dt><dd>-${M(D.paid(i))}</dd><dt class="tot">${tt('bal_due')}</dt><dd class="tot">${M(bal)}</dd></dl></div>
      <div role="radiogroup" aria-label="Amount" style="display:flex;flex-direction:column;gap:8px">
        <button class="card row" role="radio" aria-checked="${P.mode === 'full'}" data-act="custPayMode" data-arg="full" style="text-align:left;${P.mode === 'full' ? 'border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)' : ''}"><span>${tt('full_bal')}</span><b class="num">${M(bal)}</b></button>
        <div class="card" style="${P.mode === 'part' ? 'border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)' : ''}">
          <button class="row" role="radio" aria-checked="${P.mode === 'part'}" data-act="custPayMode" data-arg="part" style="all:unset;cursor:pointer;display:flex;justify-content:space-between;width:100%"><span>${tt('part')}</span><span class="muted" style="font-size:12px">${tt('rest_later')}</span></button>
          ${P.mode === 'part' ? `<label class="field" style="margin-top:8px" for="cust-part">${E(tt('amount_in', { c: cur() }))}<input id="cust-part" inputmode="decimal" data-bind="cust.pay.custom" value="${E(P.custom)}"></label>` : ''}</div></div>
      ${P.mode === 'part' && amt > 0 && amt <= bal ? `<div class="muted" style="font-size:12.5px">${tt('remaining_after')} <b class="num">${M(bal - amt)}</b></div>` : ''}
      ${P.err ? `<div class="stale" role="alert">${E(P.err)}</div>` : ''}
      <button class="btn pri" style="justify-content:center;padding:11px" data-act="custContinue" ${u.busy ? 'disabled' : ''}>${u.busy ? tt('checking') : tt('continue')}</button>`;
    if (P.stage === 'hosted') { const p = findPay(P.op); return `
      <div class="row"><b>${tt('secure_pay')}</b><button class="btn sm" data-act="custCancelPay">${tt('cancel')}</button></div>
      <div style="border:1px solid var(--line);border-radius:12px;overflow:hidden">
        <div style="background:var(--sunk);padding:8px 12px;font-size:11.5px;display:flex;gap:6px;align-items:center" class="muted"><svg width="12" height="12" viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" fill="none" stroke="currentColor" stroke-width="2"/></svg>Hosted payment form \u00b7 ${prov()} (sandbox) \u00b7 ${E(cur())}</div>
        <div style="padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--surface)">
          ${wallets()}
          <label class="field" for="hp-card">Card number<input id="hp-card" value="4111 1111 1111 1111" autocomplete="off"></label>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><label class="field" for="hp-exp">Expiry<input id="hp-exp" value="12/28"></label><label class="field" for="hp-cvv">CVV<input id="hp-cvv" value="123"></label><label class="field" for="hp-zip">${isMk() ? 'Postcode' : 'ZIP'}<input id="hp-zip" value="${isMk() ? '' : '60622'}"></label></div>
          <button class="btn pri" style="justify-content:center;padding:11px" data-act="custSubmit">${E(tt('pay_amt', { a: M(p.amt) }))}</button></div></div>
      <div class="muted" style="font-size:12px">${E(tt('card_note', { p: prov() }))}</div>`; }
    const p = findPay(P.op), st = p.state;
    if (st === 'posted' || st === 'pending-pos') {
      const fresh = U().cel !== P.op; if (fresh) U().cel = P.op;
      const check = `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="${st === 'posted' ? 'var(--ok)' : 'var(--warn)'}"/><path d="M17 29l7 7 15-16" fill="none" stroke="var(--surface)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const conf = [[-46, -30, '#2457e6'], [44, -36, '#22a35a'], [-38, 34, '#f5c84c'], [40, 30, '#7c4dff'], [0, -54, '#5b8cff'], [-56, 4, '#22a35a'], [56, 2, '#f5c84c'], [16, 48, '#2457e6']].map(([x, y, c]) => `<i class="cf" style="--x:${x}px;--y:${y}px;background:${c}"></i>`).join('');
      return `
      <div style="text-align:center;padding-top:20px;display:flex;flex-direction:column;gap:8px;align-items:center">
        ${fresh ? `<div class="celebrate"><i class="ring"></i><i class="ring"></i>${check}${conf}</div>` : check}
        <h2 style="font-size:22px">${tt('received')}</h2><div class="num" style="font-size:28px;font-family:var(--f-display);font-weight:800">${M(p.amt)}</div>
        ${st === 'pending-pos' ? `<div class="stale">The store system will update shortly. You will not be charged again.</div>` : ''}</div>
      <div class="card"><dl class="kv" style="margin:0"><dt>Ticket</dt><dd class="mono">${E(tt('ticket_no', { id: p.inv }))}</dd><dt>Card</dt><dd>${E(p.card)}</dd><dt>${E(prov())}</dt><dd class="mono">${E(p.ref)}</dd>
        <dt>${tt('store_update')}</dt><dd>${st === 'posted' ? `<span class="pill ok">${tt('posted')}</span>` : `<span class="pill warn">${tt('pending')}</span>`}</dd>
        <dt class="tot">${tt('remaining_bal')}</dt><dd class="tot">${st === 'posted' ? M(D.bal(authInv(p.inv))) : 'updating'}</dd></dl></div>
      <div class="muted" style="font-size:12.5px">Your order stays ready for pickup. A receipt was emailed to ${isMk() ? 'you' : 'jordan.lee@example.com'}.</div>
      <button class="btn" style="justify-content:center" data-act="custDone">${tt('done')}</button>`; }
    const done = (t) => `<li class="done"><span class="d"></span>${t}</li>`, now = (t) => `<li class="now"><span class="d"></span>${t}</li>`, warn = (t) => `<li class="fail"><span class="d"></span>${t}</li>`;
    return `<h2 style="font-size:20px;padding-top:6px">${E(tt('processing', { a: M(p.amt) }))}</h2><div class="card"><ul class="steps">
      ${done('Balance verified with the store system')}${done('Ticket locked against double collection')}
      ${st === 'submitted' ? now('Waiting for ' + prov()) : st === 'unknown' ? warn('No answer yet. Checking with ' + prov() + ' before doing anything else') : done('Approved by ' + prov())}
      ${['approved', 'posting'].includes(st) ? now('Posting to the store system') : ''}</ul></div>
      <div class="muted" style="font-size:12px">You can close the app. If it closes now, the payment still completes and is never charged twice.</div>`;
  }

  function dlvScreen() {
    const u = U(), i = D.s.cloud.inv[u.inv], c = D.s.pos.customers['C-1001'];
    return `<button class="btn sm" style="align-self:flex-start" data-act="custBack">${tt('back')}</button>
      <h2 style="font-size:20px">Delivery for No. ${i.id}</h2>${banner()}
      <div class="eyebrow">Choose a window</div>
      <div style="display:flex;flex-direction:column;gap:6px" role="radiogroup" aria-label="Delivery window">${WINS.map((w, k) => `<button class="card row" role="radio" aria-checked="${u.dlv.win === k}" data-act="custDlvWin" data-arg="${k}" style="text-align:left;padding:10px 12px;${u.dlv.win === k ? 'border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)' : ''}"><span style="font-size:13px">${w}</span><span class="muted" style="font-size:11.5px">${[2, 5, 4, 6][k]} left</span></button>`).join('')}</div>
      <div class="card" style="font-size:13px"><div class="eyebrow">Deliver to</div>${E(c.addr)}<div class="muted" style="font-size:12px">Address changes are confirmed by the store.</div></div>
      <div class="card row"><span>Delivery fee</span><b class="num">${M(800)}</b></div>
      <div class="muted" style="font-size:12px">The fee is added to your ticket once the store confirms. Delivery leaves only after the balance is paid.</div>
      ${u.dlv.err ? `<div class="stale" role="alert">${E(u.dlv.err)}</div>` : ''}
      <button class="btn pri" style="justify-content:center;padding:11px" data-act="custDlvSubmit">${tt('req_dlv')}</button>`;
  }

  function claimScreen() {
    const c = U().claim;
    return `<button class="btn sm" style="align-self:flex-start" data-act="custBack">${tt('back')}</button>
      <h2 style="font-size:20px">${tt('claim_title')}</h2>
      <div class="muted" style="font-size:12.5px">${tt('claim_hint')}</div>
      ${c.ok ? `<div class="card" style="font-size:13px;border-color:var(--ok)">${E(c.ok)}</div><button class="btn pri" style="justify-content:center" data-act="custOpen" data-arg="${E(c.inv)}">${E(tt('ticket_no', { id: c.inv }))}</button>`
      : `<label class="field" for="cl-code">${tt('claim_label')}<input id="cl-code" class="mono" data-bind="cust.claim.code" value="${E(c.code)}" placeholder="XXXX-XXXX" autocomplete="off"></label>
        ${c.err ? `<div class="stale" role="alert">${E(c.err)}</div>` : ''}
        <button class="btn pri" style="justify-content:center;padding:11px" data-act="custClaim" ${c.tries <= 0 ? 'disabled' : ''}>${tt('claim_btn')}</button>`}
      <div class="muted" style="font-size:11.5px">Demo: press Print receipt in the POS for a code, or try H4TR-9KXM (ticket 1039). EXPD-2Q4M is expired and USED-7K2P was already used.</div>`;
  }

  function rewards() {
    const Lo = D.s.cloud.loy['C-1001'];
    return `<h2 style="font-size:20px;padding-top:4px">${tt('rewards')}</h2>${banner()}
      <div class="grid g2" style="gap:10px"><div class="card"><div class="eyebrow">Points</div><div class="num" style="font-family:var(--f-display);font-size:26px;font-weight:800">${Lo.points.toLocaleString()}</div></div>
      <div class="card"><div class="eyebrow">${tt('credit')}</div><div class="num" style="font-family:var(--f-display);font-size:26px;font-weight:800">${M(Lo.credit)}</div></div></div>
      <div class="muted" style="font-size:12px">Balances come from the store's POS (last verified ${D.ago(Lo.syncedAt)}). Redeem at the counter.</div>
      <div class="card"><div class="eyebrow" style="margin-bottom:6px">History</div>${Lo.hist.map((h) => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line);font-size:13px"><span>${E(h.t)}<br><span class="muted" style="font-size:11.5px">${E(h.d)}</span></span><b class="num" style="color:${h.pts < 0 ? 'var(--bad)' : 'var(--ok)'}">${h.pts > 0 ? '+' : ''}${h.pts}</b></div>`).join('')}</div>`;
  }
  function alerts() {
    const n = D.s.cloud.notif, pr = U().prefs;
    const prefs = `<div class="card" style="font-size:12.5px;display:flex;flex-direction:column;gap:6px">
      <div class="eyebrow">How we reach you</div>
      <div>Mobile push in this app \u00b7 email \u00b7 browser push on the website</div>
      ${Object.entries(D.PREF_CATS).map(([k, l]) => `<button class="row" style="border:0;background:none;padding:2px 0;font:inherit;color:inherit;text-align:left" data-act="custPref" data-arg="${k}" aria-pressed="${pr[k]}"><span>${l}</span><span class="pill ${pr[k] ? 'ok' : 'plain'}">${pr[k] ? 'On' : 'Off'}</span></button>`).join('')}
      <div class="muted" style="font-size:11.5px">Order status always stays here in your account, even with a category off.</div></div>`;
    return `<h2 style="font-size:20px;padding-top:4px">${tt('nav_alerts')}</h2>${prefs}${n.length ? n.map((x) => `<div class="card"><div class="row"><b style="font-size:13.5px">${E(x.title)}</b><span class="muted" style="font-size:11px">${D.clock(x.at)}</span></div><div style="font-size:13px">${E(x.body)}</div></div>`).join('') : '<div class="card muted">No alerts yet. You will get one when an order is ready, a payment is received or a delivery moves.</div>'}`;
  }
  function login() {
    const Lg = U().login, left = Math.max(0, 300 - Math.round((Date.now() - Lg.sentAt) / 1000));
    if (Lg.step === 'email') return `<div style="padding-top:40px;display:flex;flex-direction:column;gap:14px"><div class="eyebrow">Maple Avenue Cleaners</div><h2 style="font-size:26px">Sign in</h2>
      <label class="field" for="lg-email">Email<input id="lg-email" value="jordan.lee@example.com"></label>
      <label class="field" for="lg-pass">Password<input id="lg-pass" type="password" value="demo-password"></label>
      <button class="btn pri" style="justify-content:center;padding:11px" data-act="custLoginNext">Continue</button>
      <div class="muted" style="font-size:12px">Every sign-in also needs a one-time code sent by SMS to your verified phone.</div></div>`;
    return `<div style="padding-top:40px;display:flex;flex-direction:column;gap:12px"><div class="eyebrow">Step 2 of 2</div><h2 style="font-size:24px">Enter the SMS code</h2>
      <div style="font-size:13px">We sent a 6-digit code to +1 (312) \u2022\u2022\u2022-\u2022\u202248.</div>
      <label class="field" for="lg-code">6-digit code<input id="lg-code" class="mono" inputmode="numeric" maxlength="6" data-bind="cust.login.code" value="${E(Lg.code)}" ${Lg.locked ? 'disabled' : ''}></label>
      ${Lg.err ? `<div class="stale" role="alert">${E(Lg.err)}</div>` : ''}
      <button class="btn pri" style="justify-content:center;padding:11px" data-act="custVerify" ${Lg.locked ? 'disabled' : ''}>Verify and sign in</button>
      <div class="row" style="font-size:12px"><span class="muted">${Lg.locked ? 'Locked for 15 min' : `Expires in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} \u00b7 ${Lg.tries} tries left`}</span><button class="btn sm" data-act="custResend">Send a new code</button></div>
      <div class="muted" style="font-size:11.5px">Lost your phone or changed number? Recovery needs a stronger check or help from the store, and old codes stop working.</div></div>`;
  }

  D.custPhone = function () {
    const u = U();
    let body;
    if (!u.signed) body = login();
    else if (u.screen === 'inv') body = detail();
    else if (u.screen === 'pay') body = payScreen();
    else if (u.screen === 'dlv') body = dlvScreen();
    else if (u.screen === 'claim') body = claimScreen();
    else body = { home, orders, rewards, alerts }[isMk() && u.tab === 'rewards' ? 'home' : u.tab]();
    const nav = u.signed && !u.screen ? `<nav class="app-nav">${['home', 'orders', 'rewards', 'alerts'].map((t) => `<button data-act="custTab" data-arg="${t}" aria-current="${u.tab === t}"><svg viewBox="0 0 24 24">${icon[t]}</svg>${tt('nav_' + t)}</button>`).join('')}</nav>` : '';
    return `<div class="phone"><div class="screen"><div class="notch"></div>
      <div class="sbar"><span>${D.clock()}</span><span>5G \u25ae\u25ae\u25ae</span></div>
      ${u.push ? `<div class="push" data-act="custPushClose" role="status"><b>${E(isMk() ? loc().tenant.name : 'Maple Avenue Cleaners')} \u00b7 ${E(u.push.title)}</b>${E(u.push.body)}</div>` : ''}
      <div class="app" id="cust-app" lang="${D.locale(L())}" data-keep="${u.screen || u.tab}">${body}</div>${nav}</div></div>`;
  };

  /* actions */
  const A = D.acts;
  A.custTab = (t) => { Object.assign(U(), { tab: t, screen: null }); D.render(); };
  A.custOpen = (id) => { Object.assign(U(), { screen: 'inv', inv: id }); D.render(); };
  A.custBack = () => { const u = U(); if (u.screen === 'pay' && u.pay.stage === 'hosted') A.custCancelPay(); u.screen = u.screen === 'pay' || u.screen === 'dlv' ? 'inv' : null; D.render(); };
  A.custLang = (k) => { U().lang = k; D.log('APP', `Language switched to ${D.locale(k)}. Currency, tax and ids stay as they are.`, { edge: 'app-api' }); };
  A.custStore = (k) => { Object.assign(U(), { store: k, screen: null, tab: 'home', inv: null }); const l = D.locOf(k); D.log('APP', `Store selected: ${l.tenant.name}, ${l.name} (${l.mkt.country}, ${l.mkt.cur}, ${D.provFor(l.mkt.country)})`, { edge: 'app-api' }); };
  document.addEventListener('change', (e) => { const t = e.target; if (t && t.id === 'cust-store') A.custStore(t.value); });
  A.custPay = (id) => { Object.assign(U(), { screen: 'pay', inv: id, pay: { stage: 'amount', mode: 'full', custom: U().pay.custom || '20.00', op: null, err: '' } }); D.render(); };
  A.custPayMode = (m) => { U().pay.mode = m; U().pay.err = ''; D.render(); };
  A.custContinue = async () => {
    const u = U(); if (u.busy) return;
    const i = invOf(u.inv), c = cur(), amt = u.pay.mode === 'full' ? D.bal(i) : D.toMinor(u.pay.custom, c);
    if (amt === -1) { u.pay.err = `${c} uses ${D.DEC[c]} decimal places. Enter a whole amount.`; return D.render(); }
    if (!(amt > 0)) { u.pay.err = `Enter an amount greater than ${M(0)}.`; return D.render(); }
    if (amt > D.bal(i)) { u.pay.err = `That is more than the ${M(D.bal(i))} due.`; return D.render(); }
    u.busy = true; u.pay.err = ''; D.render();
    const r = isMk() ? await D.mkCheckout.start(u.store, u.inv, amt) : await D.checkout.start(u.inv, amt);
    u.busy = false;
    if (r.err) { u.pay.err = r.err; } else { u.pay.op = r.op; u.pay.stage = 'hosted'; }
    D.render();
  };
  A.custCancelPay = () => { const u = U(); if (u.pay.op) (isMk() ? D.mkCheckout : D.checkout).cancel(u.pay.op); u.pay.stage = 'amount'; u.pay.op = null; D.render(); };
  A.custSubmit = async (w) => { const u = U(), wallet = typeof w === 'string' && /Pay$/.test(w) ? w : ''; u.pay.stage = 'processing'; D.render(); await (isMk() ? D.mkCheckout : D.checkout).submit(u.pay.op, wallet); D.render(); };
  A.custWallet = (w) => A.custSubmit(w);
  A.custDone = () => { Object.assign(U(), { screen: 'inv' }); D.render(); };
  A.custDlv = (id) => { Object.assign(U(), { screen: 'dlv', inv: id, dlv: { win: 0, err: '' } }); D.render(); };
  A.custDlvWin = (k) => { U().dlv.win = +k; D.render(); };
  A.custDlvSubmit = () => {
    const u = U(), r = D.dlvApi.request([u.inv], WINS[u.dlv.win]);
    if (r.err) { u.dlv.err = r.err; return D.render(); }
    u.screen = 'inv'; D.render();
  };
  A.custSignOut = () => { Object.assign(U(), { signed: false, screen: null, login: login0() }); D.log('APP', 'Signed out. Session revoked on the server.', { edge: 'app-api' }); };
  const sendSms = () => {
    const Lg = U().login;
    Lg.expect = String(100000 + Math.floor(Math.random() * 900000)); Lg.sentAt = Date.now(); Lg.last = Date.now(); Lg.code = ''; Lg.err = '';
    U().push = { title: 'SMS', body: `Your sign-in code is ${Lg.expect}. It expires in 5 minutes. Never share it.`, at: Date.now() };
    D.log('API', 'SMS one-time code sent to +1 \u2022\u2022\u2022-\u2022\u2022\u2022-0148 through the WBS-approved SMS provider. Single use, 5 min expiry, 5 tries, rate limited.', { edge: 'app-api' });
  };
  A.custLoginNext = () => { const Lg = U().login; Lg.step = 'sms'; Lg.tries = 5; Lg.locked = false; D.log('API', 'Email and password checked for jordan.lee@example.com. Second factor required.', { edge: 'app-api' }); sendSms(); };
  A.custResend = () => {
    const Lg = U().login;
    if (Lg.locked) return D.render();
    if (Date.now() - Lg.last < 30000) { Lg.err = `Wait ${Math.ceil((30000 - (Date.now() - Lg.last)) / 1000)} s before asking for a new code.`; return D.render(); }
    sendSms();
  };
  A.custVerify = () => {
    const u = U(), Lg = u.login; if (Lg.locked) return;
    const code = String(Lg.code || '').trim();
    if (Date.now() - Lg.sentAt > 300000) { Lg.err = 'This code has expired. Send a new one.'; D.log('API', 'SMS code rejected: expired', { cls: 'warn', edge: 'app-api' }); return D.render(); }
    if (code !== Lg.expect) {
      Lg.tries--; Lg.code = '';
      if (Lg.tries <= 0) { Lg.locked = true; Lg.err = 'Too many wrong codes. Sign-in is locked for 15 minutes. If you lost your phone, ask the store to help you recover the account.'; D.log('API', 'SMS code rejected 5 times: sign-in locked for 15 min, attempt logged', { cls: 'err', edge: 'app-api' }); }
      else { Lg.err = `That code is not right. ${Lg.tries} tries left.`; D.log('API', `SMS code rejected (${Lg.tries} tries left), attempt logged`, { cls: 'warn', edge: 'app-api' }); }
      return D.render();
    }
    Lg.expect = ''; Object.assign(u, { signed: true, tab: 'home', push: null });
    D.log('API', 'SMS code accepted and spent. Session issued; linked to POS customer C-1001 at Downtown only.', { cls: 'ok', edge: 'app-api' });
  };
  A.custSendCode = A.custLoginNext;
  A.custSignIn = A.custVerify;
  A.custClaimOpen = () => { Object.assign(U(), { screen: 'claim', claim: Object.assign(U().claim, { err: '', ok: '' }) }); D.render(); };
  A.custClaim = () => {
    const c = U().claim; if (c.tries <= 0) return;
    const r = D.claimUse(c.code, 'C-1001');
    if (r.err) {
      if (r.err === 'bad') c.tries--;
      c.err = c.tries <= 0 ? tt('claim_lock') : r.err === 'bad' ? tt('claim_bad', { n: c.tries }) : tt(r.err === 'exp' ? 'claim_exp' : 'claim_used');
      if (c.tries <= 0) D.log('API', 'Claim attempts used up: claim locked for 15 min for this account and device', { cls: 'err', edge: 'app-api' });
      return D.render();
    }
    Object.assign(c, { err: '', ok: tt('claim_ok', { id: r.inv }), inv: r.inv, code: '' }); D.render();
  };
  A.custTipSel = (a) => { U().tip.sel = +a; D.render(); };
  A.custTip = async (id) => {
    const t = U().tip; if (!t.op) t.op = D.opId('tip');
    t.busy = true; D.render();
    await D.tip(id, t.sel, t.op);
    t.busy = false; D.render();
  };
  A.custPushClose = () => { U().push = null; D.render(); };
  A.custPref = (k) => { const p = U().prefs; p[k] = !p[k]; D.log('APP', `Customer turned ${p[k] ? 'on' : 'off'} "${D.PREF_CATS[k]}" push and email. In-account status is kept.`, { edge: 'app-api' }); };
})();
