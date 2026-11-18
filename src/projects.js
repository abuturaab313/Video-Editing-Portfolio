/**
 * PROJECT DETAIL VIEW CONTENT
 * ---------------------------
 * Keys map to the data-project attribute on each card in index.html.
 * When you replace a demo project with real work, update the copy here and
 * change its tag away from "Concept project".
 *
 * All projects below are self-initiated concept demonstrations. Keep the
 * disclosure honest if you edit it.
 */
export const projectDetails = {
  p1: {
    title: "The Cinematic Beast",
    category: "AI Video Creation",
    lead: "A concept for an ultra-realistic cinematic wildlife film — a royal, slow-burning sequence built around dramatic light, weight and presence.",
    direction: [
      "Golden-hour key light from a single warm source, deep shadow everywhere else",
      "Low camera angles and long-lens framing for scale",
      "Royal, minimal art direction — texture over decoration",
      "Sound-led pacing: silence first, then one low hit",
    ],
    scope: [
      "AI shot generation and sequence design",
      "Colour grade and film-emulation direction",
      "Letterboxed edit with sound design cues",
      "Concept poster artwork",
    ],
    disclosure:
      "Concept project. An original design demonstration — no footage was shot, licensed or delivered to a client. The visual is an illustrative mockup.",
    // Add real media when it exists; the card and panel switch automatically.
    media: {
      video: "", // e.g. "/media/p1-beast.mp4"
      poster: "",
      before: "",
      after: "",
      stills: [],
    },
  },
  p2: {
    title: "Beyond the Frame",
    category: "Short-form Video Editing",
    lead: "A vertical short-form edit concept built for the first three seconds: a hard hook, animated captions and a rhythm that never lets the thumb rest.",
    direction: [
      "A hook frame with movement and contrast in the first beat",
      "Captions inside the safe area, animating in rhythm with the cut",
      "Cut on the beat, with breathing room around the payoff",
      "Sound design that lifts ordinary clips",
    ],
    scope: [
      "Vertical 9:16 edit structure",
      "Animated caption and subtitle styling",
      "Transition and pacing direction",
      "Sound design and mix planning",
    ],
    disclosure:
      "Concept project. No client footage is shown. The visual is an illustrative mockup of a vertical edit layout, not a still from delivered work.",
    // Before/after pair drives the comparison slider in the detail panel.
    media: {
      video: "",
      poster: "",
      before: "", // e.g. "/media/p2-before.mp4"
      after: "", // e.g. "/media/p2-after.mp4"
      stills: [],
    },
  },
  p3: {
    title: "Future in Motion",
    category: "AI Promotional Content",
    lead: "A fictional product launch film: a glowing device, a slow orbit and light that behaves like it costs money.",
    direction: [
      "The product is the only hero — everything else supports it",
      "Volumetric light, rim glow and controlled lens texture",
      "Slow orbital camera moves, then quick cuts on impact",
      "UI-adjacent typography with no clutter",
    ],
    scope: [
      "AI-assisted shot concepts and look development",
      "Product reveal structure and edit rhythm",
      "Motion and transition direction",
      "Promotional copy framing",
    ],
    disclosure:
      "Concept project for a fictional product. Nothing here represents a real brand, campaign or paid commission.",
    media: {
      video: "", // e.g. "/media/p3-launch.mp4"
      poster: "",
      before: "",
      after: "",
      stills: [],
    },
  },
  p4: {
    title: "Object / 001",
    category: "3D Design",
    lead: "A quiet product-visualisation study: a fictional premium wireless device modelled as a clean, minimal object with believable materials.",
    direction: [
      "Studio lighting from one large soft source plus a rim",
      "A rounded, confident industrial silhouette",
      "Material study: anodised metal against matte polymer",
      "Negative space treated as part of the composition",
    ],
    scope: [
      "3D modelling and form exploration",
      "Material and lighting study",
      "Hero render composition",
      "Dimension callouts for a technical read",
    ],
    disclosure:
      "Concept project. The device is fictional and was created as a 3D design exercise, not a client product render.",
    media: {
      video: "",
      poster: "",
      before: "",
      after: "",
      stills: [], // [{ src: "/media/p4-render.jpg", alt: "Studio render of the device" }]
    },
  },
  p5: {
    title: "The Digital Machine",
    category: "CAD / 3D Modelling",
    lead: "A mechanical assembly presented the way engineering work should be shown: wireframe clarity, multiple views and a render that respects the geometry.",
    direction: [
      "Orthographic discipline — every line has a reason",
      "Technical typography and dimension callouts",
      "Wireframe over render, not instead of it",
      "A restrained palette so the structure reads",
    ],
    scope: [
      "Parametric 3D modelling in FreeCAD",
      "Assembly and component breakdown",
      "Technical drawing layout",
      "Presentation render and callouts",
    ],
    disclosure:
      "Concept project. The component is an original modelling exercise, not a commissioned engineering deliverable.",
    media: {
      video: "",
      poster: "",
      before: "",
      after: "",
      stills: [], // [{ src: "/media/p5-cad.jpg", alt: "CAD assembly screenshot" }]
    },
  },
  p6: {
    title: "Visual Experiments",
    category: "Creative Experiments",
    lead: "An open laboratory of AI visuals, lighting tests and cinematic compositions — the work that happens before a style is signed off.",
    direction: [
      "Deliberate colour clashes held together by grain",
      "Light as the subject: bloom, falloff, flare",
      "Frames inside frames to suggest a film strip",
      "Whatever the experiment needs, not what a template allows",
    ],
    scope: [
      "AI image and video experiments",
      "Composition and lighting studies",
      "Colour grading tests",
      "Ongoing visual research",
    ],
    disclosure:
      "Concept project. A curated set of self-initiated experiments, not delivered client work.",
    media: {
      video: "",
      poster: "",
      before: "",
      after: "",
      stills: [], // [{ src: "/media/p6-test.jpg", alt: "Lighting experiment" }]
    },
  },
};
