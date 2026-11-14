/* core: pos db, cloud, adapter */
(function () {
  const D = (window.D = { views: {}, acts: {}, ui: {}, flashing: {}, speed: 1 });
  let seq = 0;

  D.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  D.money = (c) => (c < 0 ? '-' : '') + '$' + (Math.abs(c) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  D.wait = (ms) => new Promise((r) => setTimeout(r, ms * D.speed));
  D.opId = (p) => p + '_' + Math.random().toString(36).slice(2, 7) + (++seq).toString(36);
  D.rand = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
  D.clock = (t = Date.now()) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  D.clockS = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  D.ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 5 ? 'just now' : s < 60 ? s + 's ago' : Math.round(s / 60) + ' min ago'; };
  D.sum = (a, f) => a.reduce((x, y) => x + f(y), 0);
  D.feeSum = (inv) => D.sum(inv.fees, (f) => f.amt);
  D.paid = (inv) => D.sum(inv.pays, (p) => p.amt);
  D.bal = (inv) => inv.total + D.feeSum(inv) - D.paid(inv);
  /* terminal routes (TER01) */
  D.TERMS = {
    Clover: { pfx: 'CLV-', how: 'WBS Clover developer account' },
    Ingenico: { pfx: 'ING-', how: 'Fiserv-certified app' },
    Dejavoo: { pfx: 'DJV-', how: 'SPIn API' },
  };
  D.isTerm = (d) => !!D.TERMS[d];
  D.PREF_CATS = { ready: 'Order ready', pay: 'Payments and points', dlv: 'Delivery updates' };
  D.devName = (d) => d;
  const copy = (o) => JSON.parse(JSON.stringify(o));

  /* seed data */
  const SHIRT = 'Shirt, laundered + pressed';
  function inv(id, status, items, pays, extra) {
    return Object.assign({ id, cust: 'C-1001', status, items, total: D.sum(items, (i) => i.q * i.p), fees: [], pays, ver: 0, rack: '', dropped: '' }, extra);
  }
  /* market config per location */
  const mkt = (country, cur, lang, langs, tz, pack, tax, apple, google, why) => ({ country, cur, curs: [cur], lang, langs, tz, pack, tax, apple, google, why: why || '' });
  D.MKT_US = () => mkt('US', 'USD', 'en-US', ['en-US'], 'America/Chicago', 'us 1.0', 'exclusive', true, true);
  const mi = (id, status, items, pays, extra) => Object.assign({ id, status, items, total: D.sum(items, (i) => i.q * i.p), fees: [], pays, ver: 0, rack: '', dropped: '' }, extra);
  D.seed = function () {
    const now = Date.now();
    const s = {
      link: true, gateway: true, driverOnline: true,
      conn: { state: 'online', outbox: [], pendingCmd: [], lastSync: now },
      inject: { drop: false, timeout: false },
      holds: { global: false, tenant: {} },
      role: 'manager',
      guards: {}, postedOps: {}, seenHooks: {}, log: [], driverQueue: [],
      tenants: [
        { id: 'T-MAPLE', name: 'Maple Avenue Cleaners', kind: 'Pilot', state: 'Active', gateway: 'Authorize.Net prod ref \u2022\u2022\u2022\u20224821',
          locations: [{ id: 'L-DT', name: 'Downtown', pilot: true, mkt: D.MKT_US() }, { id: 'L-WS', name: 'Westside', pilot2: true, mkt: D.MKT_US() }] },
        { id: 'T-HARBOR', name: 'Harbor Press Cleaners', kind: 'Synthetic', state: 'Active', gateway: 'Authorize.Net sandbox \u2022\u2022\u2022\u20220193',
          locations: [{ id: 'L-PS', name: 'Pier St', heartbeat: 'ok', mkt: D.MKT_US() }, { id: 'L-HC', name: 'Hillcrest', heartbeat: 'ok', mkt: D.MKT_US() }] },
        { id: 'T-CEDAR', name: 'Cedar Lane Cleaners', kind: 'Synthetic', state: 'Active', gateway: 'Authorize.Net sandbox \u2022\u2022\u2022\u20227710',
          locations: [{ id: 'L-MS', name: 'Main St', heartbeat: 'ok', mkt: mkt('CA', 'CAD', 'en-US', ['en-US', 'fr-FR'], 'America/Toronto', 'ca 1.0', 'exclusive', true, true) }] },
        { id: 'T-PARIS', name: 'Pressing de la Seine', kind: 'Synthetic', state: 'Active', gateway: 'CyberSource test \u2022\u2022\u2022\u20223310',
          locations: [{ id: 'L-PAR', name: 'Paris 11e', heartbeat: 'ok', mkt: mkt('FR', 'EUR', 'fr-FR', ['fr-FR', 'en-US'], 'Europe/Paris', 'fr-FR 1.0', 'inclusive', true, true) }] },
        { id: 'T-SEOUL', name: 'Hangang Cleaners', kind: 'Synthetic', state: 'Active', gateway: 'CyberSource test \u2022\u2022\u2022\u20225527',
          locations: [{ id: 'L-SEL', name: 'Seoul Mapo', heartbeat: 'ok', mkt: mkt('KR', 'KRW', 'ko-KR', ['ko-KR', 'en-US'], 'Asia/Seoul', 'ko-KR 1.0', 'inclusive', false, false, 'Wallets not enabled on this CyberSource account in KR yet') }] },
        { id: 'T-TOKYO', name: 'Sakura Cleaning', kind: 'Synthetic', state: 'Active', gateway: 'CyberSource test \u2022\u2022\u2022\u20228804',
          locations: [{ id: 'L-TYO', name: 'Tokyo Shibuya', heartbeat: 'ok', mkt: mkt('JP', 'JPY', 'ja-JP', ['ja-JP', 'en-US'], 'Asia/Tokyo', 'ja-JP 1.0', 'inclusive', true, false, 'Google Pay not approved for this merchant account in JP yet') }] },
        { id: 'T-AND', name: 'Android POS test merchant', kind: 'Staging', state: 'Active', gateway: 'Authorize.Net sandbox \u2022\u2022\u2022\u20224410',
          locations: [{ id: 'L-AND', name: 'Staging store', heartbeat: 'ok', mkt: D.MKT_US() }] },
      ],
      support: [],
      /* market stores */
      mk: {
        'L-PAR': { tenant: 'T-PARIS', cust: 'Camille Martin', inv: {
          'P-2107': mi('P-2107', 'Ready', [{ code: 'suit.2pc', q: 1, p: 1900 }, { code: 'shirt.press', q: 4, p: 450 }], [{ kind: 'Deposit', via: 'Cash', amt: 1000, ref: '' }], { rack: 'A-02', at: now - 2 * 864e5 }),
          'P-2111': mi('P-2111', 'In process', [{ code: 'comforter', q: 1, p: 3200 }], [], { at: now - 864e5 }) } },
        'L-SEL': { tenant: 'T-SEOUL', cust: 'Minji Kim', inv: {
          'S-0412': mi('S-0412', 'Ready', [{ code: 'suit.2pc', q: 1, p: 25000 }, { code: 'shirt.press', q: 5, p: 4000 }], [{ kind: 'Deposit', via: 'Cash', amt: 10000, ref: '' }], { rack: 'C-11', at: now - 3 * 864e5 }),
          'S-0415': mi('S-0415', 'In process', [{ code: 'dress.silk', q: 1, p: 18000 }], [], { at: now - 864e5 }) } },
        'L-TYO': { tenant: 'T-TOKYO', cust: 'Yuki Sato', inv: {
          'T-7730': mi('T-7730', 'Ready', [{ code: 'suit.2pc', q: 1, p: 2200 }, { code: 'shirt.press', q: 3, p: 350 }], [], { rack: 'B-05', at: now - 2 * 864e5 }),
          'T-7734': mi('T-7734', 'In process', [{ code: 'coat.wool', q: 1, p: 2800 }], [], { at: now - 864e5 }) } },
      },
      mkPay: [], tips: [],
      /* claim codes */
      claims: { 'H4TR-9KXM': { inv: '1039', loc: 'L-DT', exp: now + 29 * 864e5, used: false },
        'EXPD-2Q4M': { inv: '1031', loc: 'L-DT', exp: now - 864e5, used: false }, 'USED-7K2P': { inv: '1027', loc: 'L-DT', exp: now + 20 * 864e5, used: true } },
      pos: {
        rowver: 51207,
        customers: { 'C-1001': { name: 'Jordan Lee', phone: '(312) 555-0148', email: 'jordan.lee@example.com', addr: '1820 W Maple Ave, Apt 3B', charge: false },
          'C-1090': { name: 'J Lee', phone: 'none on file', email: '', addr: '', charge: false, walkin: true } },
        loyalty: { 'C-1001': { points: 1240, credit: 1000, hist: [
          { d: 'Oct 30', t: 'Earned on ticket 1031', pts: 48 },
          { d: 'Oct 12', t: 'Redeemed at counter', pts: -200 },
          { d: 'Oct 09', t: 'Earned on ticket 1027', pts: 64 } ] }, 'C-1090': { points: 0, credit: 0, hist: [] } },
        invoices: {
          1042: inv('1042', 'Ready', [{ n: 'Suit, 2-piece', q: 2, p: 2200 }, { n: SHIRT, q: 6, p: 350 }, { n: 'Dress, silk', q: 1, p: 1900 }, { n: 'Overcoat, wool', q: 1, p: 1600 }],
            [{ id: 'PAY-88120', kind: 'Deposit', via: 'Cash', amt: 3000, ref: '', at: now - 4 * 864e5 }], { rack: 'B-14', dropped: 'Fri Oct 30' }),
          1043: inv('1043', 'In process', [{ n: 'Comforter, king', q: 1, p: 3800 }, { n: 'Trousers', q: 3, p: 750 }], [], { dropped: 'Mon Nov 2' }),
          1045: inv('1045', 'Dropped off', [{ n: SHIRT, q: 5, p: 350 }], [], { dropped: 'Today' }),
          1031: inv('1031', 'Picked up', [{ n: 'Suit, 2-piece', q: 1, p: 2200 }, { n: SHIRT, q: 4, p: 350 }, { n: 'Tie', q: 2, p: 600 }],
            [{ id: 'PAY-87911', kind: 'Payment', via: 'Clover', amt: 4800, ref: 'CLV-20417', at: now - 5 * 864e5 }], { dropped: 'Oct 24' }),
          1027: inv('1027', 'Delivered', [{ n: 'Drapes, per panel', q: 4, p: 1600 }],
            [{ id: 'PAY-87602', kind: 'Payment', via: 'Authorize.net', amt: 6400, ref: '60219934417', at: now - 25 * 864e5 }], { dropped: 'Oct 05' }),
          1039: Object.assign(inv('1039', 'In process', [{ n: SHIRT, q: 3, p: 350 }, { n: 'Trousers', q: 1, p: 750 }], [], { dropped: 'Thu Oct 29' }), { cust: 'C-1090' }),
        },
      },
      cloud: { inv: {}, loy: {}, pay: [], exc: [], dlv: [], audit: [], notif: [], loyReq: [], claimed: {} },
    };
    for (const i of Object.values(s.pos.invoices)) { i.ver = ++s.pos.rowver; s.cloud.inv[i.id] = Object.assign(copy(i), { syncedAt: now }); }
    for (const m of Object.values(s.mk)) for (const i of Object.values(m.inv)) { i.ver = ++s.pos.rowver; i.syncedAt = now; }
    s.cloud.loy['C-1001'] = Object.assign(copy(s.pos.loyalty['C-1001']), { syncedAt: now });
    return s;
  };
  D.locOf = (id) => { for (const t of D.s.tenants) for (const l of t.locations) if (l.id === id) return Object.assign({ tenant: t }, l); return null; };

  /* trace log + render */
  D.log = (src, msg, o = {}) => {
    D.s.log.unshift({ id: ++seq, t: Date.now(), src, msg, op: o.op || '', cls: o.cls || '' });
    if (D.s.log.length > 300) D.s.log.length = 300;
    if (o.edge) D.flash(o.edge);
    D.render();
  };
  D.flash = (e) => { [].concat(e).forEach((k) => (D.flashing[k] = Date.now())); setTimeout(D.render, 1000); };
  D.audit = (actor, action, entity, detail) => {
    D.s.cloud.audit.unshift({ t: Date.now(), actor, action, entity, detail });
  };
  let raf = 0;
  D.render = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; D.paint && D.paint(); }); };

  /* notifications */
  D.notify = (key, title, body) => {
    const n = D.s.cloud.notif;
    if (n.some((x) => x.key === key)) { D.log('API', `Notification "${key}" already sent, duplicate suppressed`); return; }
    n.unshift({ key, title, body, at: Date.now() });
    // NOT02, NOT06: channels can be off, status stays in the account
    const cat = /^(pay|loy)/.test(key) ? 'pay' : /^(dlv|delivered)/.test(key) ? 'dlv' : 'ready';
    const pref = D.ui.cust && D.ui.cust.prefs;
    D.log('API', pref && !pref[cat] ? `In-account status only (customer turned off "${D.PREF_CATS[cat]}" alerts): ${title}` : `Mobile push, browser push + email queued: ${title}`, { edge: 'app-api' });
    const c = D.ui.cust; if (c && !(pref && !pref[cat])) { c.push = { title, body, at: Date.now() }; setTimeout(() => { if (c.push && Date.now() - c.push.at >= 4400) { c.push = null; D.render(); } }, 4500); }
  };

  /* payment guard */
  D.guard = {
    take(id, by, op) { const g = D.s.guards[id]; if (g && g.op !== op) return false; D.s.guards[id] = { by, op, at: Date.now() }; return true; },
    free(id, op) { const g = D.s.guards[id]; if (g && g.op === op) delete D.s.guards[id]; },
  };

  /* pos -> cloud sync */
  D.posTouch = (id, why, o = {}) => {
    const s = D.s, p = s.pos.invoices[id];
    p.ver = ++s.pos.rowver;
    const ev = { id, ver: p.ver, why, fin: !!o.fin, at: Date.now() };
    if (s.link) setTimeout(() => { if (D.s === s) s.link ? D.deliver(ev) : D.queue(ev); }, 700 * D.speed);
    else D.queue(ev);
  };
  D.queue = (ev) => {
    D.s.conn.outbox.push(ev);
    D.log('CONN', `Cloud unreachable: "${ev.why}" on ticket ${ev.id} saved to local outbox (${D.s.conn.outbox.length} pending)`, { cls: 'warn', edge: 'conn-sql' });
  };
  D.deliver = (ev, replay) => {
    const s = D.s, p = s.pos.invoices[ev.id], prev = s.cloud.inv[ev.id];
    if (prev && prev.ver >= p.ver) { D.log('CONN', `Ticket ${ev.id} rowversion ${ev.ver} already current in cloud, skipped (no duplicate effect)`); return; }
    const before = prev ? prev.status : null;
    s.cloud.inv[ev.id] = Object.assign(copy(p), { syncedAt: Date.now() });
    s.cloud.loy[p.cust] = Object.assign(copy(s.pos.loyalty[p.cust]), { syncedAt: Date.now() });
    s.conn.lastSync = Date.now();
    D.log('CONN', `${replay ? 'Replayed' : 'Synced'} ticket ${ev.id} to cloud (rowversion ${p.ver}: ${ev.why})`, { edge: 'api-conn', cls: ev.fin ? 'fin' : '' });
    if (before !== p.status && (p.cust === 'C-1001' || s.cloud.claimed[p.id])) {
      if (p.status === 'Ready') D.notify('ready-' + p.id, 'Ready for pickup', `Ticket ${p.id} is ready at Maple Avenue Cleaners, Downtown. Balance ${D.money(D.bal(p))}.`);
      if (p.status === 'Delivered') D.notify('delivered-' + p.id, 'Delivered', `Ticket ${p.id} was delivered. Thank you!`);
      if (p.status === 'Picked up') D.notify('picked-' + p.id, 'Picked up', `Ticket ${p.id} was picked up at the counter.`);
    }
  };

  /* connectivity + recovery gate */
  D.setLink = async (on, why) => {
    const s = D.s;
    if (!on) {
      if (!s.link) return;
      s.link = false; s.conn.state = 'offline';
      D.log('CONN', why || 'Store internet down: connector cannot reach the cloud. POS keeps working on the local network.', { cls: 'err', edge: 'api-conn' });
      D.log('API', 'Two heartbeats missed: Downtown marked DEGRADED. Remote payments paused for this location only.', { cls: 'warn' });
      return;
    }
    if (s.link) return;
    s.link = true; s.conn.state = 'recovering';
    D.log('CONN', 'Connection restored. Recovery gate started; remote payments stay paused until it passes.', { cls: 'ok', edge: 'api-conn' });
    await D.wait(700);
    const pend = s.cloud.pay.filter((p) => p.state === 'pending-pos');
    D.log('API', `Recovery 1/4: resolve ${pend.length} approved-but-unposted payment(s) first`);
    for (const p of pend) { await D.wait(500); D.posApplyOnline(p.op); }
    for (const c of s.conn.pendingCmd.splice(0)) { await D.wait(400); D.completeOnPos(c.dlv); }
    const ob = s.conn.outbox.splice(0), fin = ob.filter((e) => e.fin), other = ob.filter((e) => !e.fin);
    await D.wait(500);
    D.log('CONN', `Recovery 2/4: replay ${fin.length} financial event(s) from local outbox in causal order`);
    for (const e of fin) { await D.wait(350); D.deliver(e, true); }
    await D.wait(400);
    D.log('CONN', `Recovery 3/4: replay ${other.length} status event(s); stale versions skipped`);
    for (const e of other) { await D.wait(300); D.deliver(e, true); }
    await D.wait(600);
    D.log('API', 'Recovery 4/4: reconcile Authorize.net, cloud journal and POS ledger: 0 mismatches', { cls: 'ok', edge: ['api-gw', 'api-conn'] });
    s.conn.state = 'online';
    D.log('API', 'Recovery gate passed. Remote payments re-enabled for Downtown.', { cls: 'ok' });
  };

  /* remote pay check (STA03, PAY10) */
  D.payElig = (id) => {
    const s = D.s, c = s.cloud.inv[id];
    if (D.capOn && !D.capOn('L-DT', 'payments')) return { ok: false, why: "Online payment is not offered for this store's POS. You can still pay at the counter." };
    if (s.holds.global || s.holds.tenant['T-MAPLE']) return { ok: false, why: 'Online payments are paused by the platform operator. You can still pay at the counter.' };
    if (s.conn.state !== 'online') return { ok: false, why: "We can't reach the store's system right now, so online payment is paused. Amounts shown may be out of date." };
    if (!s.gateway) return { ok: false, why: 'The payment service is unavailable. Try again shortly.' };
    if (s.cloud.pay.some((x) => x.inv === id && ['unknown', 'pending-pos', 'submitted', 'posting'].includes(x.state))) return { ok: false, why: 'A payment on this ticket is still being confirmed. You will not be charged twice.' };
    if (c.status !== 'Ready') return { ok: false, why: ['Picked up', 'Delivered'].includes(c.status) ? 'This order is complete.' : 'Online payment opens when your order is ready for pickup.' };
    const g = s.guards[id]; if (g && g.by === 'counter') return { ok: false, why: 'This ticket is being updated at the store counter. Try again in a minute.' };
    if (D.bal(c) <= 0) return { ok: false, why: 'Nothing is due on this ticket.' };
    return { ok: true };
  };
  D.findPay = (op) => D.s.cloud.pay.find((p) => p.op === op);
  D.addExc = (op, inv, amt, kind, next) => {
    if (D.s.cloud.exc.some((e) => e.op === op && e.state === 'open')) return;
    D.s.cloud.exc.unshift({ id: 'EX-' + (701 + D.s.cloud.exc.length), op, inv, amt, kind, next, state: 'open', at: Date.now() });
  };
  D.resolveExc = (op, how) => D.s.cloud.exc.filter((e) => e.op === op && e.state === 'open').forEach((e) => { e.state = 'resolved'; e.how = how; });

  /* online checkout (PAY02) */
  D.checkout = {
    async start(id, amt) {
      const s = D.s, op = D.opId('pay');
      const e = D.payElig(id); if (!e.ok) return { err: e.why };
      D.log('APP', `POST /v1/invoices/${id}/payment-intents  amount=${D.money(amt)}`, { op, edge: 'app-api' });
      await D.wait(400);
      D.log('API', `Preflight: ask connector for live balance + rowversion of ticket ${id}`, { op, edge: 'api-conn' });
      await D.wait(400);
      if (!s.link) return { err: "We can't reach the store's system right now, so online payment is paused." };
      const p = s.pos.invoices[id], bal = D.bal(p);
      D.log('SQL', `Read ticket ${id}: due ${D.money(p.total + D.feeSum(p))}, paid ${D.money(D.paid(p))}, balance ${D.money(bal)}, rowversion ${p.ver}`, { op, edge: 'conn-sql' });
      if (!(amt > 0) || amt > bal) { D.log('API', `Quote rejected: requested ${D.money(amt)}, collectible ${D.money(bal)}`, { op, cls: 'warn' }); return { err: `The balance changed. ${D.money(bal)} is now due.`, requote: bal }; }
      if (!D.guard.take(id, 'online', op)) { D.log('API', `Guard on ticket ${id} is held by the counter, checkout refused`, { op, cls: 'warn' }); return { err: 'This ticket is being updated at the store counter. Try again in a minute.' }; }
      D.log('CONN', `Financial guard set on ticket ${id} in the store agent. The POS payment screen checks it before any payment.`, { op, cls: 'fin', edge: 'conn-sql' });
      s.cloud.pay.unshift({ op, inv: id, amt, state: 'session', via: 'Authorize.net', channel: 'App', at: Date.now(), ref: null, card: null, refunded: 0 });
      await D.wait(300);
      D.log('GW', 'Accept Hosted token issued. Card entry happens on the Authorize.net form; card data never reaches our servers.', { op, edge: 'api-gw' });
      return { op };
    },
    cancel(op) {
      const p = D.findPay(op); if (!p || p.state !== 'session') return;
      p.state = 'cancelled'; D.guard.free(p.inv, op);
      D.log('APP', 'Customer closed checkout before submitting. Guard released, nothing charged.', { op });
    },
    async submit(op, wallet) {
      const s = D.s, p = D.findPay(op);
      if (!p || p.state !== 'session') { D.log('API', `Repeat submit for ${op} ignored (same idempotency key)`, { op }); return p; }
      p.state = 'submitted'; p.wallet = wallet || '';
      D.log('GW', wallet ? `${wallet} token sent to Authorize.Net (refId = operation id). The device token never reaches our servers.` : 'Card submitted on hosted form (createTransactionRequest, refId = operation id)', { op, edge: 'api-gw' });
      await D.wait(900);
      if (s.inject.timeout) {
        s.inject.timeout = false; p.state = 'unknown';
        D.addExc(op, p.inv, p.amt, 'Gateway outcome unknown', 'Query transaction by refId. Do not charge again.');
        D.log('GW', 'No response within timeout. Outcome UNKNOWN. Guard stays held and no new charge is allowed.', { op, cls: 'err', edge: 'api-gw' });
        await D.wait(2200);
        D.log('API', `Transaction inquiry by refId ${op}: found APPROVED. Continuing with the original transaction.`, { op, cls: 'ok', edge: 'api-gw' });
        D.resolveExc(op, 'Resolved by provider inquiry');
      }
      p.state = 'approved'; p.ref = '60' + D.rand(9); p.card = p.wallet ? p.wallet + ' \u00b7 Visa \u2022\u2022\u2022\u20224242' : 'Visa \u2022\u2022\u2022\u20221111';
      D.log('GW', `Approved ${D.money(p.amt)}, transId ${p.ref}`, { op, cls: 'ok', edge: 'api-gw' });
      D.log('API', 'Result verified server-side (amount, merchant, invoice). Journal: APPROVED, POS posting PENDING.', { op, cls: 'fin' });
      setTimeout(() => D.webhook(op, 1), 1100 * D.speed);
      if (s.inject.drop) { s.inject.drop = false; D.setLink(false, 'Store link dropped right after the gateway approved (injected fault).'); }
      await D.postOnline(op);
      return p;
    },
  };
  D.webhook = (op, times) => {
    const p = D.findPay(op); if (!p || !p.ref) return;
    for (let i = 0; i < times; i++) {
      const k = 'wh_' + p.ref;
      if (D.s.seenHooks[k]) { D.s.seenHooks[k]++; D.log('API', `Webhook for ${p.ref}: signature valid, duplicate #${D.s.seenHooks[k] - 1} ignored`, { op }); }
      else { D.s.seenHooks[k] = 1; D.log('GW', `Webhook authcapture.created for ${p.ref}: HMAC-SHA512 signature verified`, { op, edge: 'api-gw' }); }
    }
  };
  D.postOnline = async (op) => {
    const s = D.s, p = D.findPay(op);
    if (!s.link) {
      p.state = 'pending-pos';
      D.addExc(op, p.inv, p.amt, 'Approved, not yet posted to POS', 'Posts automatically on reconnect. Do not charge again.');
      D.log('API', `Store unreachable: payment held as RECEIVED, POS posting pending. Second charge blocked on ticket ${p.inv}.`, { op, cls: 'warn' });
      D.notify('pay-' + op, 'Payment received', `${D.money(p.amt)} on ticket ${p.inv}. The store will update shortly. You will not be charged again.`);
      return;
    }
    p.state = 'posting';
    D.log('API', `Command to connector: post ${D.money(p.amt)} to ticket ${p.inv}`, { op, edge: 'api-conn' });
    await D.wait(700);
    if (!s.link) return D.postOnline(op);
    D.posApplyOnline(op);
  };
  D.posApplyOnline = (op) => {
    const s = D.s, p = D.findPay(op), inv = s.pos.invoices[p.inv];
    if (s.postedOps[op]) { D.log('CONN', `${op} already in the operation journal, skipped (exactly-once)`, { op }); p.state = 'posted'; return; }
    s.postedOps[op] = true;
    inv.pays.push({ id: 'PAY-' + (88200 + inv.pays.length + D.rand(2) * 1), kind: 'Payment', via: 'Authorize.net', amt: p.amt, ref: p.ref, at: Date.now(), op });
    D.log('SQL', `BEGIN TRAN; insert payment ${D.money(p.amt)} (Authorize.Net ${p.ref}, operation id in the reference); update balance; COMMIT (84 ms)`, { op, cls: 'fin', edge: 'conn-sql' });
    D.posEarn(inv.cust, p.amt, inv.id);
    D.guard.free(inv.id, op);
    p.state = 'posted';
    D.resolveExc(op, 'Posted once on reconnect');
    D.posTouch(inv.id, `online payment ${D.money(p.amt)}`, { fin: true });
    D.notify('pay-' + op, 'Payment received', `${D.money(p.amt)} on ticket ${inv.id}. Remaining balance ${D.money(D.bal(inv))}.`);
  };
  D.posEarn = (cust, amt, id) => {
    const pts = Math.floor(amt / 100), L = D.s.pos.loyalty[cust];
    L.points += pts; L.hist.unshift({ d: 'Today', t: `Earned on ticket ${id} (existing POS rule)`, pts });
    D.log('POS', `Existing POS loyalty rule awarded ${pts} pts. The platform adds no points of its own.`, { edge: 'pos-sql' });
  };

  /* counter payments (FIN04, TER01) */
  D.posStart = (id, amt, dev) => {
    const s = D.s, p = s.pos.invoices[id], bal = D.bal(p);
    if (!(amt > 0)) return { err: 'Enter an amount greater than $0.00.' };
    if (amt > bal) return { err: `Amount is more than the balance due (${D.money(bal)}).` };
    const g = s.guards[id];
    if (g && g.by === 'online') {
      D.log('POS', `Counter payment on ticket ${id} blocked: guard held by online checkout ${g.op}`, { cls: 'warn', edge: 'pos-sql' });
      return { err: `An online payment is in progress on ticket ${id}.\n\nWait for it to finish, then press Refresh to see the new balance.`, lock: true };
    }
    if (dev !== 'Cash' && !D.isTerm(dev)) return { err: `${dev} is not a configured payment route.` };
    if (dev !== 'Cash' && !s.link) return { err: `${D.devName(dev)} cannot reach the card processor while the store internet is down.\n\nTake cash or wait. The terminal will not approve offline.` };
    const op = D.opId(dev === 'Cash' ? 'cash' : 'term');
    D.guard.take(id, 'counter', op);
    D.log('POS', `Ticket ${id}: collect ${D.money(amt)} by ${D.devName(dev)}`, { op, edge: 'pos-sql' });
    if (dev === 'Cash') { D.posApplyCounter(op, id, amt, 'Cash', ''); return { done: true, amt }; }
    D.log('TERM', `Sale request to ${D.devName(dev)}: ${D.money(amt)}, invoice ${id}, ref ${op}`, { op, edge: 'pos-term' });
    return { op };
  };
  D.posTerminal = async (op, id, amt, dev, outcome) => {
    const name = D.devName(dev);
    if (outcome === 'decline' || outcome === 'cancel') {
      D.log('TERM', outcome === 'decline' ? `${name}: DECLINED (05). Nothing posted.` : `${name}: cancelled by customer. Nothing posted.`, { op, cls: 'warn', edge: 'pos-term' });
      D.guard.free(id, op); return { res: outcome };
    }
    if (outcome === 'noresp') {
      D.log('TERM', `${name}: no response after 60s. Outcome UNKNOWN. Not posted and not retried.`, { op, cls: 'err', edge: 'pos-term' });
      await D.wait(2000);
      D.log('TERM', `Transaction inquiry by ref ${op}: APPROVED. Posting the original transaction once.`, { op, cls: 'ok', edge: 'pos-term' });
      outcome = 'approve';
    }
    const ok = outcome === 'partial' ? Math.max(100, Math.round(amt * 0.4 / 100) * 100) : amt;
    const ref = D.TERMS[dev].pfx + D.rand(5);
    if (outcome === 'partial') D.log('TERM', `${name}: PARTIAL approval. Requested ${D.money(amt)}, approved ${D.money(ok)}. ${D.money(amt - ok)} stays due.`, { op, cls: 'warn', edge: 'pos-term' });
    else D.log('TERM', `${name}: APPROVED ${D.money(ok)}, ${ref}`, { op, cls: 'ok', edge: 'pos-term' });
    if (D.s.postedOps[op]) { D.log('CONN', `${op} already in the operation journal, skipped (exactly-once)`, { op }); return { res: 'approved', ok, ref }; }
    D.posApplyCounter(op, id, ok, dev, ref);
    return { res: outcome === 'partial' ? 'partial' : 'approved', ok, ref };
  };
  D.posApplyCounter = (op, id, amt, via, ref) => {
    const s = D.s, inv = s.pos.invoices[id];
    inv.pays.push({ id: 'PAY-' + (88300 + inv.pays.length), kind: 'Payment', via, amt, ref, at: Date.now(), op });
    s.postedOps[op] = true;
    D.log('SQL', `POS committed ${via} payment ${D.money(amt)}${ref ? ' ' + ref : ''}; journal ${op}`, { op, cls: 'fin', edge: 'pos-sql' });
    D.posEarn(inv.cust, amt, id);
    D.guard.free(id, op);
    D.posTouch(id, `${via} payment ${D.money(amt)}`, { fin: true });
  };
  /* market checkout */
  D.mkInv = (loc, id) => { const m = D.s.mk[loc]; return m ? m.inv[id] : null; };
  D.mkElig = (loc, id) => {
    const s = D.s, l = D.locOf(loc), i = D.mkInv(loc, id);
    if (!l || !i) return { ok: false, why: 'Ticket not found.' };
    if (s.holds.global || s.holds.tenant[l.tenant.id] || l.tenant.state !== 'Active') return { ok: false, why: 'Online payments are paused by the platform operator. You can still pay at the counter.' };
    if (s.mkPay.some((x) => x.inv === id && ['submitted', 'unknown'].includes(x.state))) return { ok: false, why: 'A payment on this ticket is still being confirmed. You will not be charged twice.' };
    if (i.status !== 'Ready') return { ok: false, why: ['Picked up', 'Delivered'].includes(i.status) ? 'This order is complete.' : 'Online payment opens when your order is ready for pickup.' };
    if (D.bal(i) <= 0) return { ok: false, why: 'Nothing is due on this ticket.' };
    return { ok: true };
  };
  D.mkCheckout = {
    async start(loc, id, amt) {
      const s = D.s, l = D.locOf(loc), i = D.mkInv(loc, id), cur = l.mkt.cur, op = D.opId('pay');
      const e = D.mkElig(loc, id); if (!e.ok) return { err: e.why };
      if (!(amt > 0) || amt > D.bal(i)) return { err: 'The balance changed. Check the amount due.' };
      if (!D.guard.take(loc + ':' + id, 'online', op)) return { err: 'This ticket is being updated at the store counter. Try again in a minute.' };
      D.log('APP', `POST /v1/invoices/${id}/payment-intents  amount=${amt} ${cur} (minor units), store ${l.name}`, { op, edge: 'app-api' });
      await D.wait(400);
      D.log('API', `Preflight for ${id}: live balance ${D.fmt(D.bal(i), cur)} read through the adapter, guard set. Provider for ${l.mkt.country}: CyberSource.`, { op, edge: 'api-conn' });
      s.mkPay.unshift({ op, loc, inv: id, amt, cur, state: 'session', via: 'CyberSource', at: Date.now(), ref: null, card: null });
      await D.wait(300);
      D.log('GW', 'CyberSource Unified Checkout session issued. Card and wallet data stay on the CyberSource form.', { op, edge: 'api-gw' });
      return { op };
    },
    cancel(op) { const p = D.mkFind(op); if (!p || p.state !== 'session') return; p.state = 'cancelled'; D.guard.free(p.loc + ':' + p.inv, op); D.log('APP', 'Checkout closed before submit. Guard released, nothing charged.', { op }); },
    async submit(op, wallet) {
      const p = D.mkFind(op);
      if (!p || p.state !== 'session') { D.log('API', `Repeat submit for ${op} ignored (same idempotency key)`, { op }); return p; }
      p.state = 'submitted'; p.wallet = wallet || '';
      D.log('GW', `${wallet ? wallet + ' token' : 'Card'} submitted to CyberSource, ${p.amt} ${p.cur}, clientReferenceInformation.code = operation id`, { op, edge: 'api-gw' });
      await D.wait(900);
      p.state = 'approved'; p.ref = 'CYB' + D.rand(10); p.card = wallet ? wallet + ' \u00b7 Visa \u2022\u2022\u2022\u20224242' : 'Visa \u2022\u2022\u2022\u20221111';
      D.log('GW', `CyberSource AUTHORIZED and captured ${D.fmt(p.amt, p.cur)} (${p.cur}, ${D.DEC[p.cur]} decimals), id ${p.ref}. Webhook signature checked.`, { op, cls: 'ok', edge: 'api-gw' });
      await D.wait(500);
      D.mkPost(op);
      return p;
    },
  };
  D.mkFind = (op) => D.s.mkPay.find((p) => p.op === op);
  D.mkPost = (op) => {
    const s = D.s, p = D.mkFind(op), i = D.mkInv(p.loc, p.inv);
    if (s.postedOps[op]) { D.log('CONN', `${op} already posted, skipped (exactly-once)`, { op }); p.state = 'posted'; return; }
    s.postedOps[op] = true;
    i.pays.push({ kind: 'Payment', via: 'CyberSource', amt: p.amt, ref: p.ref, op });
    i.ver = ++s.pos.rowver; i.syncedAt = Date.now();
    D.log('SQL', `${p.loc} POS: payment ${p.amt} ${p.cur} posted once in the original currency (CyberSource ${p.ref}). Balance ${D.fmt(D.bal(i), p.cur)}.`, { op, cls: 'fin', edge: 'conn-sql' });
    D.guard.free(p.loc + ':' + p.inv, op);
    p.state = 'posted';
  };

  /* receipt claim codes (APP02) */
  const CC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  D.claimIssue = (id) => {
    const s = D.s, pick = () => Array.from({ length: 4 }, () => CC[Math.floor(Math.random() * CC.length)]).join('');
    for (const [k, c] of Object.entries(s.claims)) if (c.inv === id && !c.used && c.exp > Date.now()) return k;
    const code = pick() + '-' + pick();
    s.claims[code] = { inv: id, loc: 'L-DT', exp: Date.now() + 30 * 864e5, used: false };
    D.log('CONN', `Store agent issued claim code for ticket ${id}: single use, bound to Downtown and this ticket, expires in 30 days, kept as a hash${s.link ? '' : '. Queued until the store is back online'}.`, { edge: 'conn-sql' });
    return code;
  };
  D.claimUse = (raw, cust) => {
    const s = D.s, code = String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{4})(.{4})$/, '$1-$2'), c = s.claims[code];
    if (!c) { D.log('API', 'Claim code rejected: no match (attempt counted, nothing revealed)', { cls: 'warn', edge: 'app-api' }); return { err: 'bad' }; }
    if (c.used) { D.log('API', `Claim code ${code} rejected: already used`, { cls: 'warn', edge: 'app-api' }); return { err: 'used' }; }
    if (c.exp < Date.now()) { D.log('API', `Claim code ${code} rejected: expired`, { cls: 'warn', edge: 'app-api' }); return { err: 'exp' }; }
    c.used = true; s.cloud.claimed[c.inv] = cust;
    D.log('API', `Claim accepted: ticket ${c.inv} linked to ${cust} for this ticket only. Full history needs a second verified check.`, { cls: 'ok', edge: 'app-api' });
    D.audit('Customer ' + cust, 'Ticket claimed', 'Ticket ' + c.inv, 'Receipt code, single use');
    return { inv: c.inv };
  };

  /* driver tips (DRV11) */
  D.tip = async (id, amt, key) => {
    const s = D.s;
    if (s.tips.some((t) => t.key === key)) { D.log('API', `Tip for ticket ${id} already taken (same operation), ignored`); return { dup: true }; }
    const t = { key, inv: id, amt, cur: 'USD', via: 'Authorize.net', ref: null, state: 'submitted', at: Date.now() };
    s.tips.push(t);
    D.log('APP', `Customer authorized a ${D.money(amt)} tip on ticket ${id}. Separate tokenized transaction, same provider and currency as the ticket.`, { edge: 'app-api' });
    await D.wait(700);
    t.ref = '60' + D.rand(9); t.state = 'posted';
    D.log('GW', `Tip approved on Authorize.Net, transId ${t.ref}. The driver app never sees card data.`, { cls: 'ok', edge: 'api-gw' });
    D.log('SQL', `POS: tip ${D.money(amt)} posted as a mapped tip line (non-revenue), linked to ticket ${id}. Ticket total and status unchanged.`, { cls: 'fin', edge: 'conn-sql' });
    return t;
  };

  D.posStatus = (id, status) => {
    const p = D.s.pos.invoices[id], prev = p.status;
    if (status === 'Picked up' && D.bal(p) > 0) return { err: `Balance due ${D.money(D.bal(p))}.\n\nCollect payment before pickup.` };
    p.status = status; if (status === 'Ready' && !p.rack) p.rack = 'C-07';
    D.log('POS', `Ticket ${id}: ${prev} to ${status}`, { edge: 'pos-sql' });
    D.posTouch(id, 'status ' + status);
    return {};
  };
})();
