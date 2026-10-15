import {
  contractDepositService,
  type deductDepositInput,
} from "@/lib/api/services/contract_deposits/contract_deposits.service";
import type { ApiResponse } from "@/lib/types/api.type";
import { badRequestResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextResponse, type NextRequest } from "next/server";
export type routeDepoistContext = {
  params: Promise<{
    deposit_id: string;
  }>;
};

// API khấu trừ tiền cọc
export async function PUT(req: NextRequest, { params }: routeDepoistContext) {
  try {
    //Lấy danh deposit_id
    const { deposit_id } = await params;
    const id = parseId(deposit_id);
    if (id === null) return invalidIdResponse();

    // lấy dữ liệu body bỏ id ra
    const body: Omit<deductDepositInput, "id"> = await req.json();

    if (body.amount == null || !body.reason?.trim()) {
      return badRequestResponse("Vui lòng cung cấp đủ thông tin khấu trừ");
    }

    const input: deductDepositInput = {
      ...body,
      id,
    };

    const contract_deposit = await contractDepositService.deductDeposit(input);

    return NextResponse.json<ApiResponse<typeof contract_deposit>>(
      {
        success: true,
        message: "Khấu trừ thành công",
        data: serializeBigInt(contract_deposit),
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "CONTRACT_DEPOSIT_NOT_FOUND":
          return NextResponse.json(
            {
              success: false,
              message: "Không tìm thấy khoản cọc!",
              data: null,
            },
            { status: 404 },
          );

        case "INVALID_DEDUCT_AMOUNT":
          return badRequestResponse("Số tiền khấu trừ phải lớn hơn 0");

        case "DEDUCTION_REASON_REQUIRED":
          return badRequestResponse("Vui lòng nhập lý do khấu trừ");

        case "INVALID_DEPOSIT_STATUS":
          return badRequestResponse(
            "Trạng thái khoản cọc không cho phép khấu trừ",
          );

        case "NO_DEPOSIT_BALANCE":
          return badRequestResponse("Khoản cọc không còn số dư để khấu trừ");

        case "DEDUCT_AMOUNT_EXCEEDS_REMAINING":
          return badRequestResponse("Số tiền khấu trừ vượt quá số dư còn lại");

        case "SERVER_ERROR":
        default:
          console.error("PUT DEDUCT DEPOSIT ERROR:", error);
          return serverErrorResponse();
      }
    }

    console.error("PUT DEDUCT DEPOSIT ERROR:", error);
    return serverErrorResponse();
  }
}