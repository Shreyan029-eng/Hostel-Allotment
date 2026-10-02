import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Admin session terminated successfully.',
  });

  response.cookies.delete('admin_session');
  return response;
}
