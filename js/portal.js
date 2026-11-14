/* merchant portal */
(function () {
  const D = window.D, E = D.esc, M = D.money;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const ACTIVE = (d) => !['Cancelled', 'Rejected', 'Delivered'].includes(d.state);
  const actor = () => (D.s.role === 'manager' ? 'Dana K. (manager)' : 'Ray P. (counter)');

  /* delivery */
  D.dlvApi = {
    find: (id) => D.s.cloud.dlv.find((d) => d.id === id),
    request(ids, win) {
      const s = D.s;
      for (const id of ids) {
        if (s.cloud.inv[id].status !== 'Ready') return { err: 'Only orders that are ready can be delivered.' };
        if (s.cloud.dlv.some((d) => d.inv.includes(id) && ACTIVE(d))) return { err: 'This ticket already has an active delivery request.' };
      }
      const off = s.conn.state !== 'online';
      const d = { id: 'DLV-' + (301 + s.cloud.dlv.length), inv: ids, win, addr: s.pos.customers['C-1001'].addr, fee: 800, state: off ? 'Intent (unconfirmed)' : 'Requested', driver: null, feePosted: false, at: Date.now() };
      s.cloud.dlv.unshift(d);
      D.log('APP', `Delivery request ${d.id}: ticket ${ids.join(', ')}, ${win}, fee ${M(d.fee)} shown before submit`, { edge: 'app-api' });
      if (off) D.log('API', `${d.id} saved as an unconfirmed intent. No window, capacity or fee is promised while the store is offline.`, { cls: 'warn' });
      D.audit('Jordan Lee (customer)', 'Delivery requested', d.id, win);
      return d;
    },
    async confirm(id) {
      const s = D.s, d = this.find(id);
      if (s.conn.state !== 'online') return { err: 'The store system is unreachable. A delivery can only be confirmed once its fee is posted to the POS.' };
      if (!['Requested', 'Intent (unconfirmed)'].includes(d.state)) return {};
      d.state = 'Confirming';
      D.log('API', `${id}: window confirmed by ${actor()}; capacity reserved atomically`, { edge: 'portal-api' });
      await D.wait(600);
      const p = s.pos.invoices[d.inv[0]];
      p.fees.push({ n: 'Delivery fee', amt: d.fee, dlv: d.id });
      D.log('SQL', `Fee line ${M(d.fee)} added to ticket ${p.id} (designated invoice), linked to ${d.id}`, { cls: 'fin', edge: 'conn-sql' });
      D.posTouch(p.id, 'delivery fee posted', { fin: true });
      d.feePosted = true; d.state = 'Confirmed';
      D.audit(actor(), 'Delivery confirmed + fee posted', d.id, `${d.win} \u00b7 ${M(d.fee)}`);
      D.notify('dlv-conf-' + d.id, 'Delivery confirmed', `${d.win}. A ${M(d.fee)} delivery fee was added to ticket ${p.id}. Pay it in the app before dispatch.`);
      return {};
    },
    assign(id, drv) { const d = this.find(id); d.driver = drv; d.state = 'Scheduled'; D.log('API', `${id} assigned to ${drv}`, { edge: 'portal-api' }); D.audit(actor(), 'Driver assigned', id, drv); },
    gate(id) {
      const s = D.s, d = this.find(id), invs = d.inv.map((i) => s.pos.invoices[i]);
      return [
        ['Confirmed by staff', ['Confirmed', 'Scheduled', 'Out for delivery', 'Delivered'].includes(d.state)],
        ['Delivery fee posted to the POS', d.feePosted],
        ['Linked tickets paid in full (or approved charge account)', invs.every((p) => D.bal(p) <= 0)],
        ['No payment pending or unknown', !s.cloud.pay.some((p) => d.inv.includes(p.inv) && ['unknown', 'pending-pos', 'submitted', 'posting', 'session'].includes(p.state))],
        ['Driver assigned', !!d.driver],
        ['Store system reachable', s.conn.state === 'online'],
        ['No safety hold', !s.holds.global && !s.holds.tenant['T-MAPLE']],
      ];
    },
    dispatch(id) {
      const d = this.find(id), g = this.gate(id), miss = g.filter((x) => !x[1]);
      if (miss.length) { D.log('API', `Dispatch of ${id} refused: ${miss.map((x) => x[0]).join('; ')}`, { cls: 'warn', edge: 'portal-api' }); return { err: miss.map((x) => x[0]).join(', ') }; }
      d.state = 'Out for delivery';
      D.log('API', `Dispatch gate passed for ${id}. Driver may depart.`, { cls: 'ok', edge: ['portal-api', 'drv-api'] });
      D.audit(actor(), 'Dispatched', id, d.driver);
      D.notify('dlv-out-' + id, 'Out for delivery', `${d.driver} is on the way with ticket ${d.inv.join(', ')} (${d.win}).`);
      return {};
    },
    complete(id, recipient, op, note) {
      const s = D.s, d = this.find(id);
      if (d.state !== 'Out for delivery') { D.log('API', `Completion ${op} for ${id} rejected: status is ${d.state}`, { cls: 'warn', op }); return { err: 'Not out for delivery' }; }
      // DRV04, server checks it too
      if (!String(recipient || '').trim() || !String(note || '').trim()) {
        D.log('API', `Completion ${op} for ${id} rejected: ${String(note || '').trim() ? 'recipient or unattended handoff' : 'driver note'} missing (DRV04)`, { cls: 'warn', op, edge: 'drv-api' });
        return { err: 'Recipient and note are required' };
      }
      d.state = 'Delivered'; d.recipient = recipient; d.note = note;
      D.log('API', `${id} delivered to "${recipient}", note "${note}" (server-confirmed, op ${op})`, { cls: 'ok', op, edge: 'drv-api' });
      D.audit(d.driver, 'Delivery completed', id, `Recipient: ${recipient} \u00b7 Note: ${note}`);
      if (s.link) D.completeOnPos(id);
      else { d.posPending = true; s.conn.pendingCmd.push({ dlv: id }); D.log('API', `${id}: delivery recorded; POS update pending (store offline). Will post once on reconnect.`, { cls: 'warn' }); }
      return {};
    },
    fail(id, reason) {
      const d = this.find(id); d.state = 'Failed attempt'; d.failReason = reason;
      D.log('API', `${id} failed attempt: ${reason}. Fee kept pending manager decision; no second charge.`, { cls: 'warn', edge: 'drv-api' });
      D.audit(d.driver, 'Failed attempt', id, reason);
      D.notify('dlv-fail-' + id, 'Delivery attempt missed', `We could not deliver ticket ${d.inv.join(', ')}: ${reason}. The store will contact you.`);
    },
  };
  D.completeOnPos = (id) => {
    const d = D.dlvApi.find(id);
    for (const i of d.inv) {
      const p = D.s.pos.invoices[i]; if (p.status === 'Delivered') continue;
      p.status = 'Delivered';
      D.log('SQL', `POS fulfillment: ticket ${i} set to Delivered (one completion command for ${id})`, { cls: 'fin', edge: 'conn-sql' });
      D.posTouch(i, 'delivered');
    }
    d.posPending = false;
  };

  /* refunds */
  D.refund = async (invId, ref, amt) => {
    const s = D.s, p = s.pos.invoices[invId];
    if (s.role !== 'manager') return { err: 'Refunds need manager permission.' };
    if (s.conn.state !== 'online') return { err: 'Refunds need the store system online so the POS ledger is updated exactly once.' };
    const orig = p.pays.find((x) => x.ref === ref), done = -D.sum(p.pays.filter((x) => x.orig === ref), (x) => x.amt);
    if (!orig || orig.amt <= 0) return { err: 'Original payment not found on this ticket.' };
    if (!(amt > 0) || amt > orig.amt - done) return { err: `You can refund up to ${M(orig.amt - done)} on this payment.` };
    const op = D.opId('rfd'), via = orig.via;
    if (via !== 'Authorize.net' && !D.isTerm(via)) return { err: `${via} payments are refunded at the counter.` };
    // FIN06: original provider only
    D.log('API', `Refund ${M(amt)} against original ${via} transaction ${ref} (requested by ${actor()})`, { op, edge: ['portal-api', via === 'Authorize.net' ? 'api-gw' : 'api-conn'] });
    await D.wait(900);
    let rref;
    if (via === 'Authorize.net') {
      rref = '60' + D.rand(9);
      D.log('GW', `Refund approved, transId ${rref} (refTransId ${ref})`, { op, cls: 'ok', edge: 'api-gw' });
    } else {
      rref = D.TERMS[via].pfx + 'R' + D.rand(4);
      D.log('TERM', `${via}: referenced refund on original ${ref} approved, ${rref} (${D.TERMS[via].how})`, { op, cls: 'ok', edge: 'pos-term' });
    }
    await D.wait(500);
    p.pays.push({ id: 'PAY-' + (88400 + p.pays.length), kind: 'Refund', via, amt: -amt, ref: rref, orig: ref, at: Date.now(), op });
    D.log('SQL', `POS refund line ${M(amt)} linked to ${ref}; ticket ${invId} balance reopens to ${M(D.bal(p))} (approved ledger rule)`, { op, cls: 'fin', edge: 'conn-sql' });
    D.posTouch(invId, 'refund ' + M(amt), { fin: true });
    D.audit(actor(), 'Refund', 'Ticket ' + invId, `${M(amt)} on ${ref}`);
    return {};
  };

  /* loyalty adjust */
  D.loyAdjust = async (pts, reason) => {
    const s = D.s;
    if (s.role !== 'manager') return { err: 'Loyalty adjustments need manager permission.' };
    if (s.conn.state !== 'online') return { err: 'Loyalty is read-only while the store system is unreachable.' };
    if (!pts || Math.abs(pts) > 500) return { err: 'Enter between -500 and 500 points.' };
    if (!reason.trim()) return { err: 'A reason is required.' };
    const op = D.opId('loy'), req = { op, pts, reason, state: 'Pending POS', at: Date.now(), actor: actor() };
    s.cloud.loyReq.unshift(req);
    D.log('API', `Loyalty adjustment ${pts > 0 ? '+' : ''}${pts} pts for C-1001 requested; pending POS confirmation`, { op, edge: ['portal-api', 'api-conn'] });
    await D.wait(800);
    const L = s.pos.loyalty['C-1001'], before = L.points;
    L.points += pts; L.hist.unshift({ d: 'Today', t: 'Store adjustment: ' + reason, pts });
    D.log('SQL', `POS loyalty ledger: ${before} to ${L.points} pts (reason recorded)`, { op, cls: 'fin', edge: 'conn-sql' });
    s.cloud.loy['C-1001'] = Object.assign(clone(L), { syncedAt: Date.now() });
    req.state = 'Confirmed';
    D.audit(req.actor, 'Loyalty adjustment', 'C-1001', `${before} to ${L.points} pts \u00b7 ${reason}`);
    D.notify('loy-' + op, 'Points updated', `Your balance is now ${L.points.toLocaleString()} points.`);
    return {};
  };

  /* portal view */
  D.ui.portal = { tab: 'overview', sel: null, ref: '20.00', pts: '50', why: 'Goodwill for a late order', err: '', drv: 'Marco R.' };
  const U = () => D.ui.portal;
  const pstate = { posted: ['ok', 'Posted'], 'pending-pos': ['warn', 'Pending POS'], unknown: ['bad', 'Unknown'], approved: ['info', 'Approved'], posting: ['info', 'Posting'], submitted: ['info', 'Submitted'], session: ['plain', 'Checkout open'], cancelled: ['plain', 'Abandoned'] };
  const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return +d; };

  function payments() {
    const s = D.s, rows = [];
    for (const i of Object.values(s.cloud.inv)) for (const p of i.pays) rows.push({ t: p.at, inv: i.id, via: p.via, ref: p.ref, amt: p.amt, kind: p.amt < 0 ? 'Refund' : p.kind, st: 'posted' });
    for (const p of s.cloud.pay) if (!['posted', 'cancelled', 'session'].includes(p.state)) rows.push({ t: p.at, inv: p.inv, via: 'Authorize.net', ref: p.ref || '\u2014', amt: p.amt, kind: 'Payment', st: p.state });
    return rows.sort((a, b) => b.t - a.t);
  }

  function overview() {
    const s = D.s, rows = payments().filter((r) => r.t >= startOfDay() && r.st === 'posted');
    const rec = D.sum(rows.filter((r) => r.amt > 0), (r) => r.amt), ref = -D.sum(rows.filter((r) => r.amt < 0), (r) => r.amt);
    const out = D.sum(Object.values(s.cloud.inv).filter((i) => !['Picked up', 'Delivered'].includes(i.status) || D.bal(i) > 0), (i) => Math.max(0, D.bal(i)));
    const exc = s.cloud.exc, open = exc.filter((e) => e.state === 'open');
    const oldest = s.conn.outbox[0] ? D.ago(s.conn.outbox[0].at) : '\u2014';
    const k = (l, v, sub) => `<section class="panel kpi"><div class="eyebrow">${l}</div><div class="v">${v}</div><div class="s">${sub}</div></section>`;
    return `
      <div class="grid g4">${k('Payments received today', M(rec), `${rows.filter((r) => r.amt > 0).length} payments, all channels`)}${k('Refunds today', M(ref), 'Shown separately')}
        ${k('Net receipts', M(rec - ref), 'Receipts, not invoice sales')}${k('Outstanding balances', M(out), 'Open tickets, from POS')}</div>
      <div class="grid g2" style="margin-top:16px">
        <section class="panel"><div class="panel-h"><h3>Store connection</h3>${s.conn.state === 'online' ? '<span class="pill ok">Healthy</span>' : s.conn.state === 'recovering' ? '<span class="pill warn">Recovering</span>' : '<span class="pill bad">Offline, POS still running</span>'}</div>
          <div class="panel-b"><dl class="kv" style="margin:0"><dt>Last successful sync</dt><dd>${D.ago(s.conn.lastSync)}</dd><dt>Queued in local outbox</dt><dd>${s.conn.outbox.length}</dd><dt>Oldest queued item</dt><dd>${oldest}</dd>
            <dt>POS adapter</dt><dd>${E(D.adapterLabel('L-DT'))}</dd><dt>Financial guards held</dt><dd>${Object.keys(s.guards).length}</dd><dt>SQL latency (p95)</dt><dd>${s.link ? '14 ms' : '\u2014 (cloud cannot see)'}</dd><dt>Online payments</dt><dd>${s.conn.state === 'online' && !s.holds.global && !s.holds.tenant['T-MAPLE'] ? 'Available' : 'Paused'}</dd></dl>
            ${D.capOff('L-DT').length ? `<p style="margin:10px 0 0;font-size:12.5px;color:var(--warn)">Not available from this store's POS: ${E(D.capOff('L-DT').join(', '))}. Shown as a limit, never guessed.</p>` : ''}
            ${s.conn.state !== 'online' ? '<p class="muted" style="margin:10px 0 0;font-size:12.5px">The counter can keep taking cash. Card terminals need the processor. Online payment reopens automatically after the recovery check.</p>' : ''}</div></section>
        <section class="panel"><div class="panel-h"><h3>Payment exceptions</h3><span class="pill ${open.length ? 'warn' : 'ok'}">${open.length} open</span></div>
          ${exc.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Ticket</th><th class="r">Amount</th><th>Issue</th><th>State</th></tr></thead><tbody>
            ${exc.map((e) => `<tr><td class="mono">${e.inv}</td><td class="r num">${M(e.amt)}</td><td>${E(e.kind)}<div class="muted" style="font-size:12px">${E(e.state === 'open' ? e.next : e.how)}</div></td><td><span class="pill ${e.state === 'open' ? 'warn' : 'ok'}">${e.state === 'open' ? 'Open' : 'Resolved'}</span></td></tr>`).join('')}</tbody></table></div>`
          : '<div class="panel-b muted">No exceptions. Approved-but-unposted or unknown payments show up here with a safe next step.</div>'}</section>
      </div>`;
  }

  function deliveries() {
    const s = D.s, u = U(), list = s.cloud.dlv, sel = list.find((d) => d.id === u.sel) || list[0];
    const btn = (d) => {
      if (['Requested', 'Intent (unconfirmed)'].includes(d.state)) return `<button class="btn sm pri" data-act="pdConfirm" data-arg="${d.id}">Confirm + post fee</button>`;
      if (d.state === 'Confirmed') return `<button class="btn sm" data-act="pdAssign" data-arg="${d.id}">Assign ${E(u.drv)}</button>`;
      if (d.state === 'Scheduled') return `<button class="btn sm pri" data-act="pdDispatch" data-arg="${d.id}">Dispatch</button>`;
      return '';
    };
    return `<div class="grid split">
      <section class="panel"><div class="panel-h"><h3>Delivery requests</h3><span class="muted" style="font-size:12px">Paid delivery only \u00b7 store-confirmed windows</span></div>
        ${list.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Request</th><th>Tickets</th><th>Window</th><th>Status</th><th></th></tr></thead><tbody>
          ${list.map((d) => `<tr data-act="pdSel" data-arg="${d.id}" style="cursor:pointer;${sel && sel.id === d.id ? 'background:var(--accent-soft)' : ''}"><td class="mono">${d.id}</td><td class="mono">${d.inv.join(', ')}</td><td>${E(d.win)}</td>
            <td><span class="pill ${d.state === 'Delivered' ? 'ok' : d.state === 'Out for delivery' ? 'info' : 'warn'}">${E(d.state)}</span>${d.posPending ? '<div class="muted" style="font-size:11.5px">POS update pending</div>' : ''}</td><td class="r">${btn(d)}</td></tr>`).join('')}</tbody></table></div>`
        : '<div class="panel-b muted">No requests yet. Request delivery for ticket 1042 in the customer app, then confirm it here.</div>'}</section>
      <section class="panel"><div class="panel-h"><h3>Dispatch gate</h3>${sel ? `<span class="mono muted">${sel.id}</span>` : ''}</div><div class="panel-b">
        ${sel ? `<ul class="gate">${D.dlvApi.gate(sel.id).map(([t, y]) => `<li class="${y ? 'y' : ''}">${E(t)}</li>`).join('')}</ul>
        <p class="muted" style="font-size:12.5px;margin:10px 0 0">Checked again at the moment of dispatch. A driver cannot override it. Pending or unknown payments never count as paid.</p>
        ${u.err ? `<div class="stale" style="margin-top:10px" role="alert">${E(u.err)}</div>` : ''}` : '<p class="muted" style="margin:0">Select a request to see what must be true before it can leave the store.</p>'}
      </div></section></div>`;
  }

  function paymentsView() {
    const s = D.s, u = U(), mgr = s.role === 'manager';
    return `<section class="panel"><div class="panel-h"><h3>Payments, all channels</h3><span class="muted" style="font-size:12px">Card numbers are never stored or shown</span></div>
      <div class="tbl-wrap"><table class="t"><thead><tr><th>Time</th><th>Ticket</th><th>Type</th><th>Method</th><th>Reference</th><th class="r">Amount</th><th>POS posting</th><th></th></tr></thead><tbody>
      ${payments().map((r) => { const st = pstate[r.st] || ['plain', r.st]; const canRef = (r.via === 'Authorize.net' || D.isTerm(r.via)) && r.amt > 0 && r.kind !== 'Refund' && r.st === 'posted';
        return `<tr><td class="num">${new Date(r.t).toLocaleDateString([], { month: 'short', day: 'numeric' })} ${D.clock(r.t)}</td><td class="mono">${r.inv}</td><td>${E(r.kind)}</td><td>${E(r.via)}</td><td class="mono">${E(r.ref || '')}</td>
          <td class="r num">${M(r.amt)}</td><td><span class="pill ${st[0]}">${st[1]}</span></td>
          <td class="r">${canRef ? `<button class="btn sm" data-act="pdRefund" data-arg="${r.inv}|${r.ref}" ${mgr ? '' : 'disabled title="Needs manager permission"'}>Refund ${E('$' + u.ref)}</button>` : r.via === 'Cash' && r.amt > 0 ? '<span class="muted" style="font-size:11.5px">Cash: refund at counter</span>' : ''}</td></tr>`; }).join('')}
      </tbody></table></div>
      <div class="panel-b" style="border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:10px;align-items:end">
        <label class="field" for="pd-ref" style="width:140px">Refund amount<input id="pd-ref" data-bind="portal.ref" value="${E(u.ref)}" inputmode="decimal"></label>
        <span class="muted" style="font-size:12.5px;max-width:56ch">Refunds go back through the original provider and transaction: Authorize.net, Clover, Ingenico or Dejavoo, never a different one. The POS gets one linked credit line. A refund does not undo a pickup or delivery.</span></div>
      ${u.err ? `<div class="panel-b" style="padding-top:0"><div class="stale" role="alert">${E(u.err)}</div></div>` : ''}</section>`;
  }

  function loyaltyView() {
    const s = D.s, u = U(), L = s.cloud.loy['C-1001'], mgr = s.role === 'manager';
    return `<div class="grid g2">
      <section class="panel"><div class="panel-h"><h3>Jordan Lee \u00b7 C-1001</h3><span class="muted" style="font-size:12px">From POS \u00b7 ${D.ago(L.syncedAt)}</span></div><div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
        <div class="grid g2" style="gap:10px"><div><div class="eyebrow">Points</div><div class="num" style="font-family:var(--f-display);font-size:24px;font-weight:800">${L.points.toLocaleString()}</div></div><div><div class="eyebrow">Store credit</div><div class="num" style="font-family:var(--f-display);font-size:24px;font-weight:800">${M(L.credit)}</div></div></div>
        <div style="display:grid;grid-template-columns:110px minmax(0,1fr);gap:8px"><label class="field" for="pl-pts">Points (+/-)<input id="pl-pts" data-bind="portal.pts" value="${E(u.pts)}" inputmode="numeric"></label><label class="field" for="pl-why">Reason<input id="pl-why" data-bind="portal.why" value="${E(u.why)}"></label></div>
        <button class="btn pri" data-act="pdLoy" ${mgr ? '' : 'disabled'} style="align-self:flex-start">${mgr ? 'Send adjustment to POS' : 'Manager permission needed'}</button>
        ${u.err ? `<div class="stale" role="alert">${E(u.err)}</div>` : ''}
        ${s.cloud.loyReq.map((r) => `<div class="row" style="font-size:13px"><span>${r.pts > 0 ? '+' : ''}${r.pts} pts \u00b7 ${E(r.reason)}</span><span class="pill ${r.state === 'Confirmed' ? 'ok' : 'warn'}">${r.state}</span></div>`).join('')}</div></section>
      <section class="panel"><div class="panel-h"><h3>Audit trail</h3><span class="muted" style="font-size:12px">Append-only</span></div>
        ${s.cloud.audit.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Time</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead><tbody>${s.cloud.audit.slice(0, 30).map((a) => `<tr><td class="num">${D.clock(a.t)}</td><td>${E(a.actor)}</td><td>${E(a.action)} <span class="mono muted">${E(a.entity)}</span></td><td>${E(a.detail)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="panel-b muted">Payments, refunds, delivery changes, loyalty and role changes are recorded here with who, when and why.</div>'}</section></div>`;
  }

  D.views.portal = {
    render(el) {
      const s = D.s, u = U();
      const tabs = [['overview', 'Overview'], ['deliveries', 'Deliveries'], ['payments', 'Payments'], ['loyalty', 'Loyalty + audit']];
      el.innerHTML = `
      <div class="view-head"><div><div class="eyebrow">Merchant portal \u00b7 Maple Avenue Cleaners \u00b7 Downtown</div><h2>Store operations</h2><p>Reads the same POS data as the counter. Every change goes back through the connector and waits for the POS to confirm it.</p></div>
        <div class="ctl" role="group" aria-label="Signed in as"><span class="muted" style="font-size:12px">Signed in as</span>
          <button class="btn sm ${s.role === 'manager' ? 'pri' : ''}" data-act="pdRole" data-arg="manager">Dana K. \u00b7 Manager</button><button class="btn sm ${s.role === 'counter' ? 'pri' : ''}" data-act="pdRole" data-arg="counter">Ray P. \u00b7 Counter</button></div></div>
      <div class="tabs" style="padding:0;margin-bottom:14px;border-bottom:1px solid var(--line)" role="tablist">${tabs.map(([k, l]) => `<button class="tab" role="tab" aria-selected="${u.tab === k}" data-act="pdTab" data-arg="${k}">${l}</button>`).join('')}</div>
      ${{ overview, deliveries, payments: paymentsView, loyalty: loyaltyView }[u.tab]()}`;
    },
  };

  const A = D.acts;
  A.pdTab = (t) => { Object.assign(U(), { tab: t, err: '' }); D.render(); };
  A.pdRole = (r) => { if (D.s.role === r) return; D.s.role = r; U().err = ''; D.log('API', `Portal session switched to ${actor()}. Permissions enforced on the server.`, { edge: 'portal-api' }); D.audit(actor(), 'Signed in', 'Portal', 'MFA verified'); };
  A.pdSel = (id, el, e) => { if (e && e.target.closest('button')) return; U().sel = id; U().err = ''; D.render(); };
  A.pdConfirm = async (id) => { U().sel = id; const r = await D.dlvApi.confirm(id); U().err = r.err || ''; D.render(); };
  A.pdAssign = (id) => { U().sel = id; D.dlvApi.assign(id, U().drv); U().err = ''; D.render(); };
  A.pdDispatch = (id) => { U().sel = id; const r = D.dlvApi.dispatch(id); U().err = r.err ? 'Dispatch blocked: ' + r.err + '.' : ''; D.render(); };
  A.pdRefund = async (arg) => { const [inv, ref] = arg.split('|'); const r = await D.refund(inv, ref, Math.round(parseFloat(U().ref || '0') * 100)); U().err = r.err || ''; D.render(); };
  A.pdLoy = async () => { const u = U(); const r = await D.loyAdjust(parseInt(u.pts, 10), u.why); u.err = r.err || ''; D.render(); };
})();
