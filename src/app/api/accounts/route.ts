import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  Account,
} from '@/lib/db';

// ---------------------------------------------------------------------------
// Helper – mask an API key, showing only the last 4 characters
// ---------------------------------------------------------------------------

function maskApiKey(key: string): string {
  if (!key || key.length <= 4) return '****';
  return '*'.repeat(key.length - 4) + key.slice(-4);
}

function maskAccountKeys(account: Account): Record<string, unknown> {
  return {
    ...account,
    api_key: maskApiKey(account.api_key),
  };
}

// ---------------------------------------------------------------------------
// GET /api/accounts – list all accounts (with masked API keys)
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  try {
    const accounts = getAccounts();
    const masked = accounts.map(maskAccountKeys);
    return NextResponse.json({ accounts: masked });
  } catch (error) {
    console.error('GET /api/accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/accounts – create a new account
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, apiKey, isPrimary, dailyQuota, notes } = body;

    if (!name || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: name and apiKey' },
        { status: 400 },
      );
    }

    const account = createAccount({
      id: uuidv4(),
      name,
      api_key: apiKey,
      is_primary: isPrimary ? 1 : 0,
      daily_quota: dailyQuota ?? 50,
      notes: notes ?? null,
    });

    return NextResponse.json(
      { account: maskAccountKeys(account) },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/accounts – update an existing account
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 },
      );
    }

    // Map camelCase input to snake_case DB fields
    const updates: Record<string, unknown> = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.apiKey !== undefined) updates.api_key = fields.apiKey;
    if (fields.isPrimary !== undefined) updates.is_primary = fields.isPrimary ? 1 : 0;
    if (fields.dailyQuota !== undefined) updates.daily_quota = fields.dailyQuota;
    if (fields.notes !== undefined) updates.notes = fields.notes;

    const updated = updateAccount(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ account: maskAccountKeys(updated) });
  } catch (error) {
    console.error('PUT /api/accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/accounts – delete an account
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 },
      );
    }

    deleteAccount(id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('DELETE /api/accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 },
    );
  }
}
