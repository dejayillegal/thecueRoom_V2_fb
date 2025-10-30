import { NextResponse } from 'next/server';
import { EPK_TEMPLATES, getAllCategories } from '@thecueroom/epk';

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      templates: EPK_TEMPLATES,
      categories: getAllCategories()
    });
  } catch (error) {
    console.error('[EPK Templates API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
