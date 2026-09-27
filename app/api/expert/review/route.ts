import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { databricksExpertReviews } from '../../../../lib/server/databricks-expert-reviews';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser().catch(() => null);
    const body = await req.json();

    const {
      messageId,
      userQuestion,
      userLogsSummary,
      originalAIResponse,
      correctedResponse,
      ratingAccuracy,
      ratingGroundedness,
      ratingEmpathy,
      isClinicallySafe,
      expertComments,
      expertName: customName,
    } = body;

    if (!messageId || !userQuestion || !originalAIResponse) {
      return NextResponse.json(
        { error: 'Missing required fields (messageId, userQuestion, or originalAIResponse)' },
        { status: 400 }
      );
    }

    const expertId = user ? user.id : 'expert-local';
    const expertName = customName || (user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'Dr. Maya Lin, Clinician Reviewer');

    const status = correctedResponse && correctedResponse.trim() !== originalAIResponse.trim()
      ? 'corrected'
      : 'reviewed';

    const saved = await databricksExpertReviews.saveReview({
      messageId: String(messageId),
      expertId,
      expertName: expertName || 'Clinical Expert',
      userQuestion: String(userQuestion),
      userLogsSummary: String(userLogsSummary || ''),
      originalAIResponse: String(originalAIResponse),
      correctedResponse: correctedResponse ? String(correctedResponse) : undefined,
      ratingAccuracy: Number(ratingAccuracy) || 5,
      ratingGroundedness: Number(ratingGroundedness) || 5,
      ratingEmpathy: Number(ratingEmpathy) || 5,
      isClinicallySafe: Boolean(isClinicallySafe ?? true),
      expertComments: String(expertComments || ''),
      status,
    });

    return NextResponse.json({ success: true, review: saved });
  } catch (err) {
    console.error('[API /api/expert/review POST error]:', err);
    return NextResponse.json({ error: 'Failed to save expert review' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const reviews = await databricksExpertReviews.getRecentReviews(50);
    const total = reviews.length;
    const avgAccuracy = total > 0
      ? (reviews.reduce((acc, r) => acc + r.ratingAccuracy, 0) / total).toFixed(1)
      : '5.0';

    return NextResponse.json({
      success: true,
      stats: {
        totalReviews: total,
        averageAccuracy: avgAccuracy,
      },
      reviews,
    });
  } catch (err) {
    console.error('[API /api/expert/review GET error]:', err);
    return NextResponse.json({ error: 'Failed to retrieve expert reviews' }, { status: 500 });
  }
}
