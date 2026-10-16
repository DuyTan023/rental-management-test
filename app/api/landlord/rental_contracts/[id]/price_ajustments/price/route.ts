import { priceAjustmentService } from "@/lib/api/services/contract_price_adjustments/contract_price_adjustment.service";
import { ApiResponse, routeContext } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { Decimal } from "@prisma/client/runtime/client";
import { NextRequest, NextResponse } from "next/server";

// Lấy giá phòng đang áp dụng tính cho hóa đơn
export async function GET (req: NextRequest, {params}: routeContext) {
    try {

        const { searchParams } = new URL(req.url);
        const effectiveDateParam = searchParams.get("effectiveDate");
        
        const { id } = await params;
        const contract_id = parseId(id);

        if (contract_id === null) {
            return invalidIdResponse();
        }

        if (!effectiveDateParam) {
            return NextResponse.json<ApiResponse<null>>(
                {
                success: false,
                message: "Vui lòng cung cấp ngày hiệu lực",
                data: null,
                },
                { status: 400 },
            );
        }

        const effectiveDate = new Date(effectiveDateParam);

        if (Number.isNaN(effectiveDate.getTime())) {
            return NextResponse.json<ApiResponse<null>>(
                {
                success: false,
                message: "Ngày hiệu lực không hợp lệ",
                data: null,
                },
                { status: 400 },
            );
        }

        const rent_price: Decimal = await priceAjustmentService.getRentPrice(contract_id, effectiveDate);

        return NextResponse.json<ApiResponse<Decimal>>(
            {
                success: true,
                message: "Lấy danh sách điều chỉnh thành công",
                data: rent_price,
            },
            { status: 200 },
        )
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "RENTAL_CONTRACT_NOT_FOUND"
            ) {
            return NextResponse.json<ApiResponse<null>>(
                {
                success: false,
                message: "Không tìm thấy hợp đồng thuê",
                data: null,
                },
                { status: 404 },
            );
        }

        if (
            error instanceof Error &&
            error.message === "FOREIGN_KEY_CONSTRAINT"
            ) {
            return NextResponse.json<ApiResponse<null>>(
                {
                success: false,
                message: "Lỗi khóa",
                data: null,
                },
                { status: 404 },
            );
        }

        return serverErrorResponse();
    }
}