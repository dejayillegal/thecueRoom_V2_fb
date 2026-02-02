#!/usr/bin/env tsx
/**
 * MANUAL ONE-SHOT INITIALIZATION SCRIPT
 * Run with: pnpm init:db
 * 
 * - Idempotent: safe to run multiple times
 * - Deterministic: same output every run
 * - Non-destructive: never drops data
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql, eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

const UNDERGROUND_PREFIXES = [
  "bass", "nocturn", "techno", "pulse", "subfreq", "vinyl", "synth", "analog",
  "dark", "acid", "deep", "low", "wave", "beat", "drum", "sonic", "void",
  "phantom", "ghost", "shadow", "neon", "cyber", "grid", "hex", "bit",
  "zero", "null", "flux", "drift", "echo", "static", "fuzz", "haze"
];

const UNDERGROUND_SUFFIXES = [
  "ritual", "kid", "veil", "operator", "404", "head", "smith", "runner",
  "walker", "rider", "selector", "spinner", "master", "prophet", "monk",
  "sage", "ghost", "shade", "hunter", "seeker", "diver", "pilot", "drone",
  "signal", "noise", "wave", "freq", "pulse", "sync", "loop", "drop"
];

function generateUndergroundUsername(seed: number): string {
  const prefixIdx = seed % UNDERGROUND_PREFIXES.length;
  const suffixIdx = Math.floor(seed / UNDERGROUND_PREFIXES.length) % UNDERGROUND_SUFFIXES.length;
  const numSuffix = Math.floor(seed / (UNDERGROUND_PREFIXES.length * UNDERGROUND_SUFFIXES.length));
  
  const prefix = UNDERGROUND_PREFIXES[prefixIdx];
  const suffix = UNDERGROUND_SUFFIXES[suffixIdx];
  
  if (numSuffix === 0) {
    return `${prefix}_${suffix}`;
  }
  return `${prefix}_${suffix}_${numSuffix}`;
}

async function main() {
  console.log("\n========================================");
  console.log("  thecueRoom Manual Database Init");
  console.log("========================================\n");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  // STEP 1: Check schema
  console.log("📋 Checking database schema...");
  
  const tableCheck = await db.execute(sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'profiles', 'forum_threads', 'forum_categories', 'forum_replies')
  `);
  
  const existingTables = tableCheck.map((r: any) => r.table_name);
  console.log(`   Found tables: ${existingTables.join(", ") || "none"}`);
  
  if (!existingTables.includes("users")) {
    console.log("⚠️  Required tables missing. Please run migrations first:");
    console.log("   pnpm --filter db migrate");
    await client.end();
    process.exit(1);
  }
  console.log("✅ Schema verified\n");

  // STEP 2: Admin account
  console.log("👤 Processing admin account...");
  const adminEmail = "dejayillegal@gmail.com";
  const adminPassword = "Closer@82";
  const adminUsername = "illegal_mastercue";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await db.execute(sql`
    SELECT id FROM users WHERE email = ${adminEmail}
  `);

  if (existingAdmin.length === 0) {
    await db.execute(sql`
      INSERT INTO users (id, email, password_hash, username, role, verified, created_at, updated_at)
      VALUES (gen_random_uuid(), ${adminEmail}, ${adminHash}, ${adminUsername}, 'admin', true, NOW(), NOW())
    `);
    console.log("   ✅ Admin created: " + adminEmail);
  } else {
    await db.execute(sql`
      UPDATE users SET role = 'admin', verified = true, username = ${adminUsername}, password_hash = ${adminHash}
      WHERE email = ${adminEmail}
    `);
    console.log("   ✅ Admin updated: " + adminEmail);
  }

  // STEP 3: Artist accounts (12)
  console.log("\n🎵 Processing artist accounts...");
  const artistPassword = "Test123!";
  const artistHash = await bcrypt.hash(artistPassword, 10);
  let artistsCreated = 0;
  let artistsSkipped = 0;
  const artistIds: string[] = [];

  for (let i = 1; i <= 12; i++) {
    const email = `artist${i}@demo.thecueroom.com`;
    const username = generateUndergroundUsername(i);
    const artistName = `DJ ${username.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`;

    const existing = await db.execute(sql`SELECT id FROM users WHERE email = ${email}`);
    
    if (existing.length === 0) {
      const result = await db.execute(sql`
        INSERT INTO users (id, email, password_hash, username, role, verified, created_at, updated_at)
        VALUES (gen_random_uuid(), ${email}, ${artistHash}, ${username}, 'artist', true, NOW(), NOW())
        RETURNING id
      `);
      const newUserId = (result[0] as any).id;
      artistIds.push(newUserId);
      
      const existingProfile = await db.execute(sql`SELECT id FROM profiles WHERE user_id = ${newUserId}`);
      if (existingProfile.length === 0) {
        await db.execute(sql`
          INSERT INTO profiles (id, user_id, artist_name, display_name, bio, genre, created_at, updated_at)
          VALUES (gen_random_uuid(), ${newUserId}, ${artistName}, ${artistName}, 
            ${"Underground music producer and DJ. Part of the thecueRoom community."}, 
            'Electronic', NOW(), NOW())
        `);
      }
      
      artistsCreated++;
    } else {
      artistIds.push((existing[0] as any).id);
      await db.execute(sql`
        UPDATE users SET username = ${username}, role = 'artist', verified = true
        WHERE email = ${email}
      `);
      artistsSkipped++;
    }
  }
  console.log(`   ✅ Artists: ${artistsCreated} created, ${artistsSkipped} updated`);

  // STEP 4: User accounts (38)
  console.log("\n👥 Processing user accounts...");
  let usersCreated = 0;
  let usersSkipped = 0;

  for (let i = 13; i <= 50; i++) {
    const email = `user${i}@demo.thecueroom.com`;
    const username = generateUndergroundUsername(i + 100);

    const existing = await db.execute(sql`SELECT id FROM users WHERE email = ${email}`);
    
    if (existing.length === 0) {
      await db.execute(sql`
        INSERT INTO users (id, email, password_hash, username, role, verified, created_at, updated_at)
        VALUES (gen_random_uuid(), ${email}, ${artistHash}, ${username}, 'user', true, NOW(), NOW())
      `);
      usersCreated++;
    } else {
      await db.execute(sql`
        UPDATE users SET username = ${username}, verified = true
        WHERE email = ${email}
      `);
      usersSkipped++;
    }
  }
  console.log(`   ✅ Users: ${usersCreated} created, ${usersSkipped} updated`);

  // STEP 5: Forum categories
  console.log("\n📂 Processing forum categories...");
  const categories = [
    { name: "Production", slug: "production", description: "Music production tips and techniques" },
    { name: "Scene", slug: "scene", description: "Local and global scene discussions" },
    { name: "Career", slug: "career", description: "Career advice and opportunities" },
    { name: "Discussion", slug: "discussion", description: "General music discussion" },
    { name: "Marketing", slug: "marketing", description: "Promotion and marketing strategies" }
  ];

  let catsCreated = 0;
  let catsSkipped = 0;
  const categoryIds: Record<string, string> = {};

  for (const cat of categories) {
    const existing = await db.execute(sql`
      SELECT id FROM forum_categories WHERE slug = ${cat.slug}
    `);
    
    if (existing.length === 0) {
      const result = await db.execute(sql`
        INSERT INTO forum_categories (id, name, slug, description, created_at)
        VALUES (gen_random_uuid(), ${cat.name}, ${cat.slug}, ${cat.description}, NOW())
        RETURNING id
      `);
      categoryIds[cat.slug] = (result[0] as any).id;
      catsCreated++;
    } else {
      categoryIds[cat.slug] = (existing[0] as any).id;
      catsSkipped++;
    }
  }
  console.log(`   ✅ Categories: ${catsCreated} created, ${catsSkipped} existed`);

  // STEP 6: Forum threads (50)
  console.log("\n💬 Processing forum threads...");
  
  const threadCount = await db.execute(sql`SELECT COUNT(*) as count FROM forum_threads`);
  const existingThreads = parseInt((threadCount[0] as any).count || "0");

  if (existingThreads >= 50) {
    console.log(`   ✅ Threads: skipped (${existingThreads} already exist)`);
  } else {
    const threadTitles = [
      "Best DAW for underground production?",
      "How to get booked at warehouse parties",
      "Vinyl vs digital - the eternal debate",
      "Building a modular synth setup on a budget",
      "Tips for mixing in mono",
      "Local scene spotlight - share your city",
      "How to network without being cringe",
      "Sample pack recommendations",
      "Mastering for streaming platforms",
      "The art of the B2B set",
      "Starting a label in 2026",
      "Favorite hardware synths right now",
      "Dealing with imposter syndrome",
      "How to price your DJ services",
      "Building a home studio acoustics",
      "Best cities for electronic music",
      "Collaborating with vocalists remotely",
      "Marketing without selling out",
      "The future of AI in music production",
      "Finding your unique sound",
      "Transitioning from bedroom to club",
      "Understanding music rights and royalties",
      "Building a sustainable music career",
      "Favorite underground labels",
      "Tips for festival applications",
      "How to handle DJ requests",
      "Building your EPK effectively",
      "Social media strategy for artists",
      "Dealing with creative blocks",
      "The importance of music theory",
      "Analog warmth - myth or reality?",
      "Building a following organically",
      "Collaboration etiquette",
      "Understanding music contracts",
      "Tips for live performance",
      "Mixing bass-heavy genres",
      "Creating atmospheric textures",
      "The art of sampling",
      "Building DJ-producer hybrid skills",
      "Understanding venue requirements",
      "Tips for opening sets",
      "Building genre-fluid sets",
      "The role of resident DJs",
      "Understanding music distribution",
      "Tips for Bandcamp success",
      "Building community online",
      "The ethics of AI-generated music",
      "Creating effective promo materials",
      "Understanding sync licensing",
      "Tips for international touring"
    ];

    const threadsToCreate = 50 - existingThreads;
    let threadsCreated = 0;
    const categoryList = Object.values(categoryIds);

    for (let i = 0; i < threadsToCreate && i < threadTitles.length; i++) {
      const title = threadTitles[i];
      const artistId = artistIds[i % artistIds.length];
      const categoryId = categoryList[i % categoryList.length];
      
      if (!artistId || !categoryId) continue;

      try {
        await db.execute(sql`
          INSERT INTO forum_threads (id, title, content, user_id, category_id, moderation_status, visibility, created_at, updated_at)
          VALUES (gen_random_uuid(), ${title}, 
            ${"Share your thoughts and experiences. Let's discuss this topic as a community."}, 
            ${artistId}, ${categoryId}, 'approved', 'public', NOW(), NOW())
        `);
        threadsCreated++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`   ✅ Threads: ${threadsCreated} created`);
  }

  // Summary
  console.log("\n========================================");
  console.log("  Initialization Complete");
  console.log("========================================");
  console.log("\n📌 Login credentials:");
  console.log("   Admin: dejayillegal@gmail.com / Closer@82");
  console.log("   Artists: artist1-12@demo.thecueroom.com / Test123!");
  console.log("   Users: user13-50@demo.thecueroom.com / Test123!");
  console.log("\n✅ Database ready. Run again anytime - it's idempotent.\n");

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Init failed:", err);
  process.exit(1);
});
