import { NextRequest, NextResponse } from "next/server";
import { routeDepoistContext } from "../deduct/route";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { contractDepositService } from "@/lib/api/services/contract_deposits/contract_deposits.service";
import { auth } from "@/auth";
import { ApiResponse } from "@/lib/types/api.type";
import { serializeBigInt } from "@/lib/utils/serialize";
import { badRequestResponse, serverErrorResponse } from "@/lib/utils/api-error";

export async function PUT(req:NextRequest, { params }: routeDepoistContext) {
    try {
        const session = await auth();
        // Kiểm tra người dùng đã đăng nhập chưa
        if (!session?.user) {
            return NextResponse.json(
                { message: "Bạn chưa đăng nhập" },
                { status: 401 }
            );
        }
        // Lấy thông tin tài khoản đang đăng nhập
        const user = session?.user;
        
        const user_id = parseId(user.id)
        // Lấy deposit_id
        const { deposit_id } = await params;
        const id = parseId(deposit_id);
        if (id === null) return invalidIdResponse();

        const contract_deposit = await contractDepositService.settleDeposit(id, user_id!)
        return NextResponse.json<ApiResponse<typeof contract_deposit>>(
            {
                success: true,
                message: "Quyết toán cọc thành công",
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
    
            case "INVALID_DEPOSIT_STATUS":
              return badRequestResponse(
                "Trạng thái khoản cọc không cho phép khấu trừ",
              );
    
            case "NO_DEPOSIT_BALANCE":
              return badRequestResponse("Khoản cọc không còn số dư để hoàn trả");

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