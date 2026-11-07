var active   = new Set();
var items    = document.querySelectorAll('#cv-list .cv-item');
var noRes    = document.getElementById('cv-noresults');
var clearBtn = document.getElementById('cv-clear');

function tagsMatch(entryTags, criterion) {
  var set = expand[criterion] || [criterion];
  return set.some(function (x) { return entryTags.indexOf(x) !== -1; });
}

function jointCount(criteria) {
  var arr = Array.from(criteria), n = 0;
  items.forEach(function (item) {
    var tags = item.dataset.tags.split('|');
    if (arr.every(function (c) { return tagsMatch(tags, c); })) n++;
  });
  return n;
}

// Sync active visual state across ALL elements sharing data-tag (panel buttons + entry chips).
function syncTagVisual(t, isActive) {
  document.querySelectorAll('[data-tag="' + t + '"]').forEach(function(el) {
    el.classList.toggle('active', isActive);
  });
}

function filter() {
  var n = 0, arr = Array.from(active);
  items.forEach(function(item) {
    var tags = item.dataset.tags.split('|');
    var show = active.size === 0 || arr.every(function(c){ return tagsMatch(tags, c); });
    item.style.display = show ? '' : 'none';
    if (show) n++;
  });
  noRes.style.display  = n === 0 ? 'block' : 'none';
  clearBtn.style.display = active.size > 0 ? 'inline-block' : 'none';
  updateCompat();
}

// Dim, not count: a binary "does any currently-visible entry match" claim, nothing about
// magnitude. Counts were tried and dropped (ADR-16) — entry-count reflects how granularly
// something got written up, not real-world frequency, and that's actively misleading.
function updateCompat() {
  var dimActive = active.size > 0;
  document.querySelectorAll('.cv-tag-btn').forEach(function(btn) {
    if (btn.classList.contains('active')) { btn.classList.remove('dim'); return; }
    var id = btn.dataset.tag, possible = false;
    items.forEach(function(item) {
      if (item.style.display === 'none') return;
      if (tagsMatch(item.dataset.tags.split('|'), id)) possible = true;
    });
    btn.classList.toggle('dim', dimActive && !possible);
  });
}

function clearActive() {
  active.clear();
  document.querySelectorAll('.cv-tag-btn.active, .cv-group-lbl.active, .cv-chip.active, .cv-fl.active')
    .forEach(function(b){ b.classList.remove('active'); });
}

// The group-nav ring (#tools, #areas-of-expertise, ...) is a one-time landing cue, not persistent
// state -- it has no representation in `active` and isn't meant to survive the reader taking any
// real filtering action. Cleared on every selectTag/clear rather than timed out, so it never lies
// about what's currently relevant.
function clearGroupHighlight() {
  document.querySelectorAll('.cv-group-highlight').forEach(function(el) {
    el.classList.remove('cv-group-highlight');
  });
}

// A group's highlight-set is itself plus every sibling up to (not including) the next group
// label -- the same flat-DOM walk used by the load-time hash handler and the in-page click below.
function applyGroupHighlight(label) {
  label.classList.add('cv-group-highlight');
  for (var el = label.nextElementSibling; el && !el.classList.contains('cv-group-lbl'); el = el.nextElementSibling) {
    el.classList.add('cv-group-highlight');
  }
}

// Keep the URL a live, shareable/bookmarkable snapshot of the current filter -- history.replaceState,
// not pushState, so every pill click doesn't spam browser history with one entry apiece; the address
// bar always reflects "where you are now," not "everywhere you've been." Sorted for a stable URL
// regardless of click order.
function syncHash() {
  var h = Array.from(active).sort().join('+');
  history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
}

// Every tag is selected the same way — no partition, no radio, no kind/facet split. Clicking a
// tag that would make the ACTUAL JOINT intersection empty drops the oldest conflicting selection
// and rechecks, rather than silently rendering a dead end (a naive pairwise check is NOT sound
// here with 3+ active tags — verified against a real counterexample before shipping this).
function selectTag(t) {
  clearGroupHighlight();
  if (active.has(t)) { active.delete(t); syncTagVisual(t, false); filter(); syncHash(); return; }
  var candidate = new Set(active);
  candidate.add(t);
  while (candidate.size > 1 && jointCount(candidate) === 0) {
    var oldest = Array.from(candidate).find(function (x) { return x !== t; });
    candidate.delete(oldest);
    syncTagVisual(oldest, false);
  }
  active = candidate;
  syncTagVisual(t, true);
  filter();
  syncHash();
}

document.querySelectorAll('.cv-tag-btn').forEach(function(btn) {
  btn.addEventListener('click', function() { selectTag(btn.dataset.tag); });
});

// Group labels are clickable too, but deliberately do a different thing than a tag: a highlight
// (border), never a filter (fill) -- they answer "what's in this cluster," not "show me only
// this." Mutually exclusive with tag filtering, same reasoning as clearGroupHighlight() above:
// each always clears the other rather than layering, so the URL stays a single, unambiguous
// snapshot. Click an already-highlighted group again to toggle it off.
function selectGroup(id) {
  var label = document.getElementById(id);
  if (label.classList.contains('cv-group-highlight')) {
    clearGroupHighlight();
    syncHash();
    return;
  }
  clearGroupHighlight();
  clearActive();
  filter();
  applyGroupHighlight(label);
  history.replaceState(null, '', '#' + id);
}

document.querySelectorAll('.cv-group-lbl').forEach(function(lbl) {
  lbl.addEventListener('click', function() { selectGroup(lbl.id); });
});

// Entry chips — same selection logic as panel buttons
document.querySelectorAll('.cv-chip').forEach(function(chip) {
  chip.addEventListener('click', function() { selectTag(chip.dataset.tag); });
});

// Cite/bibtex toggle -- two independent buttons and boxes per entry, one for the plain-text
// citation, one for the raw bibtex. data-id on each button is the target box's own id, not an
// entry id, so a cite click never opens or copies the sibling bibtex box, and vice versa.
document.querySelectorAll('.cv-cite-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var box = document.getElementById(btn.dataset.id);
    var open = box.classList.toggle('open');
    btn.textContent = open ? 'hide' : btn.dataset.label;
  });
});

// Copy cite or bibtex -- copies only the one box's own content, never both.
document.querySelectorAll('.cv-copy-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var box = document.getElementById(btn.dataset.id);
    var text = box.innerText.replace(/^copy\n?/, '').trim();
    navigator.clipboard.writeText(text).then(function() {
      btn.textContent = 'copied!';
      setTimeout(function() { btn.textContent = 'copy'; }, 2000);
    });
  });
});

// Intro filter links
document.querySelectorAll('.cv-fl[data-tag]').forEach(function(el) {
  el.addEventListener('click', function() { selectTag(el.dataset.tag); });
});

clearBtn.addEventListener('click', function() {
  clearGroupHighlight();
  active.clear();
  document.querySelectorAll('.cv-tag-btn.active, .cv-group-lbl.active, .cv-chip.active, .cv-fl.active').forEach(function(b){ b.classList.remove('active'); });
  filter();
  syncHash();
});

// Activate tag filter(s) from the URL hash. Single tag: tmihoc.github.io/#paper
// Intersection: tmihoc.github.io/#documentation+writing (AND of all tags).
// A tag hash lands mid-page by default (no element has an id matching a tag id, so the browser's
// native anchor-scroll has nothing to jump to) -- scroll to the filter panel explicitly once a
// tag match activates a filter, so the reader doesn't land back at the very top of the page with
// no visual cue anything happened. #cv-filter itself (no tag, just the panel's own id) needs no
// JS help here -- that's a real element id, so the browser scrolls to it natively.
(function() {
  var h = decodeURIComponent(window.location.hash.slice(1));
  if (!h) return;
  var matched = false;
  h.split('+').forEach(function(t) {
    t = t.trim();
    if (!t || !expand[t]) return;
    active.add(t);
    syncTagVisual(t, true);
    matched = true;
  });
  if (matched) {
    filter();
    document.getElementById('filter').scrollIntoView();
  }
})();

// Group-hash navigation: tmihoc.github.io/#tools scrolls to and highlights the Tools cluster of
// pills -- distinct from a tag hash above, this never filters the entry list (a group label click
// highlights, a tag click filters -- see selectGroup below). A no-op if the hash was already
// consumed as a tag above (expand[h] check) or doesn't match any group id. Reuses
// applyGroupHighlight rather than clearing active/calling filter() -- at page load `active` is
// always already empty, so there's nothing to reconcile the way selectGroup has to for a live click.
(function() {
  var h = decodeURIComponent(window.location.hash.slice(1));
  if (!h || expand[h]) return;
  var label = document.getElementById(h);
  if (!label || !label.classList.contains('cv-group-lbl')) return;
  applyGroupHighlight(label);
  label.scrollIntoView();
})();
