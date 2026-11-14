/* boot, render, store floor, guided tests */
(function () {
  const D = window.D, E = D.esc, A = D.acts;
  const TABS = [['overview', 'Overview'], ['floor', 'Store floor'], ['portal', 'Merchant portal'], ['driver', 'Driver app'], ['admin', 'Super Admin'], ['connectors', 'Connectors'], ['arch', 'Architecture'], ['tests', 'Guided tests']];
  const $ = (id) => document.getElementById(id);

  D.resetUI = () => {
    D.custReset();
    D.ui.pos = { sel: '1042', amt: '70.00', msg: null, term: null, last: '' };
    D.ui.portal = { tab: 'overview', sel: null, ref: '20.00', pts: '50', why: 'Goodwill for a late order', err: '', drv: 'Marco R.' };
    D.ui.drv = D.drvFresh();
    D.ui.admin = D.adminFresh();
  };
  const fresh = () => { D.s = D.seed(); D.resetUI(); D.log('POS', 'Demo data loaded: Jordan Lee, ticket 1042 Ready ($100.00, $30.00 cash deposit)'); };
  const go = (t) => { if (D.tab !== t) { D.tab = t; try { history.replaceState(null, '', '#' + t); } catch (e) { /* read-only hash */ } window.scrollTo({ top: 0 }); } D.render(); };
  A.goTab = (t) => go(t);

  /* top bar */
  function ctl() {
    const s = D.s;
    return `<button class="sw" data-act="toggleLink" aria-pressed="${s.link}" title="Simulates the store's internet connection"><i></i>Store internet</button>
      <button class="sw" data-act="toggleDriver" aria-pressed="${s.driverOnline}"><i></i>Driver signal</button>
      <button class="btn sm ${s.inject.drop ? 'warn' : ''}" data-act="armDrop" aria-pressed="${s.inject.drop}">${s.inject.drop ? 'Armed: ' : 'Fault: '}link drops after next approval</button>
      <button class="btn sm ${s.inject.timeout ? 'warn' : ''}" data-act="armTimeout" aria-pressed="${s.inject.timeout}">${s.inject.timeout ? 'Armed: ' : 'Fault: '}gateway timeout</button>
      <button class="btn sm" data-act="reset">Reset demo</button>`;
  }
  A.toggleLink = () => D.setLink(!D.s.link);
  A.toggleDriver = () => D.setDriverOnline(!D.s.driverOnline);
  A.armDrop = () => { D.s.inject.drop = !D.s.inject.drop; D.log('API', D.s.inject.drop ? 'Fault armed: the store link will drop right after the next gateway approval' : 'Fault disarmed', { cls: 'warn' }); };
  A.armTimeout = () => { D.s.inject.timeout = !D.s.inject.timeout; D.log('API', D.s.inject.timeout ? 'Fault armed: the next gateway call will time out' : 'Fault disarmed', { cls: 'warn' }); };
  A.reset = () => { A.stopPlay(); fresh(); };

  /* overview is static, see overview.js */
  D.views.overview = { render(el) { el.innerHTML = ''; } };

  /* store floor */
  D.views.floor = {
    render(el) {
      el.innerHTML = `
      <div class="view-head"><div><h2>Store floor</h2><p>The customer app and the store's existing POS, side by side. They share one ledger: a payment or status change on either side shows up on the other within seconds.</p></div>
        <div class="ids"><span class="id">PAY01-PAY11</span><span class="id">FIN01-FIN10</span><span class="id">TER01</span><span class="id">APP03</span></div></div>
      <div class="floor">
        <div class="col"><div class="cap"><b>Customer app</b> iOS + Android \u00b7 the website runs the same flows</div>${D.custPhone()}</div>
        <div class="col"><div class="cap"><b>Existing POS at the counter</b> VB6 + SQL Server 2008 R2 \u00b7 first adapter of the universal connector \u00b7 same screens staff use today</div>${D.posWindow()}
          <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">${D.posTermPanel()}
            <section class="panel" style="flex:1 1 260px"><div class="panel-h"><h3>Things to try</h3><button class="btn sm" data-act="goTab" data-arg="tests">Guided tests</button></div>
              <div class="panel-b"><ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:13.5px">
                <li>Pay ticket 1042 in the app and watch the POS balance drop.</li>
                <li>Open the app's payment form, then press <b>Clover</b> in the POS.</li>
                <li>Take part of a balance on <b>Ingenico</b> and the rest on <b>Dejavoo</b>. Each posts once with its own reference.</li>
                <li>Turn off <b>Store internet</b>, take cash at the POS, then turn it back on.</li>
                <li>Select ticket 1043 in the POS, press <b>Mark Ready</b> and watch the phone.</li>
                <li>Switch the app to <b>KO</b> or <b>JA</b>, then pick the Seoul or Tokyo store and pay in won or yen through CyberSource.</li>
                <li>Select ticket 1039 in the POS, press <b>Print receipt</b>, then claim it in the app.</li></ul></div></section>
          </div></div>
      </div>`;
    },
  };

  /* guided tests */
  let RUN = 0;
  const STOP = { stop: true };
  D.ui.narr = null; D.ui.playing = null;
  const openInv = (id) => { Object.assign(D.ui.cust, { signed: true, screen: 'inv', inv: id }); D.render(); };
  const synced = async (id = '1042', max = 4000) => { const t = Date.now(); while (Date.now() - t < max) { if (D.s.cloud.inv[id].ver === D.s.pos.invoices[id].ver) return; await new Promise((r) => setTimeout(r, 100)); } };
  async function payApi(amt) { await synced(); const r = await D.checkout.start('1042', amt ?? D.bal(D.s.pos.invoices['1042'])); if (!r.err) await D.checkout.submit(r.op); await synced(); return r; }
  async function prepDelivery(c) {
    const s = D.s;
    if (s.conn.state !== 'online') return { err: 'Turn Store internet back on first.' };
    if (!['Ready'].includes(s.pos.invoices['1042'].status)) return { err: 'Ticket 1042 is no longer Ready. Reset the demo first.' };
    if (D.bal(s.pos.invoices['1042']) > 0 && !s.cloud.dlv.length) await payApi();
    let d = s.cloud.dlv.find((x) => x.inv.includes('1042') && !['Cancelled', 'Delivered'].includes(x.state));
    if (!d) d = D.dlvApi.request(['1042'], D.WINS[0]);
    if (d.err) return d;
    if (c) c.check();
    await D.dlvApi.confirm(d.id); await synced();
    if (D.bal(s.pos.invoices['1042']) > 0) await payApi();
    if (!d.driver) D.dlvApi.assign(d.id, 'Marco R.');
    if (d.state !== 'Out for delivery') D.dlvApi.dispatch(d.id);
    return d;
  }
  A.drvPrep = async () => { const d = await prepDelivery(); if (d && d.err) { D.log('API', d.err, { cls: 'warn' }); return; } Object.assign(D.ui.drv, { screen: 'job', id: d.id }); D.render(); };

  const ROUTES = Object.keys(D.TERMS);
  const SC = [
    { id: 'at09', ids: ['AT09', 'PAY02', 'FIN08'], title: 'Deposit, then pay the rest online', what: '$100 ticket with a $30 deposit. The app collects exactly $70 and the POS shows $0 due.',
      async run(c) {
        await c.say('Ticket 1042 is $100.00. Jordan paid a $30.00 cash deposit at drop-off, so $70.00 is due. The POS has marked it Ready.', 3400);
        openInv('1042'); await c.say('The app shows the POS numbers and when they were last verified.', 2600);
        A.custPay('1042'); await c.say('Jordan chooses the full balance.', 1800);
        await A.custContinue(); c.check();
        await c.say('The server re-read the live balance from SQL Server and locked the ticket. The card goes into the Authorize.net hosted form, never into our app.', 3800);
        await A.custSubmit(); c.check();
        A.posSel('1042');
        await c.say('Approved, verified on the server, posted to the POS once. The POS balance is $0.00 and the ticket stays Ready until pickup.', 4200);
        await c.say('Loyalty went up 70 points from the POS\'s own rule. The platform never awards points by itself.', 3400);
      } },
    { id: 'at10', routes: ROUTES, ids: ['AT10', 'TER01', 'FIN04'], title: 'Part online, rest at the terminal', what: '$20 in the app, then $50 from a POS-started terminal sale. $70 \u2192 $50 \u2192 $0. Run it on each route: all three are tested separately.',
      async run(c, rt = 'Clover') {
        await c.say(`Same ticket: $100.00 total, $30.00 deposit. Jordan pays $20.00 now in the app and the rest at pickup on ${rt}.`, 3200);
        openInv('1042'); A.custPay('1042'); Object.assign(D.ui.cust.pay, { mode: 'part', custom: '20.00' }); D.render();
        await c.say('Part payment of $20.00. The app shows $50.00 will remain.', 2600);
        await A.custContinue(); c.check(); await c.say('Hosted Authorize.net form.', 1400); await A.custSubmit(); c.check();
        A.posSel('1042'); await c.say('The POS now shows $50.00 due.', 2600);
        A.posPay(rt); await c.say(`At pickup the clerk starts a ${rt} sale from the POS invoice. The amount comes from the POS, not typed on the device.`, 3600);
        await A.posTerm('approve'); c.check();
        await c.say(`$70.00, then $50.00, then $0.00 on ${rt}. Each collection posted once with its own reference. Clover, Ingenico and Dejavoo are each tested on their own; none stands in for another.`, 4600);
      } },
    { id: 'route', routes: ROUTES, ids: ['AT61', 'AT62', 'AT63', 'TER10', 'FIN06'], title: 'Each terminal route on its own', what: 'Decline, then a lost terminal response settled by inquiry and posted once, then a refund through the same provider. AT61 Clover, AT62 Ingenico, AT63 Dejavoo.',
      async run(c, rt = 'Clover') {
        const at = { Clover: 'AT61', Ingenico: 'AT62', Dejavoo: 'AT63' }[rt];
        await c.say(`${at}: the ${rt} route passes on its own. Ticket 1042 has $70.00 due.`, 2800);
        A.posSel('1042'); A.posPay(rt);
        await c.say(`The clerk starts a $70.00 ${rt} sale from the POS invoice.`, 2600);
        await A.posTerm('decline'); c.check();
        await c.say('Declined. Nothing posted, the guard is released and $70.00 is still due.', 3000);
        A.posPay(rt); await c.say('Another card. This time the terminal approves, but its answer never reaches the POS.', 3000);
        await A.posTerm('noresp'); c.check();
        await c.say(`The POS did not guess and did not retry. An inquiry by the original reference found the approval and posted it once with a ${D.TERMS[rt].pfx} reference.`, 4400);
        go('portal'); Object.assign(D.ui.portal, { tab: 'payments', ref: '20.00', err: '' }); D.render();
        await c.say(`The manager refunds $20.00. It goes back through ${rt} against the original transaction, never through a different provider.`, 3400);
        const p = D.s.pos.invoices['1042'].pays.find((x) => x.via === rt);
        await D.refund('1042', p.ref, 2000); await synced(); c.check();
        await c.say(`One POS credit line, linked to the original ${rt} payment.`, 3200);
      } },
    { id: 'at15', ids: ['AT15', 'FIN01', 'FIN02', 'FIN09'], title: 'Counter and app at the same moment', what: 'The app has checkout open; the clerk tries Clover on the same ticket. The POS refuses.',
      async run(c) {
        await c.say('What if the clerk and Jordan try to collect the same ticket at the same time?', 2600);
        openInv('1042'); A.custPay('1042'); await A.custContinue(); c.check();
        await c.say('Jordan has the payment form open. A financial guard in the store agent now protects ticket 1042.', 3400);
        A.posSel('1042'); A.posPay('Clover');
        await c.say('The clerk presses Clover for $70.00. The patched POS payment screen checks the guard and stops before the terminal is touched.', 4200);
        A.posMsgOk(); await A.custSubmit(); c.check();
        await c.say('Jordan\'s payment completes and releases the guard.', 2200);
        A.posRefresh();
        await c.say('The clerk presses Refresh: $0.00 due. No double collection. It works in reverse too: during a terminal sale, the app says the ticket is being updated at the counter.', 4600);
      } },
    { id: 'at13', ids: ['AT13', 'PAY06', 'PAY11', 'CON12'], title: 'Link drops right after approval', what: 'Money approved, POS not updated yet. No second charge, a visible exception, one posting on reconnect.',
      async run(c) {
        await c.say('Worst case: Authorize.net approves, then the store internet drops before the POS is updated.', 3000);
        D.s.inject.drop = true; openInv('1042'); A.custPay('1042'); await A.custContinue(); c.check(); await A.custSubmit(); c.check();
        await c.say('Jordan sees "Payment received", never "failed, pay again". Another charge on this ticket is blocked.', 3600);
        go('portal'); D.ui.portal.tab = 'overview'; D.render();
        await c.say('The manager sees an open exception with the safe next step.', 3200);
        await c.say('The internet comes back. The recovery gate posts approved payments before anything else.', 2400);
        await D.setLink(true); c.check();
        go('floor'); A.posSel('1042');
        await c.say('Posted exactly once, exception resolved, and online payment reopened only after reconciliation.', 4000);
      } },
    { id: 'at14', ids: ['AT14', 'PAY04', 'PAY09'], title: 'Gateway never answers', what: 'Outcome unknown: no "failed" message, no retry charge. An inquiry finds the original approval.',
      async run(c) {
        await c.say('Authorize.net receives the charge but its answer never arrives.', 2600);
        D.s.inject.timeout = true; openInv('1042'); A.custPay('1042'); await A.custContinue(); c.check();
        const p = A.custSubmit();
        await c.say('Outcome unknown. The app does not say "failed" and Jordan cannot pay again while it is unresolved.', 3000);
        await p; c.check();
        await c.say('The server queried Authorize.net for the original transaction, found it approved, and posted it once.', 3800);
      } },
    { id: 'at18', ids: ['AT18', 'FIN05', 'TER10'], title: 'Partial approval at the terminal', what: '$50 requested, card approves $20. The POS records $20, never $50.',
      async run(c) {
        A.posSel('1042'); D.ui.pos.amt = '50.00'; D.render();
        await c.say('The clerk runs $50.00 on the Ingenico terminal. The card only has $20.00 available.', 3000);
        A.posPay('Ingenico'); await c.say('Terminal waiting for the card.', 1500);
        await A.posTerm('partial'); c.check();
        await c.say('The POS records $20.00, not $50.00. $50.00 stays due, and the clerk collects the rest or reverses it.', 4200);
      } },
    { id: 'off', ids: ['AT07', 'SCP08', 'CON06', 'OFF'], title: 'Store internet goes down', what: 'Offline Safe Mode: POS keeps working, apps go read-only, recovery replays safely.',
      async run(c) {
        await c.say('The store internet goes down in the middle of the day.', 2200);
        await D.setLink(false); openInv('1042');
        await c.say('The app shows last-verified data with a clear banner. Online payment is paused for this store only. Other merchants are unaffected.', 4000);
        A.posSel('1042'); D.ui.pos.amt = '20.00'; A.posPay('Cash');
        await c.say('The counter keeps working. A $20.00 cash payment is saved in the POS and waits in the encrypted local outbox.', 3800);
        D.ui.pos.amt = '10.00'; A.posPay('Clover');
        await c.say('Card terminals need the processor, so the POS says so plainly. Nothing is approved offline.', 3400);
        A.posMsgOk(); A.posSel('1043'); A.posStatus('Ready');
        await c.say('Ticket 1043 is marked Ready. That change is queued too.', 2800);
        await c.say('Internet is back. Watch the recovery steps in the trace.', 1800);
        await D.setLink(true); c.check();
        await c.say('Money first, then status, then reconciliation, then payments reopen. Jordan gets one "Ready" alert for 1043.', 4200);
      } },
    { id: 'dlv', ids: ['AT20', 'DEL04-DEL06', 'DRV04', 'DRV07'], title: 'Delivery fee and dispatch gate', what: 'Fee posts to the POS, dispatch is blocked until it is paid, the driver completes once with the required note.',
      async run(c) {
        await c.say('Delivery is paid-only. Jordan pays ticket 1042 in full, then asks for delivery.', 2800);
        await payApi(); c.check();
        openInv('1042'); A.custDlv('1042'); await c.say('Windows and the $8.00 fee are shown before submitting.', 2800);
        A.custDlvSubmit(); const d = D.s.cloud.dlv[0];
        await c.say('Requested. Not confirmed yet, so no window is promised.', 2600);
        go('portal'); Object.assign(D.ui.portal, { tab: 'deliveries', sel: d.id }); D.render();
        await c.say('The store confirms the window. The $8.00 fee is written to ticket 1042 in the POS first.', 2800);
        await D.dlvApi.confirm(d.id); await synced(); c.check();
        A.pdDispatch(d.id); await c.say('Dispatch is blocked: the $8.00 fee is unpaid and no driver is assigned.', 3800);
        go('floor'); openInv('1042'); A.custPay('1042'); await A.custContinue(); c.check(); await A.custSubmit(); c.check();
        await c.say('Jordan pays the $8.00 fee in the app.', 2400);
        go('portal'); A.pdAssign(d.id); A.pdDispatch(d.id);
        await c.say('Every check passes. Out for delivery.', 2800);
        go('driver'); Object.assign(D.ui.drv, { screen: 'job', id: d.id }); D.render();
        await c.say('The driver sees only this job, with no balances or payment history.', 2800);
        A.drvDeliver(); await c.say('Marking it delivered without a note is refused. The driver note is a required field.', 3200);
        D.ui.drv.note = 'Handed to Jordan at the door, 2 garment bags'; D.render();
        await c.say('The driver adds a note.', 1600);
        A.drvDeliver(); await synced(); c.check();
        await c.say('Delivered. The POS closes the ticket once and Jordan is notified.', 3600);
      } },
    { id: 'dup', ids: ['AT12', 'PAY05', 'NOT03'], title: 'Double taps and repeated webhooks', what: 'Same operation submitted twice, webhook delivered ten times: one charge, one posting.',
      async run(c) {
        openInv('1042'); A.custPay('1042'); await A.custContinue(); c.check();
        await c.say('Jordan double-taps Pay on a slow connection.', 2200);
        const op = D.ui.cust.pay.op;
        await Promise.all([A.custSubmit(), D.checkout.submit(op)]); c.check();
        await c.say('The second submit carried the same operation id and was ignored.', 3000);
        D.webhook(op, 10);
        await c.say('Authorize.net sends the same webhook ten times. One is processed and nine are ignored. One POS posting, one notification.', 4400);
      } },
    { id: 'iso', ids: ['AT04', 'SEC02', 'NFR10'], title: 'Tenant isolation and roles', what: 'Changed ids and wrong roles get 403 with no data, and every attempt is logged.',
      async run(c) {
        go('admin'); await c.say('The platform hosts many merchants. Let\'s try reaching data we shouldn\'t.', 2600);
        await A.admIso(); c.check();
        await c.say('All four were denied on the server and recorded. Hiding a button is never the only protection.', 3800);
      } },
    { id: 'drv', ids: ['AT28', 'DRV06', 'DRV09', 'STA10'], title: 'Driver loses signal', what: 'Proof captured offline stays PENDING SYNC until the server revalidates it.',
      async run(c) {
        await c.say('Setting up a dispatched delivery for ticket 1042.', 2000);
        const d = await prepDelivery(c); c.check();
        go('driver'); Object.assign(D.ui.drv, { screen: 'job', id: d.id }); D.render();
        await c.say('The driver walks into a building with no signal.', 2400);
        await D.setDriverOnline(false); D.ui.drv.note = 'Left with the concierge, signed log at front desk'; A.drvDeliver();
        await c.say('Proof is saved on the phone as PENDING SYNC / NOT CONFIRMED. The customer and the POS still show Out for delivery.', 4000);
        await c.say('Signal returns.', 1400);
        await D.setDriverOnline(true); await synced(); c.check();
        await c.say('The server rechecked the assignment and accepted it. The POS ticket is set to Delivered once.', 3800);
      } },
    { id: 'at65', v14: true, ids: ['AT65', 'UCON13', 'UCON05'], title: 'Contract tests on the WBS adapter', what: 'The harness runs all seven suites against the WBS POS adapter. A build without a passing report cannot go live.',
      async run(c) {
        go('connectors'); await c.say('Every adapter must pass the same contract tests before it can be enabled in production.', 3000);
        await A.ucHarness('wbs-pos@1.0.0'); c.check();
        await c.say('38 of 38 passed: connection, read, reversible write, duplicate and replay, offline queue and recovery, mapping validation and capability checks.', 4200);
        await A.ucUpgrade('L-WS'); c.check();
        await c.say('Upgrading Westside to 1.0.1 is blocked, because that build has no passing report yet.', 3400);
        await A.ucHarness('wbs-pos@1.0.1'); c.check(); await A.ucUpgrade('L-WS'); c.check();
        await c.say('With a passing report, Westside moves to 1.0.1. Downtown and the synthetic stores stay on their pinned version.', 3800);
      } },
    { id: 'at66', v14: true, ids: ['AT66', 'AT79', 'UCON21'], title: 'Second production adapter, same app', what: 'The WBS POS and the Android POS run side by side. The same contract tests pass on both and the same app build serves both stores.',
      async run(c) {
        go('connectors'); await c.say('Two real POS systems sit behind the connector: the WBS POS and an Android POS that WBS picks after award.', 3400);
        await c.say('Different ids, status codes and money formats go in. The same canonical record comes out.', 3200);
        await A.ucBoth(); c.check();
        await c.say('The same harness passed 38 of 38 on both adapters. Only the limits the Android POS declares (rack, loyalty) differ, and the app shows them.', 4400);
        await A.ucHarness('android-pos@1.0.1'); c.check(); await A.ucUpgrade('L-AND'); c.check();
        await c.say('The Android adapter moves to 1.0.1 at the staging store only, after its own passing report.', 3200);
        await A.ucVerBack('L-AND'); c.check();
        await c.say('And it rolls back to the last known good version, with the queue and checkpoints kept.', 3200);
      } },
    { id: 'at67', v14: true, ids: ['AT67', 'UCON04'], title: 'Mapping change by configuration only', what: 'Pier St sends a new status code and item code. They are held, mapped in Super Admin, published, then rolled back.',
      async run(c) {
        go('connectors'); D.ui.ucon.mapSel = 'L-PS'; D.render();
        await c.say('The Pier St test POS started sending status code 35 and item code ALT. Neither is mapped, so 3 events are held. Nothing gets a default.', 4200);
        A.ucSetMap('L-PS', 'status', '35', 'Ready'); A.ucSetMap('L-PS', 'item', 'ALT', 'svc.alteration');
        await c.say('The admin maps 35 to Ready and ALT to an alteration service, in configuration.', 3000);
        A.ucValidate('L-PS'); await c.say('Validation passes, including a dry run on recent events.', 2400);
        await A.ucPublish('L-PS'); c.check();
        await c.say('Version 4 is live. The agent picked it up without a deployment and released the held events. Who and when are in the history.', 4200);
        A.ucRollback('L-PS'); await c.say('Rolling back restores version 3 exactly, again with a history line.', 3200);
      } },
    { id: 'at68', v14: true, ids: ['AT68', 'UCON02'], title: 'No POS names outside adapters', what: 'A code scan looks for POS table, column and status names in platform code. Expected: none.',
      async run(c) {
        go('connectors'); await c.say('Only an adapter may know its POS table, column and status names.', 2600);
        await A.ucLeak(); c.check();
        await c.say('0 found in the API, apps, website, portal, Super Admin, payments and delivery code.', 3600);
      } },
    { id: 'at69', v14: true, ids: ['AT69', 'UCON06'], title: 'Capability honesty', what: 'Rack data is switched off in the Downtown manifest. The app shows the limit instead of an old value.',
      async run(c) {
        go('connectors'); D.ui.ucon.capSel = 'L-DT'; D.render();
        await c.say('Downtown declares rack data today. In test we switch it off in the adapter manifest.', 3000);
        A.ucCap('L-DT:rack'); c.check();
        go('floor'); openInv('1042');
        await c.say('The app says the rack is not available from this store\'s POS. It does not show an old rack or make one up.', 4200);
        go('connectors'); A.ucCap('L-DT:rack'); await c.say('Switched back on.', 1800);
      } },
    { id: 'at71', v14: true, ids: ['AT71', 'UCON05', 'UCON11'], title: 'Adapter isolation', what: 'The Westside agent stops while Downtown takes a payment. Westside queues, then replays in order.',
      async run(c) {
        go('connectors'); await c.say('Westside\'s agent stops while Downtown keeps trading.', 2600);
        const dr = A.ucDrill(); await payApi(); c.check();
        await c.say('Downtown took $70.00 online and posted it once. Westside queues its own changes.', 3400);
        await dr; c.check();
        await c.say('Westside restarted and replayed its queue in order: 0 lost, 0 duplicated.', 3400);
      } },
    { id: 'mkt', v16: true, ids: ['AT94', 'AT99', 'GLB-018', 'PAY12'], title: 'Tokyo store: Japanese, yen, CyberSource', what: 'The app switches to Japanese, picks the Tokyo store and pays a yen ticket through CyberSource with 0 decimals.',
      async run(c) {
        go('admin'); D.ui.admin.mloc = 'L-TYO'; D.render();
        await c.say('Super Admin set up the Tokyo store from dropdowns: Japan, JPY, ja-JP, Asia/Tokyo, country pack ja-JP. The provider follows the country: CyberSource.', 4400);
        go('floor'); A.custLang('ja'); A.custStore('L-TYO'); c.check();
        await c.say('One tap switches the app to Japanese. The store sets the currency, not the language.', 3200);
        openInv('T-7730'); await c.say('Ticket T-7730 comes from the store POS through the connector: 3,250 yen, shown with no decimals.', 3400);
        A.custPay('T-7730'); await A.custContinue(); c.check();
        await c.say('CyberSource hosts the form. Apple Pay is on for this account, Google Pay is shown as not available with a reason.', 3800);
        await A.custSubmit(); c.check();
        await c.say('Paid once in yen and posted once to the POS in the original currency. No conversion anywhere.', 3600);
      } },
    { id: 'mktchg', v16: true, ids: ['AT101', 'GLB-017', 'ADM24'], title: 'Market change with dry run and rollback', what: 'A currency the POS cannot hold is rejected. A language and tax display change passes, goes live without a deploy, then rolls back.',
      async run(c) {
        go('admin'); D.ui.admin.mloc = 'L-DT'; D.render();
        await c.say('An operator tries to switch Downtown to euros.', 2400);
        A.admMkSet('cur', 'EUR'); A.admMkDry(); c.check();
        await c.say('Rejected in the dry run: the POS at Downtown records USD only. Old invoices would never be rewritten anyway.', 3800);
        A.admMkDiscard(); D.ui.admin.mloc = 'L-TYO'; D.render();
        await c.say('Now Tokyo enables Korean as a second language and switches tax display to exclusive.', 3200);
        A.admMkChip('langs|ko-KR'); A.admMkSet('tax', 'exclusive'); A.admMkDry(); c.check();
        A.admMkAct(); c.check();
        await c.say('Dry run passed and version 2 is live, with no code change or redeploy. Who and when are in the history.', 3600);
        A.admMkBack(); c.check();
        await c.say('Rolled back to version 1, the last known good config.', 2800);
      } },
    { id: 'claim', v16: true, ids: ['AT84', 'APP02', 'NFR12'], title: 'Claim a walk-in ticket from the receipt', what: 'The POS prints a single-use claim code on the normal receipt. The app links only that ticket and rejects wrong, expired and used codes.',
      async run(c) {
        A.posSel('1039'); await c.say('Ticket 1039 belongs to a walk-in customer with no app account.', 2600);
        A.posPrint(); c.check();
        await c.say('The receipt prints through the existing POS print routine, with a claim code and QR. Nothing is printed from the cloud.', 3800);
        const code = D.ui.pos.receipt.code; A.posPrintClose();
        A.custClaimOpen(); D.ui.cust.claim.code = 'ABCD-2345'; A.custClaim(); c.check();
        await c.say('A guessed code is rejected and counted against the attempt limit.', 3000);
        D.ui.cust.claim.code = 'EXPD-2Q4M'; A.custClaim(); await c.say('An expired code is rejected too.', 2400);
        D.ui.cust.claim.code = code; A.custClaim(); c.check();
        await c.say('The real code links ticket 1039 only. Full history needs a second verified check.', 3600);
        A.custClaimOpen(); D.ui.cust.claim.code = code; A.custClaim();
        await c.say('The same code cannot be used twice.', 2400);
      } },
    { id: 'otp', v16: true, ids: ['AT03', 'APP01', 'AT106'], title: 'Sign in with an SMS code', what: 'Email and password, then a one-time SMS code on every sign-in. A wrong code is rejected and counted.',
      async run(c) {
        A.custSignOut(); await c.say('Jordan signs out, then signs in again.', 2200);
        A.custLoginNext(); c.check();
        await c.say('After email and password, a 6-digit code goes to the verified phone by SMS. It expires in 5 minutes and works once.', 3800);
        D.ui.cust.login.code = '000000'; A.custVerify(); c.check();
        await c.say('A wrong code is rejected and logged. 4 tries left.', 2800);
        D.ui.cust.login.code = D.ui.cust.login.expect; A.custVerify(); c.check();
        await c.say('The right code signs Jordan in and is spent, so it cannot be replayed.', 3200);
      } },
    { id: 'tip', v16: true, ids: ['AT88', 'DRV11', 'DRV12'], title: 'Tip the driver after delivery', what: 'A separate tip on the same provider and currency as the ticket. A double tap still makes one tip.',
      async run(c) {
        openInv('1027'); await c.say('Ticket 1027 was delivered. Jordan can add a tip for the driver.', 2800);
        const t = A.custTip('1027'); const t2 = A.custTip('1027'); await Promise.all([t, t2]); c.check();
        await c.say('One tip on Authorize.Net in USD, posted to the POS as its own tip line. The ticket total and status did not change.', 4000);
      } },
  ];

  A.play = async (arg) => {
    const [id, rt] = String(arg).split(':'), sc = SC.find((x) => x.id === id), my = ++RUN;
    const title = sc.title + (rt ? ' \u00b7 ' + rt : '');
    fresh(); go('floor'); D.ui.playing = arg;
    let n = 0;
    const c = {
      check() { if (my !== RUN) throw STOP; },
      async say(text, ms) { if (my !== RUN) throw STOP; n++; D.ui.narr = { title, ids: sc.ids, text, n }; D.render(); await D.wait(ms || 2400); if (my !== RUN) throw STOP; },
    };
    try { await sc.run(c, rt); if (my === RUN) { D.ui.narr = { title, ids: sc.ids, text: 'Done. Look around freely, or play another test.', done: true }; } }
    catch (e) { if (e !== STOP) { console.error(e); D.ui.narr = { title, ids: sc.ids, text: 'This walkthrough stopped unexpectedly. Reset the demo and try again.', done: true }; } }
    finally { if (my === RUN) { D.ui.playing = null; D.render(); } }
  };
  A.stopPlay = () => { RUN++; D.ui.playing = null; D.ui.narr = null; D.render(); };

  const tcard = (s) => `<section class="panel" style="display:flex;flex-direction:column">
        <div class="panel-b" style="display:flex;flex-direction:column;gap:8px;flex:1">
          <div class="ids">${s.ids.map((i) => `<span class="id">${i}</span>`).join('')}</div>
          <h3 style="font-size:16px">${E(s.title)}</h3><p class="muted" style="margin:0;font-size:13px;flex:1">${E(s.what)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${(s.routes ? s.routes.map((r) => [s.id + ':' + r, r]) : [[s.id, 'Play']]).map(([arg, label]) => {
            const on = D.ui.playing === arg;
            return `<button class="btn ${s.routes ? 'sm' : ''} ${on ? '' : 'pri'}" data-act="${on ? 'stopPlay' : 'play'}" data-arg="${arg}">${on ? 'Stop' : (s.routes ? '&#9654; ' : '') + label}</button>`; }).join('')}</div></div></section>`;
  D.views.tests = {
    render(el) {
      el.innerHTML = `<div class="view-head"><div><h2>Guided tests</h2><p>Each walkthrough resets the demo, then plays a scenario from the SRS acceptance tests with captions. Pause any time with Stop and take over by hand.</p></div></div>
      <h3 class="tgrp">New in v1.6: markets, sign-in, receipts and tips</h3>
      <div class="grid g3">${SC.filter((s) => s.v16).map(tcard).join('')}</div>
      <h3 class="tgrp">Universal POS connector</h3>
      <div class="grid g3">${SC.filter((s) => s.v14).map(tcard).join('')}</div>
      <h3 class="tgrp">Payments, terminals, delivery and offline</h3>
      <div class="grid g3">${SC.filter((s) => !s.v14 && !s.v16).map(tcard).join('')}</div>`;
    },
  };

  /* paint */
  let lastTab = null;
  D.paint = () => {
    const ae = document.activeElement, fid = ae && ae.id, sel = fid && typeof ae.selectionStart === 'number' ? [ae.selectionStart, ae.selectionEnd] : null;
    const keep = {}; document.querySelectorAll('[data-keep]').forEach((el) => (keep[el.id] = [el.dataset.keep, el.scrollTop]));
    const lb = $('logbox'), lt = lb ? lb.scrollTop : 0;
    $('ctl').innerHTML = ctl();
    $('tabs').innerHTML = TABS.map(([k, l]) => `<button class="tab" role="tab" aria-selected="${D.tab === k}" data-act="goTab" data-arg="${k}">${l}</button>`).join('');
    const m = $('main'); if (m.dataset) m.dataset.tab = D.tab;
    const body = document.body; if (body && body.classList) body.classList.toggle('is-ov', D.tab === 'overview');
    if (lastTab !== D.tab && m.classList) { m.classList.remove('enter'); void m.offsetWidth; m.classList.add('enter'); }
    lastTab = D.tab;
    D.views[D.tab].render(m);
    D.views.trace.render($('trace'));
    const nr = D.ui.narr;
    $('narr').innerHTML = nr ? `<div class="narr" role="status"><div class="t"><b>${E(nr.title)}${nr.done ? '' : ' \u00b7 step ' + nr.n}</b>${E(nr.text)}</div>
      ${nr.done ? '<button class="btn sm" data-act="stopPlay">Close</button>' : '<button class="btn sm" data-act="stopPlay">Stop</button>'}</div>` : '';
    document.querySelectorAll('[data-keep]').forEach((el) => { const k = keep[el.id]; if (k && k[0] === el.dataset.keep) el.scrollTop = k[1]; });
    const nb = $('logbox'); if (nb) nb.scrollTop = lt;
    if (D.onPaint) D.onPaint();
    if (fid) { const n = $(fid); if (n && n !== document.activeElement) { n.focus({ preventScroll: true }); if (sel && n.setSelectionRange) try { n.setSelectionRange(sel[0], sel[1]); } catch (e) { /* not a text field */ } } }
  };

  /* events */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const f = A[b.dataset.act]; if (f) f(b.dataset.arg, b, e);
  });
  const bind = (e) => {
    const t = e.target, path = t.dataset && t.dataset.bind; if (!path) return;
    const [ns, ...rest] = path.split('.'); let o = D.ui[ns];
    for (let i = 0; i < rest.length - 1; i++) o = o[rest[i]];
    o[rest[rest.length - 1]] = t.value;
    if (path === 'cust.pay.custom' || t.hasAttribute('data-rerender')) D.render();
  };
  document.addEventListener('input', bind);
  document.addEventListener('change', bind);
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (D.views[h] && h !== 'trace' && h !== D.tab) { D.tab = h; D.render(); } });

  /* boot */
  const h = location.hash.slice(1);
  D.tab = TABS.some(([k]) => k === h) ? h : 'overview';
  D.s = D.seed();
  D.log('POS', 'Demo data loaded: Jordan Lee, ticket 1042 Ready ($100.00, $30.00 cash deposit)');
  D.paint();
  setInterval(() => { const a = document.activeElement; if (!document.hidden && !(a && /^(SELECT|INPUT)$/.test(a.tagName) && a.closest && a.closest('main'))) D.render(); }, 5000);
})();
