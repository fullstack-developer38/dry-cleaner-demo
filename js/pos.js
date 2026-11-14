/* vb6 pos (simulated) */
(function () {
  const D = window.D, E = D.esc, M = D.money;
  const css = document.createElement('style');
  css.textContent = `
  .vb{position:relative;font-family:"Microsoft Sans Serif","MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;color:#000;background:#c0c0c0;border:2px solid;border-color:#dfdfdf #404040 #404040 #dfdfdf;box-shadow:1px 1px 0 #000,0 14px 30px rgba(0,0,0,.18);min-width:0}
  .vb-title{background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font-weight:700;padding:3px 3px 3px 6px;display:flex;justify-content:space-between;align-items:center;gap:8px}
  .vb-title span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .vb-tb{display:flex;gap:2px;flex:none}.vb-tb i{width:16px;height:14px;background:#c0c0c0;border:1px solid;border-color:#fff #404040 #404040 #fff;font-style:normal;font-size:9px;line-height:12px;text-align:center;color:#000}
  .vb-menu{display:flex;gap:14px;padding:3px 8px;border-bottom:1px solid #808080;box-shadow:0 1px 0 #fff;overflow-x:auto}
  .vb-menu u{text-decoration:underline}
  .vb-body{display:grid;grid-template-columns:190px minmax(0,1fr);gap:10px;padding:10px}
  @media (max-width:700px){.vb-body{grid-template-columns:minmax(0,1fr)}}
  .vb fieldset{border:1px solid #808080;box-shadow:1px 1px 0 #fff inset,1px 1px 0 #fff;margin:0;padding:8px;min-width:0}
  .vb legend{padding:0 3px}
  .vb-in{background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;padding:2px 4px;font:inherit;color:#000;width:100%}
  .vb-btn{background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;padding:4px 8px;font:inherit;color:#000;min-width:76px}
  .vb-btn:active{border-color:#404040 #fff #fff #404040}
  .vb-btn:disabled{color:#808080;text-shadow:1px 1px 0 #fff;cursor:default}
  .vb-btn:focus-visible{outline:1px dotted #000;outline-offset:-5px}
  .vb-list{background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;max-height:178px;overflow:auto}
  .vb-list button{display:flex;justify-content:space-between;width:100%;text-align:left;border:0;background:none;padding:2px 4px;font:inherit;color:#000}
  .vb-list button[aria-selected="true"]{background:#000080;color:#fff}
  .vb-grid{background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;overflow:auto}
  .vb-grid table{border-collapse:collapse;width:100%;font-size:11.5px}
  .vb-grid th{background:#c0c0c0;border:1px solid;border-color:#fff #808080 #808080 #fff;text-align:left;font-weight:400;padding:1px 4px;white-space:nowrap}
  .vb-grid td{padding:1px 4px;border-bottom:1px solid #e0e0e0;white-space:nowrap}
  .vb-grid td.r{text-align:right}
  .vb-tot{display:grid;grid-template-columns:auto auto;gap:2px 10px;justify-content:end;font-variant-numeric:tabular-nums}
  .vb-tot b{text-align:right}
  .vb-status{display:flex;gap:2px;padding:2px;flex-wrap:wrap}
  .vb-status span{border:1px solid;border-color:#808080 #fff #fff #808080;padding:1px 6px;flex:1 1 auto;white-space:nowrap}
  .vb-modal{position:absolute;inset:0;background:rgba(0,0,0,.08);display:flex;align-items:center;justify-content:center;z-index:3;padding:10px}
  .vb-modal .vb{max-width:360px;width:100%}
  .vb-modal .msg{display:flex;gap:12px;padding:14px 12px;white-space:pre-line}
  .term{background:#1b2127;border-radius:20px;padding:14px;color:#e8eef2;width:280px;max-width:100%;box-shadow:0 14px 30px rgba(0,0,0,.25)}
  .term-scr{background:#e9f1ec;color:#0d1f17;border-radius:8px;padding:12px;font-family:var(--f-mono);min-height:96px;display:flex;flex-direction:column;justify-content:center;gap:4px;text-align:center}
  .term-k{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}
  .term-k button{border:0;border-radius:8px;padding:8px 6px;background:#2d363f;color:#e8eef2;font-size:12px}
  .term-k button:hover{background:#3a4652}
  .rcpt{background:#fffefa;color:#111;font-family:"Courier New",Consolas,monospace;font-size:11.5px;width:250px;max-width:100%;padding:12px 12px 10px;box-shadow:0 10px 24px rgba(0,0,0,.25);border-top:6px dotted #ddd;display:flex;flex-direction:column;gap:6px}
  .rcpt .c{text-align:center}.rcpt hr{border:0;border-top:1px dashed #999;margin:2px 0;width:100%}
  .rcpt .ln{display:flex;justify-content:space-between;gap:8px}
  .rc-claim{display:flex;gap:8px;align-items:center;border:1px solid #111;padding:6px}
  .qr{width:54px;height:54px;flex:none;background:#fff;border:2px solid #111;position:relative;background-image:repeating-linear-gradient(90deg,#111 0 3px,transparent 3px 7px),repeating-linear-gradient(0deg,#111 0 3px,transparent 3px 6px);background-size:30px 30px;background-position:12px 12px;background-repeat:no-repeat}
  .qr i{position:absolute;width:14px;height:14px;border:3px solid #111;background:#fff;box-shadow:inset 0 0 0 2px #fff,inset 0 0 0 5px #111}
  .qr i:nth-child(1){left:2px;top:2px}.qr i:nth-child(2){right:2px;top:2px}.qr i:nth-child(3){left:2px;bottom:2px}`;
  document.head.appendChild(css);

  D.ui.pos = { sel: '1042', amt: '70.00', msg: null, term: null, last: '' };
  const U = () => D.ui.pos;
  const msgIcon = (k) => k === 'stop'
    ? '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#c00"/><path d="M10 10l12 12M22 10 10 22" stroke="#fff" stroke-width="3"/></svg>'
    : '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#0000c0"/><text x="16" y="22" text-anchor="middle" fill="#fff" font-size="18" font-weight="700" font-family="serif">i</text></svg>';

  D.posWindow = function () {
    const s = D.s, u = U(), p = s.pos.invoices[u.sel], c = s.pos.customers[p.cust], bal = D.bal(p), g = s.guards[u.sel];
    const list = Object.values(s.pos.invoices).sort((a, b) => b.id - a.id);
    const ledger = [...p.items.map((x) => ({ a: `${x.q} x ${x.n}`, b: '', amt: x.q * x.p }))];
    return `
    <div class="vb" role="region" aria-label="Existing VB6 POS, counter screen">
      <div class="vb-title"><span>DCPOS 4.2 - Counter  [Maple Ave Downtown]  - (local)\\DCPOS</span><span class="vb-tb"><i>_</i><i>\u25a1</i><i>\u00d7</i></span></div>
      <div class="vb-menu"><span><u>F</u>ile</span><span><u>C</u>ustomer</span><span><u>T</u>icket</span><span><u>R</u>ack</span><span>R<u>e</u>ports</span><span><u>H</u>elp</span></div>
      <div class="vb-body">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <fieldset><legend>Customer</legend><div style="font-weight:700">${E(c.name.split(' ').reverse().join(', ').toUpperCase())}</div><div>${E(c.phone)}</div><div style="color:#404040">Acct ${E(p.cust)} \u00b7 ${c.walkin ? 'Walk-in, no app account' : 'Cash/Card'}</div></fieldset>
          <fieldset><legend>Tickets</legend><div class="vb-list" role="listbox" aria-label="Tickets">${list.map((i) => `<button role="option" aria-selected="${i.id === u.sel}" data-act="posSel" data-arg="${i.id}"><span>${i.id}  ${E(i.status)}</span><span>${M(D.bal(i))}</span></button>`).join('')}</div></fieldset>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <fieldset><legend>Ticket ${p.id}</legend>
            <div style="display:flex;flex-wrap:wrap;gap:4px 16px;margin-bottom:6px"><span>Status: <b>${E(p.status)}</b></span><span>Rack: <b>${E(p.rack || '-')}</b></span><span>In: ${E(p.dropped)}</span></div>
            <div class="vb-grid"><table><thead><tr><th>Item</th><th>Type</th><th>Ref</th><th class="r">Amount</th></tr></thead><tbody>
              ${ledger.map((l) => `<tr><td>${E(l.a)}</td><td>Charge</td><td></td><td class="r">${M(l.amt)}</td></tr>`).join('')}
              ${p.fees.map((f) => `<tr><td>${E(f.n)}</td><td>Fee</td><td>${E(f.dlv || '')}</td><td class="r">${M(f.amt)}</td></tr>`).join('')}
              ${p.pays.map((x) => `<tr><td>${x.amt < 0 ? 'Refund' : x.kind} - ${E(x.via)}</td><td>${x.amt < 0 ? 'Credit' : 'Pay'}</td><td>${E(x.ref || '')}</td><td class="r">${x.amt < 0 ? M(-x.amt) : '(' + M(x.amt) + ')'}</td></tr>`).join('')}
            </tbody></table></div>
            <div class="vb-tot" style="margin-top:6px"><span>Total</span><b>${M(p.total + D.feeSum(p))}</b><span>Paid</span><b>${M(D.paid(p))}</b><span>Balance</span><b style="color:${bal > 0 ? '#a00000' : '#006000'}">${M(bal)}</b></div>
          </fieldset>
          <fieldset><legend>Take payment</legend>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
              <label for="pos-amt">Amount $</label><input id="pos-amt" class="vb-in" style="width:90px" data-bind="pos.amt" value="${E(u.amt)}">
              <button class="vb-btn" data-act="posPay" data-arg="Cash" ${bal > 0 ? '' : 'disabled'}>Cash</button></div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px"><span>Card on:</span>
              ${Object.keys(D.TERMS).map((t) => `<button class="vb-btn" style="min-width:64px;padding:4px 6px" data-act="posPay" data-arg="${t}" ${bal > 0 ? '' : 'disabled'}>${t}</button>`).join('')}</div>
            ${u.last ? `<div style="margin-top:6px;color:#000080">${E(u.last)}</div>` : ''}
          </fieldset>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <button class="vb-btn" data-act="posStatus" data-arg="In process" ${p.status === 'Dropped off' ? '' : 'disabled'}>To Cleaning</button>
            <button class="vb-btn" data-act="posStatus" data-arg="Ready" ${p.status === 'In process' ? '' : 'disabled'}>Mark Ready</button>
            <button class="vb-btn" data-act="posStatus" data-arg="Picked up" ${p.status === 'Ready' ? '' : 'disabled'}>Pickup</button>
            <button class="vb-btn" data-act="posRefresh">Refresh</button>
            <button class="vb-btn" data-act="posPrint">Print receipt</button></div>
        </div>
      </div>
      <div class="vb-status"><span>Cloud connector: ${s.conn.state === 'online' ? 'Online' : s.conn.state === 'recovering' ? 'Recovering' : 'OFFLINE (POS OK)'}</span><span>Outbox: ${s.conn.outbox.length}</span><span>Guard: ${g ? (g.by === 'online' ? 'ONLINE CHECKOUT' : 'Counter') : 'none'}</span><span>${D.clock()}</span></div>
      ${u.msg ? `<div class="vb-modal"><div class="vb" role="alertdialog" aria-label="DCPOS message"><div class="vb-title"><span>DCPOS</span><span class="vb-tb"><i>\u00d7</i></span></div>
        <div class="msg">${msgIcon(u.msg.k)}<div>${E(u.msg.t)}</div></div><div style="text-align:center;padding:0 0 10px"><button class="vb-btn" data-act="posMsgOk">OK</button></div></div></div>` : ''}
      ${u.receipt ? receipt(u.receipt) : ''}
    </div>`;
  };

  /* receipt with claim code (APP02, NFR12) */
  function receipt(r) {
    const p = D.s.pos.invoices[r.id], c = D.s.pos.customers[p.cust];
    return `<div class="vb-modal"><div class="rcpt" role="dialog" aria-label="Printed receipt">
      <div class="c"><b>MAPLE AVENUE CLEANERS</b><br>Downtown \u00b7 (312) 555-0100</div><hr>
      <div class="ln"><span>Ticket ${p.id}</span><span>${E(p.dropped)}</span></div><div>${E(c.name.toUpperCase())}</div><hr>
      ${p.items.map((x) => `<div class="ln"><span>${x.q} ${E(x.n.split(',')[0])}</span><span>${M(x.q * x.p)}</span></div>`).join('')}<hr>
      <div class="ln"><span>Total</span><b>${M(p.total + D.feeSum(p))}</b></div><div class="ln"><span>Paid</span><span>${M(D.paid(p))}</span></div><div class="ln"><span>Balance</span><b>${M(D.bal(p))}</b></div><hr>
      <div class="rc-claim"><div class="qr" aria-hidden="true"><i></i><i></i><i></i></div><div><b>Track it in the app</b><br>Claim code<br><b style="font-size:13px">${E(r.code)}</b><br><span style="font-size:10px">One use \u00b7 expires in 30 days</span></div></div>
      <div class="c" style="font-size:10px">Printed by the POS on the counter printer</div>
      <div class="c"><button class="vb-btn" data-act="posPrintClose">Close</button></div></div></div>`;
  }

  D.posTermPanel = function () {
    const t = U().term;
    if (!t) return `<div class="term" aria-label="Card terminals idle"><div class="eyebrow" style="color:#9fb0bd">Counter terminals \u00b7 3 mandatory routes</div><div class="term-scr" style="margin-top:8px;gap:6px">
        ${Object.entries(D.TERMS).map(([k, v], i) => `${i ? '<hr style="width:100%;border:0;border-top:1px solid #b9c9bf;margin:0">' : ''}<div><b>${k}</b><div style="font-size:10.5px">${v.how} \u00b7 paired</div></div>`).join('')}</div>
      <div class="muted" style="font-size:11.5px;margin-top:8px;color:#9fb0bd">Processor: Fiserv. Exact models are provided by WBS (D01). Start a card payment from the POS: the amount and invoice come from the POS, never typed on the device.</div></div>`;
    return `<div class="term" role="dialog" aria-label="${E(D.devName(t.dev))} terminal">
      <div class="row"><span class="eyebrow" style="color:#9fb0bd">${E(D.devName(t.dev))}</span><span class="mono" style="font-size:10px;color:#9fb0bd">${E(t.op)}</span></div>
      <div class="term-scr" style="margin-top:8px">${t.busy ? '<b>Processing\u2026</b>' : `<span style="font-size:11px">Invoice ${t.id}</span><b style="font-size:22px">${M(t.amt)}</b><span>Tap, insert or swipe</span>`}</div>
      <div class="eyebrow" style="color:#9fb0bd;margin-top:10px">Demo: choose what the card does</div>
      <div class="term-k"><button data-act="posTerm" data-arg="approve" ${t.busy ? 'disabled' : ''}>Approve</button><button data-act="posTerm" data-arg="decline" ${t.busy ? 'disabled' : ''}>Decline</button>
        <button data-act="posTerm" data-arg="partial" ${t.busy ? 'disabled' : ''}>Partial approval</button><button data-act="posTerm" data-arg="noresp" ${t.busy ? 'disabled' : ''}>No response</button>
        <button data-act="posTerm" data-arg="cancel" style="grid-column:1/-1" ${t.busy ? 'disabled' : ''}>Customer cancels</button></div></div>`;
  };

  const A = D.acts;
  const balStr = (id) => (Math.max(0, D.bal(D.s.pos.invoices[id])) / 100).toFixed(2);
  D.posSyncAmt = () => { U().amt = balStr(U().sel); };
  A.posSel = (id) => { Object.assign(U(), { sel: id, amt: balStr(id), last: '' }); D.render(); };
  A.posRefresh = () => { U().amt = balStr(U().sel); D.render(); };
  A.posMsgOk = () => { U().msg = null; D.render(); };
  A.posPrint = () => {
    const u = U(), code = D.claimIssue(u.sel);
    u.receipt = { id: u.sel, code };
    D.log('POS', `Receipt for ticket ${u.sel} printed through the existing POS print routine. Claim code ${code} and its QR are on the slip. No cloud print job.`, { edge: 'pos-sql' });
  };
  A.posPrintClose = () => { U().receipt = null; D.render(); };
  A.posPay = (dev) => {
    const u = U(); if (u.term) return;
    const amt = Math.round(parseFloat(u.amt || '0') * 100) || 0;
    const r = D.posStart(u.sel, amt, dev);
    if (r.err) { u.msg = { k: r.lock ? 'stop' : 'info', t: r.err }; return D.render(); }
    if (r.done) { u.last = `Cash ${M(amt)} posted. Balance ${M(D.bal(D.s.pos.invoices[u.sel]))}.`; u.amt = balStr(u.sel); return D.render(); }
    u.term = { op: r.op, id: u.sel, amt, dev, busy: false }; D.render();
  };
  A.posTerm = async (outcome) => {
    const u = U(), t = u.term; if (!t || t.busy) return;
    t.busy = true; D.render();
    const r = await D.posTerminal(t.op, t.id, t.amt, t.dev, outcome);
    u.term = null;
    const b = M(D.bal(D.s.pos.invoices[t.id]));
    u.last = r.res === 'approved' ? `${D.devName(t.dev)} approved ${M(r.ok)} (${r.ref}). Balance ${b}.`
      : r.res === 'partial' ? `Partial approval: ${M(r.ok)} of ${M(t.amt)}. ${b} still due. Collect the rest or reverse.`
      : r.res === 'decline' ? 'Card declined. Nothing posted.' : 'Customer cancelled. Nothing posted.';
    u.amt = balStr(t.id); D.render();
  };
  A.posStatus = (st) => {
    const u = U(), r = D.posStatus(u.sel, st);
    if (r.err) u.msg = { k: 'info', t: r.err }; else u.last = `Ticket ${u.sel} set to ${st}.`;
    D.render();
  };
})();
