import { PrismaClient, Role, ArticleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const categories = [
  { name: "U.S. News", slug: "us-news", color: "#C8102E", sortOrder: 1 },
  { name: "True Crime", slug: "true-crime", color: "#1F2937", sortOrder: 2 },
  { name: "Weird News", slug: "weird-news", color: "#7C3AED", sortOrder: 3 },
  { name: "Technology", slug: "technology", color: "#0E7490", sortOrder: 4 },
  { name: "Culture", slug: "culture", color: "#B45309", sortOrder: 5 },
];

async function main() {
  const password = await bcrypt.hash("ChangeMe123!", 12);

  const [admin, editor, journalist] = await Promise.all([
    db.user.upsert({
      where: { email: "admin@thepulse.news" },
      update: {},
      create: { email: "admin@thepulse.news", name: "Site Admin", role: Role.ADMIN, passwordHash: password },
    }),
    db.user.upsert({
      where: { email: "editor@thepulse.news" },
      update: {},
      create: { email: "editor@thepulse.news", name: "Erin Editor", role: Role.EDITOR, passwordHash: password },
    }),
    db.user.upsert({
      where: { email: "reporter@thepulse.news" },
      update: {},
      create: { email: "reporter@thepulse.news", name: "Jamie Reporter", role: Role.JOURNALIST, passwordHash: password },
    }),
  ]);

  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  const cats = await db.category.findMany();
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  const tagNames = ["viral", "investigation", "breaking", "courts", "internet"];
  for (const name of tagNames) {
    await db.tag.upsert({ where: { slug: name }, update: {}, create: { name, slug: name } });
  }
  const tags = await db.tag.findMany();

  const samples = [
    {
      title: "Small Town Erupts After Mayor Declares Every Friday 'Casserole Day'",
      slug: "small-town-casserole-day",
      category: "weird-news",
      isFeatured: true,
      isTrending: true,
    },
    {
      title: "Cold Case Reopened: New DNA Evidence in 1998 Lakeside Disappearance",
      slug: "cold-case-lakeside-dna",
      category: "true-crime",
      isFeatured: true,
      isBreaking: true,
    },
    {
      title: "Federal Court Ruling Reshapes How States Handle Highway Tolls",
      slug: "federal-court-highway-tolls",
      category: "us-news",
      isTrending: true,
    },
    {
      title: "AI Startup's Office Dog Accidentally Approves $2M Budget",
      slug: "office-dog-approves-budget",
      category: "technology",
    },
    {
      title: "The Quiet Comeback of the American Drive-In Theater",
      slug: "drive-in-theater-comeback",
      category: "culture",
      isFeatured: true,
    },
  ];

  for (const [i, s] of samples.entries()) {
    const article = await db.article.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        title: s.title,
        slug: s.slug,
        excerpt: `${s.title}. Full reporting from The Pulse newsroom with sources, context, and what happens next.`,
        content: `<h2>What happened</h2><p>${s.title}. This is seeded demo copy. Replace it with real reporting from the editor.</p><h2>Why it matters</h2><p>Context paragraph explaining the stakes for readers across the U.S.</p><blockquote><p>"We've never seen anything quite like it," a local official said.</p></blockquote><p>More details to follow as the story develops.</p>`,
        coverImage: `https://images.unsplash.com/photo-150472460${i}438-462999088660?w=1600&q=80`,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - i * 36e5 * 6),
        isFeatured: s.isFeatured ?? false,
        isBreaking: s.isBreaking ?? false,
        isTrending: s.isTrending ?? false,
        viewCount: Math.floor(Math.random() * 5000) + 200,
        readMinutes: 4,
        authorId: i % 2 === 0 ? journalist.id : editor.id,
        categoryId: catId(s.category),
      },
    });
    await db.articleTag.createMany({
      data: tags.slice(0, 2 + (i % 3)).map((t) => ({ articleId: article.id, tagId: t.id })),
      skipDuplicates: true,
    });
  }

  console.log("Seed complete.", { admin: admin.email, editor: editor.email, journalist: journalist.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
