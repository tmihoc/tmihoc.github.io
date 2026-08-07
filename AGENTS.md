# AGENTS.md — tmihoc.github.io (website / data layer)

Quick reference for anyone — human or AI agent — touching `data/entries.yaml`,
`data/groups.yaml`, or `layouts/index.html`. Describes current behavior only. Keep it that
way: if something here goes stale, fix it or delete it, don't leave it as a decoy.

**What this site is for (settled 2026-08-07, after building and then reverting a preview
feature and considering a homepage "highlights" section):** a store for lifeDB — the entries,
the tag filter, and links out to the artifacts. Not a marketing surface, not a design
showcase. "Highlighting" specific work for a specific audience (recruiters, a LinkedIn post,
whoever) is a job for wherever that audience already is, done by hand, per occasion — not a
standing feature of this site. Before proposing a new section, widget, or visual flourish here,
check that it serves *browsing/querying the record*, not *presenting a curated subset of it* —
the latter belongs elsewhere, by design.

## Files

- `data/entries.yaml` — the corpus. One entry per real eventuality (state/activity/
  accomplishment/achievement), each a flat `{id, sentence, date, tags, desc?, links?,
  bibtex?}`.
- `data/groups.yaml` — the tag ontology. Every group is `{id, label, tags: [...]}`; a tag
  may itself carry a nested `tags:` list, making it a parent node (e.g. `documentation` has
  children `ai-ml`, `cloud-operations`, `virtualization` — clicking `documentation` matches
  entries tagged with any of those three too, not just entries tagged `documentation`
  itself).
- `layouts/index.html` — renders both: the filter panel, the entry list, and all filtering/
  navigation JS.
- Verify entry count after any `entries.yaml` edit:
  `python3 -c "import yaml; print(len(yaml.safe_load(open('data/entries.yaml'))))"`
  — **gotcha**: a project virtualenv's `python3` may not have `pyyaml` installed; if that
  import fails, try `/usr/bin/python3` (the system interpreter) instead of chasing a pip
  install inside someone else's venv.

## Data model, one paragraph

Bipartite graph: entries (set A) × tags (set B), one edge type (`has-tag`). No entry ever
points at another entry — e.g. a talk and the paper it later became are never linked by an
edge; they just happen to share tags like `modified-numerals`, and a reader browsing that tag
sees both, with the dates alone showing which came first. Tags can point at other tags
(parent → children = subsumption — a click on a parent means "itself, or any descendant
leaf"; e.g. clicking `linguistics` also surfaces entries tagged only with its descendant
`polarity-sensitivity`, even though those entries never mention `linguistics` directly). No
`kind`/partition anywhere: every group is fully symmetric, `{id, label, tags}`. `hidden:
true` on a tag renders no pill for that tag specifically, and continues rendering one tier
into its children instead — e.g. `canonical` (under `roles`) is hidden, so the panel shows
"Sr Technical Author @ Canonical" and "Technical Author @ Canonical" directly, with no
separate "Canonical" pill that would just repeat what those two already say.

## No presumption of exhaustivity (added 2026-08-07)

Ordinary conversation carries a strong exhaustivity expectation for free: if A asks "which
professor did the student talk to?" and B answers "P1 and P2," any listener infers that's the
complete list — nobody else, or B would have said so (this is a Gricean Quantity-maxim effect,
not a logical entailment of the words themselves). **The record, and any resume built as a
filter over it, deliberately do not carry that same expectation.** An entry existing is
evidence something happened; an entry *not* existing is not evidence it didn't — it may just
not be written down yet, or ever. This isn't a flaw to eventually fix by achieving completeness
— completeness was never the goal. Both the raw lifeDB record and any compressed resume view
of it are low-resolution windows onto an actual life, which is the kind of thing you can know
someone for fifty years and still keep finding new layers of. Recording something is allowed
to be sloppy, partial, and opportunistic — there's no obligation to log everything, and no
license for a reader to assume silence means absence. Don't write documentation, UI copy, or
entries themselves in a way that implies (even accidentally) "this is the complete record of
X" — that's a claim the system was never designed to make.

## Entry format

```yaml
- id: paper-2022-foo
  sentence: "I wrote a paper arguing..."   # first-person; states the actual argument/
                                            # finding, never echoes the title; HTML ok
  date: 2022-08                            # YYYY / YYYY-MM / YYYY-MM-DD / YYYY/YYYY / YYYY/present
  tags: [linguistics, research, writing, theoretical, paper]
  desc: "..."       # optional -- reserve for citable scholarly output (things with/
                     # deserving a bibtex block); skip for talks/interviews where the
                     # sentence already states the point. NEVER a verbatim third-party
                     # quote with a name attached -- paraphrase in her own voice.
  links: {pdf: /path}  # optional; keys: pdf, published, lingbuzz, slides, abstract,
                        # handout, poster, video, docs, web, hof, syllabus
  bibtex: |          # optional; creates a "cite" button -- papers/theses only, never
    @article{...}    # talks/lightning talks
```

**Sentence order: context clause first, then the actual claim (2026-08-07).** When an entry
needs to name the circumstance it happened under (a program, a secondment, a role), lead with
it as a subordinate "As X, ..." clause, then the main clause states what was actually done —
never bury the context as a trailing parenthetical after the claim. Reader hits the frame once,
up front, then reads the substance uninterrupted. E.g. "As my capstone project for Canonical's
Design Academy UX program, I designed a new information architecture..." not "I designed a new
information architecture... (as my capstone project for the Design Academy)." **Don't use the
context clause to smuggle in detail that a tag already carries** — e.g. don't add "(interviews
with the PM, conducted via Maze)" when `maze` and `user-research` are already tags on that same
entry; the sentence's job is the argument/finding, the tags' job is the faceted metadata, and
collapsing one into the other duplicates information in two places that can drift out of sync.

**Editing `entries.yaml`: always via Python (`yaml.safe_load`/`yaml.dump`), never a direct
text-editing tool.** This file's string-wrapping makes exact-text matches unreliable.
Pattern:
```python
import yaml
data = yaml.safe_load(open('data/entries.yaml'))
for e in data:
    if e['id'] == 'some-id':
        e['sentence'] = "new sentence"
        e['tags'] = sorted(set(e['tags']) | {'new-tag'})
with open('data/entries.yaml', 'w') as f:
    yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False, width=88)
```

**Two different "order" concepts — do not conflate them:**
- Inside a single entry's own `tags: [...]` list (in `entries.yaml`): order is cosmetic
  only, kept alphabetical purely for human scanning. It has **zero** effect on the live
  site — `layouts/index.html` re-sorts every entry's chips into canonical group order at
  render time regardless of source order (confirmed empirically: reversing an entry's whole
  tag list and rebuilding produced identically-ordered chips). Don't build or re-add a
  "normalize tag order" pass.
- Inside `groups.yaml`: **file order is the canonical order** — it drives `$tagOrder`,
  which is what the render-time sort above actually sorts by, and it's also literally the
  filter-panel's left-to-right/top-to-bottom order. Reordering `groups.yaml` *does* change
  what the site looks like. `roles` is reverse-chronological; every other group is
  alphabetical (no inherent sequence otherwise).

## Core tests (patterns to follow, and why)

1. **Facet-vs-entry test.** Same event variable → belongs in a tag or a sentence detail on
   an existing entry. Distinct event variable → its own entry. ("While a PhD student, I
   wrote a paper" is two entries — a state + an accomplishment — not one; a tool/methodology
   never gets its own entry, it's an adjunct on an existing one.)
   **Corollary — doing vs. reporting-on-the-doing (clarified 2026-08-07):** the same split
   applies between *doing the work* and *producing an artifact about it*, not just between
   state and accomplishment. `project-personal-ontology` ("I designed and built lifeDB...")
   and `blog-lifedb-framework` ("I wrote a blog post...") are two entries, not one, sharing
   tags rather than one folding into the other. This is deliberate, and it's a real advantage
   over the resume paradigm, not just a stylistic split: a resume only has room for things
   with a deliverable to point to, so unshipped or never-written-up work has nowhere to live.
   Here the doing is a complete, valid entry on its own, whether or not an artifact about it
   ever exists, comes later, or never comes at all — recording the effort was never
   conditional on there being something to link to.
   **Corollary — repetition is not synthesis (clarified 2026-08-07):** a proceedings paper,
   the journal version of the same result, and every talk given on it along the way are each
   their own entry — never collapsed into one synthetic "I worked on X" line the way a
   traditional academic CV might list "Intro to Semantics × 10" with no per-instance detail.
   This isn't a tolerated side-effect of "no counts in the UI" (Test 4) — it's the actually
   correct unit of recording, for a concrete reason: each instance is a genuinely distinct
   real-world event, and any of them might carry something the others don't (a new angle in
   the talk, a syllabus that changed substantially between one year's iteration and the next,
   teaching evaluations worth noting for one offering and not another). Collapsing them loses
   real, honest information that a specific instance might be the only place recording. **The
   compression a traditional resume performs is real and sometimes wanted — it just doesn't
   belong at the recording layer.** It belongs entirely in a separate, later, and deliberately
   manual step: building an actual resume/CV as a curated filter over the full lifeDB record,
   for a specific audience or application, where synthesizing five iterations of the same
   course into one line (or not) is a presentation choice made on purpose, not a default baked
   into how the underlying facts get recorded.
2. **Affiliation-tagging test.** Tag an institution on an entry only when the affiliation
   was genuinely *attached to that specific work* — presented under it, employed/enrolled by
   it, or it sponsored/enabled the work. Being merely-current at the time isn't enough
   (volunteer proofreading and peer review, for instance, carry no institution tag even
   though they happened during a given employment window).
   **Corollary — the same test, applied to domain on a recognition entry (clarified
   2026-08-07):** an award/fellowship entry carries the domain of the work it recognizes, even
   though the recognition event itself (a ceremony, a shout-out, a funding decision) didn't
   involve *doing* that domain's work — the tag is attached because the entry is fundamentally
   *about* that work being recognized, the same "genuinely attached" logic as an institution
   tag, just pointed at domain instead. Every `rec-*` entry in the corpus already does this:
   `rec-vca-2026` carries `documentation` though the award ceremony wasn't a documentation
   event; the PhD-era funding entries (`rec-sosland-2015`, `rec-douglas-dillon`, ...) all
   carry `linguistics` for the same reason, though receiving a fellowship isn't itself
   research. (A Turing Award recipient's award entry would carry their field's domain tag on
   this same logic, even if the ceremony obviously involved no actual research.)
3. **Domain test.** "Does this support a job title?" is what makes something a `domain`
   rather than a finer-grained `topic`/subtag (e.g. "polarity sensitivity" isn't a domain —
   nobody has that job title — it's a topic nested under `linguistics`).
4. **Tag-frequency ≠ occurrence-frequency.** A tag on a *repeatable act* (e.g. `hiring`,
   where each entry genuinely is one distinct interview) has count ≈ real-world magnitude. A
   tag on an *instrument/method* used in underlying work that gets *reported on* multiple
   times (e.g. `qualtrics` appearing on six talks that all discuss the same one or two
   surveys) does not — talks/papers are presenting-events built on a doing-event, not
   repetitions of the doing. Never derive a magnitude claim ("used in N projects") from a
   raw tagged-entry count without checking which kind of tag it is.
   **Corollary, clarified 2026-08-07 (don't over-apply this test the way it was misapplied to
   the `r`/`programming` question that day):** this test constrains *reading* a count, not
   *applying* a true tag to several entries. Giving substantially the same talk at multiple
   venues is normal academic practice — `talk-2016-lingedin-heterogeneity`, `talk-2016-mit`,
   and `talk-2016-language-cognition-harvard` are three presentations of one body of
   R-analyzed research within two months of each other, and `programming` correctly sits on
   all three, same as `r`. It was briefly proposed to strip `programming` from the
   re-presentations and keep it only on the one that felt most "original" (the eventual
   published paper) — wrong move, caught and reverted the same day: since this site never
   shows counts anywhere (see "no counts" in Rendering rules), there was never a magnitude
   claim at risk to begin with, and each entry's own sentence already supplies whatever
   context distinguishes it from its siblings. Don't re-litigate a tag's presence across
   repeated presenting-events on magnitude grounds when nothing here ever displays a count.
5. **Activity-vs-tool test (established 2026-08-06, adding `programming`/`markup`).** A
   *tool* tag (`python`, `bash`, `latex`, ...) means exposure to that instrument/ecosystem —
   it doesn't require personal authorship (same logic as a GitHub repo's language bar: 5%
   Python still means Python, even from a docs-only contributor). An *activity* tag
   (`programming`, `writing`, `teaching`, ...) means she personally *did* that doing — a
   stricter bar. Never derive an activity tag mechanically from a tool tag's presence: e.g.
   `latex` sits on 47 entries, nearly all of them "typeset a paper/talk in LaTeX," which is
   `markup` (safe to add wherever `latex`/`markdown`/`rst` appear — typesetting is what those
   tools are *for*, so the implication reliably holds), not `programming` (adding it
   mechanically would have false-positived on all 47). `programming` was hand-applied only
   to entries with confirmed personal script-authorship (the WebPPL model, 8 R analysis
   scripts, one Python-tooling docset) — three python/bash-tagged docset entries were
   deliberately left untagged despite carrying the tool tag, because their personal-authorship
   claim wasn't confirmed to the same bar: she's used Python, which the `python` tool tag
   already truthfully carries on its own, without that amounting to a claim of being a
   programmer, which is the stronger thing `programming` would assert. **Why the asymmetry
   isn't arbitrary:** it's a corollary of
   the neo-Davidsonian adjunct/core-predicate split this whole ontology already runs on
   (methodology = manner, tool = instrument, domain = theme — all adjuncts on one event
   variable; see "Data model" above). An activity tag asserts the event's core predicate with
   her as agent — full commitment, she *did* it. A tool tag is an adjunct describing what
   equipped some event, without asserting who wielded it (she can give a talk with LaTeX
   slides without having written the macros). Concretely: activity ⟹ the matching tool tag
   would also be true (if she really programmed in Python, Python is trivially also a tool
   she used) — but tool ⇏ activity, never the reverse. Not just "two different bars," a real
   asymmetric implication.

## Hosted blog posts

An entry can host its own full text on this site instead of (or as well as) linking out to
where it was originally published. This is the `blog-post` tag's native path — but it's not
blog-post-specific machinery: any entry whose artifact is text and lives here as a real page
can use it, on the same terms as `links.pdf` is used for typeset artifacts.

- **The page itself** is an ordinary Hugo content page under `content/blog/<slug>/index.md`,
  with normal front matter (`title`, `date`). It renders with PaperMod's default
  `single.html` — reading time, ToC, etc. — no custom layout needed. No nav tab links to it
  and none is needed: discovery is entirely through the `blog-post` tag in the filter panel;
  the page is still fully reachable at its own URL and gets a section archive at `/blog/` for
  free.
- **The entry** (`data/entries.yaml`) points at that page the same way it would point at any
  other artifact — `links: {web: /blog/<slug>/}` — no dedicated field, nothing beyond the
  standard `links` block.

**No inline preview in the main list (decided against, 2026-08-07).** An earlier version of
this tried several approaches to show a preview of each entry's artifact directly in the entry
list — an auto-generated text summary, a hand-copied abstract, then a live embed (`<iframe>`
for hosted posts, `<embed>` for PDFs, a real player for video, an Open-Graph link-card for
external posts). All of it was reverted the same day: it added real visual clutter and
duplicated what the `links` row underneath each entry already provides plainly. **The `links`
row is the intended way to reach an artifact** — don't reintroduce an inline preview without a
concrete reason the plain link isn't enough.

## Rendering rules

- Filter panel renders exactly **one** tier of pills per group, always — deeper structure
  (e.g. `linguistics`'s specific sub-topics) still exists and works, just isn't
  pre-populated into the top-level cloud; it's discoverable via chips on entries that carry
  it.
- **No counts, anywhere, ever.** Dim/lit (binary "does anything currently match") is the
  ceiling; a number next to a tag misleads more than it informs, per the tag-frequency test
  above — e.g. `ongoing-hiring` records "more than 200 interviews" in one entry's sentence,
  so a per-tag count would show `hiring: 1`, actively understating it, while the six-talks/
  one-survey case from the test above would overstate the opposite direction. No count can
  be right for both, so none is shown.
- **Group labels are not filters, but they are clickable for navigation.** Clicking (or
  hash-linking to) a group label scrolls to it and rings its own pills — e.g. `#tools`, or
  clicking the TOOLS label itself, scrolls to and rings every pill from Bash through YAML. It
  never filters the entry list, and it's mutually exclusive with tag filtering
  (`selectGroup`/`selectTag` each clear the other's state).
- `id="filter"` on the filter panel is a **published, externally-linked contract** — the
  author's resume links to `tmihoc.github.io/#filter`. Deliberately not `cv`-prefixed like
  everything else, so it doesn't read as an ordinary internal styling hook. **Before
  renaming or removing it, grep `resume/*.tex` for `#filter` and update there too.**

## Patterns to avoid, and why

- **Don't add a `kind`/category partition** — forcing every entry into exactly one stored
  category (e.g. every entry must be *either* a role *or* an activity *or* an output *or* a
  recognition, chosen once and stored). Instead each entry just gets every tag that's
  actually true of it, across independent ("orthogonal" — able to vary without depending on
  each other) dimensions: e.g. `ongoing-lab-management-harvard` carries `harvard`
  (institution), `documentation` *and* `linguistics` (domain), `mentoring` *and*
  `event-organization` (activity), `r` (tool) — all at once, none chosen at the expense of
  the others. "Her documentation work" and "her mentoring work" aren't two boxes that entry
  has to pick between; they're two independent queries (`tag=documentation`,
  `tag=mentoring`) that both legitimately match it, computed on demand — never read off a
  stored "kind" field. This is precisely the Dewey-style stored-bucket move the faceted
  design exists to reject. If a "clean grouped view" need comes up, solve it with tag
  hierarchy/rollup, not a privileged category.
- **Don't add typed entry↔entry edges or a knowledge-graph layer** (predicates like
  "cites"/"supersedes", direction, reification) — e.g. don't add a
  `superseded-by: talk-2020-elm`-style field to assert that a later paper supersedes an
  earlier talk. Instead both entries just share tags (`modified-numerals`,
  `polarity-sensitivity`), and their dates alone make the chronology visible to anyone
  browsing that tag. No competency question has needed edge direction or type; lineage
  between related entries stays emergent, never an asserted edge.
- **Don't build a GraphQL/SPARQL/query-service layer** without a real multi-consumer need —
  there's one dataset and exactly one consumer (this page's own filter JS; no second app, no
  external team, nobody else ever queries `entries.yaml`), so a resolver/schema layer would
  be complexity solving a problem that doesn't exist yet.
- **Don't remove something from a rollup (e.g. `roles`) by deleting the `entries.yaml`
  entry.** Edit `groups.yaml` only — e.g. to stop an institution's positions from appearing
  under `roles`, remove that institution's node from `groups.yaml`'s `roles` list; don't
  delete the underlying position entries from `entries.yaml`. The work still happened, and
  those entries may carry other tags (a domain, an activity) that other views legitimately
  depend on.
- **Don't add a numeric or magnitude display anywhere in the UI** — see "no counts" above.

## After any change

`hugo --quiet -d /tmp/hugo-check` (expect exit 0), then spot-check the live preview server if
one's running.
