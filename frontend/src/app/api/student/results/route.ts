import { NextResponse } from 'next/server';
import { requireSchoolAuth } from '@/lib/school/authz';
import * as resultsService from '@/lib/results-service';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    const userId = ctx.userId;

    const data = await resultsService.getStudentResults(userId);
    if (!data) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    // Log exception context for diagnostic purposes
    console.error('[STUDENT_RESULTS_API_ERROR]', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
