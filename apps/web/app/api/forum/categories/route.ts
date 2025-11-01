
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { forumCategories } from '@thecueroom/db/schema';
import { desc } from 'drizzle-orm';

const db = getDbClient();

export async function GET(request: NextRequest) {
  try {
    const categories = await db.select({
      id: forumCategories.id,
      name: forumCategories.name,
      slug: forumCategories.slug,
      description: forumCategories.description,
      createdAt: forumCategories.createdAt,
    })
    .from(forumCategories)
    .orderBy(desc(forumCategories.createdAt));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('List categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
