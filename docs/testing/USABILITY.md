# Worker usability test

Plan and script for testing the worker app with real technicians who have limited reading ability and little smartphone experience (PRD §16, goal G7).

## Goal

**At least 4 of 5 workers complete "accept and finish a job" without help.** We also want to learn where people hesitate, so we can fix the screens.

## Participants

- 5 working technicians (e.g. AC, electrical, plumbing), recruited through local shops or contacts.
- Mix of ages; at least 2 who rarely use apps beyond calls and WhatsApp.
- None of the project team.
- Small thank-you (e.g. mobile recharge).

## Setup

- An Android phone with SkillPass added to the home screen, Bengali voice (Google TTS) installed, volume on.
- Staging site with demo data (`seed_demo`). A test account per participant with a temporary PIN.
- One **moderator** (talks) and one **note-taker** (writes, times). Sessions ~30 minutes, in a quiet place.
- Ask permission before taking notes or recording the screen. Do not record faces.

## Tasks

Give each task out loud in Bengali. Do not show where to press. If the person is stuck for 2 minutes, count it as "needed help", help, and move on.

| # | Task (say this) | Success when |
|---|---|---|
| T1 | "এই পিন দিয়ে ঢুকুন, তারপর নিজের নতুন পিন দিন।" (Sign in with this PIN, then set your own.) | Reaches home with a new PIN |
| T2 | "আপনি এখন কাজ নিতে পারবেন — সেটা অ্যাপে জানান।" (Show you are available.) | Availability switch on |
| T3 | *(Moderator books a job from a second phone.)* "নতুন কাজ এলে সেটা নিন।" (Take the new job.) | Job accepted |
| T4 | "গ্রাহককে কল করুন।" (Call the customer.) | Call screen opens |
| T5 | "কাজে যাচ্ছেন, কাজ শুরু করলেন, কাজ শেষ — অ্যাপে দেখান।" (On the way, start, finish.) | Status reaches "waiting for confirmation" |
| T6 | "সমস্যা হলে সাহায্য কোথায় পাবেন?" (Where do you get help?) | Opens Help and finds Call support |
| T7 | "আপনার এনআইডির ছবি পাঠান।" (Send your NID photo.) | Verification sent |

**Main goal = T3 + T5 both done without help.**

## What to measure

For each task: success (yes / with help / no), time, wrong taps, and quotes. After the tasks, ask:

1. কোন জায়গাটা কঠিন লাগল? (What was hard?)
2. 🔊 বোতাম কাজে লেগেছে? (Was the speaker button useful?)
3. বন্ধুকে এই অ্যাপ ব্যবহার করতে বলবেন? কেন? (Would you tell a friend? Why?)
4. ১ থেকে ৫ — কাজ নেওয়া কতটা সহজ ছিল? (1–5, how easy was taking a job?)

## Results

| Participant | Trade | T1 | T2 | T3 | T4 | T5 | T6 | T7 | Ease (1–5) | Main problem |
|---|---|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | | | |
| P2 | | | | | | | | | | |
| P3 | | | | | | | | | | |
| P4 | | | | | | | | | | |
| P5 | | | | | | | | | | |

**Goal met?** ___ of 5 completed T3 + T5 without help.

## After the sessions

- List every problem seen by 2 or more people; rank by how many tasks it blocked.
- Turn each into a GitHub issue labelled `usability`, with the participant quotes.
- Fix blockers, then re-test those tasks with at least 2 new people.
