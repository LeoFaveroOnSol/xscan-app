import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient, createServiceClient } from '@/lib/supabase/server';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { sanitizeForStorage, sanitizeTwitterHandle } from '@/lib/utils/sanitize';
import { validateAdminSessionFromRequest } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  // SECURITY: Admin authentication required to list applications
  if (!validateAdminSessionFromRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({
      applications: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const {
      application_type = 'kol', // 'kol' or 'telegram_channel'
      twitter_handle,
      wallet_address,
      display_name,
      bio,
      follower_count,
      proof_of_calls,
      additional_info,
      wallet_signature,
      message,
      hide_wallet,
      channel_username,
      website_url,
      telegram_handle,
    } = body;

    // Handle Telegram Channel applications
    if (application_type === 'telegram_channel') {
      if (!channel_username) {
        return NextResponse.json(
          { error: 'channel_username is required for Telegram channel applications' },
          { status: 400 }
        );
      }

      const cleanUsername = channel_username.replace('@', '');

      // Check for existing pending application
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('application_type', 'telegram_channel')
        .eq('channel_username', cleanUsername)
        .eq('status', 'pending')
        .single();

      if (existingApp) {
        return NextResponse.json(
          { error: 'This channel already has a pending application' },
          { status: 409 }
        );
      }

      // Check if channel already exists
      const { data: existingChannel } = await supabase
        .from('telegram_channels')
        .select('id')
        .eq('channel_username', cleanUsername)
        .single();

      if (existingChannel) {
        return NextResponse.json(
          { error: 'This channel is already registered on XSCAN' },
          { status: 409 }
        );
      }

      // Create Telegram channel application
      const { data, error } = await supabase
        .from('applications')
        .insert({
          application_type: 'telegram_channel',
          twitter_handle: cleanUsername, // DB requires NOT NULL — use channel username as placeholder
          channel_username: cleanUsername,
          display_name: display_name ? sanitizeForStorage(display_name) : null,
          additional_info: additional_info ? sanitizeForStorage(additional_info) : null,
          website_url: website_url || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating Telegram channel application:', error);
        return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
      }

      return NextResponse.json({ application: data }, { status: 201 });
    }

    // KOL Application (default)
    // Validate required fields - only twitter_handle is required now
    if (!twitter_handle) {
      return NextResponse.json(
        { error: 'twitter_handle is required' },
        { status: 400 }
      );
    }

    // Validate wallet address format if provided
    if (wallet_address) {
      try {
        new PublicKey(wallet_address);
      } catch {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
      }
    }

    // Verify wallet signature if provided (only when wallet is connected, not manual)
    if (wallet_signature && message && wallet_address) {
      try {
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(wallet_signature);
        const publicKeyBytes = new PublicKey(wallet_address).toBytes();

        const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

        if (!isValid) {
          return NextResponse.json({ error: 'Invalid wallet signature' }, { status: 400 });
        }
      } catch (signError) {
        console.error('Signature verification error:', signError);
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
      }
    }

    // Check for existing pending application by twitter handle
    const { data: existingByTwitter } = await supabase
      .from('applications')
      .select('id, status')
      .eq('twitter_handle', twitter_handle.replace('@', ''))
      .eq('status', 'pending')
      .single();

    if (existingByTwitter) {
      return NextResponse.json(
        { error: 'You already have a pending application with this Twitter handle' },
        { status: 409 }
      );
    }

    // Check for existing pending application by wallet if provided
    if (wallet_address) {
      const { data: existingByWallet } = await supabase
        .from('applications')
        .select('id, status')
        .eq('wallet_address', wallet_address)
        .eq('status', 'pending')
        .single();

      if (existingByWallet) {
        return NextResponse.json(
          { error: 'You already have a pending application with this wallet' },
          { status: 409 }
        );
      }
    }

    // Check if already a KOL by twitter
    const { data: existingKolByTwitter } = await supabase
      .from('kols')
      .select('id')
      .eq('twitter_handle', twitter_handle.replace('@', ''))
      .single();

    if (existingKolByTwitter) {
      return NextResponse.json(
        { error: 'This Twitter handle is already registered as a KOL' },
        { status: 409 }
      );
    }

    // Check if already a KOL by wallet if provided
    if (wallet_address) {
      const { data: existingKolByWallet } = await supabase
        .from('kols')
        .select('id')
        .eq('wallet_address', wallet_address)
        .single();

      if (existingKolByWallet) {
        return NextResponse.json(
          { error: 'This wallet is already registered as a KOL' },
          { status: 409 }
        );
      }
    }

    // Sanitize all text inputs before storing
    const sanitizedData = {
      application_type: 'kol',
      twitter_handle: sanitizeTwitterHandle(twitter_handle),
      wallet_address: wallet_address || null,
      display_name: display_name ? sanitizeForStorage(display_name) : null,
      bio: bio ? sanitizeForStorage(bio) : null,
      follower_count: follower_count || null,
      proof_of_calls: proof_of_calls ? sanitizeForStorage(proof_of_calls) : null,
      additional_info: additional_info ? sanitizeForStorage(additional_info) : null,
      wallet_signature: wallet_signature || null,
      hide_wallet: hide_wallet || false,
      website_url: website_url || null,
      telegram_handle: telegram_handle ? sanitizeForStorage(telegram_handle) : null,
      status: 'pending' as const,
    };

    // Create application
    const { data, error } = await supabase
      .from('applications')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    return NextResponse.json({ application: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
