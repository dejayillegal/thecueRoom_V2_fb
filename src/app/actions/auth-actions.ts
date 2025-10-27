
'use server';

import { verifyArtist } from "@/ai/flows/verify-artist-flow";
import type { VerifyArtistInput, VerificationResult } from "@/ai/flows/verify-artist-flow";

export async function verifyArtistAction(input: VerifyArtistInput): Promise<VerificationResult> {
    return await verifyArtist(input);
}
