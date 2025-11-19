import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/app/lib/access-verification";

/**
 * Protected API endpoint example
 * Returns sensitive farmer data only if valid access token is provided
 * 
 * GET /api/farmers-protected
 * Headers: x-access-token: <token from verify-access>
 */
export async function GET(req: NextRequest) {
  // Verify access token
  const isAuthorized = await verifyAccessToken(req);
  
  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized. Please provide valid access token." },
      { status: 403 }
    );
  }
  
  // Return sensitive farmer data
  // In production, fetch from database
  const sensitiveFarmerData = [
    {
      id: "farmer-1",
      name: "Fazenda Primavera LTDA",
      documentId: "12.345.678/0001-90",
      walletAddress: "0x1234567890123456789012345678901234567890",
      region: "Mato Grosso",
      cropType: "Soy",
      riskTier: "A",
      creditScore: 850,
      maxCreditLimit: 750_000,
      outstandingLoans: 500_000,
      phoneNumber: "+55 11 98765-4321",
      email: "contato@fazendaprimavera.com.br",
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "farmer-2",
      name: "Cooperativa Sul Café",
      documentId: "98.765.432/0001-10",
      walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
      region: "Paraná",
      cropType: "Coffee",
      riskTier: "B",
      creditScore: 780,
      maxCreditLimit: 450_000,
      outstandingLoans: 350_000,
      phoneNumber: "+55 41 91234-5678",
      email: "admin@cooperativasul.com.br",
      createdAt: "2024-02-20T14:15:00Z",
    },
  ];
  
  return NextResponse.json({
    success: true,
    data: sensitiveFarmerData,
    message: "Sensitive data accessed with ZK proof authorization",
  });
}

