# Desktop AI Onboard Plan

## Goal

Build an AI-powered onboarding flow for the desktop app that can ingest
user-uploaded files such as `csv`, `pdf`, `docx`, `jpg`, `md`, and similar
formats, identify account and password information inside them, and save the
results into the password manager.

The intended architecture uses:

- `Anthropic` as the primary supervisor agent
- `MiniMax` as a worker agent for parsing and difficult extraction tasks
- `LangGraph` to orchestrate the multi-step agent workflow

## Core Recommendation

This should not start as a fully automatic import pipeline. The first version
should be:

- AI-assisted extraction
- user review and confirmation
- then save into the app

This is important because password data has a very low tolerance for extraction
errors. A wrong username-password pairing is more serious than a normal
document parsing mistake.

## System Layers

The feature should be split into four layers:

1. File parsing layer
2. Intelligent extraction layer
3. Review and confirmation layer
4. Persistence layer

### 1. File Parsing Layer

Convert different file types into normalized text chunks and metadata that can
be searched and traced back to the original source.

Responsibilities:

- detect file type
- parse raw text where possible
- OCR image-based or scanned content when needed
- preserve source references like page, row, or file name

### 2. Intelligent Extraction Layer

Use AI plus retrieval to find candidate credentials from parsed content.

Responsibilities:

- retrieve credential-relevant chunks
- extract structured account data
- normalize fields
- collect confidence and evidence

### 3. Review And Confirmation Layer

Show extracted credentials to the user before they are saved.

Responsibilities:

- display candidate entries
- show evidence snippets
- allow edit, merge, skip, or confirm
- reduce the risk of incorrect imports

### 4. Persistence Layer

Write approved records into the existing desktop app data model.

Responsibilities:

- save confirmed records through Electron IPC
- reuse SQLite-backed password storage
- keep imported staging data separate from final records

## Recommended Runtime Placement

For the current desktop architecture, the implementation should be split like
this:

- `Electron main process`
  - file access
  - parsing pipeline
  - LangGraph runtime integration
  - final SQLite writes
- `Renderer`
  - file upload UI
  - import progress
  - review and confirmation UI
- `LangGraph runtime`
  - initially embedded in the desktop app backend path
  - later movable into a sidecar service if needed

The agent runtime should not live in the React renderer. Parsing, OCR,
embedding, retrieval, and model orchestration belong in the backend side of the
desktop app.

## Agent Design

This should be modeled as a supervisor graph with specialized tools and worker
nodes, not as one unconstrained agent.

### Supervisor

- `Anthropic supervisor`
  - decides which tools to call
  - coordinates the flow
  - produces final structured output

### Worker

- `MiniMax parser worker`
  - handles difficult OCR text
  - helps with weakly structured tables
  - processes noisy image or scan-derived text
  - returns tightly structured extraction results

### Tooling Nodes

- `csv parser`
- `pdf text extractor`
- `pdf OCR fallback`
- `docx extractor`
- `markdown/plaintext extractor`
- `image OCR`
- `RAG retriever`
- `credential extractor`
- `deduper/normalizer`
- `save-to-staging`

## Why RAG Is Needed

This use case fits a retrieval pipeline, but not mainly for chat. It is better
described as evidence-oriented RAG.

RAG should be used to:

- search long documents for credential-related content
- reduce prompt size by focusing on relevant chunks
- attach source evidence to every extracted credential

Each extracted result should keep:

- source file
- chunk id
- source excerpt
- confidence
- extraction summary
- raw field mapping when useful

This makes debugging, review, and future tuning much easier.

## RAG Retrieval And Candidate Aggregation

In this design, RAG is not primarily used for question answering. It is used to
find evidence-bearing chunks that are likely to contain credentials, then build
clean candidate contexts for extraction.

The retrieval pipeline should follow five stages:

1. chunk creation
2. indexing
3. candidate retrieval
4. candidate aggregation
5. evidence-linked extraction

### 1. Chunk Creation

Each file type should be converted into retrieval-friendly chunks with source
metadata attached.

Examples:

- `csv`
  - split by row or logical record
- `md` and `txt`
  - split by heading, paragraph, or list block
- `docx`
  - split by paragraph, table, and table row
- `pdf`
  - split by page, paragraph, or detected block
- `jpg` and `png`
  - OCR first, then split by layout block or text region

Each chunk should preserve metadata such as:

- `chunkId`
- `fileName`
- `sourceType`
- `page`
- `row`
- `sectionTitle`
- raw text

This metadata is required so extracted credentials can be traced back to their
origin during review.

### 2. Indexing

The retrieval layer should use hybrid indexing instead of embeddings alone.

#### Keyword And Rule-Based Index

Use lexical matching and heuristics to find chunks that look credential-related.

Signals include:

- keywords such as `username`, `password`, `login`, `account`, `email`
- Chinese equivalents such as `账号`, `密码`, `邮箱`
- URLs and domain names
- email patterns
- CSV headers with likely credential semantics
- row structures that look like exported password-manager data

This layer is important because many password export files are highly
structured, and deterministic signals are often stronger than semantic
similarity.

#### Embedding Index

Use embeddings to retrieve semantically related chunks when the source text is
weakly structured, noisy, or uses inconsistent labels.

This is especially useful for:

- natural-language notes
- OCR output
- screenshots
- informal lists of account information

The rule is to use lexical retrieval for precision and embedding retrieval for
recall.

### 3. Candidate Retrieval

The retriever should combine the two signals and rank chunks by likelihood of
containing credentials.

Recommended approach:

- run keyword and rule-based retrieval first
- run semantic retrieval in parallel or as a fallback
- combine both result sets into a scored candidate list
- preserve why each chunk matched, for debugging and ranking analysis

This should produce a list of credential-relevant chunks rather than a generic
document summary.

### 4. Candidate Aggregation

Retrieved chunks should not be sent directly to the model one by one. They
should first be grouped into candidate contexts.

This is necessary because credential fields are often spread across nearby
chunks, for example:

- one chunk contains the website
- the next chunk contains the username
- a nearby row or paragraph contains the password

If these fragments are processed independently, the extraction model is more
likely to mis-pair usernames and passwords.

The aggregation step should:

- merge adjacent chunks from the same page or section
- merge related table rows or neighboring OCR regions
- group chunks that share the same domain, title, or structural parent
- form a bounded candidate context with attached source references

The output of this stage should be a candidate bundle, not just raw chunks.

### 5. Evidence-Linked Extraction

The extraction model should operate on candidate bundles rather than the full
document.

The `Anthropic` supervisor should receive:

- the candidate context text
- chunk metadata
- retrieval reasons
- nearby structural hints when available

It should then produce structured credentials together with:

- confidence
- evidence references
- a short extraction summary

If the text is too noisy, the supervisor can call the `MiniMax` worker to
refine OCR text or parse difficult layouts before final extraction.

### Stored Evidence

Each extracted credential should retain enough provenance for UI review and
debugging.

Recommended evidence fields include:

- source file
- chunk ids
- short source excerpts
- page or row information
- retrieval reason
- confidence score

This allows the UI to show the user where the extracted value came from and
supports a review-first import flow.

### Suggested RAG Modules

To keep the design modular, the retrieval system should be split into the
following components:

- `chunker`
  - converts parsed files into typed chunks
- `indexer`
  - builds keyword and embedding indexes
- `retriever`
  - performs hybrid retrieval for credential-like chunks
- `candidate-builder`
  - merges related chunks into bounded candidate contexts
- `extractor`
  - runs structured extraction on candidate contexts
- `evidence-linker`
  - binds extraction outputs back to chunk-level provenance

This keeps the RAG system focused on high-precision credential extraction
instead of generic document chat behavior.

## Proposed Intermediate Schema

The agents should not write directly into the database schema. Use a stable
intermediate structure first.

```ts
type ExtractedCredential = {
  sourceFile: string
  sourceType: 'csv' | 'pdf' | 'docx' | 'image' | 'md' | 'txt'
  title?: string
  serviceName?: string
  website?: string
  loginUrl?: string
  username?: string
  email?: string
  password?: string
  notes?: string
  otpSecret?: string
  tags?: string[]
  confidence: number
  evidence: {
    chunkId: string
    excerpt: string
    page?: number
    row?: number
  }[]
  needsReview: boolean
}
```

Then map this intermediate structure into the existing `passwords` table shape.

Benefits:

- stable agent output contract
- easier UI review
- easier support for more formats later

## File-Type Strategy

Different file types should use different parsing strategies. Do not send raw
files directly to an LLM by default.

### CSV

- parse deterministically first
- infer columns like `website`, `username`, `password`, `notes`
- only use a model if column meaning is ambiguous

### Markdown Or Text

- chunk directly
- run extraction on text plus retrieval

### DOCX

- extract paragraphs and tables first
- then run retrieval and extraction

### PDF

- attempt text extraction first
- fall back to OCR if extraction quality is poor

### JPG Or PNG

- run OCR and layout understanding
- then extract credential candidates from recognized text

The general rule is simple: use deterministic parsing first, and only involve
AI where ambiguity actually exists.

## Suggested LangGraph Flow

The first graph can follow this shape:

1. `ingest_file`
2. `detect_file_type`
3. `parse_content`
4. `quality_check`
5. `chunk_and_embed`
6. `retrieve_credential_candidates`
7. `anthropic_supervisor_extract`
8. `minimax_worker_refine`
9. `normalize_and_dedupe`
10. `human_review_required`
11. `persist_to_sqlite`

Recommended role split:

- `Anthropic`
  - planning
  - extraction decisions
  - final structured output
- `MiniMax`
  - hard parsing tasks
  - OCR cleanup
  - noisy chunk refinement

This means Anthropic decides what should happen, while MiniMax is called as a
bounded worker for difficult content.

## Multi-Agent Guidance

Do not implement this as two free-form agents chatting with each other. That is
harder to control, harder to test, and more expensive.

Use:

- `Anthropic` as a supervisor node
- `MiniMax` as a controlled worker node
- fixed JSON outputs between nodes

This makes LangGraph state easier to inspect and replay.

## Security And Privacy Principles

Because this feature handles credential data, the first version should enforce
strict safety constraints.

Recommended rules:

- process locally whenever possible
- avoid storing raw files long term
- only send relevant chunks to models
- store source evidence for each extraction
- do not write to the final password table before review
- do not log plaintext passwords in import logs
- clean temporary caches after import completion

If cloud models are used, later versions should also support:

- explicit user consent
- minimized outbound data
- a clear local-only mode versus cloud-assisted mode

## Fit With Current Desktop App

Given the current repository structure, the implementation should likely add:

- `apps/desktop/src/features/import/`
  - file upload and review UI
- `apps/desktop/electron/import/`
  - parsing pipeline
  - temp file handling
  - orchestration glue
- `apps/desktop/electron/agents/`
  - LangGraph runtime
  - model provider wrappers
  - tool definitions
- `apps/desktop/electron/ipc/import.ts`
  - import-related IPC handlers
- `apps/desktop/src/store/importStore.ts`
  - progress
  - candidate records
  - review state

## Database Recommendation

Avoid writing directly into the main `passwords` table during extraction.

Use staging tables first, for example:

- `import_jobs`
- `import_candidates`

After user confirmation, write the approved records into `passwords`.

This reduces the risk of polluting the main dataset when extraction quality is
not yet fully trusted.

## MVP Scope

The first useful version should focus on:

- support for `csv`, `md`, `txt`, and `pdf`
- single-file import
- extraction of `website`, `username`, `password`, and `notes`
- user review before save
- simple dedupe
- evidence display

The first version should explicitly avoid:

- autonomous multi-agent behavior
- large multi-file batch processing
- aggressive auto-overwrite of existing passwords
- silent background imports
- complex image-first workflows

## Current Practical Constraint

Based on local testing already done in this repository:

- `ANTHROPIC_API_KEY` is currently working
- `MINIMAX_API_KEY` is currently returning `invalid api key`

That means the proposed Anthropic-plus-MiniMax design is valid at the
architecture level, but MiniMax is currently blocked at runtime until a working
key is available.

Recommended approach:

- design the system with a provider abstraction
- ship the first implementation with Anthropic only
- leave the MiniMax worker behind an interface for later activation

This keeps development moving without changing the intended long-term design.

## Recommended Implementation Order

1. Define the intermediate schema and import state machine
2. Build the file parsing layer without AI
3. Build an Anthropic-only extraction path
4. Build review UI and save flow
5. Add RAG and evidence retrieval
6. Add the MiniMax worker integration once a valid key is available

This order is the lowest-risk path to a usable feature.
