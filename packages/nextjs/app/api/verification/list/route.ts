import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~~/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
    const userAddress = searchParams.get("address");

    // Check if request is from admin
    const isAdmin = userAddress === adminAddress;

    if (!isAdmin && !userAddress) {
      return NextResponse.json({ error: "Address parameter required for non-admin requests" }, { status: 400 });
    }

    let verificationRequests;

    if (isAdmin) {
      // Admin can see all requests
      verificationRequests = await prisma.verificationRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              username: true,
              email: true,
              ens: true,
            },
          },
        },
      });
    } else {
      // Users can only see their own requests
      verificationRequests = await prisma.verificationRequest.findMany({
        where: { address: userAddress },
        orderBy: { createdAt: "desc" },
      });
    }

    // Parse fields JSON for response
    const requests = verificationRequests.map(request => ({
      ...request,
      fields: JSON.parse(request.fields),
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
