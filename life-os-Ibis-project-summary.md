# Ibis: Project Summary and life-os Integration Brief

## Prepared for: Ibis Project Manager (Claude Instance)

## Context: life-os System Design Consultation

## Date: 2026-03-19

------------------------------------------------------------------------

## What This Document Is

This document summarizes everything known about Ibis as it has been described during the design of a companion system called life-os. It is written for the Ibis project manager to understand how life-os expects to interact with Ibis, what integration contract has already been designed around it, and what decisions made in life-os should inform or constrain Ibis development.

This is not a feature request document. It is a briefing. The Ibis project manager should treat the integration contract section as a proposed interface agreement, not a mandate.

------------------------------------------------------------------------

## What Is Ibis

Ibis is a software tool being developed under SIM DAD LLC by the same owner as life-os. It is a voice memo transcription application: it takes voice recordings as input and produces transcribed plain text (.txt) files as output.

That is the entirety of what has been formally stated about Ibis in the life-os design consultation. The name, the output format, and the general function are confirmed. All other details — the transcription engine, the UI, the platform target, the file naming convention — are unspecified from life-os's perspective and remain within Ibis's design authority.

**Current status:** Active build. The owner has indicated that Ibis and life-os are being developed in parallel, and that life-os should not wait for Ibis before becoming operational. A manual fallback capture mechanism has been designed into life-os for the period before Ibis ships.

------------------------------------------------------------------------

## Why Ibis Matters to life-os

The owner has ADHD. This is a first-order design constraint for both systems.

The honest default capture behavior for the owner is not typing. It is not opening an app and filling in fields. It is speaking. Voice memos are how ideas, tasks, health observations, and work notes naturally leave the owner's head in real time.

Ibis is therefore not a nice-to-have integration. It is the primary intended input mechanism for life-os. The entire life-os inbox pipeline — the automated triage, classification, and filing system — was designed with Ibis transcripts as its expected primary input. A frictionless capture path from voice to structured vault entry is the difference between a system the owner uses and a system the owner intends to use.

In practical terms: when Ibis ships and integrates with life-os, the owner should be able to dictate a task, a health observation, a project idea, or a meeting note on any device, and have it automatically filed in the correct location in the life-os vault within 60 seconds, with no further action required.

------------------------------------------------------------------------

## The life-os Inbox Pipeline

life-os includes a continuously running file watcher (Python Watchdog daemon) that monitors a designated drop folder:

```         
C:\life-os\ibis-inbox\
```

When any .txt file appears in this folder, the pipeline triggers automatically:

1.  The Watchdog daemon detects the new file
2.  The file content is passed to a local LLM (Llama 3.1 8B running via Ollama)
3.  The 8B model classifies the content:
    -   Which life zone does this belong to? (academic / llc / personal)
    -   Which specific project does it relate to, if any?
    -   What type of content is it? (task / health log / idea / meeting note / ambiguous)
    -   Confidence score for each classification
4.  High-confidence classifications are filed automatically to the correct vault location
5.  Low-confidence classifications are written to a human-review inbox (personal/gap-items/inbox.md) with the classification reasoning shown
6.  Any extracted tasks are written to the SQLite task table
7.  Any health-relevant content is written to the health log
8.  The original .txt file is archived after processing
9.  The entire pipeline completes in under 60 seconds for a typical memo

The pipeline is source-agnostic. It processes any .txt file that lands in the drop folder, regardless of whether it came from Ibis, from a manual paste, or from any other tool. This means life-os is already operational for manual capture and will adopt Ibis automatically the moment Ibis begins writing to the drop folder.

------------------------------------------------------------------------

## The Integration Contract

This is the proposed interface between Ibis and life-os. It was designed to be as minimal as possible so that Ibis retains full design freedom.

**What life-os needs from Ibis:**

1.  **Output format:** Plain text (.txt). No other format is required or expected. Markdown is acceptable but not required. life-os's 8B model reads raw transcribed prose without needing any structure imposed by Ibis.

2.  **Output location:** Ibis should write completed transcriptions to:

    ```         
    C:\life-os\ibis-inbox\
    ```

    This path is configurable in life-os. If Ibis has its own output directory setting, pointing it here is the entire integration. There is no API, no webhook, no SDK. One folder path.

3.  **File naming:** life-os does not require a specific naming convention. It will process any .txt file. However, a timestamp prefix is recommended for disambiguation:

    ```         
    YYYY-MM-DD-HH-MM-SS-[optional-title].txt
    ```

    The 8B classifier reads the content, not the filename, for routing decisions. The filename is used only for archiving and audit trails.

4.  **Atomic writes:** life-os expects files to be complete before they land in the drop folder. Ibis should write the final file atomically — write to a temp location, then move to the drop folder — or write only when transcription is fully complete. A partial file written incrementally could trigger the pipeline prematurely.

**What life-os does not need from Ibis:**

-   No metadata files or sidecar files
-   No structured frontmatter or JSON headers in the .txt
-   No speaker diarization or timestamps within the transcript
-   No integration SDK or API
-   No notification or callback to life-os when a file is ready
-   No changes to Ibis's internal architecture

**What Ibis retains full authority over:**

-   The transcription engine (Whisper, cloud API, proprietary, anything)
-   The recording interface and user experience
-   The platform (desktop, mobile, web, or all three)
-   Internal file handling before the final .txt is written
-   Transcription quality, language support, and accuracy
-   Voice cloning or speaker identification features, if any
-   Pricing, licensing, and distribution

------------------------------------------------------------------------

## Multi-Device Consideration

The owner works across multiple machines (NSF-Leith as the hub, plus three laptops and a phone) and remotes into NSF-Leith via Parsec for most work. The drop folder lives on NSF-Leith.

If Ibis runs on the phone or on a laptop, there is a path question: how does the transcribed .txt reach C:\life-os\ibis-inbox on NSF-Leith?

This is an open design question. Possible approaches include:

-   **Simplest:** Ibis runs only on NSF-Leith. Voice recordings are made on the phone and transferred manually before transcription. Ibis handles everything locally.
-   **Network share:** NSF-Leith exposes ibis-inbox as a network share. Ibis on other devices writes directly to it when on the home network.
-   **Deferred:** Ibis runs on NSF-Leith only for now. Mobile capture is addressed in a later version.

life-os has no opinion on which approach Ibis takes. The drop folder will accept files from any source.

------------------------------------------------------------------------

## What life-os Tracks About Ibis

Ibis is registered in the life-os execution plan as project LLC-002:

```         
ID: LLC-002
Name: Ibis
Zone: llc
Intent: commercial
Status: active
Description: Voice memo transcription to .txt files. Integrated with
  life-os inbox pipeline. Ibis completion unblocks the full automated
  capture system.
Dependency note: life-os capture pipeline operates in manual fallback
  mode until Ibis ships. Ibis completion is flagged as a dependency
  for full pipeline activation.
```

The context-aware routing system in life-os is aware of this dependency. When the owner works on Ibis-related tasks, the launcher surfaces the dependency relationship between Ibis and the life-os capture pipeline in its queue projection output.

------------------------------------------------------------------------

## The Manual Fallback

Until Ibis ships, the owner writes notes directly in Obsidian and drops .txt files manually into ibis-inbox. The pipeline processes manual files identically to Ibis transcripts. The only difference is the source field in the database: "manual" vs "ibis".

This means:

-   The pipeline is live and being tested with real content before Ibis ships
-   Classification logic bugs will be found during the manual fallback period
-   The owner builds the capture habit before Ibis automates it
-   Integration testing when Ibis ships is a single folder configuration step

------------------------------------------------------------------------

## Coordination Recommendation

The life-os capture pipeline will be operational and processing real content during Phase 1 of the life-os build. Any decisions about Ibis output format or file structure should be checked against this document, as the 8B classifier will have been tuned on manual fallback content by then.

The integration contract above is intentionally minimal. As long as Ibis produces a .txt file in the drop folder, the integration works. Changes to that contract require coordination with the life-os project manager.

------------------------------------------------------------------------

## Summary Table

| Item | Detail |
|-------------------------------|-----------------------------------------|
| What life-os needs | A .txt file written to C:\life-os\ibis-inbox\\ |
| When | When Ibis ships; manual fallback active until then |
| Integration complexity | Minimal — one folder path configuration |
| Atomic write required | Yes — write complete before dropping to folder |
| life-os design authority over Ibis | None |
| Ibis design authority | Everything except the output folder path |
| Open question | How Ibis reaches the drop folder from non-NSF-Leith devices |
| Execution plan entry | LLC-002, active, flagged as pipeline dependency unlocker |
| Coordination trigger | Output format or naming changes after life-os Phase 1 ships |