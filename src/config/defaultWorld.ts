import { CompanyLoreConfig } from '@/types/world';

export const defaultWorldData: CompanyLoreConfig = {
    companyName: "Realm Quest",
    tagline: "An Interactive Spatial Portfolio & World Engine",
    customPitchMessage: "Welcome traveler. Explore the map nodes to discover my engineering capabilities, past shipped projects, and technical skills.",
    pins: [
        {
            id: "adventurer-node",
            title: "Martins Akeredolu",
            subtitle: "Senior Full-Stack Engineer",
            category: "hero",
            iconName: "User",
            coordinates: { x: 30, y: 40 },
            content: {
                badge: "Level 6+ Engineer",
                description: "Specialized in React, TypeScript, Vue.js, Node, and Spatial Web Architectures.",
                stats: [
                    { label: "Frontend Architecture", value: 98 },
                    { label: "Spatial / Canvas UI", value: 95 },
                    { label: "System Design", value: 92 },
                    { label: "AI-Native Speed", value: 99 }
                ],
                tags: ["React", "TypeScript", "Next.js", "Vue.js", "Cursor AI"],
                externalLink: {
                    label: "View Full Portfolio",
                    url: "https://aboutmartins.vercel.app/"
                }
            }
        },
        {
            id: "relic-3d-allocator",
            title: "3D Spatial Allocation Engine",
            subtitle: "Interactive Real Estate Canvas",
            category: "relic",
            iconName: "Boxes",
            coordinates: { x: 55, y: 35 },
            content: {
                badge: "Shipped Artifact",
                description: "Built an interactive web tool overlaying dynamic 3D/SVG shapes directly onto site plans for real-time unit allocation.",
                tags: ["SVG", "Spatial UI", "Canvas Rendering", "Complex State"],
                externalLink: {
                    label: "Portfolio Case Study",
                    url: "https://aboutmartins.vercel.app/"
                }
            }
        },
        {
            id: "quest-main",
            title: "The Guild Pitch",
            subtitle: "Why Join Forces?",
            category: "quest",
            iconName: "Scroll",
            coordinates: { x: 70, y: 65 },
            content: {
                badge: "Main Quest",
                description: "Looking to build high-polish spatial tools, lore platforms, and complex web UIs alongside world-class teams.",
                callToAction: {
                    label: "Initiate Contact",
                    actionType: "email",
                    target: "mailto:your-email@example.com"
                }
            }
        }
    ]
};
