# AGENTS.md — lifeDB

This file describes a lifeDB site: what's in the repository, how the pieces fit together, and how
they're meant to be used. It describes the code as it actually behaves today. A stale statement
here should be fixed or cut.

A repository can also carry a second file, `AGENTS.local.md`, for anything specific to its own
record: a decision and the reason behind it, a fact about the data, a place where the site departs
from this file's guidance. Where the two disagree, `AGENTS.local.md` wins. This file, `AGENTS.md`,
holds only generic lifeDB knowledge — a sync can replace its entire content (see "The sync
relationship," below), so anything personal belongs in `AGENTS.local.md` instead, or a future sync
could erase it. `AGENTS.local.md` needs no particular structure, and gets tracked in git normally,
right next to `AGENTS.md` — never gitignored. Nothing in it is more sensitive than the public
record it describes, so gitignoring buys no real privacy, and it costs something real: a
gitignored file exists only on one disk, with no git history and no GitHub backup. A lost or
broken machine, with no other backup, means that information is gone for good.

## The Conceptual Model

### The data model

lifeDB's record is a bipartite graph: one set of nodes is entries, the other is tags, and the
only edge type is `has-tag`, connecting an entry to every tag genuinely true of it.

Each entry denotes one *eventuality* — the general term, in linguistic aspect theory, for a
state, an activity, an accomplishment, or an achievement, the four-way classification eventualities
fall into by their internal temporal shape (traced to Vendler). A role is a state: no inherent
endpoint, simply true across an interval. An ongoing duty is an activity: also durative and
without a natural culmination, but agentive rather than static. A finished piece of work — a
paper, a redesign — is an accomplishment: a process with a result. An award, a defense, a hire is
an achievement: punctual, true at essentially one instant, no extended process. `date`'s three
shapes happen to cover exactly this range: a single date fits an achievement's instant or an
accomplishment's close; an open `/present` range fits a state or an activity still ongoing; a
closed range fits one that ended. What makes something *one* entry, whichever of the four classes
it falls into, is boundedness at the recording level: an entry draws a boundary around exactly
one eventuality — the whole content of the granularity question in the FAQ, below.

Tags are optional and freely stack: nothing requires a fixed number, and nothing requires them to
come from one group — an entry recording a role held while also finishing a thesis carries a role
tag, a domain tag, and an activity tag at once, each an independent, true fact about it. A tag can
also stand in a subsumption relation to other tags in its own group: a parent tag whose match
includes every descendant, not itself alone. This hierarchy is a convenience for browsing, not a
claim about the data — no entry ever references anything but a leaf or parent tag id directly, and
a tag's parent always belongs to the same group as the tag itself (see `data/groups.yaml` under
File Spec, below, for why).

Which tags exist at all isn't decided by a fixed ontology drawn up in advance. It's pragmatically
informed, by a single competency question asked of each candidate: would a reader ever actually
filter down to exactly this? A tag that answers yes earns its place in `data/groups.yaml`; one
that would never be the target of a real query doesn't, however real or nameable the distinction
it would encode.

### The three surfaces

Everything on the site beyond the record itself is built from those two files, or links into
them.

**The filter panel and the entry list**, rendered by `layouts/index.html`, read both files
directly at build time. The panel shows one row of pills per tag group; the list shows every
entry, newest first, each with its own tag chips underneath. A click on a pill or a chip narrows
the list to entries carrying that tag — several clicks narrow it to their intersection. A new
entry or tag goes live the moment the site rebuilds.

**The resume**, `content/resume.tex`, is the one surface nothing builds automatically. It's
written by hand, but from the same vocabulary: Experience comes from `roles` tags, Skills from
`domains` tags, and so on — the exact mapping is under File Spec, below. Every lifeDB site
has two kinds of resume: the *generic* one, tracked in the repository and linked from the
homepage, and any number of *per-job* forks, each tailored to one application and kept entirely
outside the repository. The generic resume links back into the site, too — its Summary points at
`#filter`, and each Skills line points at `#domains` — so a reader can go from a one-line resume
claim straight to the full, filterable record behind it.

**The homepage intro**, `content/_index.md`, is the third surface, and the smallest: a few
sentences of hand-written bio, with some of its words wired up as live tag links — a click filters
the list below, exactly like clicking a pill. It also carries the one link to the resume, and that
link must always point at the generic PDF, never a per-job fork.

One vocabulary, one set of facts, three surfaces built from them — one automatic, two by hand, all
three cross-linked. That cross-linking is the most fragile part of the system: a renamed tag, a
renamed anchor, a stray link to the wrong resume. File Spec, below, flags every place it
matters.

### Scope discipline

A new section or widget earns its place only by serving browsing and querying the record. A
curated slice of the record for one audience — a highlight for recruiters, a LinkedIn post —
belongs in a resume fork or a one-off post, written by hand, for one occasion. A query-service
layer — GraphQL, a custom resolver — waits for a second real consumer to show up; today there's
exactly one dataset and one consumer, the site's own filter JavaScript. And the `links` row under
each entry is the one place an artifact gets surfaced — an auto-summary, an embed, or a link card
next to it would only duplicate that job, with real visual clutter added.

### The sync relationship

A lifeDB repository's relationship to lifeDB itself has three layers, and each behaves
differently over time. `layouts/`, `layouts/partials/`, the structural parts of `hugo.toml` — its
theme and markup settings — and this file, `AGENTS.md`, hold no personal data, so a later
improvement to any of them — a bug fix, a new optional field, better guidance in this file — can
be pulled in directly from lifeDB, once lifeDB is added as a second remote (`git remote add
upstream https://github.com/tmihoc/lifedb.git`):
`git fetch upstream` followed by `git diff upstream/main -- layouts/ AGENTS.md` shows what
changed, and the result can be taken file by file (`git checkout upstream/main --
layouts/index.html`, say) or merged by hand where local edits touch the same files.
`data/entries.yaml`, `data/groups.yaml`, `content/resume.tex`, `content/_index.md`, and a site's
own values in `hugo.toml` are the opposite: entirely one site's own content, with no wholesale
sync possible by design. What *can* still change upstream is the expected format of these files —
a new optional field, a changed convention — worth checking after every `AGENTS.md` update.
`AGENTS.local.md` sits outside all of this: nothing in the first two layers ever touches it.

## Implementation

### Setup

Working on a lifeDB site locally needs `git`, [Hugo](https://gohugo.io/installation/), and a
LaTeX distribution capable of `lualatex` or `pdflatex` — for example,
[TeX Live](https://tug.org/texlive/) — installed first.

A new lifeDB site starts as a copy of this repository, made through GitHub's own **Use this
template** or **Fork** button, named exactly `<username>.github.io` — see `baseURL`, under
`hugo.toml` below, for why that exact name matters. Cloning that new repository locally
(`git clone <its URL>`, then `cd <username>.github.io`) comes next, followed by adding lifeDB
itself as a second remote (`git remote add upstream https://github.com/tmihoc/lifedb.git`),
which is what makes the sync relationship described above possible later. Fork keeps a visible
"forked from" link back to lifeDB and preserves the `themes/PaperMod` submodule reference; Use
this template drops both, so the vendored theme needs re-adding by hand, with `git submodule add
https://github.com/adityatelange/hugo-PaperMod themes/PaperMod` (`git submodule status` shows
which case applies: a line starting with a space means the theme's already checked out; a line
starting with `-` means the reference exists but isn't checked out yet, fixed with `git submodule
update --init`; no output or an error means the reference itself never came through). A local
preview runs on `hugo server`, at `http://localhost:1313/`, rebuilding and refreshing on every
save.

From there, filling things in has a natural order: data, then resume, then homepage.
`data/entries.yaml` and `data/groups.yaml` are what the filter panel and the entry list are built
from directly, so they come first — every other surface either derives from them (the resume's
Skills lines are drawn from what actually co-occurs in the data) or links into them (the
homepage's tag spans only make sense once the tags they point to exist).

### File Spec

#### data/entries.yaml

The corpus: one entry per real thing that happened — a role, an activity, an accomplishment, an
achievement (see "The data model," above) — each a flat structure.

```yaml
- id: paper-2022-foo
  sentence: >-
    I wrote a paper arguing...
  date: 2022-08
  tags:
  - mathematics
  - research
  - writing
  - theoretical
  - paper
  cite: "..."          # optional -- plain-text, human-readable citation, for a talk or paper
                        # with no formal bibtex entry, or alongside one; creates a "cite" button
  links: {pdf: /path}   # optional; any label works and is shown as the pill's text, hyphens
                         # rendered as spaces (hall-of-fame displays as "hall of fame")
  bibtex: |             # optional; creates a separate "bibtex" button
    @article{...}
```

- **`id`** — short, unique, kebab-case. `layouts/index.html` uses it as a DOM id, for citation
  boxes and their copy buttons, so it has to stay unique across the whole file.
- **`sentence`** — written as a `>-` block scalar, not a plain unmarked one, even when it fits on
  one line: the `>-` marks a folded block explicitly, so continuation lines only need consistent
  indentation, not YAML's fussier unmarked-scalar rules. First person. States the actual argument
  or finding — never just echoes a title.

  `layouts/index.html` renders this value as plain text, not HTML, on purpose: `sentence` is free
  text, and rendering it raw would let a stray `<` or a pasted `<script>` tag run in a visitor's
  browser. HTML markup doesn't belong here; plain punctuation carries the emphasis instead.
  *Exception, when a single person is the record's only author:* `{{ .sentence }}` can become
  `{{ .sentence | safeHTML }}` in `layouts/index.html` — and the same for `{{ .cite }}` below — to
  allow real markup, for example `<em>` around a journal title. This is safe only when every past
  and future author of `data/entries.yaml` is trusted completely; `safeHTML` renders exactly what's
  there, with no escaping, so an untrusted contributor could run a script in every visitor's
  browser.

  Context first, then the claim. When an entry needs to name the circumstance it happened
  under — a program, a secondment, a role — it opens with that circumstance as a subordinate "As
  X" clause, then states what actually happened. The context never sits as a trailing
  parenthetical after the claim: a reader should hit the frame once, up front, then read the
  substance without interruption. *"As my capstone project for Acme's design program, I built a
  new admin dashboard..."* — not *"I built a new admin dashboard... (as my capstone project for
  Acme's design program)."* Nor does the context clause smuggle in detail a tag already carries —
  the sentence argues the point, the tags carry the facets, and duplicating one in the other just
  leaves two copies that can drift apart.
- **`date`** — `"YYYY"`, `"YYYY-MM"`, or `"YYYY-MM-DD"` for a single date. A range joins two of
  these with `/`, like `"2015-09/2017-06"`; an open-ended one ends `/present` instead of a second
  date, like `"2021-03/present"`. The list sorts on the end of the range (or the single date),
  newest first.
- **`tags`** — every id here must already exist in `data/groups.yaml`. This file supplies no tags
  of its own; it only references that vocabulary.
- **`cite`, `links`, `bibtex`** — all optional. `cite` and `bibtex` each get their own collapsible
  box behind their own button, labeled "cite" and "bibtex," each with its own copy button that
  copies only its own content. (An earlier version combined them into one box behind one button —
  reverted, because one copy button copying both texts as a single block left neither one usable
  on its own.) `cite`, like `sentence`, renders as plain text, for the same security reason.
  Anything that isn't a citation — why an award was given, say — belongs in the sentence, not in
  `cite`.
- No entry links to another entry's id. Two related entries — a talk and the paper it became —
  just share tags; a reader browsing that tag sees both, and the dates alone show which came
  first.

An entry can host its own full text on this site, instead of, or as well as, linking out to
wherever it was first published — nothing beyond an ordinary Hugo content page is needed. The page
sits at `content/<section>/<slug>/index.md`, with the usual `title` and `date` front matter, and
renders with PaperMod's default layout, reading time and table of contents included. No nav-tab
link is needed either — a reader finds it through whichever tag marks that kind of content in the
filter panel, and the page stays reachable at its own URL regardless. The entry points at it
exactly like any other artifact: `links: {web: /<section>/<slug>/}`.

This file gets edited with a script once it holds more than a handful of entries — direct text
matches get unreliable once the line-wrapping kicks in:

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

The entry count is worth checking after every edit: `python3 -c "import yaml;
print(len(yaml.safe_load(open('data/entries.yaml'))))"`. If that import fails, the virtual
environment in use probably lacks `pyyaml` — `/usr/bin/python3`, the system interpreter, is the
fix, rather than installing `pyyaml` into someone else's venv.

This `safe_load`/`dump` trick is safe here, but never on `data/groups.yaml` — see below.

#### data/groups.yaml

The tag ontology. Every group looks like `{id, label, tags: [...]}`; any tag inside it can carry
its own nested `tags:` list, which makes it a parent.

A tag's parent must live in the same group as the tag, per "The data model," above. Take the
activity tag `writing`: it could sit under a dozen different domains — documentation, blogging,
fiction, research. Nested under the domain tag `documentation`, a match on `documentation` would
also match every `writing` entry, even ones that have nothing to do with documentation — the
hierarchy would be asserting a link that isn't real. Nesting within one group avoids this, because
the parent and the child are making the same kind of claim: a narrow sub-topic under a broad
domain, or an institution as the hidden parent of every role held there.

A tag marked `hidden: true` shows no pill of its own; the site renders one level of its children
instead. This is what keeps `roles` clean — an institution's name would only repeat what its own
position labels already say ("Senior Engineer @ Acme Corp").

Two different things are both called "order" here. A single entry's own `tags: [...]` list, in
`entries.yaml`, is cosmetic — there for a human to scan, with zero effect on the live site;
`layouts/index.html` re-sorts every entry's chips into canonical group order at render time, no
matter what order they were written in. The order of `groups.yaml` itself, by contrast, is
canonical: it drives that render-time sort, and it's literally the filter panel's left-to-right,
top-to-bottom layout, so reordering this file changes the site's appearance. A sensible default:
`roles` reverse-chronological, most recent first, like a normal resume; everything else
alphabetical, since nothing else has an inherent sequence.

The seven starter groups are worth keeping. Splitting role from domain from activity buys two
things: accuracy — a role tag can be exact to one job at one employer, while a domain tag stays
broad — and expressiveness — a tool or an activity can be recorded honestly even when it never
adds up to a full domain or role. Dropping one deserves real thought first. What each is for, and
which `content/resume.tex` section it feeds:

- **roles** — a position at a specific employer, written "Title @ Employer." An employer tag is
  the hidden parent of its position tags. Experience is built entirely from this group, one entry
  per role.
- **domains** — the field the work supports a job title in. Skills is built from it, one line per
  domain.
- **activities** — actions personally carried out.
- **methodologies** — how the work was approached. Fills the parenthetical of a Skills line,
  alongside tools.
- **tools** — an instrument or ecosystem involved in the work. Same job as methodologies:
  parenthetical evidence for a domain claim.
- **deliverables** — the form the work took: paper, talk, blog post, docset. The fastest way to
  find "everything published" or "every talk given," regardless of domain or activity.
- **recognition** — an award, fellowship, or other recognition. Education is built from it
  directly, along with role tags.

The tags inside each group are shaped to fit the record — no need to over-design a structure for a
record that doesn't divide that way yet.

To remove something from a rollup — an institution's positions from under `roles`, say — this
file is the one to edit, not `data/entries.yaml`. Deleting the institution's node from the `roles`
list here does it; the position entries themselves stay, since the work still happened, and those
entries may carry other tags — a domain, an activity — that other views on the site depend on.

This file gets edited directly, never with `yaml.safe_load`/`yaml.dump`. `safe_load` reads only
the data — ids, labels, tag structure — never the `#` comments, blank lines, or indentation style,
because none of that is data. So `dump` has nothing to write those back from: it rebuilds the file
from scratch, in PyYAML's own default style. `data/entries.yaml` has no comments and already
matches that style, so the round trip loses nothing there. This file has real header-comment prose
and a deliberate nested-indent style, so the same round trip would silently delete both — a change
that shows up in a diff as two lines, but actually erases the whole comment block. A plain text
tool, used surgically at the exact lines that need changing, is the safe way in. Before trusting a
round-trip edit on any unfamiliar YAML file, `grep -c '^\s*#' <file>` first — comments or unusual
indentation either one means the file needs the surgical approach, not `dump`.

#### content/resume.tex

A single-column, ATS-safe LaTeX resume, built by hand from the tagged record — nothing here pulls
from `entries.yaml` or `groups.yaml` automatically. The generic version comes first: header,
Summary, Experience, Skills, Education. Each section maps to a tag group: Experience from `roles`,
Skills from `domains` with `methodologies` and `tools` as parenthetical evidence, Education from
role and recognition tags.

Compiled with `lualatex -interaction=nonstopmode resume.tex` (or `pdflatex` — nothing here needs
LuaLaTeX specifically). A clean log ending "Output written on..." isn't proof enough on its own;
the rendered PDF is worth opening and checking too. It shows up on the site at the resume link, at
the end of the homepage intro.

The 10-point size, the `bitstream-charter` font, the single column, and the 2-centimeter margins
stay untouched, as a rule — none of that is a style choice: plain serif text is what both a parser
and a skimming human read most reliably, and anything decorative risks garbling in an ATS.

Macros: `\employer{Name}` opens a new employer block, in plain bold text, not `\subsection`, which
is reserved for the group-header tier. `\jobtitle{Title}{Start -- End}` states one position under
the current `\employer`. A `\url{...#...}` never passes through a macro's argument, since that
mangles the literal `#` — a link with a URL fragment goes inline, at the call site, not through
`\jobtitle`. A Fit to Role paragraph (below) uses a bold run-in label, with the answer flowing
right after it, on the same line, never on its own line and never as an unlabeled bullet.

Fit to Role is for one specific job application, not a permanent fixture: it keeps Experience and
Skills to bare facts, and does the persuading here instead, addressed to one posting. Each
requirement gets quoted close to the job ad's own words, as the label of a `\paragraph`. The
answer is something real and verifiable — no aspirational language, and a genuine weakness named
plainly if there is one. A requirement phrased as an "or" list only needs one true match; two
bullets asking the same question in different words get answered together, in one paragraph. The
master copy stays generic — Fit to Role gets uncommented and filled in only in a copy kept
entirely outside this repository, for one application at a time.

Skills: one line per domain, based on what actually co-occurs with that tag in
`data/entries.yaml`. A Skills line's domain label links to `#domains` — the group, not one
specific tag's filter — so a reader lands on the whole cluster and narrows from there. The `\href`
wrapper drops out entirely on a resume with no linked website. Tailoring a copy for one job: copy
the file outside this repository, uncomment Fit to Role, and work through each requirement,
linking to the matching filter on the site where it helps.

Some sites go further than tracking just the generic `resume.tex` and keeping forks outside:
every version of the source, generic included, stays outside the repository, with only the
compiled `content/resume.pdf` tracked. This removes the "remembering to keep Fit to Role commented
out" dependency entirely: a per-job detail was never in the repository to begin with. Taking this
approach means the `#filter` check under `layouts/index.html`, below, has no
`content/resume.tex` here to search — the external source needs a direct search instead.

#### content/_index.md

The homepage's intro, above the filter panel. Its `data-tag="..."` spans are live: clicking one
filters the list below, exactly like clicking a pill. The placeholder bio gets replaced with real
words, the pattern stays, and each `data-tag` gets swapped for a real tag id.

This PDF link always points at the generic, master resume — a fork's Fit to Role section names a
specific company and quotes a specific job ad, and linked here by accident, that information
becomes public on the homepage. Every per-job fork stays outside this repository.

One quirk worth knowing: this file's presence is what makes `content/` a Hugo content bundle, so
any other file next to it — `resume.tex`, `resume.pdf` — becomes a resource of this page instead
of a plain static file. That's what publishes `resume.pdf` at a working URL with no extra
configuration — and, as a side effect, `resume.tex` too.

#### layouts/index.html and layouts/partials/

Renders the filter panel, the entry list, and every bit of filtering and navigation JavaScript.
`layouts/partials/fmt-date.html` and `fmt-period.html` format dates and date ranges. This file's
own comments explain its rendering logic line by line; here's just the behavior that matters to
whoever is filling in data, not the implementation:

- The filter panel always shows exactly one level of pills per group. Deeper structure still
  exists and works — it surfaces through chips on the entries that carry it, even though it isn't
  pre-populated in the top cloud.
- No counts, anywhere, ever. Dim or lit — does anything currently match, yes or no — is as far as
  a pill goes. A number next to a tag would mislead more than it informs: a tag on a repeatable
  act tracks real magnitude, while a tag on a tool or method that gets *written up* several times
  tracks something else entirely, and there's no single display honest for both.
- A group label is clickable for a different purpose than a tag: a click on one, or a link to its
  hash, scrolls the page there and outlines its pills, a pure navigation action, mutually
  exclusive with tag filtering (each clears the other's state).
- `id="filter"` on the panel is a contract the resume can link to, at
  `<username>.github.io/#filter`. It's deliberately plain, unlike this codebase's other styling
  hooks, which is what keeps it reading as a real, external contract rather than an ordinary
  internal one. Renaming or removing it means grepping `content/resume.tex`, and any per-job fork,
  for `#filter`, and updating every hit.

#### hugo.toml

`title`, `baseURL`, `params.description`, and the LinkedIn and GitHub URLs under
`params.schema.sameAs` and `params.socialIcons` are the values every new site personalizes first.

`baseURL` must be exactly `https://<username>.github.io/`. GitHub Pages only serves a plain "user
site," with no extra configuration, when the repository itself is named `<username>.github.io`;
any other name means either no live site, or one served from a `/<repo-name>/` subpath that this
`baseURL` would then no longer match. `theme = 'PaperMod'` needs the theme's own files at
`themes/PaperMod`, per the submodule note under Setup, above.
`[markup.goldmark.renderer] unsafe = true` is required: Goldmark strips raw HTML from Markdown by
default, and `content/_index.md` depends on raw HTML — its `<span class="cv-fl"
data-tag="...">` spans — to work at all, so dropping this setting makes those spans quietly stop
rendering as HTML (no error, just literal escaped text on the page, and the click-to-filter
behavior gone with it). `[params.footer] text = "Built with [lifeDB](https://github.com/tmihoc/lifedb)"`
is a nice touch, per the License section of `README.md`; deleting the block skips crediting
lifeDB in the footer.

### Publishing

Publishing turns a local, private working copy into a public GitHub Pages site, and with it, its
full git history. Anything meant to stay private — a per-job resume fork, say — needs
`.gitignore` added before the first commit that includes it, since gitignore only stops new files
from being tracked and can't undo a commit that already happened; content that never enters the
repository at all is safest of all.

Two things are worth checking right before that first push: that `data/entries.yaml` says only
what's comfortable to make public, and that neither `content/resume.tex` nor any per-job fork
holds anything confidential — better still, tracking only the compiled `resume.pdf`, with every
`.tex` source kept outside the repository, as described under `content/resume.tex`, above. The
repository's own placeholder content — the example entries and tags, and `README.md`, which
describes the template rather than the site — gets deleted at the same point, though `AGENTS.md`
stays: unlike the old `GET_STARTED.md` it replaces, it earns its keep again the next time this
repository gets touched, and it's what makes the sync relationship described above possible going
forward.

A clean build (`hugo --quiet -d /tmp/hugo-check`, exit code 0) and a clean resume compile
(`lualatex -interaction=nonstopmode resume.tex`, or `pdflatex`, log ending "Output written
on...") are both worth verifying directly, by reading the log and opening the actual PDF — an
exit code alone proves neither. On GitHub, the repository's Settings, under Pages, needs Source
set to **GitHub Actions**; the Actions tab's **New workflow** search for "hugo" surfaces a
ready-made workflow needing no hand-written YAML. Once that workflow runs, at
`github.com/<username>/<username>.github.io/actions`, the site and the resume are both live, at
`https://<username>.github.io/`.

This same build-and-compile check is worth repeating after any later change, along with a
spot-check of the live preview server, if one's running.

## FAQ

<details>
<summary>Do I have to log everything?</summary>

No. The record doesn't need to be complete, and nothing about its design claims it is. An entry
existing is evidence something happened; an entry *not* existing isn't evidence it didn't — it
might just not be written down yet, or ever. No entry, tag, or surrounding copy should imply, even
by accident, "this is the complete record of X." Sloppy and partial beats not recorded at all —
most attempts at record-keeping never even clear that bar.
</details>

<details>
<summary>How big should one entry be?</summary>

Same underlying event → a tag or a sentence detail on an existing entry. Genuinely different
event → its own entry. *"While an intern, I shipped a feature"* is two entries — a state and an
accomplishment — not one; a tool or a methodology never gets its own entry, it's an adjunct on an
existing one. Two entries can relate without merging: a talk and the paper it became, or a
recurring duty discharged through several kinds of action on one day. The test: could the actions
have happened independently of each other? If so, split them; if they're just what one ongoing
duty looks like in practice, one entry holds them all.

The same test separates *doing* work from *producing an artifact about* it — those become two
entries too, sharing tags, neither folded into the other. A resume only has room for work with a
deliverable to point to, so the doing stands as its own entry whether or not an artifact about it
ever exists.

It also applies to a repeated presentation of one result: a conference paper, its later journal
version, and every talk given on it along the way are each their own entry, never one synthetic
"gave several talks on X" line — each is a distinct real event, and any one of them might carry a
detail the others don't. That compression is sometimes exactly the point of a resume; it belongs
at the resume-building step, as a deliberate choice, separate from how facts get recorded in the
first place.

Beyond that, combine or split however seems useful. No rule counts events.
</details>

<details>
<summary>What if one thing led to another?</summary>

Apply the same tag to both entries. That shows the connection without collapsing the two events
into one, and keeps the recording system simple. There's no field for linking one entry's id to
another's — a reader browsing a shared tag sees both, and the dates alone show which came first.
</details>

<details>
<summary>Can tag groups be renamed, added, or deleted?</summary>

Yes — tags aren't a fixed schema, though the seven starter groups are worth keeping; each earns
its keep in the filters and the resume templates (see `data/groups.yaml` under Implementation).
</details>

<details>
<summary>Why are role tags one combined label, like "Senior Engineer @ Company"?</summary>

An entry needs the exact context the work happened in, and a combined label makes sure a filter
for one employer catches every role held there, without cluttering the panel with a separate,
redundant company pill.
</details>

<details>
<summary>Aren't the tag groups redundant?</summary>

They can look that way — if someone's a software developer, it's safe to assume they do
programming and use some language. So why keep all the layers? Because the same redundancy says
more, in both directions. A software developer who's also deep in hiring gets both `programming`
and `candidate-evaluation` as activity tags. Someone who's used JavaScript, but wouldn't claim to
"do programming" or hold the title "software developer," just applies `javascript` — alone, no
other tag required.
</details>

<details>
<summary>When does a new tag get created, versus leaving the detail in the sentence?</summary>

Two tests, matching "The data model," above. Worth creating at all: would a reader ever really
filter down to exactly this? *"Show me everything with `kubernetes`"* is a real question; a "just
in case" distinction isn't — a tag nobody would filter on doesn't earn its keep. Which group it
belongs in: does it support a job title? That's what separates a `domain` from a finer topic
nested under one — "load balancing" isn't a domain, since nobody's job title is "load balancing
specialist," so it nests under `software-development` instead.
</details>

<details>
<summary>Can tags nest?</summary>

Yes, though it's optional — most stay flat. A broad tag that feels lossy gets children in
`data/groups.yaml`, rather than a whole new group. One hard rule: a tag's parent must live in the
same group as the tag itself (see `data/groups.yaml` under Implementation).
</details>

<details>
<summary>Does a tool tag mean personal authorship of that activity?</summary>

No — one doesn't get derived from the other automatically. A *tool* tag (`python`, `latex`) just
means the entry involved that instrument, no personal authorship required — the same logic as a
GitHub repo's language bar, where 5% Python still counts, even from a docs-only contributor. An
*activity* tag (`programming`, `writing`) is stricter: it requires personal authorship. Where the
activity is genuine, the matching tool tag follows automatically — genuine Python authorship makes
Python trivially a tool that was used. The reverse never holds: a talk can run on LaTeX slides
someone else wrote, earning `latex` but not `markup`-as-authorship, and certainly not
`programming`.
</details>

<details>
<summary>Should an institution get tagged on everything from that time period?</summary>

No — only when the work was genuinely attached to it: presented under its name, done as an
employee or student there, or sponsored by it. Merely being employed there at the time isn't
enough on its own — volunteer work during an employment window doesn't inherit that employer's tag
just because the calendar overlapped. The same logic covers a domain tag on a recognition entry:
an award carries the domain of the work it recognizes, even though the ceremony itself wasn't an
instance of doing that work — the tag applies because the entry is fundamentally *about* that
work.
</details>

<details>
<summary>Does a tag's entry count mean anything?</summary>

Not on its own — which is exactly why the site never shows one (see "No counts," under
`layouts/index.html` in Implementation). A tag on a genuinely repeatable act tracks real
magnitude. A tag on an instrument or method that gets *written up* several times — six talks on
the same one or two projects, say — tracks something else: the talks are presenting-events built
on one doing-event, not repetitions of it. The same talk given at several venues is normal, and
each presentation still honestly keeps the same activity and tool tags as the others — none gets
stripped from a re-presentation just because it isn't the "most original" instance. A magnitude
claim always needs checking which kind of tag is involved before it gets read off a raw entry
count.
</details>
