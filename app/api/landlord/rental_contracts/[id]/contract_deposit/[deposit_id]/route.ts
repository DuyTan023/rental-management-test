import type { contract_deposits } from "@/generated/prisma/client";
import { contractDepositService } from "@/lib/api/services/contract_deposits/contract_deposits.service";
import type { ApiResponse } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextResponse, type NextRequest } from "next/server";
type routeContext = {
  params: Promise<{
    deposit_id: string;
  }>;
};
// api/rental_contracts/[id]/contract_deposit/[deposit_id]/route.ts
// Lấy chi tiết khoản cọc
export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    //  Lấy danh deposit_id
    const { deposit_id } = await params;
    const id = parseId(deposit_id);
    if (id === null) return invalidIdResponse();

    const contract_deposit = await contractDepositService.getById(id);
    return NextResponse.json<ApiResponse<contract_deposits>>(
      {
        success: true,
        message: "Lấy chi tiết cọc thành công",
        data: serializeBigInt(contract_deposit),
      },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "CONTRACT_DEPOSIT_NOT_FOUND"
    ) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy hợp đồng!",
          data: null,
        },
        { status: 404 },
      );
    }
    console.error("GET CONTRAC DEPOSIT ERROR:", error);
    return serverErrorResponse();
  }
}