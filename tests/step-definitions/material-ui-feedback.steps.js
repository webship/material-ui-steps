'use strict';

// Notifications (Snackbar), alerts (Alert), the loading spinner (CircularProgress), progress bars (LinearProgress),
// badges, pagination and breadcrumbs.
//
// A notification is a Snackbar, at the edge of the window in a portal, read by its text; one that holds an Alert has
// role=alert and the Alert's kind (success, info, warning, error). It hides by itself after the time the app gives it.
// An alert outside a Snackbar is read the same way, and is dismissible when it has its close button. The kinds are
// the same words as the other component packs': primary is Material UI's info, danger its error.

const { When, Then } = require('@cucumber/cucumber');
const h = require('./material-ui-helpers');

const KIND_CLASS = { primary: 'Info', info: 'Info', success: 'Success', warning: 'Warning', danger: 'Error', error: 'Error' };

// The kind of an Alert (inside a notification or not), from Material UI's classes.
async function kindOfAlert(loc) {
  return loc.evaluate((el) => {
    const a = el.classList.contains('MuiAlert-root') ? el : el.querySelector('.MuiAlert-root');
    if (!a) return null;
    const m = [...a.classList].join(' ').match(/MuiAlert-(?:color|standard|filled|outlined)(Success|Info|Warning|Error)/);
    return m ? m[1] : null;
  });
}

/**
 * A notification (a Snackbar) is shown with this text, of a kind or any.
 *
 * Example #1: Then I should see a notification "Note archived"
 * Example #2: Then I should see a success notification "Employee deleted successfully."
 * Example #3: And we should not see an error notification "Failed to delete employee"
 * Example #4: Then I should see a success notification "Employee created successfully."
 * Example #5: But we should not see a notification "Note archived"
 *
 */
Then(/^(?:I |we )?should( not)? see an? (?:(primary|success|danger|error|warning) )?notification "([^"]*)"$/, async function (not, kind, text) {
  const loc = h.notification(this.page, text);
  if (not) {
    const gone = await h.waitGone(kind ? loc.filter({ has: this.page.locator(`[class*="MuiAlert-"][class*="${KIND_CLASS[kind]}"]`) }) : loc);
    if (gone !== true) throw h.failure(this.page, `Expected no ${kind ? `${kind} ` : ''}notification "${text}", but one is ${h.describe(gone)}.`);
    return;
  }
  const shown = await h.waitShown(loc);
  if (shown !== true) throw h.failure(this.page, `Expected a notification "${text}", but it is ${h.describe(shown)} after ${h.WAIT.shown / 1000} seconds.`);
  if (kind) {
    const k = await kindOfAlert(loc.first());
    if (k !== KIND_CLASS[kind]) throw h.failure(this.page, `Expected the notification "${text}" to be a ${kind} one, but it is ${k ? `a ${k.toLowerCase()} one` : 'of no kind'}.`);
  }
});

/**
 * A notification hides by itself (a Snackbar told how long it stays): waited for until it is gone.
 *
 * Example #1: Then the "Employee deleted successfully." notification should hide by itself
 * Example #2: And the "Note archived" notification should hide by itself
 * Example #3: Then the "Employee created successfully." notification should hide by itself
 * Example #4: And the "Element updated" notification should hide by itself
 * Example #5: Then the "Element deleted" notification should hide by itself
 *
 */
Then(/^the "([^"]*)" notification should hide by itself$/, async function (text) {
  const loc = h.notification(this.page, text);
  await h.waitShown(loc);
  const gone = await h.waitGone(loc, h.WAIT.notification);
  if (gone !== true) throw h.failure(this.page, `Expected the notification "${text}" to hide by itself within ${h.WAIT.notification / 1000} seconds, but it is ${h.describe(gone)}.`);
});

// An alert outside a notification, by its text.
function alertOf(page, text) {
  return page.locator('.MuiAlert-root:not(.MuiSnackbar-root .MuiAlert-root)').filter({ hasText: h.textRe(text) });
}

/**
 * An alert (outside a notification) is shown with this text, of a kind or any.
 *
 * Example #1: Then I should see an alert "This Alert displays the default close icon."
 * Example #2: Then we should see the success alert "This is a success Alert."
 * Example #3: And I should not see an alert "Something went wrong"
 * Example #4: Then I should see an alert "This Alert uses a Button component for its action."
 * Example #5: But I should not see the alert "This Alert displays the default close icon."
 *
 */
Then(/^(?:I |we )?should( not)? see (?:the|an?) (?:(primary|success|danger|error|warning) )?alert "([^"]*)"$/, async function (not, kind, text) {
  const loc = alertOf(this.page, text);
  if (not) {
    const gone = await h.waitGone(loc);
    if (gone !== true) throw h.failure(this.page, `Expected no alert "${text}", but one is ${h.describe(gone)}.`);
    return;
  }
  const shown = await h.waitShown(loc);
  if (shown !== true) throw h.failure(this.page, `Expected an alert "${text}", but it is ${h.describe(shown)}.`);
  if (kind) {
    const k = await kindOfAlert(loc.first());
    if (k !== KIND_CLASS[kind]) throw h.failure(this.page, `Expected the alert "${text}" to be a ${kind} one, but it is ${k ? `a ${k.toLowerCase()} one` : 'of no kind'}.`);
  }
});

/**
 * Dismiss an alert with its close button, and wait until it is gone.
 *
 * Example #1: When I dismiss the alert "This Alert displays the default close icon."
 * Example #2: And we dismiss the alert "Saved"
 * Example #3: When I dismiss the alert "Settings saved"
 * Example #4: And I dismiss the alert "Welcome back"
 * Example #5: When we dismiss the alert "This Alert displays the default close icon."
 *
 */
When(/^(?:I |we )?dismiss the alert "([^"]*)"$/, async function (text) {
  const loc = alertOf(this.page, text);
  if (await loc.count() === 0) throw h.failure(this.page, `Expected an alert "${text}", but the page has none.`);
  const close = loc.first().getByRole('button', { name: /^close$/i });
  if (await close.count() === 0) throw h.failure(this.page, `Expected the alert "${text}" to have a close button, but it has none: it is not dismissible.`);
  await close.first().click();
  const gone = await h.waitGone(loc);
  if (gone !== true) throw h.failure(this.page, `Expected the alert "${text}" to be gone once dismissed, but it is ${h.describe(gone)}.`);
});

/**
 * An alert is dismissible (it has its close button), or not.
 *
 * Example #1: Then the alert "This Alert displays the default close icon." should be dismissible
 * Example #2: And the alert "This Alert uses a Button component for its action." should not be dismissible
 * Example #3: Then the alert "Settings saved" should be dismissible
 * Example #4: And the alert "Payment failed" should not be dismissible
 * Example #5: Then the alert "Welcome back" should be dismissible
 *
 */
Then(/^the alert "([^"]*)" should( not)? be dismissible$/, async function (text, not) {
  const loc = alertOf(this.page, text);
  if (await loc.count() === 0) throw h.failure(this.page, `Expected an alert "${text}", but the page has none.`);
  const has = await loc.first().getByRole('button', { name: /^close$/i }).count() > 0;
  if (has === !!not) throw h.failure(this.page, `Expected the alert "${text}" ${not ? 'not ' : ''}to be dismissible, but it ${has ? 'has' : 'has no'} close button.`);
});

// A spinner: a progressbar with no value of its own (CircularProgress, indeterminate).
function spinners(page) {
  return page.locator('[role=progressbar].MuiCircularProgress-root:not([aria-valuenow]), [role=progressbar].MuiCircularProgress-indeterminate');
}

/**
 * A loading spinner is shown, or none is.
 *
 * Example #1: Then I should see a loading spinner
 * Example #2: And we should not see a loading spinner
 * Example #3: Then I should not see a loading spinner
 * Example #4: But we should see a loading spinner
 * Example #5: And I should see a loading spinner
 *
 */
Then(/^(?:I |we )?should( not)? see a loading spinner$/, async function (not) {
  const loc = spinners(this.page);
  const done = not ? await h.waitGone(loc, h.WAIT.progress) : await h.waitShown(loc);
  if (done !== true) throw h.failure(this.page, `Expected ${not ? 'no' : 'a'} loading spinner, but ${not ? 'one is' : 'it is'} ${h.describe(done)}.`);
});

/**
 * Wait until the loading spinners are gone.
 *
 * Example #1: When I wait for the loading spinner to disappear
 * Example #2: And we wait for the loading spinners to disappear
 * Example #3: When I wait for the loading spinners to disappear
 * Example #4: Then we wait for the loading spinner to disappear
 * Example #5: Given I wait for the loading spinners to disappear
 *
 */
When(/^(?:I |we )?wait for the loading spinners? to disappear$/, async function () {
  const done = await h.waitGone(spinners(this.page), h.WAIT.progress);
  if (done !== true) throw h.failure(this.page, `Expected the loading spinners to disappear within ${h.WAIT.progress / 1000} seconds, but one is ${h.describe(done)}.`);
});

// A progress bar (LinearProgress with a value) by its name, or the only one of the page.
async function progressBar(world, name) {
  const page = world.page;
  const bars = page.locator('[role=progressbar][aria-valuenow]');
  const bar = name ? page.getByRole('progressbar', { name, exact: true }) : bars;
  if (await bar.count() === 0) throw h.failure(page, name ? `Expected a progress bar named "${name}", but the page has none.` : 'Expected a progress bar with a value, but the page has none.');
  return bar.first();
}

/**
 * A progress bar is at a value now (its aria-valuenow, in percent of its range).
 *
 * Example #1: Then the progress bar should be at 10%
 * Example #2: And the "Upload" progress bar should be at 100%
 * Example #3: Then the progress bar should be at 0%
 * Example #4: And the "Upload" progress bar should be at 50%
 * Example #5: Then the progress bar should be at 12.5%
 *
 */
Then(/^the (?:"([^"]*)" )?progress bar should be at (\d+(?:\.\d+)?)%$/, async function (name, value) {
  const bar = await progressBar(this, name);
  const at = await bar.evaluate((el) => { const min = Number(el.getAttribute('aria-valuemin') || 0); const max = Number(el.getAttribute('aria-valuemax') || 100); return (Number(el.getAttribute('aria-valuenow')) - min) * 100 / (max - min); });
  if (Math.round(at * 10) / 10 !== Number(value)) throw h.failure(this.page, `Expected the progress bar to be at ${value}%, but it is at ${Math.round(at * 10) / 10}%.`);
});

/**
 * A progress bar reaches a value: waited for until it is there or past it.
 *
 * Example #1: Then the progress bar should reach 50%
 * Example #2: And the "Upload" progress bar should reach 100%
 * Example #3: Then the progress bar should reach 100%
 * Example #4: And the "Upload" progress bar should reach 30%
 * Example #5: Then the progress bar should reach 70%
 *
 */
Then(/^the (?:"([^"]*)" )?progress bar should reach (\d+(?:\.\d+)?)%$/, async function (name, value) {
  const bar = await progressBar(this, name);
  const end = Date.now() + h.WAIT.progress;
  let at = 0;
  while (Date.now() < end) {
    at = await bar.evaluate((el) => { const min = Number(el.getAttribute('aria-valuemin') || 0); const max = Number(el.getAttribute('aria-valuemax') || 100); return (Number(el.getAttribute('aria-valuenow')) - min) * 100 / (max - min); });
    if (at >= Number(value)) return;
    await h.sleep(100);
  }
  throw h.failure(this.page, `Expected the progress bar to reach ${value}% within ${h.WAIT.progress / 1000} seconds, but it is at ${Math.round(at)}%.`);
});

/**
 * The badge a button, link, heading, menu item or tab shows (Material UI's Badge around it), or none.
 *
 * Example #1: Then the "Open notifications" button should show the badge "4"
 * Example #2: And the "Inbox" menu item should not show the badge "2"
 * Example #3: Then the "Inbox" menu item should show the badge "2"
 * Example #4: And the "Orders" link should show the badge "5"
 * Example #5: Then the "Messages" tab should not show the badge "1"
 *
 */
Then(/^the "([^"]*)" (button|link|heading|menu item|tab) should( not)? show the badge "([^"]*)"$/, async function (name, role, not, badge) {
  const el = this.page.getByRole(role === 'menu item' ? 'menuitem' : role, { name, exact: true });
  if (await el.count() === 0) throw h.failure(this.page, `Expected a ${role} named "${name}", but the page has none.`);
  const text = await el.first().evaluate((e) => {
    const root = e.closest('.MuiBadge-root') || e.querySelector('.MuiBadge-root') || (e.parentElement && e.parentElement.closest('.MuiBadge-root'));
    const b = root && root.querySelector('.MuiBadge-badge:not(.MuiBadge-invisible)');
    return b ? b.textContent.trim() : null;
  });
  if ((text === badge) === !!not) throw h.failure(this.page, `Expected the "${name}" ${role} ${not ? 'not ' : ''}to show the badge "${badge}", but it shows ${text === null ? 'none' : `"${text}"`}.`);
});

// A pagination (Pagination's nav) by its name, or the only one of the page.
async function paginationOf(world, name) {
  const page = world.page;
  const navs = page.locator('nav.MuiPagination-root, nav[aria-label*="pagination" i]');
  const nav = name ? page.getByRole('navigation', { name, exact: true }) : navs;
  if (await nav.count() === 0) throw h.failure(page, name ? `Expected a pagination named "${name}", but the page has none.` : 'Expected a pagination, but the page has none.');
  return nav.first();
}

// A breadcrumb trail by its name, or the only one of the page.
async function breadcrumbOf(world, name) {
  const page = world.page;
  const navs = page.locator('nav.MuiBreadcrumbs-root');
  const nav = name ? page.getByRole('navigation', { name, exact: true }) : navs;
  if (await nav.count() === 0) throw h.failure(page, name ? `Expected a breadcrumb named "${name}", but the page has none.` : 'Expected a breadcrumb, but the page has none.');
  return nav.first();
}

/**
 * The current page of a pagination (the item Material UI marks with aria-current), or of a breadcrumb (its last item,
 * or the one marked so).
 *
 * Example #1: Then the current page of the pagination should be "2"
 * Example #2: And the current page of the breadcrumb should be "Breadcrumbs"
 * Example #3: Then the current page of the "pagination navigation" pagination should be "1"
 * Example #4: Then the current page of the pagination should be "1"
 * Example #5: And the current page of the breadcrumb should be "Core"
 *
 */
Then(/^the current page of the (?:"([^"]*)" )?(pagination|breadcrumb) should be "([^"]*)"$/, async function (name, kind, current) {
  const nav = kind === 'pagination' ? await paginationOf(this, name) : await breadcrumbOf(this, name);
  const end = Date.now() + h.WAIT.value;
  let now = '';
  while (Date.now() < end) {
    now = await nav.evaluate((el, k) => {
      const marked = el.querySelector('[aria-current]:not([aria-current=false])');
      if (marked) return marked.textContent.trim();
      if (k === 'breadcrumb') { const items = el.querySelectorAll('li.MuiBreadcrumbs-li'); return items.length ? items[items.length - 1].textContent.trim() : ''; }
      const sel = el.querySelector('.Mui-selected'); return sel ? sel.textContent.trim() : '';
    }, kind);
    if (now === current) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the current page of the ${kind} to be "${current}", but it is "${now}".`);
});

/**
 * A link (or button) of a pagination is disabled, or not: named the way the pagination names it ("Go to next page").
 *
 * Example #1: Then the "Go to previous page" link of the pagination should be disabled
 * Example #2: And the "Go to next page" link of the pagination should not be disabled
 * Example #3: Then the "Go to next page" link of the pagination should be disabled
 * Example #4: And the "Go to page 2" link of the "pagination navigation" pagination should not be disabled
 * Example #5: Then the "Go to previous page" link of the "pagination navigation" pagination should not be disabled
 *
 */
Then(/^the "([^"]*)" link of the (?:"([^"]*)" )?pagination should( not)? be disabled$/, async function (label, name, not) {
  const nav = await paginationOf(this, name);
  const item = nav.getByRole('button', { name: label, exact: true }).or(nav.getByRole('link', { name: label, exact: true }));
  if (await item.count() === 0) throw h.failure(this.page, `Expected the pagination to have a link named "${label}", but it has none.`);
  const disabled = await item.first().evaluate((el) => el.disabled === true || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('Mui-disabled'));
  if (disabled === !!not) throw h.failure(this.page, `Expected the "${label}" link of the pagination ${not ? 'not ' : ''}to be disabled, but it ${disabled ? 'is' : 'is not'}.`);
});

/**
 * What a breadcrumb trail reads, its items in order, separated by ">" or "/".
 *
 * Example #1: Then the breadcrumb should read "MUI > Core > Breadcrumbs"
 * Example #2: And the "breadcrumb" breadcrumb should read "Dashboard / Home"
 * Example #3: Then the breadcrumb should read "MUI / Core / Breadcrumbs"
 * Example #4: And the breadcrumb should read "Employees > New"
 * Example #5: Then the "breadcrumb" breadcrumb should read "MUI > Core > Breadcrumbs"
 *
 */
Then(/^the (?:"([^"]*)" )?breadcrumb should read "([^"]*)"$/, async function (name, trail) {
  const nav = await breadcrumbOf(this, name);
  const want = trail.split(/\s*[>/]\s*/).map((s) => s.trim());
  const end = Date.now() + h.WAIT.value;
  let items = [];
  while (Date.now() < end) {
    items = await nav.evaluate((el) => [...el.querySelectorAll('li.MuiBreadcrumbs-li')].map((li) => li.textContent.trim()));
    if (items.join('|') === want.join('|')) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the breadcrumb to read "${want.join(' > ')}", but it reads "${items.join(' > ')}".`);
});
