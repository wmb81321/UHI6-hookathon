import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~~/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
    const userAddress = searchParams.get("address");
    const direction = searchParams.get("direction");
    const status = searchParams.get("status");

    // Check if request is from admin
    const isAdmin = userAddress === adminAddress;

    if (!isAdmin && !userAddress) {
      return NextResponse.json({ error: "Address parameter required for non-admin requests" }, { status: 400 });
    }

    // Build where clause
    const whereClause: any = {};

    if (!isAdmin) {
      whereClause.address = userAddress;
    }

    if (direction && ["IN", "OUT"].includes(direction)) {
      whereClause.direction = direction;
    }

    if (status && ["PENDING", "APPROVED", "REJECTED", "CANCELED"].includes(status)) {
      whereClause.status = status;
    }

    const cashRequests = await prisma.cashRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: isAdmin
        ? {
            user: {
              select: {
                username: true,
                email: true,
                ens: true,
              },
            },
          }
        : undefined,
    });

    return NextResponse.json({ requests: cashRequests });
  } catch (error) {
    console.error("Error fetching cash requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
