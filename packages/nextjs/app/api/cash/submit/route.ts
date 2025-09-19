import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~~/lib/prisma";
import { notifyTelegram } from "~~/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, direction, amountWei, bankRef, token = "ECOP" } = body;

    if (!address || !direction || !amountWei) {
      return NextResponse.json({ error: "Missing required fields: address, direction, amountWei" }, { status: 400 });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 });
    }

    // Validate direction
    if (!["IN", "OUT"].includes(direction)) {
      return NextResponse.json({ error: "Invalid direction. Must be IN or OUT" }, { status: 400 });
    }

    // Create or update user record
    await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address },
    });

    // Create cash request
    const cashRequest = await prisma.cashRequest.create({
      data: {
        address,
        direction,
        token,
        amountWei: amountWei.toString(),
        bankRef,
        status: "PENDING",
      },
    });

    // Get user info for notification
    const user = await prisma.user.findUnique({
      where: { address },
      select: { username: true, ens: true },
    });

    // Format amount for display (assuming 6 decimals for ECOP/USDC)
    const decimals = token === "ETH" ? 18 : 6;
    const displayAmount = (parseFloat(amountWei) / Math.pow(10, decimals)).toFixed(6);

    // Send Telegram notification
    const telegramMessage = `💰 *New cash ${direction.toLowerCase()} request*

*User:* ${user?.username || user?.ens || "Unknown"}
*Wallet:* \`${address}\`
*Amount:* ${displayAmount} ${token}
*Bank:* ${bankRef || "Not specified"}
*Request ID:* ${cashRequest.id}
*Timestamp:* ${new Date().toISOString()}

Please review the request in the admin panel.`;

    await notifyTelegram(telegramMessage);

    return NextResponse.json({
      success: true,
      requestId: cashRequest.id,
      status: "PENDING",
    });
  } catch (error) {
    console.error("Error submitting cash request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
