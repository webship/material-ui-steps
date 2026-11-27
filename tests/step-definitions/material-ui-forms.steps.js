'use strict';

// Fields shown as valid or invalid with their messages, select lists (Select) and search lists (Autocomplete).
//
// A field is named by its label, as a person reads it. Material UI marks a field the app found wrong with
// aria-invalid="true" and points it at its message with aria-describedby (the helper text under it): the steps read
// those, so they hold for a TextField, a Select or a field of the app's own. A select list is Material UI's combobox:
// its options are in a listbox of their own, which grows in and, after a choice, fades out while the combobox already
// shows the choice; the steps wait for the listbox to be gone before the next step. A search list (Autocomplete) is a
// combobox the person types in, whose matching options show in a listbox the same way.

const { When, Then } = require('@cucumber/cucumber');
const h = require('./material-ui-helpers');

async function oneField(world, label) {
  const f = h.field(world.page, label);
  if (await f.count() === 0) {
    throw h.failure(world.page, `Expected a field labelled "${label}", but the page has none.`, {
      hint: 'a field is named by its label (the asterisk of a required one is not part of it), or by its aria-label.',
    });
  }
  return f.first();
}

/**
 * A field is shown as valid or as invalid: aria-invalid, which Material UI sets on a field in error.
 *
 * Example #1: Then the "Email" field should be shown as invalid
 * Example #2: And the "Password" field should be shown as valid
 * Example #3: Then the "Password" field should be shown as invalid
 * Example #4: And the "Email" field should be shown as valid
 * Example #5: Then the "First name" field should be shown as valid
 *
 */
Then(/^the "([^"]*)" field should be shown as (valid|invalid)$/, async function (label, state) {
  const f = await oneField(this, label);
  const end = Date.now() + h.WAIT.value;
  let invalid;
  while (Date.now() < end) {
    invalid = (await f.getAttribute('aria-invalid')) === 'true';
    if (invalid === (state === 'invalid')) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${label}" field to be shown as ${state}, but it is ${invalid ? 'invalid' : 'valid'}.`);
});

/**
 * The message a field shows: the text it points at with aria-describedby (Material UI's helper text).
 *
 * Example #1: Then the "Email" field should show the message "Please enter a valid email address."
 * Example #2: And the "Password" field should show the feedback "Password must be at least 6 characters long."
 * Example #3: Then the "Full name" field should show the message "Name is required."
 * Example #4: And the "Email" field should show the feedback "Please enter a valid email address."
 * Example #5: Then the "Age" field should show the message "Age must be at least 18."
 *
 */
Then(/^the "([^"]*)" field should show the (?:message|feedback) "([^"]*)"$/, async function (label, message) {
  const f = await oneField(this, label);
  const end = Date.now() + h.WAIT.value;
  let said = '';
  while (Date.now() < end) {
    said = await f.evaluate((el) => (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
      .map((id) => (document.getElementById(id) || {}).textContent || '').join(' ').trim());
    if (h.textRe(message).test(said)) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${label}" field to show the message "${message}", but it shows ${said ? `"${said}"` : 'none'}.`, {
    hint: 'the message is the text the field points at with aria-describedby (a TextField\'s helperText).',
  });
});

/**
 * How many fields of the page are shown as invalid.
 *
 * Example #1: Then 2 fields should be shown as invalid
 * Example #2: Then no fields should be shown as invalid
 * Example #3: And 1 field should be shown as invalid
 * Example #4: Then 3 fields should be shown as invalid
 * Example #5: But no fields should be shown as invalid
 *
 */
Then(/^(\d+|no) fields? should be shown as invalid$/, async function (count) {
  const want = count === 'no' ? 0 : parseInt(count, 10);
  const end = Date.now() + h.WAIT.value;
  let n = -1;
  while (Date.now() < end) {
    n = await this.page.evaluate(() => [...document.querySelectorAll('[aria-invalid=true]')].filter((el) => {
      const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
    }).length);
    if (n === want) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected ${want} field(s) to be shown as invalid, but ${n} are.`);
});

// A select list (Select's combobox) by its label. Material UI names a Select's combobox by its label and the option it
// shows (aria-labelledby="<label> <value>": "Age Twenty"), so the label alone, its asterisk aside, is what names it.
async function selectList(world, name) {
  const c = await h.byLabel(world.page.getByRole('combobox'), name);
  if (!c) {
    throw h.failure(world.page, `Expected a select list labelled "${name}", but the page has none.`, {
      hint: 'a select list is named by its label (an InputLabel tied to it with labelId) or its aria-label; one with neither has no name to find it by.',
    });
  }
  return c;
}

// The listbox a combobox controls, while it is open.
async function listboxOf(world, combo) {
  const id = await combo.getAttribute('aria-controls');
  return id ? world.page.locator(`[id="${id}"]`) : world.page.getByRole('listbox');
}

// The text a select list shows: its chosen option, its first line when the option has a second (a ListItemText's
// secondary text).
async function shownValue(combo) {
  return combo.evaluate((el) => (el.tagName === 'INPUT' ? el.value : el.innerText).replace(/\u200b/g, '').trim().split(/\n/)[0].trim());
}

// An option of a list by its text: its whole name, or its first line when it has a second (a ListItemText's secondary
// text, which is part of its name).
async function optionNamed(list, text) {
  const exact = list.getByRole('option', { name: text, exact: true });
  if (await exact.count() > 0) return exact.first();
  const all = list.getByRole('option');
  const n = await all.count();
  for (let i = 0; i < n; i += 1) {
    const first = await all.nth(i).evaluate((el) => el.innerText.trim().split(/\n/)[0].trim()).catch(() => '');
    if (first === text) return all.nth(i);
  }
  return null;
}

// The options of a list as a person reads them: each one's first line.
async function optionTexts(list) {
  return list.getByRole('option').evaluateAll((els) => els.map((el) => el.innerText.trim().split(/\n/)[0].trim()));
}

/**
 * Choose an option of a select list: opened, the option clicked, then waited for until the list is closed and gone
 * and the select list shows the choice.
 *
 * Example #1: When I choose "Twenty" in the "Age" select list
 * Example #2: And we choose "Dark" in the "Color mode" select list
 * Example #3: When I choose "Thirty" in the "Age" select list
 * Example #4: And I choose "Development" in the "Department" select list
 * Example #5: When we choose "Ten" in the "Age" select list
 *
 */
When(/^(?:I |we )?choose "([^"]*)" in the "([^"]*)" select list$/, async function (option, name) {
  const combo = await selectList(this, name);
  if ((await combo.getAttribute('aria-expanded')) !== 'true') await combo.click();
  const list = await listboxOf(this, combo);
  const shown = await h.waitShown(list);
  if (shown !== true) throw h.failure(this.page, `Expected the options of the "${name}" select list to show, but they are ${h.describe(shown)}.`);
  const opt = await optionNamed(list, option);
  if (!opt) {
    const all = await optionTexts(list);
    throw h.failure(this.page, `Expected the "${name}" select list to offer "${option}", but it offers ${all.map((t) => `"${t}"`).join(', ') || 'nothing'}.`);
  }
  await opt.click();
  const gone = await h.waitGone(list);
  if (gone !== true) throw h.failure(this.page, `Expected the options of the "${name}" select list to be gone after the choice, but they are ${h.describe(gone)}.`);
  const end = Date.now() + h.WAIT.value;
  while (Date.now() < end) {
    if ((await shownValue(combo)) === option) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${name}" select list to show "${option}" after the choice, but it shows "${await shownValue(combo)}".`);
});

/**
 * The option a select list shows.
 *
 * Example #1: Then the "Age" select list should show "Twenty"
 * Example #2: And the "Color mode" select list should show "Dark"
 * Example #3: Then the "Department" select list should show "Finance"
 * Example #4: And the "Rows per page" select list should show "10"
 * Example #5: Then the "Age" select list should show "Thirty"
 *
 */
Then(/^the "([^"]*)" select list should show "([^"]*)"$/, async function (name, option) {
  const combo = await selectList(this, name);
  const end = Date.now() + h.WAIT.value;
  let value = '';
  while (Date.now() < end) {
    value = await shownValue(combo);
    if (value === option) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${name}" select list to show "${option}", but it shows "${value}".`);
});

/**
 * Whether a select list offers an option: the list is opened, read, and closed again with Escape.
 *
 * Example #1: Then the "Age" select list should offer "Thirty"
 * Example #2: And the "Age" select list should not offer "Forty"
 * Example #3: Then the "Color mode" select list should offer "Dark"
 * Example #4: And the "Department" select list should offer "Market"
 * Example #5: Then the "Color mode" select list should not offer "Purple"
 *
 */
Then(/^the "([^"]*)" select list should( not)? offer "([^"]*)"$/, async function (name, not, option) {
  const combo = await selectList(this, name);
  const wasOpen = (await combo.getAttribute('aria-expanded')) === 'true';
  if (!wasOpen) await combo.click();
  const list = await listboxOf(this, combo);
  await h.waitShown(list);
  const has = !!(await optionNamed(list, option));
  const all = await optionTexts(list);
  if (!wasOpen) {
    await this.page.keyboard.press('Escape');
    await h.waitGone(list);
  }
  if (has === !!not) {
    throw h.failure(this.page, `Expected the "${name}" select list ${not ? 'not ' : ''}to offer "${option}", but it offers ${all.map((t) => `"${t}"`).join(', ') || 'nothing'}.`);
  }
});

// A search list (Autocomplete's combobox input) by its label.
async function searchList(world, name) {
  const c = await h.byLabel(world.page.getByRole('combobox'), name);
  if (!c) throw h.failure(world.page, `Expected a search list labelled "${name}", but the page has none.`);
  return c;
}

/**
 * Type in a search list, then choose one of the options it offers: the option clicked, then waited for until the list
 * of options is gone and the search list shows the choice.
 *
 * Example #1: When I type "God" in the "Movie" search list and choose "The Godfather"
 * Example #2: And we type "Ital" in the "Country" search list and choose "Italy"
 * Example #3: When I type "Dark" in the "Movie" search list and choose "The Dark Knight"
 * Example #4: And I type "Schind" in the "Movie" search list and choose "Schindler's List"
 * Example #5: When we type "Pul" in the "Movie" search list and choose "Pulp Fiction"
 *
 */
When(/^(?:I |we )?type "([^"]*)" in the "([^"]*)" search list and choose "([^"]*)"$/, async function (typed, name, option) {
  const input = await searchList(this, name);
  await input.click();
  await input.fill('');
  await input.pressSequentially(typed);
  const list = await listboxOf(this, input);
  const shown = await h.waitShown(list);
  if (shown !== true) throw h.failure(this.page, `Expected the "${name}" search list to offer options for "${typed}", but its list is ${h.describe(shown)}.`);
  const opt = list.getByRole('option', { name: option, exact: true });
  if (await opt.count() === 0) {
    const all = await list.getByRole('option').allInnerTexts();
    throw h.failure(this.page, `Expected the "${name}" search list to offer "${option}" for "${typed}", but it offers ${all.slice(0, 8).map((t) => `"${t.trim()}"`).join(', ') || 'nothing'}.`);
  }
  await opt.first().click();
  await h.waitGone(this.page.getByRole('listbox'));
  const end = Date.now() + h.WAIT.value;
  while (Date.now() < end) {
    if ((await input.inputValue()) === option) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${name}" search list to show "${option}" after the choice, but it shows "${await input.inputValue()}".`);
});

/**
 * Whether a search list offers an option for what was typed in it (its list of options, open now).
 *
 * Example #1: Then the "Movie" search list should offer "The Godfather: Part II"
 * Example #2: And the "Movie" search list should not offer "Pulp Fiction"
 * Example #3: Then the "Movie" search list should offer "The Godfather"
 * Example #4: And the "Movie" search list should not offer "The Dark Knight"
 * Example #5: Then the "Customer" search list should offer "Josephine Drake"
 *
 */
Then(/^the "([^"]*)" search list should( not)? offer "([^"]*)"$/, async function (name, not, option) {
  const input = await searchList(this, name);
  const list = await listboxOf(this, input);
  await h.waitShown(list);
  const end = Date.now() + h.WAIT.value;
  let has = false;
  while (Date.now() < end) {
    has = await list.getByRole('option', { name: option, exact: true }).count() > 0;
    if (has === !not) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${name}" search list ${not ? 'not ' : ''}to offer "${option}", but it ${has ? 'does' : 'does not'}.`);
});

/**
 * The option a search list shows (the text of its field).
 *
 * Example #1: Then the "Movie" search list should show "The Godfather"
 * Example #2: And the "Country" search list should show "Italy"
 * Example #3: Then the "Movie" search list should show "Pulp Fiction"
 * Example #4: And the "Customer" search list should show "Josephine Drake"
 * Example #5: Then the "Movie" search list should show "The Dark Knight"
 *
 */
Then(/^the "([^"]*)" search list should show "([^"]*)"$/, async function (name, option) {
  const input = await searchList(this, name);
  const end = Date.now() + h.WAIT.value;
  let value = '';
  while (Date.now() < end) {
    value = await input.inputValue();
    if (value === option) return;
    await h.sleep(60);
  }
  throw h.failure(this.page, `Expected the "${name}" search list to show "${option}", but it shows "${value}".`);
});
