import type { TargetRole } from "@/types/career";

export const targetRoles: TargetRole[] = [
  {
    id: "software-engineer",
    title: "Software Engineer",
    category: "tech",
    description: "Builds reliable applications, services, and product features with clean code and strong engineering habits.",
    popularKeywords: ["React", "TypeScript", "APIs", "testing", "system design", "Git"],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    category: "product",
    description: "Guides product strategy, prioritizes customer problems, and aligns teams around measurable outcomes.",
    popularKeywords: ["roadmaps", "discovery", "prioritization", "metrics", "stakeholders", "experiments"],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    category: "data",
    description: "Turns data into clear insights, dashboards, and recommendations that help teams make better decisions.",
    popularKeywords: ["SQL", "dashboards", "Excel", "Python", "statistics", "storytelling"],
  },
  {
    id: "ux-designer",
    title: "UX Designer",
    category: "design",
    description: "Designs intuitive product experiences through user research, flows, prototypes, and usability testing.",
    popularKeywords: ["Figma", "wireframes", "prototyping", "user research", "journey maps", "accessibility"],
  },
  {
    id: "marketing-manager",
    title: "Marketing Manager",
    category: "marketing",
    description: "Plans campaigns, sharpens positioning, and grows demand through creative and data-informed marketing.",
    popularKeywords: ["campaigns", "SEO", "content", "analytics", "positioning", "conversion"],
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    category: "business",
    description: "Clarifies business needs, maps processes, and translates stakeholder goals into practical requirements.",
    popularKeywords: ["requirements", "process mapping", "stakeholders", "UAT", "documentation", "KPIs"],
  },
  {
    id: "cloud-engineer",
    title: "Cloud Engineer",
    category: "tech",
    description: "Designs, deploys, and operates secure cloud infrastructure for scalable production systems.",
    popularKeywords: ["Azure", "AWS", "IaC", "Kubernetes", "networking", "monitoring"],
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    category: "tech",
    description: "Improves delivery pipelines, reliability, observability, and operational practices across engineering teams.",
    popularKeywords: ["CI/CD", "Docker", "Terraform", "SRE", "observability", "automation"],
  },
];
