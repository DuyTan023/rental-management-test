// Tạo thay đổi giá thuê phòng
// lấy lịch sử tăng/ giảm giá phòng

import { NextRequest, NextResponse } from "next/server";
import { routeDepoistContext } from "../contract_deposit/[deposit_id]/deduct/route";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { ApiResponse, PaginationResult, routeContext } from "@/lib/types/api.type";
import { badRequestResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { contract_price_adjustments, Prisma } from "@/generated/prisma/client";
import { priceAjustmentService } from "@/lib/api/services/contract_price_adjustments/contract_price_adjustment.service";
import { serializeBigInt } from "@/lib/utils/serialize";

export async function POST(req: NextRequest, {params}: routeContext) {
    try {
        // Lấy id hợp đồng
        const {id} = await params;
        const contract_id = parseId(id);

        if (contract_id === null) {
            return invalidIdResponse();
        }

        const body: Prisma.contract_price_adjustmentsCreateInput = await req.json();

        if (
            !body ||
            !body.effective_date ||
            body.new_rent_price === undefined ||
            body.new_rent_price === null
        ) {
            return badRequestResponse(
                "Vui lòng cung cấp ngày hiệu lực và giá phòng mới",
            );
        }

        const input: Prisma.contract_price_adjustmentsCreateInput = {
            ...body,
            rental_contracts: {
                connect: {id: contract_id}
            }
        }

        const price_ajustment = await priceAjustmentService.createPriceAjustment(input);

        return NextResponse.json<ApiResponse<typeof price_ajustment>>(
            {
                success: true,
                message: "Tạo mới thay đổi giá phòng thành công",
                data: serializeBigInt(price_ajustment),
            },
            {
                status: 201,
            },
        )
    } catch (error) {
        if (error instanceof Error && error.message === "ROOM_EXISTS") {
            return NextResponse.json<ApiResponse<null>>(
                {
                success: false,
                message: "Trùng lặp!",
                data: null,
                },
                {
                status: 409,
                },
            );
        }

        if (error instanceof Error && error.message === "RENTAL_CONTRACT_NOT_FOUND") {
            return NextResponse.json<ApiResponse<null>>(
                {
                success: false,
                message: "Không tìm thấy hợp đồng cần giá điều chỉnh!",
                data: null,
                },
                {
                status: 409,
                },
            );
        }
        return serverErrorResponse();
    }
}

export async function GET(req: NextRequest, { params }: routeContext) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = Number(searchParams.get("page"));
        const limitParam = Number(searchParams.get("limit"));

        const { id } = await params;
        const contract_id = parseId(id);

        // Tránh lỗi nhập ký tự thì cho về 1 hết
        const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

        // Giới hạn giá trị 100 mẫu tin tránh limit=1000000
        const limit =
        Number.isInteger(limitParam) && limitParam > 0
            ? Math.min(limitParam, 100)
                : 10;
        if (contract_id === null) {
             return invalidIdResponse();
        }
        const price_ajustments = await priceAjustmentService.getPriceAjustment({ contract_id, page, limit })
        
        return NextResponse.json<ApiResponse<PaginationResult<contract_price_adjustments>>>(
            {
                success: true,
                message: "Lấy danh sách điều chỉnh thành công",
                data: serializeBigInt(price_ajustments),
            },
            { status: 200 },
        )
    } catch (error) {
        return serverErrorResponse();
    }
}