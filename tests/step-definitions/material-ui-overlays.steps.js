'use strict';

// Dialogs, side panels (temporary drawers), drop-down menus, notifications (snackbars) and hints (tooltips): opened,
// closed, Escape, a click outside, shown or not, what they show, a button pressed in them, an item chosen from a menu,
// a hint shown under the pointer, and the general wait for every component to stop moving.
//
// A component is named the way a person reads it: a dialog by its title (one with no title by the start of its text),
// a side panel by its name or a heading in it, a drop-down menu by the button that opens it, a notification or a
// tooltip by its text. A side panel or a menu with no name of its own takes the name the scenario gives it when it
// opens it with a named button. The waits are the component's own: shown means visible, at full opacity, with no
// transition running; closed means removed from the page, or hidden and still. Never a fixed time.

const { When, Then } = require('@cucumber/cucumber');
const h = require('./material-ui-helpers');

async function shownOrFail(world, kind, name) {
  const done = await h.waitShown(h.component(world, kind, name));
  if (done === true) return;
  throw h.failure(world.page, `Expected the "${name}" ${h.kindOf(kind)} to be shown, but it is ${h.describe(done)} after ${h.WAIT.shown / 1000} seconds.`, {
    hint: h.kindOf(kind) === 'dialog'
      ? 'a dialog is named by its title (its aria-labelledby): check the title, or the start of its text for a dialog with no title.'
      : 'a side panel or a menu with no name of its own takes the name a scenario gives it when it opens it with a named button.',
  });
}

async function goneOrFail(world, kind, name) {
  const done = await h.waitGone(h.component(world, kind, name));
  if (done === true) return;
  throw h.failure(world.page, `Expected the "${name}" ${h.kindOf(kind)} to be closed, but it is ${h.describe(done)} after ${h.WAIT.gone / 1000} seconds.`, {
    hint: 'a dialog told not to close with Escape or a click outside stays open: close it with one of its own buttons.',
  });
}

// After an action that may or may not close a component (Escape, a click outside, a button pressed in it): wait until
// it has answered, closed and gone, or still open and still.
async function settle(world, kind, name) {
  const loc = h.component(world, kind, name);
  const end = Date.now() + h.WAIT.gone;
  await h.sleep(30);
  while (Date.now() < end) {
    if (await loc.count() === 0) return;
    const s = await h.stateOf(loc.first());
    if (s.moving === 0 && (!s.shown || s.opacity >= 0.999)) return;
    await h.sleep(40);
  }
}

// Open a component with its button (or link): the button named `opener`, or, without one, the one named like it.
async function openWith(world, kind, name, opener, role = 'button') {
  const page = world.page;
  const k = h.kindOf(kind);
  const button = page.getByRole(role === 'link' ? 'link' : 'button', { name: opener || name, exact: true });
  if (await button.count() === 0) {
    throw h.failure(page, `Expected a ${role === 'link' ? 'link' : 'button'} named "${opener || name}" to open the "${name}" ${k}, but the page has none.`, {
      hint: 'a button is named by its text, or by its aria-label when it shows only an icon.',
    });
  }
  const before = (k === 'side panel' || k === 'drop-down menu') ? await h.tagShown(world, k) : [];
  await button.first().click();
  if ((k === 'side panel' || k === 'drop-down menu') && await h.component(world, k, name).count() === 0) await h.markNew(world, k, name, before);
  await shownOrFail(world, k, name);
}

/**
 * Open a dialog, a side panel or a drop-down menu with the button (or link) that opens it, and wait until it is shown
 * and has stopped moving. Without "with the … button", the button is named like the component. A side panel or a menu
 * with no name of its own takes the name the step gives it.
 *
 * Example #1: When I open the "Use Google's location service?" dialog with the "Open alert dialog" button
 * Example #2: When I open the "Mailboxes" side panel with the "Open drawer" button
 * Example #3: When I open the "Dashboard" drop-down menu
 * Example #4: And we open the "Reset password" dialog with the "Forgot your password?" button
 * Example #5: When I open the "Account" dropdown menu with the "Account settings" link
 *
 */
When(/^(?:I |we )?open the "([^"]*)" (dialog|side panel|drop-?down menu)(?: with the "([^"]*)" (button|link))?$/, async function (name, kind, opener, role) {
  await openWith(this, kind, name, opener, role);
});

/**
 * Close a dialog, a side panel, a drop-down menu or a notification the way a person does: its own close button
 * (named "Close"), else Escape; then wait until it is gone.
 *
 * Example #1: When I close the "Use Google's location service?" dialog
 * Example #2: And I close the "Mailboxes" side panel
 * Example #3: When we close the "Dashboard" drop-down menu
 * Example #4: When I close the "Note archived" notification
 * Example #5: Then we close the "Delete employee?" dialog
 *
 */
When(/^(?:I |we )?close the "([^"]*)" (dialog|side panel|drop-?down menu|notification)$/, async function (name, kind) {
  const loc = h.component(this, kind, name);
  if (await loc.count() === 0) {
    throw h.failure(this.page, `Expected the "${name}" ${h.kindOf(kind)} to be open, to close it, but it is not in the page.`);
  }
  const close = loc.first().getByRole('button', { name: /^close$/i });
  if (await close.count() > 0) await close.first().click();
  else await this.page.keyboard.press('Escape');
  await goneOrFail(this, kind, name);
});

/**
 * Press Escape in an open dialog, side panel or drop-down menu, and wait for its answer: closed and gone, or still
 * open (one told not to close with Escape) and still.
 *
 * Example #1: When I press Escape in the "Reset password" dialog
 * Example #2: And we press Escape in the "Mailboxes" side panel
 * Example #3: When I press Escape in the "Dashboard" drop-down menu
 * Example #4: When we press Escape in the "Delete employee?" dialog
 * Example #5: And I press Escape in the "Color mode" dropdown menu
 *
 */
When(/^(?:I |we )?press Escape in the "([^"]*)" (dialog|side panel|drop-?down menu)$/, async function (name, kind) {
  const loc = h.component(this, kind, name);
  if (await loc.count() === 0) throw h.failure(this.page, `Expected the "${name}" ${h.kindOf(kind)} to be open, but it is not in the page.`);
  await this.page.keyboard.press('Escape');
  await settle(this, kind, name);
});

/**
 * Click outside an open dialog, side panel or drop-down menu (on its backdrop, away from it), and wait for its answer.
 *
 * Example #1: When I click outside the "Use Google's location service?" dialog
 * Example #2: And we click outside the "Mailboxes" side panel
 * Example #3: When I click outside the "Dashboard" drop-down menu
 * Example #4: When we click outside the "Reset password" dialog
 * Example #5: And I click outside the "Account" dropdown menu
 *
 */
When(/^(?:I |we )?click outside the "([^"]*)" (dialog|side panel|drop-?down menu)$/, async function (name, kind) {
  const page = this.page;
  const loc = h.component(this, kind, name);
  if (await loc.count() === 0) throw h.failure(page, `Expected the "${name}" ${h.kindOf(kind)} to be open, but it is not in the page.`);
  const box = await loc.first().boundingBox();
  const view = page.viewportSize() || { width: 1280, height: 720 };
  // A point of the backdrop: the corner of the window farthest from the component.
  const x = box && box.x + box.width / 2 < view.width / 2 ? view.width - 5 : 5;
  const y = box && box.y + box.height / 2 < view.height / 2 ? view.height - 5 : 5;
  await page.mouse.click(x, y);
  await settle(this, kind, name);
});

/**
 * A dialog, side panel, drop-down menu, notification or tooltip is shown (visible, at full opacity, no longer moving)
 * or not (removed, or hidden and still).
 *
 * Example #1: Then the "Reset password" dialog should be shown
 * Example #2: Then the "Use Google's location service?" dialog should not be shown
 * Example #3: And the "Mailboxes" side panel should be shown
 * Example #4: Then the "Dashboard" drop-down menu should not be shown
 * Example #5: Then the "Employee deleted successfully." notification should be shown
 * Example #6: And the "Delete" tooltip should be shown
 *
 */
Then(/^the "([^"]*)" (dialog|side panel|drop-?down menu|notification|tooltip) should( not)? be shown$/, async function (name, kind, not) {
  if (not) await goneOrFail(this, kind, name);
  else await shownOrFail(this, kind, name);
});

/**
 * No dialog, side panel, drop-down menu, notification or tooltip is shown.
 *
 * Example #1: Then no dialog should be shown
 * Example #2: And no side panel should be shown
 * Example #3: Then no drop-down menu should be shown
 * Example #4: Then no notification should be shown
 * Example #5: Then no tooltip should be shown
 *
 */
Then(/^no (tooltip|notification|dialog|side panel|drop-?down menu) should be shown$/, async function (kind) {
  const done = await h.waitGone(h.anyOf(this, kind));
  if (done !== true) throw h.failure(this.page, `Expected no ${h.kindOf(kind)} to be shown, but one is ${h.describe(done)}.`);
});

/**
 * What an open component shows: its text, or a button, link, field or heading named so. A panel and a tab show what
 * their own region holds (see the panel and tab steps).
 *
 * Example #1: Then the "Reset password" dialog should show "Enter your account's email address"
 * Example #2: And the "Mailboxes" side panel should show "Starred"
 * Example #3: Then the "Dashboard" drop-down menu should show "My account"
 * Example #4: Then the "Note archived" notification should show "UNDO"
 * Example #5: And the "Delete" tooltip should not show "Remove"
 * Example #6: Then the "Accordion 1" panel should show "Lorem ipsum"
 * Example #7: Then the "Item Two" tab should show "Item Two"
 *
 */
Then(/^the "([^"]*)" (dialog|side panel|drop-?down menu|notification|tooltip|panel|tab) should( not)? show "([^"]*)"$/, async function (name, kind, not, text) {
  const page = this.page;
  let region;
  if (kind === 'panel' || kind === 'tab') {
    const control = kind === 'tab' ? page.getByRole('tab', { name, exact: true }) : page.getByRole('button', { name, exact: true }).and(page.locator('[aria-expanded]'));
    if (await control.count() === 0) throw h.failure(page, `Expected a ${kind} named "${name}", but the page has none.`);
    const id = await control.first().getAttribute('aria-controls');
    region = id ? page.locator(`[id="${id}"]`) : control.first();
  } else {
    region = h.component(this, kind, name);
    await shownOrFail(this, kind, name);
  }
  const want = h.textRe(text);
  const end = Date.now() + h.WAIT.value;
  let has = false;
  while (Date.now() < end) {
    has = await region.first().evaluate((el, src) => {
      const re = new RegExp(src.source, src.flags);
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      if (re.test(el.innerText || '')) return true;
      return [...el.querySelectorAll('[aria-label]')].some((e) => re.test(e.getAttribute('aria-label')));
    }, { source: want.source, flags: want.flags }).catch(() => false);
    if (has === !not) return;
    await h.sleep(60);
  }
  throw h.failure(page, `Expected the "${name}" ${h.kindOf(kind)} ${not ? 'not ' : ''}to show "${text}", but it ${has ? 'does' : 'does not'}.`);
});

/**
 * Press a button (or a link) in an open dialog, side panel or notification, then wait for the component's answer:
 * closed and gone, or still open and still.
 *
 * Example #1: When I press "Agree" in the "Use Google's location service?" dialog
 * Example #2: And we press "Delete" in the "Delete employee?" dialog
 * Example #3: When I press "Inbox" in the "Mailboxes" side panel
 * Example #4: When I press "UNDO" in the "Note archived" notification
 * Example #5: And I press "Continue" in the "Reset password" dialog
 *
 */
When(/^(?:I |we )?press "([^"]*)" in the "([^"]*)" (dialog|side panel|notification)$/, async function (label, name, kind) {
  const loc = h.component(this, kind, name);
  await shownOrFail(this, kind, name);
  const target = loc.first().getByRole('button', { name: label, exact: true }).or(loc.first().getByRole('link', { name: label, exact: true }));
  if (await target.count() === 0) {
    throw h.failure(this.page, `Expected the "${name}" ${h.kindOf(kind)} to have a button or a link named "${label}", but it has none.`);
  }
  await target.first().click();
  await settle(this, kind, name);
});

/**
 * Choose an item of a drop-down menu: opened with its button first when it is not open, then the item clicked, and
 * the menu waited for until it is closed and gone.
 *
 * Example #1: When I choose "My account" from the "Dashboard" drop-down menu
 * Example #2: And we choose "Logout" in the "Dashboard" dropdown menu
 * Example #3: When I choose "Dark" from the "Color mode" drop-down menu
 * Example #4: And we choose "Logout" from the "Profile" dropdown menu
 * Example #5: When we choose "Profile" in the "Dashboard" drop-down menu
 *
 */
When(/^(?:I |we )?choose "([^"]*)" (?:from|in) the "([^"]*)" drop-?down menu$/, async function (item, name) {
  if (await h.component(this, 'drop-down menu', name).count() === 0) await openWith(this, 'drop-down menu', name);
  const menu = h.component(this, 'drop-down menu', name).first();
  await shownOrFail(this, 'drop-down menu', name);
  const entry = menu.getByRole('menuitem', { name: item, exact: true }).or(menu.getByRole('menuitemradio', { name: item, exact: true })).or(menu.getByRole('menuitemcheckbox', { name: item, exact: true }));
  if (await entry.count() === 0) throw h.failure(this.page, `Expected the "${name}" drop-down menu to have an item "${item}", but it has none.`);
  await entry.first().click();
  await h.waitGone(h.component(this, 'drop-down menu', name));
});

/**
 * An item of a drop-down menu is the active (selected) one, or disabled.
 *
 * Example #1: Then "Dark" should be active in the "Color mode" drop-down menu
 * Example #2: And "Logout" should not be disabled in the "Dashboard" drop-down menu
 * Example #3: Then "System" should not be active in the "Color mode" drop-down menu
 * Example #4: And "Profile" should be disabled in the "Dashboard" dropdown menu
 * Example #5: Then "My account" should not be disabled in the "Dashboard" drop-down menu
 *
 */
Then(/^"([^"]*)" should( not)? be (active|disabled) in the "([^"]*)" drop-?down menu$/, async function (item, not, state, name) {
  if (await h.component(this, 'drop-down menu', name).count() === 0) await openWith(this, 'drop-down menu', name);
  const menu = h.component(this, 'drop-down menu', name).first();
  const entry = menu.getByRole('menuitem', { name: item, exact: true }).or(menu.getByRole('menuitemradio', { name: item, exact: true }));
  if (await entry.count() === 0) throw h.failure(this.page, `Expected the "${name}" drop-down menu to have an item "${item}", but it has none.`);
  const is = await entry.first().evaluate((el, s) => (s === 'active'
    ? el.classList.contains('Mui-selected') || el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-current') === 'true'
    : el.getAttribute('aria-disabled') === 'true' || el.classList.contains('Mui-disabled')), state);
  if (is === !!not) throw h.failure(this.page, `Expected "${item}" ${not ? 'not ' : ''}to be ${state} in the "${name}" drop-down menu, but it ${is ? 'is' : 'is not'}.`);
});

/**
 * Move the pointer over a button or a link, the way a hint (a tooltip) is shown: the next step can check it.
 *
 * Example #1: When I hover over the "Delete" button
 * Example #2: And we hover over the "Profile" link
 * Example #3: When we hover over the "Open notifications" button
 * Example #4: And I hover over the "Help" link
 * Example #5: When I hover over the "Refresh" button
 *
 */
When(/^(?:I |we )?hover over the "([^"]*)" (button|link)$/, async function (name, role) {
  const target = this.page.getByRole(role, { name, exact: true });
  if (await target.count() === 0) throw h.failure(this.page, `Expected a ${role} named "${name}", but the page has none.`);
  await target.first().hover();
});

/**
 * Wait until no component of the page is moving: every CSS transition has ended (a spinner's endless one does not
 * count). For a step of webship-js that follows a change Material UI animates.
 *
 * Example #1: When I wait for the transitions to finish
 * Example #2: And we wait for the transitions to finish
 * Example #3: Then I wait for the transitions to finish
 * Example #4: Given I wait for the transitions to finish
 * Example #5: But we wait for the transitions to finish
 *
 */
When(/^(?:I |we )?wait for the transitions to finish$/, async function () {
  if (!(await h.waitStill(this.page))) throw h.failure(this.page, `Expected every transition of the page to end within ${h.WAIT.shown / 1000} seconds, but some still run.`);
});
