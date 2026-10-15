import type { contract_deposits } from "@/generated/prisma/client";
import type { CreateFullContractDepositParams } from "@/lib/api/repositories/contract_deposits/contract_deposits.repository";
import { contractDepositService } from "@/lib/api/services/contract_deposits/contract_deposits.service";
import type { ApiResponse, routeContext } from "@/lib/types/api.type";
import { badRequestResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextResponse, type NextRequest } from "next/server";

// lấy khoản cọc của hợp đồng
// api/rental_contracts/[id]/contract_deposit/route.ts
export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    // Lấy contract_id
    const { id } = await params;
    const contract_id = parseId(id);

    if (contract_id == null) {
      return invalidIdResponse();
    }

    const contract_deposit =
      await contractDepositService.getByContractId(contract_id);

    return NextResponse.json<ApiResponse<contract_deposits>>(
      {
        success: true,
        message: "Lấy khoản cọc thành công",
        data: serializeBigInt(contract_deposit),
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "CONTRACT_DEPOSIT_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy khoản cọc!",
          data: null,
        },
        { status: 404 },
      );
    }
    console.error("GET DEPOSIT CONTRAC ERROR:", err);
    return serverErrorResponse();
  }
}
// Tạo khoản cọc của hợp đồng
// api/rental_contracts/[id]/contract_deposit/route.ts

export async function POST(req: NextRequest, { params }: routeContext) {
  try {
    // Lấy contract_id
    const { id } = await params;
    const contract_id = parseId(id);

    if (contract_id == null) {
      return invalidIdResponse();
    }
    const body: CreateFullContractDepositParams = await req.json();
    if (!body.inputContractDeposit || !body.inputDepositTransactions) {
      return badRequestResponse("Vui lòng cung cấp đủ thông tin tạo khoản cọc");
    }

    const param: CreateFullContractDepositParams = {
      ...body,
      inputContractDeposit: {
        ...body.inputContractDeposit,
        rental_contracts: {
          connect: { id: contract_id },
        },
      },
    };

    const contract_deposit =
      await contractDepositService.createContractDeposit(param);

    return NextResponse.json<ApiResponse<typeof contract_deposit>>(
      {
        success: true,
        message: "Tạo mới khoản cọc thành công",
        data: serializeBigInt(contract_deposit),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "CONTRACT_DEPOSIT_EXISTS") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Lỗi trùng lặp!",
          data: null,
        },
        {
          status: 409,
        },
      );
    }
    console.error("POST CONTRACT DEPOSIT ERROR:", error);
    return serverErrorResponse();
  }
}