import { CompanyLoreConfig } from '@/types/world';

/**
 * Default dual-realm world.
 * West isle (adventurer) ≈ x 15–42 · East isle (guild) ≈ x 62–85
 * Channel / visual split sits nearer ~52–55% (asymmetric landmasses).
 */
export const defaultWorldData: CompanyLoreConfig = {
  companyName: 'Realm Quest',
  tagline: 'An Interactive Spatial Portfolio & World Engine',
  customPitchMessage:
    'Welcome traveler. Explore the western isles to learn my craft — then cross the channel to see why I would join your guild.',
  realmLabels: {
    adventurer: "Adventurer's Reach",
    company: 'Guild Shore',
  },
  targetTeamMembers: [
    {
      name: 'Guild Steward',
      role: 'Engineering Lead',
      note: 'Override via deployment world config when customizing this realm.',
    },
    {
      name: 'Product Partner',
      role: 'Design / Product',
      note: 'Collaborator focus for spatial UX and lore systems.',
    },
  ],
  pins: [
    // ── West isle: Adventurer ──────────────────────────────────────
    {
      id: 'adventurer-node',
      title: 'Martins Akeredolu',
      subtitle: 'Senior Full-Stack Engineer',
      category: 'character',
      realm: 'adventurer',
      iconName: 'User',
      avatarId: 'me',
      coordinates: { x: 22, y: 28 },
      content: {
        badge: 'Character',
        description:
          'Specialized in React, TypeScript, Vue.js, Node, and Spatial Web Architectures.',
        stats: [
          { label: 'Frontend Architecture', value: 98 },
          { label: 'Spatial / Canvas UI', value: 95 },
          { label: 'System Design', value: 92 },
          { label: 'AI-Native Speed', value: 99 },
        ],
        tags: ['React', 'TypeScript', 'Next.js', 'Vue.js', 'Cursor AI'],
        externalLink: {
          label: 'View Full Portfolio',
          url: 'https://aboutmartins.vercel.app/',
        },
        callToAction: {
          label: 'Offer Alliance',
          actionType: 'hire',
          target: '#forge-alliance',
        },
      },
    },
    {
      id: 'relic-3d-allocator',
      title: '3D Spatial Allocation Engine',
      subtitle: 'Interactive Real Estate Canvas',
      category: 'project',
      realm: 'adventurer',
      iconName: 'Boxes',
      coordinates: { x: 28, y: 48 },
      content: {
        badge: 'Project',
        description:
          'Built an interactive web tool overlaying dynamic 3D/SVG shapes directly onto site plans for real-time unit allocation.',
        tags: ['SVG', 'Spatial UI', 'Canvas Rendering', 'Complex State'],
        externalLink: {
          label: 'Portfolio Case Study',
          url: 'https://aboutmartins.vercel.app/',
        },
      },
    },
    {
      id: 'sanctuary-craft',
      title: 'Craft Sanctuary',
      subtitle: 'Stack & Working Style',
      category: 'achievement',
      realm: 'adventurer',
      iconName: 'Sparkles',
      coordinates: { x: 24, y: 68 },
      content: {
        badge: 'Achievement',
        description:
          'AI-native delivery, design-system thinking, and high-polish UI under real product constraints.',
        tags: ['Design Systems', 'Performance', 'DX', 'Accessibility'],
      },
    },

    // ── East isle: Guild realm ─────────────────────────────────────
    {
      id: 'company-crest',
      title: 'Realm Quest',
      subtitle: 'The Guild Across the Channel',
      category: 'achievement',
      realm: 'company',
      iconName: 'Castle',
      coordinates: { x: 68, y: 38 },
      content: {
        badge: 'Achievement',
        description:
          'Mission, product, and why this realm matters — customize through world content config.',
        tags: ['Culture', 'Mission', 'Product'],
      },
    },
    {
      id: 'company-lead',
      title: 'Guild Steward',
      subtitle: 'Engineering Lead',
      category: 'character',
      realm: 'company',
      iconName: 'Users',
      avatarId: 'viking',
      coordinates: { x: 78, y: 48 },
      content: {
        badge: 'Character',
        description:
          'Guild contact node — name, role, and note come from world content config.',
        tags: ['Team', 'Leadership'],
      },
    },
    {
      id: 'quest-main',
      title: 'The Guild Pitch',
      subtitle: 'Why Join Forces?',
      category: 'quest',
      realm: 'company',
      iconName: 'Scroll',
      coordinates: { x: 74, y: 68 },
      content: {
        badge: 'Main Quest',
        description:
          'Looking to build high-polish spatial tools, lore platforms, and complex web UIs alongside world-class teams.',
        callToAction: {
          label: 'Schedule a Quest Call',
          actionType: 'calendar',
          target: '#schedule',
        },
      },
    },
  ],
};
