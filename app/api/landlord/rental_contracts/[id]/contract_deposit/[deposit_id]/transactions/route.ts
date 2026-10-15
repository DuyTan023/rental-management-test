import { NextRequest, NextResponse } from "next/server";
import { routeDepoistContext } from "../deduct/route";
import { parseId } from "@/lib/utils/function";
import { depositTransactionService } from "@/lib/api/services/deposit_transactions/deposit_transactions.service";
import { ApiResponse, PaginationResult } from "@/lib/types/api.type";
import { serializeBigInt } from "@/lib/utils/serialize";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { deposit_transactions } from "@/generated/prisma/client";
//api/rental_contract/[id]/contract_deposit/[deposit_id]/transactions/route.ts
//  Lấy lịch sử giao dịch của khoản cọc có phân trang có phân trang
export async function GET(req:NextRequest, {params}: routeDepoistContext) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = Number(searchParams.get("page"));
        const limitParam = Number(searchParams.get("limit"))
        const { deposit_id } = await params;
        const contract_deposit_id = parseId(deposit_id);

        // Tránh lỗi nhập ký tự thì cho về 1 hết
        const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
        // Giới hạn giá trị 100 mẫu tin tránh limit=1000000
        const limit =
        Number.isInteger(limitParam) && limitParam > 0
            ? Math.min(limitParam, 100)
                : 10;
        
        if (contract_deposit_id === null) {
            return serverErrorResponse();
        }
        const deposit_transactions = await depositTransactionService.getDepositTransaction({ contract_deposit_id, page, limit})

        return NextResponse.json<ApiResponse<PaginationResult<deposit_transactions>>>(
            {
                success: true,
                message: "Lấy danh sách phòng trọ thành công",
                data: serializeBigInt(deposit_transactions),
            },
            { status: 200 },
        );
    } catch (error) {
        return serverErrorResponse();
    }
}