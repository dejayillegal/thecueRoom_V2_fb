
import { getDbClient } from '@thecueroom/db/client';
import { verificationJobs, notifications, users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function createVerificationJob(
  userId: string,
  profileUrl: string,
  metadata?: Record<string, any>
) {
  const db = getDbClient();

  try {
    const [job] = await db
      .insert(verificationJobs)
      .values({
        userId,
        profileUrl,
        status: 'queued',
        progress: 0,
        metadata,
      })
      .returning();

    // Create initial notification
    await db.insert(notifications).values({
      userId,
      type: 'verification_started',
      title: 'Verification Started',
      message: 'Your artist profile verification is in progress. This usually takes a few moments.',
      link: '/verification',
      metadata: { jobId: job.id },
    });

    // Update user with verification job ID
    await db
      .update(users)
      .set({
        verificationJobId: job.id,
        verificationStatus: 'verification_pending',
      })
      .where(eq(users.id, userId));

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error('Failed to create verification job:', error);
    return { success: false, error: 'Failed to create verification job' };
  }
}

export async function updateVerificationStatus(
  jobId: string,
  status: 'processing' | 'completed' | 'failed',
  decision?: 'approved' | 'review' | 'rejected',
  score?: number,
  evidence?: Record<string, any>
) {
  const db = getDbClient();

  try {
    const [job] = await db
      .select()
      .from(verificationJobs)
      .where(eq(verificationJobs.id, jobId))
      .limit(1);

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    // Update job
    await db
      .update(verificationJobs)
      .set({
        status,
        decision,
        score,
        evidence,
        progress: status === 'completed' ? 100 : job.progress,
        completedAt: status === 'completed' ? new Date() : null,
      })
      .where(eq(verificationJobs.id, jobId));

    // Create notification based on decision
    if (status === 'completed') {
      let notificationType = 'verification_pending';
      let notificationTitle = 'Verification Update';
      let notificationMessage = 'Your verification status has been updated.';

      if (decision === 'approved') {
        notificationType = 'verification_approved';
        notificationTitle = 'Profile Verified!';
        notificationMessage = 'Your artist profile has been verified. Welcome to thecueRoom!';
        
        // Update user as verified
        await db
          .update(users)
          .set({
            verified: true,
            verificationStatus: 'verified',
          })
          .where(eq(users.id, job.userId));
      } else if (decision === 'rejected') {
        notificationType = 'verification_denied';
        notificationTitle = 'Verification Failed';
        notificationMessage = 'We couldn\'t verify your profile. Please update your information and try again.';
      }

      await db.insert(notifications).values({
        userId: job.userId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        link: '/verification',
        metadata: { jobId, decision, score },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update verification status:', error);
    return { success: false, error: 'Failed to update verification status' };
  }
}
