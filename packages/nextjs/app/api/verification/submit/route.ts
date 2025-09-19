import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~~/lib/prisma";
import { notifyTelegram } from "~~/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, kind, fields } = body;

    if (!address || !kind || !fields) {
      return NextResponse.json({ error: "Missing required fields: address, kind, fields" }, { status: 400 });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 });
    }

    // Validate kind
    if (!["PERSON", "INSTITUTION"].includes(kind)) {
      return NextResponse.json({ error: "Invalid verification kind. Must be PERSON or INSTITUTION" }, { status: 400 });
    }

    // Create or update user record
    await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address },
    });

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        address,
        kind,
        fields: JSON.stringify(fields),
        status: "PENDING",
      },
    });

    // Send Telegram notification
    const telegramMessage = `🔍 *New verification request*

*Type:* ${kind}
*Address:* \`${address}\`
*Request ID:* ${verificationRequest.id}
*Timestamp:* ${new Date().toISOString()}

Please review the request in the admin panel.`;

    await notifyTelegram(telegramMessage);

    return NextResponse.json({
      success: true,
      requestId: verificationRequest.id,
      status: "PENDING",
    });
  } catch (error) {
    console.error("Error submitting verification request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
