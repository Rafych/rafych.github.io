---
title: "The Trade-Off Between Compression Ratio and Compute Cost."
date: 2026-08-05 22:28 +0300
lang: en
---
# Why "Smaller Files" Isn't Always the Win You Think It Is

I was trying to build my own compression format a while back, mostly out of curiosity about how far I could push the ratio. It didn't take long to run into the obvious wall, but actually measuring it changed how I think about the problem.

Most people assume smaller output means a better compressor. That's true often enough that nobody questions it — until you look at the cost side.

## PAQ vs 7-Zip, actual numbers

PAQ-family compressors show up constantly in compression forums as the thing that beats everything else. It usually does, especially on text. What doesn't get mentioned as often is what it costs to get there.

I ran 7-Zip (`7z a -mx9`, LZMA2) against zpaq (`zpaq a -method 5`) on a 7.7 MB corpus of concatenated Python source files, single-core Xeon VM:

| | Compress time | Decompress time | Output size |
|---|---|---|---|
| 7-Zip (LZMA2) | 4.2 s | 0.12 s | 1,476,806 bytes |
| zpaq (PAQ-family) | 21.6 s | 20.8 s | 1,115,281 bytes |

zpaq took about 5x longer to compress, for roughly 24% smaller output. That part's a known trade-off. The part that actually surprised me was decompression: zpaq took 20.8 seconds to unpack, versus 0.12 seconds for 7-Zip — about 170x. ZIP and LZMA are asymmetric on purpose, fast to unpack even when slow to pack. PAQ's context-mixing doesn't give you that; you pay roughly the same tax going both directions, every time you touch the file.

Memory followed the same pattern — 7-Zip peaked around 91 MB, zpaq around 205 MB. More modeling means more state to keep around, which is more or less what you'd expect once you know how it works.

## Why, mechanically

Compression is pattern-matching — find the redundancy, represent it more compactly. Better pattern detection needs more computation, full stop. That's not a deep insight, it's just what "better modeling" costs in practice. More ratio tends to cost more CPU. More speed tends to cost some ratio.

## But not always

This is where it gets less clean than a simple rule. Zstandard is faster than zlib *and* usually matches or beats it on ratio — that's not some trick, it's just a better algorithm shifting where the trade-off curve sits. So "you always trade speed for ratio" isn't quite right. It's "the trade-off exists for a given algorithm," and better engineering can move the whole curve. Those are different claims, and conflating them is how you end up overconfident in either direction.

## Picking one

In practice I use something like this:

- Archival, written once and read rarely — PAQ-tier is fine. Just remember decompression costs the same as compression, so budget for that too, not just the initial squeeze.
- Anything over a network or in a hot path — speed wins, no contest. Nobody's waiting 90 seconds for a chat message to compress.
- Embedded — you don't really have a choice here, the constraints pick the algorithm for you.

I spent a while wanting a format that maxed out both ratio and speed at once, which is not really a coincidence so much as it is how tradeoffs work. Once I stopped optimizing for "best" and started optimizing for "right for this specific case," the decisions got a lot easier to justify to other people too — "best" doesn't hold up under questioning, but "here's what we're optimizing for and why" does.

---
*Benchmark environment: single-core Intel Xeon @ 2.80GHz, 3.9 GB RAM, Ubuntu. Test corpus: 8,046,587 bytes of concatenated Python source files. Tools: 7-Zip 23.01 (`-mx9`), zpaq 7.15 (`-method 5`). Numbers will shift with data type, core count, and settings.*
