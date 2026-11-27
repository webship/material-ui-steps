'use strict';

// Panels (Accordion), tabs, trees (Tree View) and the steps of a Stepper.
//
// A panel is named by its summary, a button with aria-expanded whose region it opens; Material UI collapses the region
// by measuring its height: while it opens the collapse has a height and a transition, then MuiCollapse-entered and
// height auto; closed, MuiCollapse-hidden. A tab is role=tab with aria-selected, its content role=tabpanel. A tree is
// role=tree, its items role=treeitem with aria-expanded. A Stepper has no ARIA for its current step: the steps read the
// classes Material UI gives a step's label, Mui-active for the current one and Mui-completed for one done.

const { When, Then } = require('@cucumber/cucumber');
const h = require('./material-ui-helpers');

async function panelSummary(world, name) {
  const s = world.page.getByRole('button', { name, exact: true }).and(world.page.locator('[aria-expanded]'));
  if (await s.count() === 0) throw h.failure(world.page, `Expected a panel named "${name}", but the page has none.`, { hint: 'a panel is named by the text of its summary.' });
  return s.first();
}

// Wait until a panel is expanded or collapsed: its summary says so and its collapse has stopped (entered, or hidden).
async function waitPanel(world, summary, expanded) {
  const end = Date.now() + h.WAIT.shown;
  let state = {};
  while (Date.now() < end) {
    state = await summary.evaluate((el) => {
      const id = el.getAttribute('aria-controls');
      const region = id && document.getElementById(id);
      const col = region && region.closest('.MuiCollapse-root');
      const moving = col ? col.getAnimations({ subtree: false }).filter((a) => a.playState === 'running').length : 0;
      return { expanded: el.getAttribute('aria-expanded') === 'true', entered: !!(col && col.classList.contains('MuiCollapse-entered')), hidden: !col || col.classList.contains('MuiCollapse-hidden'), moving, noCollapse: !col };
    });
    if (state.expanded === expanded && state.moving === 0 && (state.noCollapse || (expanded ? state.entered : state.hidden))) return true;
    await h.sleep(40);
  }
  return state;
}

/**
 * Expand or collapse a panel (an accordion item) by its summary, and wait until it has opened or closed.
 *
 * Example #1: When I expand the "Accordion 1" panel
 * Example #2: And we collapse the "Accordion 1" panel
 * Example #3: When I expand the "How do I contact customer support if I have a question or issue?" panel
 * Example #4: And we expand the "Accordion 2" panel
 * Example #5: When I collapse the "Accordion 2" panel
 *
 */
When(/^(?:I |we )?(expand|collapse) the "([^"]*)" panel$/, async function (action, name) {
  const summary = await panelSummary(this, name);
  const want = action === 'expand';
  if (((await summary.getAttribute('aria-expanded')) === 'true') !== want) await summary.click();
  const done = await waitPanel(this, summary, want);
  if (done !== true) throw h.failure(this.page, `Expected the "${name}" panel to be ${want ? 'expanded' : 'collapsed'}, but it is ${done.expanded ? 'expanded' : 'collapsed'}${done.moving ? ' and still moving' : ''}.`);
});

/**
 * A panel is expanded or collapsed.
 *
 * Example #1: Then the "Accordion 1" panel should be expanded
 * Example #2: And the "Accordion 2" panel should be collapsed
 * Example #3: Then the "Accordion 1" panel should be collapsed
 * Example #4: And the "Accordion 2" panel should be expanded
 * Example #5: Then the "How do I contact customer support if I have a question or issue?" panel should be expanded
 *
 */
Then(/^the "([^"]*)" panel should be (expanded|collapsed)$/, async function (name, state) {
  const summary = await panelSummary(this, name);
  const done = await waitPanel(this, summary, state === 'expanded');
  if (done !== true) throw h.failure(this.page, `Expected the "${name}" panel to be ${state}, but it is ${done.expanded ? 'expanded' : 'collapsed'}.`);
});

async function tabNamed(world, name) {
  const t = world.page.getByRole('tab', { name, exact: true });
  if (await t.count() === 0) throw h.failure(world.page, `Expected a tab named "${name}", but the page has none.`);
  return t.first();
}

/**
 * Switch to a tab and wait until it is the selected one and its content is shown.
 *
 * Example #1: When I switch to the "Item Two" tab
 * Example #2: And we switch to the "Item Three" tab
 * Example #3: When I switch to the "Item One" tab
 * Example #4: And I switch to the "Identity" tab
 * Example #5: When we switch to the "Address" tab
 *
 */
When(/^(?:I |we )?switch to the "([^"]*)" tab$/, async function (name) {
  const tab = await tabNamed(this, name);
  await tab.click();
  const id = await tab.getAttribute('aria-controls');
  const end = Date.now() + h.WAIT.shown;
  while (Date.now() < end) {
    const selected = (await tab.getAttribute('aria-selected')) === 'true';
    const panelShown = id ? (await h.stateOf(this.page.locator(`[id="${id}"]`))).shown : true;
    if (selected && panelShown && await h.waitStill(this.page, 2000)) return;
    await h.sleep(40);
  }
  throw h.failure(this.page, `Expected the "${name}" tab to be selected with its content shown, but it is not.`);
});

/**
 * A tab is the selected one, or not.
 *
 * Example #1: Then the "Item Two" tab should be active
 * Example #2: And the "Item One" tab should not be active
 * Example #3: Then the "Item Three" tab should be active
 * Example #4: And the "Item Two" tab should not be active
 * Example #5: Then the "Identity" tab should be active
 *
 */
Then(/^the "([^"]*)" tab should( not)? be active$/, async function (name, not) {
  const tab = await tabNamed(this, name);
  const end = Date.now() + h.WAIT.value;
  let selected;
  while (Date.now() < end) {
    selected = (await tab.getAttribute('aria-selected')) === 'true';
    if (selected === !not) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${name}" tab ${not ? 'not ' : ''}to be active, but it ${selected ? 'is' : 'is not'}.`);
});

// A tree by its name, or the only tree of the page.
async function treeNamed(world, name) {
  const page = world.page;
  const t = name ? page.getByRole('tree', { name, exact: true }) : page.getByRole('tree');
  if (await t.count() === 0) throw h.failure(page, name ? `Expected a tree named "${name}", but the page has none.` : 'Expected a tree, but the page has none.');
  return t.first();
}

async function treeItem(world, tree, item) {
  const i = tree.getByRole('treeitem', { name: item, exact: true });
  if (await i.count() === 0) throw h.failure(world.page, `Expected the tree to have an item "${item}", but it has none shown.`);
  return i.first();
}

/**
 * Expand or collapse an item of a tree, and wait until it has opened or closed.
 *
 * Example #1: When I expand the "Blog" item of the "pages" tree
 * Example #2: And we collapse the "Website" item of the tree
 * Example #3: When I expand the "Store" item of the "pages" tree
 * Example #4: And I collapse the "Blog" item of the "pages" tree
 * Example #5: When we expand the "Blog" item of the tree
 *
 */
When(/^(?:I |we )?(expand|collapse) the "([^"]*)" item of the (?:"([^"]*)" )?tree$/, async function (action, item, name) {
  const tree = await treeNamed(this, name);
  const node = await treeItem(this, tree, item);
  const want = action === 'expand';
  if (((await node.getAttribute('aria-expanded')) === 'true') !== want) {
    await node.locator('.MuiTreeItem-content, [class*="TreeItem-content"]').first().click().catch(async () => { await node.click(); });
  }
  const end = Date.now() + h.WAIT.shown;
  while (Date.now() < end) {
    if (((await node.getAttribute('aria-expanded')) === 'true') === want && await h.waitStill(this.page, 2000)) return;
    await h.sleep(40);
  }
  throw h.failure(this.page, `Expected the "${item}" item of the tree to be ${want ? 'expanded' : 'collapsed'}, but it is not.`);
});

/**
 * An item of a tree is expanded or collapsed.
 *
 * Example #1: Then the "Blog" item of the "pages" tree should be expanded
 * Example #2: And the "Store" item of the tree should be collapsed
 * Example #3: Then the "Website" item of the "pages" tree should be expanded
 * Example #4: And the "Blog" item of the tree should be collapsed
 * Example #5: Then the "Store" item of the "pages" tree should be expanded
 *
 */
Then(/^the "([^"]*)" item of the (?:"([^"]*)" )?tree should be (expanded|collapsed)$/, async function (item, name, state) {
  const tree = await treeNamed(this, name);
  const node = await treeItem(this, tree, item);
  const expanded = (await node.getAttribute('aria-expanded')) === 'true';
  if (expanded !== (state === 'expanded')) throw h.failure(this.page, `Expected the "${item}" item of the tree to be ${state}, but it is ${expanded ? 'expanded' : 'collapsed'}.`);
});

/**
 * Whether a tree shows an item (an item inside a collapsed one is not shown).
 *
 * Example #1: Then the "pages" tree should show "Announcements"
 * Example #2: And the tree should not show "Announcements"
 * Example #3: Then the "pages" tree should show "Home"
 * Example #4: And the "pages" tree should not show "Announcements"
 * Example #5: Then the tree should show "Pricing"
 *
 */
Then(/^the (?:"([^"]*)" )?tree should( not)? show "([^"]*)"$/, async function (name, not, item) {
  const tree = await treeNamed(this, name);
  const end = Date.now() + h.WAIT.value;
  let shown = false;
  while (Date.now() < end) {
    const i = tree.getByRole('treeitem', { name: item, exact: true });
    shown = await i.count() > 0 && (await h.stateOf(i.first())).shown;
    if (shown === !not) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the tree ${not ? 'not ' : ''}to show "${item}", but it ${shown ? 'does' : 'does not'}.`);
});

// The label of a step of a Stepper, and what its classes say.
async function stepState(world, name) {
  const labels = world.page.locator('.MuiStepLabel-label').filter({ hasText: h.textRe(name, { exact: true }) });
  const n = await labels.count();
  for (let i = 0; i < n; i += 1) {
    if (!(await h.stateOf(labels.nth(i))).shown) continue;
    return labels.nth(i).evaluate((el) => ({ current: el.classList.contains('Mui-active'), done: el.classList.contains('Mui-completed') }));
  }
  throw h.failure(world.page, `Expected a step named "${name}", but the page shows none.`, { hint: 'a step is named by the text of its label.' });
}

/**
 * The current step of a Stepper (Material UI marks it with the class Mui-active: a Stepper has no ARIA for it).
 *
 * Example #1: Then the "Payment details" step should be the current one
 * Example #2: And the "Shipping address" step should not be the current one
 * Example #3: Then the "Shipping address" step should be the current one
 * Example #4: And the "Review your order" step should be the current one
 * Example #5: Then the "Create an ad" step should not be the current one
 *
 */
Then(/^the "([^"]*)" step should( not)? be the current one$/, async function (name, not) {
  const end = Date.now() + h.WAIT.value;
  let s;
  while (Date.now() < end) {
    s = await stepState(this, name);
    if (s.current === !not) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${name}" step ${not ? 'not ' : ''}to be the current one, but it ${s.current ? 'is' : 'is not'}.`);
});

/**
 * A step of a Stepper is done, or not (Material UI marks it with the class Mui-completed).
 *
 * Example #1: Then the "Shipping address" step should be done
 * Example #2: And the "Review your order" step should not be done
 * Example #3: Then the "Payment details" step should be done
 * Example #4: And the "Payment details" step should not be done
 * Example #5: Then the "Select campaign settings" step should be done
 *
 */
Then(/^the "([^"]*)" step should( not)? be done$/, async function (name, not) {
  const end = Date.now() + h.WAIT.value;
  let s;
  while (Date.now() < end) {
    s = await stepState(this, name);
    if (s.done === !not) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${name}" step ${not ? 'not ' : ''}to be done, but it ${s.done ? 'is' : 'is not'}.`);
});
