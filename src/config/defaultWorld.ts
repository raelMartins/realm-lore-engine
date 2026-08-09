import { CompanyLoreConfig } from "@/types/world";

/**
 * Default dual-realm world.
 * West isle (adventurer) ≈ x 15–42 · East isle (guild) ≈ x 62–85
 * Channel / visual split sits nearer ~52–55% (asymmetric landmasses).
 */
export const defaultWorldData: CompanyLoreConfig = {
  companyName: "Realm Quest",
  tagline: "An Interactive Spatial Portfolio & World Engine",
  customPitchMessage:
    "Welcome traveler. Explore the western isles to learn my craft, then cross the channel to see why I would join your guild.",
  realmLabels: {
    adventurer: "Adventurer's Reach",
    company: "Guild Shore",
  },
  targetTeamMembers: [
    {
      name: "Guild Steward",
      role: "Engineering Lead",
      note: "Override via deployment world config when customizing this realm.",
    },
    {
      name: "Product Partner",
      role: "Design / Product",
      note: "Collaborator focus for spatial UX and lore systems.",
    },
  ],
  pins: [
    // ── West isle: Adventurer ──────────────────────────────────────
    {
      id: "adventurer-node",
      title: "Martins Akeredolu",
      subtitle: "Senior Full-Stack Engineer",
      category: "character",
      realm: "adventurer",
      iconName: "User",
      avatarId: "me",
      coordinates: { x: 26, y: 42 },
      content: {
        badge: "Character",
        description:
          "Cartographer of digital interfaces. I forge React, Next.js, and Express architectures into spatial canvases, at home in the frontend mists and the deeper backend vaults.",
        stats: [
          { label: "Frontend Architecture", value: 98 },
          { label: "Backend Forging", value: 90 },
          { label: "Spatial / WebGL UIs", value: 95 },
        ],
        tags: ["React", "TypeScript", "Next.js", "Express.js"],
        callToAction: {
          label: "Offer Alliance",
          actionType: "hire",
          target: "#forge-alliance",
        },
      },
    },
    {
      id: "job-beautynbrushes",
      title: "Senior Full-Stack Architect",
      subtitle: "BeautyNBrushes Guild",
      category: "job",
      realm: "adventurer",
      iconName: "Hammer",
      coordinates: { x: 20, y: 18 },
      content: {
        badge: "Job",
        description:
          "Leading a migration from legacy shores into a modern fortress: localized payment gates and a merchant discovery atlas for wayfarers.",
        startDate: "2026-01-01",
        tasks: [
          "Architected a full-stack migration onto React, Next.js, TypeScript, and Express.",
          "Forged multi-region payment vaults bridging Stripe and Paystack for recurring tithes.",
          "Built a location-based discovery atlas for travelers and regional merchants.",
        ],
      },
    },
    {
      id: "job-myxellia",
      title: "Senior Frontend Commander",
      subtitle: "Myxellia Property Forge",
      category: "job",
      realm: "adventurer",
      iconName: "Hammer",
      coordinates: { x: 16, y: 28 },
      content: {
        badge: "Job",
        description:
          "Governed the frontend of multi-tenant estates: capital transfers at scale and interactive spatial allocation systems.",
        startDate: "2024-01-01",
        endDate: "2026-05-31",
        tasks: [
          "Engineered an interactive 3D terrain allocation engine for visual domain exploration.",
          "Built a modular theming engine so property lords could reshape their digital keeps.",
          "Led the end-to-end reconstruction of the corporate portal.",
        ],
      },
    },
    {
      id: "job-micserah-betrelate",
      title: "Frontend Scribe",
      subtitle: "Micserah Ltd / Betrelate",
      category: "job",
      realm: "adventurer",
      iconName: "Hammer",
      coordinates: { x: 34, y: 52 },
      content: {
        badge: "Job",
        description:
          "Laid the foundation of a social amphitheater for scholars and sports fans: real-time missives and dynamic scrolls.",
        startDate: "2021-12-01",
        endDate: "2024-04-30",
        tasks: [
          "Architected a real-time social platform from the ground up for 10,000+ active citizens.",
          "Optimized visual scroll rendering and cut initial load times by over 30%.",
        ],
      },
    },
    {
      id: "job-fireswitch",
      title: "Frontend Cartographer",
      subtitle: "FireSwitch Technologies",
      category: "job",
      realm: "adventurer",
      iconName: "Hammer",
      coordinates: { x: 36, y: 42 },
      content: {
        badge: "Job",
        description:
          "Redrew the primary maps for the IBErrands logistics fleet and wove a real-time channel into the parchment.",
        startDate: "2021-06-01",
        endDate: "2021-12-31",
        tasks: [
          "Redesigned the primary web application for smoother navigation.",
          "Mentored apprentices in the craft of web development.",
        ],
      },
    },
    {
      id: "job-classytouch",
      title: "Remote Full-Stack Artisan",
      subtitle: "Classy Touch Merchants",
      category: "job",
      realm: "adventurer",
      iconName: "Hammer",
      coordinates: { x: 18, y: 64 },
      content: {
        badge: "Job",
        description:
          "Built frictionless entry gates and multi-currency vaults to modernize an essential merchant realm.",
        startDate: "2019-06-01",
        endDate: "2022-03-31",
        tasks: [
          "Integrated Paystack for secure, multi-currency exchanges.",
          "Forged one-tap entry rites using Google verification seals.",
        ],
      },
    },
    {
      id: "job-solarworld",
      title: "WordPress Emissary",
      subtitle: "SolarWorld",
      category: "job",
      realm: "adventurer",
      iconName: "Hammer",
      coordinates: { x: 24, y: 72 },
      content: {
        badge: "Job",
        description:
          "Channeled the work into digital form, the bridge between the senior builder and the patrons who needed a living site.",
        startDate: "2020-09-01",
        endDate: "2020-12-31",
        tasks: [
          "Collaborated with the senior engineer to raise the primary website.",
          "Translated patron needs into clear, shippable lore for the build.",
        ],
      },
    },
    {
      id: "project-3d-allocation",
      title: "3D Domain Allocator",
      subtitle: "Veerge Engine",
      category: "project",
      realm: "adventurer",
      iconName: "Layers",
      coordinates: { x: 34, y: 22 },
      content: {
        badge: "Project",
        description:
          "An interactive spatial tool where lords and investors navigate, inspect, and claim territories inside digital 3D models.",
        tags: ["WebGL", "3D Layouts", "React"],
        externalLink: {
          label: "Inspect the Realm",
          url: "https://veerge.myxellia.io/",
        },
      },
    },
    {
      id: "project-vvd-application",
      title: "The VVD Construct",
      subtitle: "Scrollytelling Pitch",
      category: "project",
      realm: "adventurer",
      iconName: "Layers",
      coordinates: { x: 38, y: 32 },
      content: {
        badge: "Project",
        description:
          "A living application to another world-building guild: an auto-scrolling iMessage circle with the founders, pitching my craft as conversation rather than a cold scroll. Built with React, TypeScript, Framer Motion, and Cursor.",
        tags: ["React", "TypeScript", "Framer Motion", "Cursor", "Scrollytelling"],
        externalLink: {
          label: "Open the Thread",
          url: "https://martinsisperfectforvvd.vercel.app/",
        },
      },
    },
    {
      id: "project-gidi-real-estate",
      title: "Gidi Fractional Estates",
      subtitle: "Investment Forge",
      category: "project",
      realm: "adventurer",
      iconName: "Layers",
      coordinates: { x: 16, y: 48 },
      content: {
        badge: "Project",
        description:
          "A fractional investment platform where commoners and lords alike can claim a share of the realm's grandest holdings.",
        tags: ["React", "Next.js", "Fintech"],
        externalLinks: [
          {
            label: "Client portal",
            url: "https://app.gidirealestateinvestment.com/",
          },
          {
            label: "Realtor portal",
            url: "https://realtor.gidirealestateinvestment.com/",
          },
        ],
      },
    },
    {
      id: "project-draughts",
      title: "The Ultimate Draughts",
      subtitle: "Tavern Emulator",
      category: "project",
      realm: "adventurer",
      iconName: "Layers",
      coordinates: { x: 22, y: 56 },
      content: {
        badge: "Project",
        description:
          "A digital recreation of a classic tavern game from early in the journey: proof that with the right craft, anything can be built from raw code.",
        tags: ["JavaScript", "React", "Webpack"],
        externalLink: {
          label: "Play a Match",
          url: "https://ultimatedraughts.netlify.app/",
        },
      },
    },
    {
      id: "project-expert-listing",
      title: "Expert Listing Registry",
      subtitle: "Estate Ledger",
      category: "project",
      realm: "adventurer",
      iconName: "Layers",
      coordinates: { x: 32, y: 66 },
      content: {
        badge: "Project",
        description:
          "An enterprise ledger for managing the realm's grand properties and commercial estates.",
        tags: ["React", "Enterprise UI"],
        externalLink: {
          label: "View Registry",
          url: "https://expertlisting.ng",
        },
      },
    },
    {
      id: "project-myxellia-themes",
      title: "Chameleon Castles",
      subtitle: "Myxellia Theming Engine",
      category: "project",
      realm: "adventurer",
      iconName: "Layers",
      coordinates: { x: 36, y: 74 },
      content: {
        badge: "Project",
        description:
          "A modular array of architectural skins (Terracotta, Mountain Lodge, Nordic Hygge) so property lords can reshape their digital domains in a breath.",
        tags: ["Next.js", "TypeScript", "Sass"],
        externalLink: {
          label: "View Terracotta",
          url: "https://app.gidirealestateinvestment.com/",
        },
      },
    },
    {
      id: "achievement-udemy-cert",
      title: "Scroll of the Backend Arts",
      subtitle: "Arcane Certification",
      category: "achievement",
      realm: "adventurer",
      iconName: "Trophy",
      coordinates: { x: 18, y: 38 },
      content: {
        badge: "Achievement",
        description:
          "Completed the great rites of backend development, balancing frontend craft with server-side enchantments.",
        tags: ["Backend", "Node.js", "Express"],
        achievedAt: "2020-07-01",
        externalLink: {
          label: "View Scroll",
          url: "https://www.udemy.com/certificate/UC-99231148-d62f-4bba-8418-2f7586272170/",
        },
      },
    },
    {
      id: "achievement-first-fulltime",
      title: "Initiation of the Guild",
      subtitle: "First Full-Time Quest",
      category: "achievement",
      realm: "adventurer",
      iconName: "Trophy",
      coordinates: { x: 38, y: 58 },
      content: {
        badge: "Achievement",
        description:
          "Joined the ranks of professional web weavers, the true beginning of a long odyssey across digital seas.",
        tags: ["Career Milestone"],
        achievedAt: "2021-06-01",
      },
    },
    {
      id: "achievement-first-website",
      title: "The First Spark",
      subtitle: "Genesis Build",
      category: "achievement",
      realm: "adventurer",
      iconName: "Trophy",
      coordinates: { x: 28, y: 12 },
      content: {
        badge: "Achievement",
        description:
          "The moment the first lines of code were spun into a living digital tapestry.",
        tags: ["Genesis"],
        achievedAt: "2016-01-01",
      },
    },
    {
      id: "easter-egg-whispers",
      title: "Whispers in the Fog",
      subtitle: "A secret node of the realm",
      category: "easter_egg",
      realm: "adventurer",
      iconName: "Sparkles",
      coordinates: { x: 40, y: 12 },
      content: {
        badge: "Secret",
        description:
          "You found it: either by reading the wind (↑↑↓↓←→←→BA) or by noticing a faint glimmer on the northern ridge. Builders who hunt for delight tend to ship it, too.",
        tags: ["Easter Egg", "Curiosity", "Konami"],
      },
    },
    {
      id: "easter-egg-potter",
      title: "The Hidden Horcrux",
      subtitle: "Personal Secret",
      category: "easter_egg",
      realm: "adventurer",
      iconName: "Sparkles",
      coordinates: { x: 28, y: 80 },
      content: {
        badge: "Secret",
        description:
          "A quiet scholar of Hogwarts lore and collector of magical tales. You must be quite the seeker to have uncovered this fragment.",
        tags: ["Harry Potter", "Books", "Curiosity"],
      },
    },

    // ── East isle: Guild realm ─────────────────────────────────────
    {
      id: "company-crest",
      title: "Realm Quest",
      subtitle: "The Guild Across the Channel",
      category: "achievement",
      realm: "company",
      iconName: "Castle",
      coordinates: { x: 68, y: 38 },
      content: {
        badge: "Achievement",
        description:
          "Mission, product, and why this realm matters. Customize through world content config.",
        tags: ["Culture", "Mission", "Product"],
      },
    },
    {
      id: "company-lead",
      title: "Guild Steward",
      subtitle: "Engineering Lead",
      category: "character",
      realm: "company",
      iconName: "Users",
      avatarId: "viking",
      coordinates: { x: 78, y: 48 },
      content: {
        badge: "Character",
        description:
          "Guild contact node: name, role, and note come from world content config.",
        tags: ["Team", "Leadership"],
      },
    },
    {
      id: "quest-main",
      title: "The Guild Pitch",
      subtitle: "Why Join Forces?",
      category: "quest",
      realm: "company",
      iconName: "Scroll",
      coordinates: { x: 74, y: 68 },
      content: {
        badge: "Main Quest",
        description:
          "Looking to build high-polish spatial tools, lore platforms, and complex web UIs alongside world-class teams.",
        callToAction: {
          label: "Schedule a Quest Call",
          actionType: "calendar",
          target: "#schedule",
        },
      },
    },
  ],
};
