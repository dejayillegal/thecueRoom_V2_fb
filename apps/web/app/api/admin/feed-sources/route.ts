
import { NextResponse } from 'next/server';

const SOURCES = [
  { id: 'rollingstone-india', name: 'Rolling Stone India', type: 'RSS', enabled: true },
  { id: 'sortmyscene', name: 'SortMyScene', type: 'HTML', enabled: true },
  { id: 'dice-india', name: 'DICE India', type: 'JSON', enabled: true },
  { id: 'skillbox-india', name: 'Skillbox India', type: 'JSON', enabled: true },
  { id: 'paytm-insider', name: 'Paytm Insider', type: 'REST', enabled: true },
  { id: 'bookmyshow', name: 'BookMyShow', type: 'HTML', enabled: true },
  { id: 'zomato-live', name: 'Zomato Live', type: 'HTML', enabled: true },
  { id: 'swiggy-events', name: 'Swiggy SteppinOut', type: 'JSON', enabled: true },
];

export async function GET() {
  return NextResponse.json({ sources: SOURCES });
}
