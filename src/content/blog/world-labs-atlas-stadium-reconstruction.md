---
title: "Reconstructing stadiums with World Labs Atlas"
description: "Inside my Gametime experiments with lifelike stadium environments: camera geometry, depth-guided generation, and the gap between an impressive render and a trustworthy 3D experience."
date: "2026-11-04"
category: "Spatial AI / R&D"
draft: false
image: "/blog-assets/hard-rock-stadium-atlas-chisel.png"
imageAlt: "Danny’s Hard Rock Stadium experiment in World Labs Chisel, showing the lower bowl, roof structure, field, camera timeline, and render outputs."
imageCaption: "Hard Rock Stadium in my Chisel workspace. Working with an imported stadium scene, daylight appearance, and camera-based outputs. Click to inspect the original screenshot."
---

At Gametime, I’m experimenting with **World Labs’ Atlas model to create lifelike 3D stadium environments**. The question driving the work is practical: can spatial AI help us move from isolated venue images toward a coherent representation that can support exploration from different viewpoints?

A stadium is an unusually demanding test. It combines large open space, repeating seating sections, thin roof structures, suspended scoreboards, and sightlines that matter to a ticket buyer. A result can look convincing while getting the important geometry wrong.

My Hard Rock Stadium experiment is a way to investigate that gap. I’m working in Chisel with an imported stadium scene, exploring visual treatment and camera-based outputs while preserving the existing structure. The screenshot above shows that work in progress.

**I’m evaluating three things separately: visual quality, geometric consistency, and actual navigability.** Each needs its own evidence.

## Why Atlas is interesting for this problem

World Labs introduced Atlas on September 1, 2026. Its announcement describes a multimodal autoregressive diffusion transformer operating across text, imagery, video, and 3D information, with a shared spatial context. The capability that interests me is conditioning new views on explicit camera information and existing scene evidence. [World Labs’ Atlas announcement](https://www.worldlabs.ai/blog/atlas)

For a stadium, the product opportunity is larger than generating another attractive picture. If a useful scene can support multiple views, it could become a reusable basis for venue exploration and visual content. That is the product hypothesis behind this experiment.

The hard question is whether a new view preserves the relationships a customer cares about: which roof beam crosses the sightline, where a railing begins, how high the camera sits above the field, and what a scoreboard actually obscures.

## Start by separating the representations

There are several different artifacts in this workflow, and I want to be precise about each one.

| Artifact | What it can establish | What still needs verification |
| --- | --- | --- |
| Rendered image | Appearance from one specified view | Agreement with the source and other viewpoints |
| RGBD frame | Color and an associated depth estimate | Camera alignment, scale, confidence, missing geometry |
| Point cloud | Explicit spatial samples | Coverage, alignment, surfaces, and artifacts |
| Gaussian splat scene | A renderable spatial representation | Actual loading, camera movement, visual consistency, performance |
| Triangle mesh | Explicit surfaces useful to downstream tools | Topology, holes, scale, obstructions, and export integrity |

Atlas’s published demonstrations include explicit point-cloud and Gaussian-splat outputs. My session needs artifact-level checks to establish which of those outputs it has actually produced. [Atlas’s reconstruction demonstrations](https://www.worldlabs.ai/blog/atlas#spatial-reconstruction)

In the screenshot, Chisel shows rendered outputs alongside a Splat control. **A control in an editor is not a validation result.** I still need the actual artifact, its terminal operation status, and a successful inspection in a viewer before calling that step complete.

## The data contract is spatial, not just visual

A flat image workflow can pass around URLs. A spatial workflow needs a stronger contract.

World Labs’ workflow uses posed RGBD views: an image paired with camera information and depth. The documentation recommends keeping those outputs together, including confidence where available. New views can become context for later requests, so a mistake carried forward can affect subsequent generation. [How to use Atlas](https://docs.atlas-beta.worldlabs.ai/how-to-use-atlas)

For this experiment, the boundary I want is an inspectable frame record. Here is an **illustrative evaluation schema** for that record:

```typescript
type StadiumFrame = {
  id: string;
  provenance: 'captured' | 'imported-render' | 'generated';
  imageAssetId: string;
  depthAssetId?: string;
  confidenceAssetId?: string;
  camera: {
    intrinsics: {
      width: number; height: number;
      fx: number; fy: number;
      cx: number; cy: number;
    };
    cameraToWorld: number[];
    coordinateSystem: 'rub' | 'rdf';
  };
  operationId?: string;
  review: 'unreviewed' | 'accepted' | 'rejected';
};
```

The most important field may be `provenance`. A captured observation, a render of imported geometry, and a model-generated view are different kinds of evidence. I do not want generated content to silently become ground truth simply because it looks realistic.

## Camera calibration is where the experiment becomes engineering

The camera needs both intrinsics and a pose. Intrinsics define the image grid and projection; the pose places that camera in the shared scene.

World Labs documents camera-to-world poses, XYZW quaternions, and explicit RUB or RDF camera conventions. A world-to-camera matrix needs inversion; changing only a convention label does not convert the orientation. Resizing or cropping pixels also requires matching changes to the intrinsics. [Cameras and posed images](https://docs.atlas-beta.worldlabs.ai/cameras-and-posed-images)

This matters because a small angular error becomes a large visible displacement at stadium scale. For a simplified illustration, a one-degree error across a 100-meter sightline produces roughly `100 × tan(1°) ≈ 1.75 meters` of lateral displacement. Those are illustrative dimensions, not measurements from this venue.

A near-perfect material treatment cannot compensate for that kind of spatial error. A roof support that shifts relative to the field changes the view being represented.

My evaluation therefore needs landmarks and camera checks alongside visual review. I would compare roof intersections, deck boundaries, scoreboards, and field markings across views, then inspect whether those relationships remain stable when the camera translates.

## Use geometry to constrain appearance

Chisel is useful to this exploration because existing structure and generated appearance can play different roles.

The documented `atlasChisel` task accepts depth context and target cameras, with optional posed source photographs. A blockout supplies geometric layout; prompts describe intended materials and lighting. The current guide requires aligned 1280 × 720 context depth and target camera grids, and identifies that depth as planar distance along the optical axis rather than distance along a pixel ray. [Depth-guided generation](https://docs.atlas-beta.worldlabs.ai/depth-guided-generation)

That suggests an important discipline for stadium work: hold the geometry and cameras steady while evaluating appearance. If I change structural inputs and lighting at the same time, it becomes much harder to explain why a result improved or regressed.

In this session, I’m treating the imported stadium’s form as a preservation constraint while exploring a daylight look. Existing overlaps or roof separation should be documented rather than casually “fixed” by a generative pass whose job is appearance.

The next useful comparison is controlled: same structure, same camera set, one changed appearance instruction, and a side-by-side review of the outputs.

## Reconstruction needs evidence from more than one direction

Sparse input is attractive operationally, but a stadium’s repeated patterns make ambiguity easy to miss. Two seating areas can share colors and shapes while occupying different positions in the bowl.

For unposed source images, the documented `images2PosedRGBD` task estimates cameras and depth. Its guidance calls for sharp, overlapping views of the same mostly static scene. For multi-view comparisons, optional pose refinement can be requested, and its acceptance is reported separately. [Images to posed RGBD](https://docs.atlas-beta.worldlabs.ai/images-to-posed-images)

The capture strategy I want to test prioritizes coverage of meaningful structure, not simply frame count. I would choose views that reveal the relationship between the field, seating tiers, roof, and obstructions, then reserve some real observations for evaluation rather than feeding every available image into generation.

A model’s ability to fill unseen space is useful for exploration. It is also exactly why unseen geometry needs an uncertainty label when the application concerns a real location.

## A splat export is another stage, not the finish line

The documented `posedImages2Splats` task reconstructs and refines Gaussian splats from posed RGBD inputs and produces an SPZ asset. Its guide explicitly warns that refinement does not guarantee correction of inconsistent depth or conflicting object placement. `splats2Mesh` provides a separate mesh-extraction path. [Posed images to splats](https://docs.atlas-beta.worldlabs.ai/posed-images-to-splats), [mesh extraction reference](https://docs.atlas-beta.worldlabs.ai/api-reference/splats2-mesh)

For my experiment, I would verify the artifact in four steps:

1. **Completion:** inspect the operation result and confirm that the expected asset exists.
2. **Loading:** open the actual exported file in the intended viewer rather than inferring success from a thumbnail.
3. **Movement:** test translation and rotation through defined camera positions, watching for floating fragments, holes, and collapsing structure.
4. **Usefulness:** check whether the result supports the specific venue-exploration task, within an acceptable performance and quality envelope.

A compelling flythrough is a useful demonstration. A robust camera path through a verified asset is a different deliverable.

## The evaluation plan I want before productizing this

I’m thinking about this as a potential system, so the evaluation needs to connect spatial quality with operational cost.

| Dimension | What I would test |
| --- | --- |
| Viewpoint fidelity | Camera orientation, elevation, and field of view against known inputs |
| Structural consistency | Rooflines, deck edges, scoreboards, railings, and important obstructions across views |
| Novel-view behavior | Held-out observations and controlled movement beyond the original cameras |
| Appearance | Lighting consistency, texture stability, and recognizable venue details |
| Asset quality | Actual export loading, holes, floaters, and usable navigation boundaries |
| Delivery economics | Total experiment cost, failed operations, latency, artifact size, and viewer performance |
| Provenance | Which regions and views are observed, imported, or inferred |

Before productizing this, I would measure accuracy, unit economics, and operational behavior across a representative set of venues and viewing conditions.

I would also preserve operation IDs and inputs, validate each intermediate artifact, and resume an existing long-running task rather than starting another expensive operation just because a local wait ended. Reproducibility matters when the failure may sit in capture, camera conventions, depth, generation, reconstruction, or rendering.

## Why I’m doing this at Gametime

My work connects hands-on AI experimentation with business priorities and company-wide guidance. I build systems, test emerging capabilities, and teach what I learn along the way.

This experiment fits that role: identify a capability that could change how we create and explore venue content, get close enough to understand its actual constraints, and build the evidence needed to decide whether it deserves more investment.

**The opportunity is a reusable spatial foundation for stadium content.** My job at this stage is to find out how much of that foundation is faithful, what it costs to produce, where it breaks, and what a team would need to operate it responsibly.

That is the part of frontier AI work I find most compelling: moving from an impressive model demonstration to an engineering question with a testable answer.
