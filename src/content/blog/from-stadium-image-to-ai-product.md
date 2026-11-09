---
title: "From a stadium image to a working AI product"
description: "What building Seatview is teaching me about creative AI, agent workflows, spatial experiments, and the engineering that makes them useful."
date: "2026-11-09"
category: "Creative AI / Engineering"
draft: false
image: "/blog-assets/seatview-workflow.png"
imageAlt: "Conceptual illustration showing source evidence, AI generation, independent review, and an operator decision. No production data is shown."
---

A stadium image can look incredible and still fail at its job.

The lighting might be convincing. The crowd might feel alive. The stage might look ready for the biggest show of the year. But if the camera has moved, a railing has disappeared, or the stage is at the wrong end of the venue, the image no longer represents the view we started with.

That tension is at the center of a lot of my work at Gametime.

There is also a coverage problem behind it. A marketplace can have tickets available for an event while still lacking useful imagery for the sections people are considering. Every new event and layout can create more work. Filling those gaps one photo at a time does not scale with a changing catalog.

I’m building Seatview, experimenting with generative media and spatial AI, integrating OpenAI’s managed agent infrastructure and Codex App Server, and creating tools that let other people use those capabilities in their work.

These projects keep bringing me back to the same question: **how do you turn an emerging AI capability into something useful enough for another person to rely on?**

The answer involves creative experimentation, software engineering, and a surprising amount of work on what happens after the model responds.

## The creative problem inside Seatview

Seatview starts with a practical need: help people understand a venue from a particular section or seat.

The available imagery doesn’t always match the event. A useful source might show a basketball game when we need a concert configuration. Another might come from an empty virtual venue. Sometimes there are plenty of photos, but very few that establish the right camera position.

Generative imaging opens up interesting possibilities here. I can experiment with transforming an existing view into a different event atmosphere, adding temporary event elements, or improving the photographic appearance of a rendered environment.

But each transformation needs a clear idea of what can change.

The original source establishes the camera and permanent structure. The event map describes the stage and floor configuration. An appearance reference can guide lighting, materials, or atmosphere.

Those inputs have different responsibilities. If a reference image quietly becomes the authority for camera placement, a visually successful edit can become an inaccurate seat view.

A lot of the creative work is in expressing those relationships clearly enough that the model can produce a useful result, then building checks for when it doesn’t.

I spend time looking at the actual images: whether people feel photographic, whether a stage fits the room, whether a transformation preserves the sense of height and distance, and whether an obstruction that matters to the viewer is still there.

The prompt is one part of that work. Source selection, masking, reference design, and evaluation matter just as much.

## From new events to photos ready for review

The larger opportunity is to make photo coverage a continuous workflow.

The automation I’m building starts with the event catalog. Gametime’s existing sync pipeline brings in events and connects them to their seating configurations. Seatview checks that information against the photo library to identify where useful coverage is missing.

That gives the system a recurring operating cycle:

1. **Notice relevant events and inventory changes** through the synced catalog.
2. **Find the actual coverage gaps** in the matching venue and seating configuration.
3. **Prioritize the work** using business context, including realized transaction GMV.
4. **Find and assess suitable source imagery**, preserving the relationship between the source camera and event layout.
5. **Generate missing views and check the results**, keeping passing candidates and surfacing failures for attention.
6. **Bring prepared photos to an operator** for review and an explicit publication decision.

When Autopilot is enabled, eligible preparation and generation can run in the background. The browser does not need to stay open. If several event dates use the same seating configuration, they can share a photo set instead of buying the same work repeatedly.

This changes the shape of the problem. Someone no longer has to discover every gap, assemble every input, and babysit every generation request. The system can bring them prepared work and specific exceptions that need judgment.

Publication remains an explicit decision. I’m continuing to validate quality and operating cost as I expand the automation.

The goal is a coverage engine that keeps pace with the marketplace: new events become visible, missing imagery becomes actionable, and useful photos move toward the buying experience through a repeatable process.

## Making a look work across an entire venue

One convincing image is a useful experiment. A consistent collection of views is a different challenge.

If every section develops its own lighting, crowd treatment, or material appearance, the venue starts to feel like several unrelated places.

In the panorama batch workflow, the first accepted edit establishes an appearance reference. That image and its description are frozen together. Subsequent edits use their own original camera views while drawing on the same visual treatment.

Keeping the reference fixed matters. Otherwise, small differences can accumulate as each new result influences the next.

Panoramas introduce another set of problems. A change that looks reasonable in a flat preview can break when someone turns around inside the 360-degree view. Seams become visible. People get clipped. Structural features shift.

One approach I’ve implemented projects an original panorama into six perspective faces, applies edits within selected regions, and assembles the result back into a sphere. The application restores original pixels outside the edit regions.

That gives the workflow a concrete preservation mechanism. It also creates new creative and technical questions: how conservative should the masks be? What happens to a person at the edge of a mask? How do we keep the atmosphere consistent across faces?

Live tests have surfaced incomplete crowd coverage and compositing artifacts even when the viewpoint held up. Those failures tell me which part of the process needs attention.

## The stack behind the experience

Seatview brings together a web application, image-processing workflows, model integrations, a data layer, and background workers. Each part solves a different problem.

| Technology | What I use it for |
| --- | --- |
| **Next.js, React, and TypeScript** | The operator workspace, server routes, photo libraries, comparisons, and the interactions that connect a user action to saved work. |
| **Tailwind CSS and Radix UI** | Consistent interface styling and interaction primitives for dialogs, selection, settings, and review. |
| **PostgreSQL and Drizzle** | Application records for venues, configurations, photos, and jobs, with explicit relationships between the evidence and the work it belongs to. |
| **Zod** | Runtime validation of structured data at application boundaries. |
| **Temporal** | Long-running generation, classification, synchronization, and publication workflows that need to outlive a browser session or worker restart. |
| **Python and cloud GPUs** | Image-processing and batch-generation work, including the Python pipeline I built for Seatview. The web application and orchestration use TypeScript. |
| **Sharp and FFmpeg** | Image processing and panorama preparation, including projection, compositing, and assembling perspective faces into a 360-degree output. |
| **OpenAI, Gemini, and Anthropic integrations** | Generation, visual analysis, classification, and review across different workflows. |
| **OpenAI Agents API and Codex App Server** | Managed-session and application-driven agent integrations for tasks that benefit from inspecting evidence and interacting with a controlled tool. |
| **Snowflake** | Coverage and business context that help identify relevant gaps and prioritize work. |
| **AWS S3 and CloudFront** | Image storage and delivery, connecting generated artifacts with the places people need to view them. |
| **Docker, AWS ECS, and Terraform** | Packaging the application and workers, running services, and describing infrastructure as code. |
| **Braintrust** | Generation logging that supports inspection of model behavior. |

The interesting part is how these pieces work together.

A button in Next.js can start work that takes much longer than an HTTP request should remain open. Temporal coordinates that work. PostgreSQL preserves application state. A worker interacts with a model or processes an image. Storage holds the resulting artifact. The interface retrieves saved progress so someone can return later and understand what happened.

That separation lets me work on a creative experience without tying its entire lifecycle to one browser tab.

## Giving agents a specific job

Some image tasks benefit from an agent being able to inspect a source, request an edit, examine the result, and adjust its instructions.

I’ve built integrations with OpenAI’s managed Agents API to explore that workflow. The service provides a managed agent harness, including sessions and orchestration, while the application supplies its tools and chooses the execution environment. [OpenAI Agents API documentation](https://developers.openai.com/api/docs/guides/agents-api/overview)

Inside Seatview, the interesting design decision is how narrowly to define the agent’s job.

An editing agent can request an image through an application-owned tool. The application binds that request to the original source and the relevant configuration. The agent doesn’t get to substitute another section’s image or decide that a result should be published.

The application saves the rendered candidate and sends the actual pixels through a separate visual assessment. Findings can guide a corrective attempt within a limited render allowance.

The reviewer needs to inspect what was actually produced. The editing agent’s description of its own work doesn’t establish that the image is correct.

## Bringing Codex into the application

I’ve also integrated **Codex App Server** into Seatview’s image workflows.

App Server exposes the Codex agent runtime through a protocol an application can drive, with threads, turns, tool interactions, and streamed events. [Codex App Server documentation](https://learn.chatgpt.com/docs/app-server)

That lets me explore Codex as part of a product’s execution layer.

In this implementation, Seatview starts an isolated Codex process for a job and exposes a tightly scoped editing tool. Codex can inspect the visual evidence and direct an edit; Seatview performs the image request, stores the artifact, and controls what happens next.

The review runs separately.

This has also led to work on feedback and follow-up. When a panorama fails, an operator should be able to inspect the attempt, understand the findings, and discuss a useful next test. A follow-up conversation can explain the saved result without silently starting another paid image operation.

Someone can investigate a problem before deciding to spend money on another attempt.

I’m also testing where an agent loop earns its complexity. Some workflows benefit from iterative judgment. Others are clearer as explicit application steps with a bounded visual check.

Working across these approaches helps me choose the execution model for the task.

## The failures around the model call

The most expensive bugs often live around the generation request.

Suppose an image provider accepts a request, but the connection fails before the application receives the result. Starting the whole operation again could buy a second image.

Or suppose someone cancels a job while generation is still running. A late response should not overwrite their decision.

Or an operator approves an image, and the underlying layout changes before publication. That approval needs to remain attached to what they actually reviewed.

These are ordinary distributed-systems problems made more visible by expensive, variable outputs.

I’m addressing them with durable workflows, saved execution state, limited attempts, cancellation handling, and checks on whether a result is still current before it can be saved.

Temporal gives me durable orchestration, but the application still has to decide which operations are safe to retry. A recovery mechanism that blindly repeats a paid image request can make the problem worse.

Cost controls need the same care. A cost display tells someone what happened. Preventing several workers from spending the same remaining allowance requires shared reservations before the requests begin.

I also preserve failed attempts and incomplete usage records. Missing cost information should remain visible as missing information. A restart should retain the evidence needed to understand what happened.

This work makes experimentation easier to operate. I can inspect a failure, recover the appropriate step, and avoid accidentally repeating an expensive operation.

## Building tools other people can use

Creative Hub is another part of the same effort.

It gives content teams access to sourcing, generating, and publishing photos through an application. That means turning an engineering workflow into a sequence someone else can understand.

The interface needs to answer practical questions:

- Which source is this result based on?
- What did the system change?
- Why did review reject it?
- Is the job still running?
- Will this action generate another image?
- What exactly will be published?

I’ve built comparison and review flows, saved attempts, progress views, and explicit publication steps around those questions.

A generated asset becomes useful when people can find it, inspect it, make a decision, and get it into the right place.

Teaching informs this part of my work. At Pluralsight, I built AI prototypes, explored video models, and created hands-on learning experiences. That experience carries directly into product design. If I can’t explain what a control does or what a result means, the interface probably needs more work.

## Connecting the coverage gap to GMV

There are always more images to generate and more models to try.

I’ve built a Snowflake-backed coverage agent to connect photo gaps with upcoming events and realized transaction GMV. GMV is the gross value of ticket transactions, distinct from company revenue. It gives the queue a business signal for deciding where to focus attention.

A missing photo for inventory associated with substantial transaction activity deserves a different priority from a gap with little activity. Seatview connects that context to the exact configuration and missing sections so the next generation job has a reason to exist.

The chain is straightforward: understand where transaction activity is concentrated, identify the relevant coverage gaps, prepare useful imagery, and make it easier for a buyer to understand what they are considering.

That is why the gap matters. Missing imagery leaves an important buying question unanswered: what will this experience look like from here? The opportunity is to address that uncertainty across more of the catalog, with a workflow whose cost and quality can be inspected.

It also forces clearer measurement.

Coverage, visual quality, operating cost, and commercial impact are different outcomes. Improving one doesn’t automatically prove the others. An event’s GMV helps establish priority; conversion or revenue uplift still needs its own measurement.

I want the experiments to answer specific questions: can we create a useful view? How often does it pass review? What does an accepted image cost? How much operator effort does it require?

Those answers help determine what deserves further investment.

## Exploring what comes after individual images

Alongside the image workflows, I’m experimenting with World Labs Atlas and spatial representations of stadiums.

The question is whether a venue could become a coherent environment that supports exploration from different viewpoints.

Stadiums are demanding subjects. They contain repeating seats, thin roof structures, large open spaces, and obstructions whose position matters. A convincing render from one camera doesn’t establish that the space will remain coherent when the camera moves.

I’m exploring camera-based outputs, depth-guided generation, and the relationship between appearance and underlying structure. I’m evaluating visual quality, geometric consistency, and navigability separately.

That work is still exploratory. It gives me a place to test what spatial AI can contribute and where its uncertainty becomes a product constraint.

Across all of these projects, I enjoy moving between the creative possibility and the implementation detail.

I can spend part of a day experimenting with the atmosphere of a stadium image, then work on the mechanism that prevents a cancelled job from saving a late result. Both contribute to the same experience.

I want to build tools that let people do something they couldn’t do before, with enough visibility and control to use those tools with confidence.
