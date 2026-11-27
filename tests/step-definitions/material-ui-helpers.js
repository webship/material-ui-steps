'use strict';

// Shared helpers for the step files of this pack.
//
// Not a step file: it registers no step definitions. It holds the plumbing the steps use and that a project can
// require for its own steps: how a component is found the way a person reads it, and how the steps wait for it.
//
// Material UI draws its components in React. Dialogs, side panels (temporary drawers), menus, select and search lists,
// tooltips and notifications are rendered in portals at the end of the page, outside the app's root, and while a modal
// one is open the app's root carries aria-hidden="true": the rest of the page is hidden from assistive technology, so
// the steps look inside the open component. Their transitions are CSS transitions the components start themselves (a
// dialog fades in for about 225 ms and out for about 195 ms, a list grows in for about 250 ms, a panel's collapse
// measures its height): the steps wait for the component's own state and for its transitions to end, read from the
// browser (Element.getAnimations), never for a fixed time.
//
// Everything builds on webship-js's own helpers (`friendly`, `failure`), so the steps fail the way the core webship-js
// steps do.

const webship = require('webship-js/tests/step-definitions/webship');

const { friendly } = webship;

// What to check when a step fails, by what the failure is about: every failure of this pack carries a hint, its own
// when the step gives one, else the one of its subject.
const HINTS = [
  [/side panel/, 'a side panel is a temporary drawer, named by its aria-label, a heading in it, or the name a scenario gives it when it opens it with a named button.'],
  [/drop-down menu/, 'a drop-down menu is named by the button that opens it (aria-labelledby), or by the name a scenario gives it when it opens it with a named button; its items are menuitems named by their text.'],
  [/dialog/, 'a dialog is named by its title (aria-labelledby), or by the start of its text when it has none; one told not to close with Escape or a click outside stays open until one of its buttons is pressed.'],
  [/notification/, 'a notification is a Snackbar, read by its text; it shows at the edge of the window and hides after the time the app gives it.'],
  [/tooltip|hint/, 'a tooltip shows while the pointer is over its button or link, and is read by its text.'],
  [/search list/, 'a search list is an Autocomplete named by its label; its options show in a listbox once something is typed in it.'],
  [/ list|list "/, 'a select list is named by its label (Material UI adds the option it shows to its name, the label alone finds it); its options show in a listbox while it is open.'],
  [/field/, 'a field is named by its label; Material UI marks one in error with aria-invalid and points it at its message with aria-describedby.'],
  [/panel/, 'a panel is an Accordion named by the text of its summary; its content is the region the summary controls.'],
  [/tab/, 'a tab is named by its text; its content is the tabpanel it controls (aria-controls).'],
  [/tree/, 'an item of a tree is named by its label; an item inside a collapsed one is not shown.'],
  [/step/, 'a step of a Stepper is named by its label; Material UI marks the current one with Mui-active and one done with Mui-completed (a Stepper has no ARIA for them).'],
  [/alert/, 'an alert is read by its text; it is dismissible when it has a close button (named "Close").'],
  [/spinner/, 'a loading spinner is a progressbar with no value of its own (CircularProgress).'],
  [/progress bar/, 'a progress bar is a progressbar with a value (aria-valuenow), named by its aria-label when the page has several.'],
  [/badge/, 'a badge is the content of Material UI\'s Badge around the button, link, heading, menu item or tab.'],
  [/pagination/, 'a pagination is a navigation of buttons named the way Material UI names them ("Go to page 2", "Go to next page"); the current page has aria-current.'],
  [/breadcrumb/, 'a breadcrumb trail is read item by item; its current page is its last item, or the one marked with aria-current.'],
  [/table|row|column|sorted/, 'a table (a Data Grid or a Table) is named by its aria-label, its caption or the heading just before it; a row is the one that shows a text; a column is sorted when its header says so (aria-sort, or its sort label).'],
  [/transition/, 'a transition that never ends is an animation with no end: check the page for a component stuck in a state.'],
  [/button|link/, 'a button or a link is named by its text, or by its aria-label when it shows only an icon.'],
];

function failure(page, message, details) {
  const info = { ...(details || {}) };
  if (!info.hint) {
    const found = HINTS.find(([re]) => re.test(message));
    info.hint = found ? found[1] : 'names are read the way a person reads them: check the spelling, and that the page shows it.';
  }
  return webship.failure(page, message, info);
}

// The budgets of the waits (milliseconds): each is a ceiling, not a pause.
const WAIT = {
  shown: 10000,        // a component to be shown and stop moving
  gone: 10000,         // a component to be closed and gone
  notification: 20000, // a notification to hide by itself (Material UI's are told how long they stay, often 6 s)
  value: 10000,        // a field, a list or a table to show what a step expects
  progress: 30000,     // a progress bar to reach a value, a spinner to disappear
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The words a kind of component has in a step, and how a person names it.
const KINDS = {
  dialog: 'dialog',
  'side panel': 'side panel',
  'drop-down menu': 'drop-down menu',
  notification: 'notification',
  tooltip: 'tooltip',
};
const kindOf = (word) => (/^drop-?down menu$/.test(word) ? 'drop-down menu' : word);

// What a world remembers of the components a scenario opened with a named button: a side panel or a menu that has no
// name of its own is known by the name the scenario gave it.
function opened(world) {
  if (!world.materialUiOpened) world.materialUiOpened = {};
  return world.materialUiOpened;
}

// The browser-side probe: what a component is doing, read in the page. `root` is the element of the component that
// moves (a dialog's modal, a menu's popover, a drawer's modal, a snackbar, a tooltip's popper).
const PROBE = `(() => {
  const moving = (el) => (el && el.getAnimations ? el.getAnimations({ subtree: true }) : [])
    .filter((a) => a.playState === 'running' && (!a.effect || !a.effect.getTiming || a.effect.getTiming().iterations !== Infinity)).length;
  const rootOf = (el) => el && (el.closest('.MuiModal-root, .MuiPopover-root, .MuiPopper-root, .MuiSnackbar-root, .MuiTooltip-popper') || el);
  const visible = (el) => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const opacity = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || '1'); return o; };
  return { moving, rootOf, visible, opacity };
})()`;

// Is the element shown and still? { shown, still, opacity, moving }.
async function stateOf(locator) {
  return locator.evaluate((el, probe) => {
    // eslint-disable-next-line no-new-func
    const p = new Function(`return ${probe}`)();
    const root = p.rootOf(el);
    return { shown: p.visible(el), opacity: Math.round(p.opacity(el) * 1000) / 1000, moving: p.moving(root) };
  }, PROBE).catch(() => ({ shown: false, gone: true, opacity: 0, moving: 0 }));
}

// Wait until the first element of `locator` is shown and has stopped moving: visible, full opacity, no transition
// running in the component. Returns true, or the last state seen.
async function waitShown(locator, timeout = WAIT.shown) {
  const end = Date.now() + timeout;
  let last = { shown: false };
  while (Date.now() < end) {
    if (await locator.count() > 0) {
      last = await stateOf(locator.first());
      if (last.shown && last.opacity >= 0.999 && last.moving === 0) return true;
    } else {
      last = { shown: false, gone: true };
    }
    await sleep(40);
  }
  return last;
}

// Wait until no element of `locator` is shown and none is moving: closed and gone (removed, or hidden and still).
async function waitGone(locator, timeout = WAIT.gone) {
  const end = Date.now() + timeout;
  let last = { shown: true };
  while (Date.now() < end) {
    const n = await locator.count();
    if (n === 0) return true;
    let any = false;
    for (let i = 0; i < n; i += 1) {
      last = await stateOf(locator.nth(i));
      if (last.shown || last.moving > 0) { any = true; break; }
    }
    if (!any) return true;
    await sleep(40);
  }
  return last;
}

// No CSS transition running anywhere in the page (a spinner's endless animation does not count).
async function waitStill(page, timeout = WAIT.shown) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const moving = await page.evaluate(() => document.getAnimations()
      .filter((a) => a.playState === 'running' && (!a.effect || !a.effect.getTiming || a.effect.getTiming().iterations !== Infinity)).length).catch(() => 0);
    if (moving === 0) return true;
    await sleep(40);
  }
  return false;
}

// How a state reads in a failure.
function describe(state) {
  if (state === true) return 'as expected';
  if (!state || state.gone) return 'not in the page';
  if (!state.shown) return 'in the page but hidden';
  if (state.moving) return `still moving (${state.moving} transition(s) running, opacity ${state.opacity})`;
  if (state.opacity < 0.999) return `shown at opacity ${state.opacity}`;
  return 'shown';
}

// The text matched the way a person reads it: whole words, case and spaces as written, but any run of white space as one.
function textRe(text, { exact = false } = {}) {
  const t = String(text).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(exact ? `^\\s*${t}\\s*$` : t, 'i');
}

// The dialogs of a page: role=dialog, or role=alertdialog for one that asks something; never a drawer's paper or a date
// picker's popper, which carry role=dialog too.
const DIALOGS = ['dialog', 'alertdialog'].map((r) => `[role=${r}]:not(.MuiDrawer-paper):not(.MuiPickerPopper-root):not(.MuiPickersPopper-root)`).join(', ');

// A dialog by its name (its title), or, for one with no title, by the start of its text.
function dialog(page, name) {
  const all = page.locator(DIALOGS);
  const named = page.getByRole('dialog', { name, exact: true }).or(page.getByRole('alertdialog', { name, exact: true })).and(all);
  const byText = all.filter({ hasText: textRe(name) });
  return named.or(byText);
}

// A side panel (a temporary drawer, Material UI's modal one): by its name (aria-label or labelledby), by a heading in
// it, or by the name the scenario gave it when it opened it with a named button.
function sidePanel(world, name) {
  const page = world.page;
  const papers = page.locator('.MuiDrawer-modal .MuiDrawer-paper');
  const marked = page.locator(`.MuiDrawer-paper[data-webship-name="${String(name).replace(/"/g, '\\"')}"]`);
  return papers.and(page.getByRole('dialog', { name, exact: true }))
    .or(papers.filter({ has: page.getByRole('heading', { name, exact: true }) }))
    .or(marked);
}

// A drop-down menu (Menu): by its name, which Material UI gives it from the button that opens it (aria-labelledby), or
// by the name the scenario gave it when it opened it with a named button.
function dropMenu(world, name) {
  const page = world.page;
  const marked = page.locator(`[role=menu][data-webship-name="${String(name).replace(/"/g, '\\"')}"]`);
  return page.getByRole('menu', { name, exact: true }).or(marked);
}

// A notification (Snackbar) by its text.
function notification(page, text) {
  return page.locator('.MuiSnackbar-root').filter({ hasText: textRe(text) });
}

// A tooltip by its text.
function tooltip(page, text) {
  return page.getByRole('tooltip').filter({ hasText: textRe(text) });
}

// A component of a kind by its name.
function component(world, kind, name) {
  const page = world.page;
  switch (kindOf(kind)) {
    case 'dialog': return dialog(page, name);
    case 'side panel': return sidePanel(world, name);
    case 'drop-down menu': return dropMenu(world, name);
    case 'notification': return notification(page, name);
    case 'tooltip': return tooltip(page, name);
    default: throw new Error(`No such kind of component: ${kind}`);
  }
}

// Any shown component of a kind.
function anyOf(world, kind) {
  const page = world.page;
  switch (kindOf(kind)) {
    case 'dialog': return page.locator(DIALOGS);
    case 'side panel': return page.locator('.MuiDrawer-modal .MuiDrawer-paper');
    case 'drop-down menu': return page.getByRole('menu');
    case 'notification': return page.locator('.MuiSnackbar-root');
    case 'tooltip': return page.getByRole('tooltip');
    default: throw new Error(`No such kind of component: ${kind}`);
  }
}

// After a click that opens a side panel or a menu with no name of its own: the one that is now shown is given the
// scenario's name (data-webship-name), so the steps after find it by that name.
async function markNew(world, kind, name, before) {
  const page = world.page;
  const all = kindOf(kind) === 'side panel' ? page.locator('.MuiDrawer-modal .MuiDrawer-paper') : page.getByRole('menu');
  const end = Date.now() + WAIT.shown;
  while (Date.now() < end) {
    const n = await all.count();
    for (let i = 0; i < n; i += 1) {
      const el = all.nth(i);
      const s = await stateOf(el);
      if (!s.shown) continue;
      const known = await el.evaluate((e, b) => b.includes(e.getAttribute('data-webship-id') || '-'), before).catch(() => true);
      if (!known) {
        await el.evaluate((e, nm) => e.setAttribute('data-webship-name', nm), name).catch(() => {});
        opened(world)[`${kindOf(kind)}:${name}`] = true;
        return true;
      }
    }
    await sleep(40);
  }
  return false;
}

// The components of a kind shown now, tagged so a later step can tell the one a click shows from them. One kept in the
// page while closed (keepMounted) is not shown, so it is not tagged: when the click shows it, it is the new one.
async function tagShown(world, kind) {
  const page = world.page;
  const all = kindOf(kind) === 'side panel' ? page.locator('.MuiDrawer-modal .MuiDrawer-paper') : page.getByRole('menu');
  const ids = [];
  const n = await all.count();
  for (let i = 0; i < n; i += 1) {
    const el = all.nth(i);
    const s = await stateOf(el);
    const id = `w${Date.now()}-${i}`;
    const tagged = await el.evaluate((e, a) => { e.setAttribute('data-webship-id', a.shown ? a.id : ''); return a.shown; }, { id, shown: s.shown && s.opacity > 0.5 }).catch(() => false);
    if (tagged) ids.push(id);
  }
  return ids;
}

// A field by its label, as a person reads it (the label's asterisk of a required field is not part of its name).
function field(page, label) {
  return page.getByRole('textbox', { name: label, exact: true })
    .or(page.getByRole('combobox', { name: label, exact: true }))
    .or(page.getByRole('spinbutton', { name: label, exact: true }))
    .or(page.getByLabel(label, { exact: true }));
}

// The first of `candidates` whose label is `label`: its aria-label, else the first element it is labelled by
// (aria-labelledby), else its <label>; a required field's asterisk is not part of it. Returns a locator of that element
// that does not go through the accessibility tree (it is marked with data-webship-label): a select list's options open
// in a modal popover, and while they are open the app's root, the select list with it, is aria-hidden. Or null.
async function byLabel(candidates, label) {
  const want = String(label).trim().toLowerCase();
  const n = await candidates.count();
  for (let i = 0; i < n; i += 1) {
    const c = candidates.nth(i);
    const own = await c.evaluate((el) => {
      const clean = (t) => String(t || '').replace(/[\s\u200b]+/g, ' ').replace(/\s*\*\s*$/, '').trim().toLowerCase();
      if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'));
      const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      if (ids.length) return clean((document.getElementById(ids[0]) || {}).textContent);
      if (el.labels && el.labels.length) return clean(el.labels[0].textContent);
      return '';
    }).catch(() => '');
    if (own === want) {
      const mark = String(label).trim();
      await c.evaluate((el, m) => el.setAttribute('data-webship-label', m), mark);
      return candidates.page().locator(`[data-webship-label="${mark.replace(/["\\]/g, '\\$&')}"]`).first();
    }
  }
  return null;
}

// A table: Material UI's Data Grid (role=grid) or its Table (an HTML table), by its name (aria-label, aria-labelledby,
// its caption) or by the heading just before it; with no name, the only table of the page.
async function table(world, name) {
  const page = world.page;
  const all = page.locator('[role=grid]:not([role=grid] [role=grid]), table:not([role=grid] table)');
  if (!name) return all.first();
  const count = await all.count();
  for (let i = 0; i < count; i += 1) {
    const t = all.nth(i);
    const label = await t.evaluate((el) => {
      const own = el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') || '').split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ').trim()
        || ((el.querySelector('caption') || {}).textContent || '').trim();
      if (own) return own;
      const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')]
        .filter((h) => h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      return heads.length ? heads[heads.length - 1].textContent.trim() : '';
    }).catch(() => '');
    if (label.toLowerCase() === String(name).toLowerCase()) return t;
  }
  return all.filter({ hasText: '\u0000never' });
}

// The data rows of a table: its rows that hold no column header.
function rowsOf(t) {
  return t.locator('[role=row], tr').filter({ hasNot: t.page().locator('[role=columnheader], th') });
}

module.exports = {
  WAIT, KINDS, sleep, kindOf, opened, stateOf, waitShown, waitGone, waitStill, describe, textRe,
  dialog, sidePanel, dropMenu, notification, tooltip, component, anyOf, markNew, tagShown, field, byLabel, table, rowsOf,
  friendly, failure,
};
