import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~~/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, adminAddress } = body;
    const { id } = params;

    // Verify admin address
    if (adminAddress !== process.env.NEXT_PUBLIC_ADMIN_ADDRESS) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Validate status
    if (!["PENDING", "APPROVED", "REJECTED", "CANCELED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update cash request
    const updatedRequest = await prisma.cashRequest.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating cash request:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Cash request not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
