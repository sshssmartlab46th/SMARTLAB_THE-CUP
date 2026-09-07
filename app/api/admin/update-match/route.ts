import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs'; // Use nodejs runtime for admin endpoints

interface UpdateMatchPayload {
  match_id: string;
  admin_key?: string;
  status?: 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'FINISHED';
  period?: string;
  elapsed_seconds?: number;
  home_score?: number;
  away_score?: number;
  newEvent?: {
    minute: number;
    type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'VAR' | 'NOTICE';
    team: 'home' | 'away' | 'neutral';
    player?: string;
    description: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Request via Header or JSON Body
    const authHeader = request.headers.get('authorization') || request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_SECRET_KEY || 'sshsgymgo_secure_token_2026';

    const body: UpdateMatchPayload = await request.json();
    const providedKey = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : body.admin_key;

    if (!providedKey || providedKey !== expectedKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invalid or missing administrative secret key.'
        },
        { status: 401 }
      );
    }

    const { match_id, status, period, elapsed_seconds, home_score, away_score, newEvent } = body;

    if (!match_id) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: match_id is required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database Connection Error: Supabase Admin Client could not be initialized.',
          hint: 'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in .env'
        },
        { status: 503 }
      );
    }

    // 2. Fetch existing match record to append new events safely
    const { data: currentMatch, error: fetchError } = await supabase
      .from('match_logs')
      .select('*')
      .eq('match_id', match_id)
      .single();

    if (fetchError || !currentMatch) {
      return NextResponse.json(
        {
          success: false,
          error: `Match with ID '${match_id}' not found in database: ${fetchError?.message}`
        },
        { status: 404 }
      );
    }

    // 3. Build Update Object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) updateData.status = status;
    if (period !== undefined) updateData.period = period;
    if (elapsed_seconds !== undefined) updateData.elapsed_seconds = elapsed_seconds;
    if (home_score !== undefined) updateData.home_score = Math.max(0, home_score);
    if (away_score !== undefined) updateData.away_score = Math.max(0, away_score);

    if (newEvent) {
      const existingEvents = Array.isArray(currentMatch.events) ? currentMatch.events : [];
      const createdEvent = {
        id: `evt-${Date.now()}`,
        minute: newEvent.minute || 0,
        type: newEvent.type,
        team: newEvent.team || 'neutral',
        player: newEvent.player || '',
        description: newEvent.description,
        timestamp: new Date().toISOString()
      };
      // Prepend or append event (recent first)
      updateData.events = [createdEvent, ...existingEvents];
    }

    // 4. Execute atomic update
    const { data: updatedMatch, error: updateError } = await supabase
      .from('match_logs')
      .update(updateData)
      .eq('match_id', match_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to update match: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Match log successfully updated in Supabase database.',
        match: updatedMatch
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  } catch (err: any) {
    console.error('[API /admin/update-match] Server Exception:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        details: err?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
