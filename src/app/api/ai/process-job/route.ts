
import { NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { generateCoverArt, GenerateCoverArtInput } from '@/ai/flows/generate-cover-art-flow';

// This is a temporary solution to simulate a Cloud Function worker.
// In a real production environment, this logic would live in a Cloud Function
// triggered by Firestore events.

async function processJob(jobId: string) {
    const { firestore } = initializeFirebase();
    const jobRef = doc(firestore, 'generationJobs', jobId);

    try {
        await updateDoc(jobRef, { status: 'processing', progress: 5, updatedAt: new Date() });

        const jobSnap = await getDoc(jobRef);
        if (!jobSnap.exists()) {
            throw new Error("Job not found");
        }
        const jobData = jobSnap.data();

        // Check if job was cancelled
        if (jobData.status === 'cancelled') {
            console.log(`Job ${jobId} was cancelled.`);
            return;
        }

        const flowInput: GenerateCoverArtInput = {
            prompt: jobData.prompt,
            ...jobData.settings
        };
        
        // This flow is now sequential internally
        const imageUrls = await generateCoverArt(flowInput);

        // In a real worker, you would upload these to storage and get URLs.
        // For this simulation, we assume the flow returns final URLs.
        // We'll update the document with the final result.
        
        const finalSnap = await getDoc(jobRef);
        if(finalSnap.exists() && finalSnap.data().status === 'cancelled') {
             console.log(`Job ${jobId} was cancelled during generation.`);
             return;
        }

        await updateDoc(jobRef, {
            previews: imageUrls,
            status: 'completed',
            progress: 100,
            updatedAt: new Date(),
        });

    } catch (err: any) {
        console.error(`Processing job ${jobId} failed:`, err);
        await updateDoc(jobRef, {
            status: 'failed',
            error: err.message || 'Unknown error',
            updatedAt: new Date(),
        });
    }
}


export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
        return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // Don't await this. Let it run in the background.
    // This is NOT a robust way to handle background jobs in a serverless environment.
    // Vercel/Next.js might terminate the process. This is for demonstration only.
    // A proper implementation would use a Cloud Function, Cloud Run, or other background worker service.
    processJob(jobId);

    return NextResponse.json({ message: 'Job processing started' }, { status: 202 });

  } catch (err: any) {
    console.error('API /api/ai/process-job error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
