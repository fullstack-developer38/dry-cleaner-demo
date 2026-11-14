/* driver pwa */
(function () {
  const D = window.D, E = D.esc;
  D.drvFresh = () => ({ screen: 'list', id: null, recipient: 'Jordan Lee', reason: 'Recipient unavailable', busy: false, note: '', unattended: false, err: '' });
  D.ui.drv = D.drvFresh();
  const U = () => D.ui.drv;
  const ME = 'Marco R.';
  const jobs = () => D.s.cloud.dlv.filter((d) => d.driver === ME && ['Scheduled', 'Out for delivery', 'Failed attempt', 'Delivered'].includes(d.state));
  const queued = (id) => D.s.driverQueue.find((q) => q.id === id);

  D.setDriverOnline = async (on) => {
    const s = D.s; if (s.driverOnline === on) return;
    s.driverOnline = on;
    if (!on) { D.log('APP', 'Driver phone lost signal. Already-authorized jobs stay cached (encrypted, 8 h expiry).', { cls: 'warn' }); return; }
    D.log('APP', `Driver phone back online: ${s.driverQueue.length} offline proof(s) to sync`, { edge: 'drv-api' });
    for (const q of s.driverQueue.splice(0)) {
      await D.wait(700);
      D.log('API', `Revalidating offline proof ${q.op}: driver, assignment and version still match. Accepted.`, { op: q.op, cls: 'ok', edge: 'drv-api' });
      await D.wait(400);
      if (q.kind === 'delivered') D.dlvApi.complete(q.id, q.recipient, q.op, q.note); else D.dlvApi.fail(q.id, q.reason);
    }
  };

  function list() {
    const j = jobs();
    return `<div class="row" style="padding-top:4px"><div><div class="eyebrow">Driver \u00b7 ${ME}</div><h2 style="font-size:21px">Today's deliveries</h2></div><span class="pill ${D.s.driverOnline ? 'ok' : 'warn'}">${D.s.driverOnline ? 'Online' : 'No signal'}</span></div>
      ${D.s.driverOnline ? '' : '<div class="stale">No signal. You can still record proof for a job that was already dispatched. It stays unconfirmed until it syncs.</div>'}
      ${j.length ? j.map((d) => { const q = queued(d.id); return `<button class="card" style="text-align:left;display:flex;flex-direction:column;gap:6px" data-act="drvOpen" data-arg="${d.id}"><div class="media sm" style="background-image:url('assets/images/van.jpg')"><span class="media-cap">Route \u00b7 ${E(d.win || '')}</span></div>
        <div class="row"><b>${E(d.win.split('\u00b7')[1] || d.win)}</b><span class="pill ${q ? 'warn' : d.state === 'Out for delivery' ? 'info' : d.state === 'Delivered' ? 'ok' : 'plain'}">${q ? 'Pending sync' : E(d.state)}</span></div>
        <div style="font-size:13px">Jordan Lee \u00b7 ${E(d.addr)}</div><div class="muted mono" style="font-size:11.5px">${d.id} \u00b7 ticket ${d.inv.join(', ')}</div></button>`; }).join('')
      : '<div class="card muted" style="font-size:13px">No assigned deliveries. The store assigns work in the merchant portal; only your own jobs ever appear here.</div>'}`;
  }

  function job() {
    const u = U(), d = D.dlvApi.find(u.id), q = queued(d.id), online = D.s.driverOnline;
    const garments = d.inv.reduce((a, i) => a + D.s.cloud.inv[i].items.reduce((x, y) => x + y.q, 0), 0);
    let actions = '';
    if (q) actions = `<div class="card" style="border-color:var(--warn)"><div class="row"><b>PENDING SYNC \u00b7 NOT CONFIRMED</b><span class="pill warn">Pending sync</span></div>
      <div style="font-size:12.5px;margin-top:4px">${q.kind === 'delivered' ? 'Delivered to ' + E(q.recipient) + ' \u00b7 ' + E(q.note) : 'Failed: ' + E(q.reason)} at ${D.clock(q.at)}. The customer and the POS will not see this until the server accepts it.</div><div class="mono muted" style="font-size:11px">${q.op}</div></div>`;
    else if (d.state === 'Scheduled') actions = `<div class="card muted" style="font-size:13px">Waiting for the store to dispatch. Departure opens only after the store's payment and fee checks pass.</div>`;
    else if (d.state === 'Out for delivery') actions = `
      <label class="field" for="drv-rec">Recipient name<input id="drv-rec" data-bind="drv.recipient" value="${E(u.unattended ? '' : u.recipient)}" ${u.unattended ? 'disabled placeholder="Unattended handoff"' : ''}></label>
      <button class="row" style="border:0;background:none;padding:0;font-size:12.5px;color:inherit;text-align:left" data-act="drvUnatt" aria-pressed="${u.unattended}"><span>Unattended handoff<br><span class="muted" style="font-size:11.5px">Allowed by this store</span></span><span class="pill ${u.unattended ? 'ok' : 'plain'}">${u.unattended ? 'On' : 'Off'}</span></button>
      <label class="field" for="drv-note">Driver note (required)<textarea id="drv-note" rows="2" data-bind="drv.note" placeholder="e.g. Handed to Jordan at the door, 2 garment bags">${E(u.note)}</textarea></label>
      ${u.err ? `<div class="stale" role="alert">${E(u.err)}</div>` : ''}
      <button class="btn pri" style="justify-content:center;padding:11px" data-act="drvDeliver" ${u.busy ? 'disabled' : ''}>Mark delivered</button>
      <label class="field" for="drv-why">If you could not deliver<select id="drv-why" data-bind="drv.reason">${['Recipient unavailable', 'Address inaccessible', 'Address issue'].map((r) => `<option ${r === u.reason ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
      <button class="btn" style="justify-content:center" data-act="drvFail" ${u.busy ? 'disabled' : ''}>Report failed attempt</button>`;
    else actions = `<div class="card" style="font-size:13px"><span class="pill ${d.state === 'Delivered' ? 'ok' : 'warn'}">${E(d.state)}</span>${d.recipient ? ` to ${E(d.recipient)}` : ''}${d.note ? `<div class="muted" style="font-size:12px;margin-top:4px">Note: ${E(d.note)}</div>` : ''}${d.posPending ? '<div class="muted" style="font-size:12px;margin-top:4px">Delivery recorded; POS update pending.</div>' : ''}</div>`;
    return `<button class="btn sm" style="align-self:flex-start" data-act="drvBack">Back</button>
      <div class="tag"><small>${E(d.win)}</small><div class="tno">${d.id}</div></div>
      ${online ? '' : '<div class="stale">No signal. Proof is saved on this phone and synced later.</div>'}
      <div class="card" style="display:flex;flex-direction:column;gap:6px;font-size:13px"><b>Jordan Lee</b><span>${E(d.addr)}</span>
        <div class="row"><span class="mono">(312) 555-0148</span><a class="btn sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('1820 W Maple Ave Chicago')}" target="_blank" rel="noopener">Open in Maps</a></div>
        <span class="muted" style="font-size:12px">Ticket ${d.inv.join(', ')} \u00b7 ${garments} garments \u00b7 no balances or payment history shown to drivers</span></div>
      ${actions}`;
  }

  D.drvPhone = function () {
    const u = U();
    return `<div class="phone"><div class="screen"><div class="notch"></div><div class="sbar"><span>${D.clock()}</span><span>${D.s.driverOnline ? 'LTE \u25ae\u25ae\u25ae' : 'No service'}</span></div>
      <div class="app" id="drv-app" data-keep="${u.screen}">${u.screen === 'job' && u.id ? job() : list()}</div></div></div>`;
  };

  D.views.driver = {
    render(el) {
      el.innerHTML = `<div class="view-head"><div><h2>Driver app</h2><p>A web app drivers add to their home screen. Drivers see only their own assigned jobs and can't touch money. Proof captured without signal stays unconfirmed until the server accepts it.</p></div>
        <div class="ids"><span class="id">DRV01-DRV10</span><span class="id">STA06</span><span class="id">STA10</span></div></div>
        <div class="floor"><div class="col">${D.drvPhone()}</div>
        <div class="col" style="max-width:520px">
          <section class="panel"><div class="panel-h"><h3>Try it</h3></div><div class="panel-b" style="display:flex;flex-direction:column;gap:10px;font-size:13.5px">
            <p style="margin:0">A delivery has to be requested, confirmed with its fee posted, paid, assigned and dispatched before the driver can complete it. This button does those steps for ticket 1042.</p>
            <button class="btn pri" style="align-self:flex-start" data-act="drvPrep">Prepare a dispatched delivery</button>
            <p style="margin:0" class="muted">Marking it delivered needs the recipient (or the store's unattended handoff option) and a driver note. Try it without the note first. Then switch <b>Driver signal</b> off in the top bar, mark it delivered, and switch the signal back on to watch the proof sync and the POS close the ticket once.</p></div></section>
          <section class="panel"><div class="panel-h"><h3>What drivers never see</h3></div><div class="panel-b"><ul style="margin:0;padding-left:18px;font-size:13.5px;display:flex;flex-direction:column;gap:4px">
            <li>Customer payment history, balances or card tokens</li><li>Other drivers' jobs or other customers</li><li>Refunds, charge approvals or fee changes</li><li>A job after it is reassigned: access is revoked on the server</li></ul></div></section>
        </div></div>`;
    },
  };

  const A = D.acts;
  A.drvOpen = (id) => { Object.assign(U(), { screen: 'job', id, err: '' }); D.render(); };
  A.drvBack = () => { U().screen = 'list'; D.render(); };
  A.drvUnatt = () => { const u = U(); u.unattended = !u.unattended; u.err = ''; D.render(); };
  A.drvDeliver = () => {
    const u = U(), d = D.dlvApi.find(u.id), op = D.opId('drv');
    const recipient = u.unattended ? 'Unattended handoff (store-approved)' : u.recipient.trim(), note = u.note.trim();
    // DRV04: name or unattended handoff, plus a note
    u.err = !recipient ? 'Enter the recipient name, or turn on unattended handoff.' : !note ? 'Add a driver note before marking delivered. It is required.' : '';
    if (u.err) { D.log('APP', `Delivered for ${d.id} not sent: ${u.err}`, { cls: 'warn' }); return D.render(); }
    if (!D.s.driverOnline) {
      D.s.driverQueue.push({ op, id: d.id, kind: 'delivered', recipient, note, at: Date.now() });
      D.log('APP', `Offline proof saved for ${d.id} (op ${op}): PENDING SYNC / NOT CONFIRMED. Customer and POS unchanged.`, { op, cls: 'warn' });
      return D.render();
    }
    D.log('APP', `Driver submitted delivered for ${d.id}`, { op, edge: 'drv-api' });
    D.dlvApi.complete(d.id, recipient, op, note); D.render();
  };
  A.drvFail = () => {
    const u = U(), d = D.dlvApi.find(u.id), op = D.opId('drv');
    if (!D.s.driverOnline) { D.s.driverQueue.push({ op, id: d.id, kind: 'failed', reason: u.reason, at: Date.now() }); D.log('APP', `Offline failed-attempt proof saved for ${d.id}`, { op, cls: 'warn' }); return D.render(); }
    D.dlvApi.fail(d.id, u.reason); D.render();
  };
})();
