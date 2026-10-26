// api/app/landlord/rooms/[id]/services/route.ts

import { Prisma } from "@/generated/prisma/client";
import { roomServiceService } from "@/lib/api/services/services/room_service.service";
import { ApiResponse, routeContext } from "@/lib/types/api.type";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { NextRequest, NextResponse } from "next/server";

// Thêm mới 1 dịch vụ vào phòng
export async function POST(req: NextRequest, { params }: routeContext) {
    try {
        // Lấy id phòng
        const { id } = await params;
        const room_id = parseId(id);

        if (room_id === null) {
            return invalidIdResponse();
        }

        const body = await req.json();
        const service_id = parseId(body.service_id);

        if (service_id === undefined) {
            return invalidIdResponse();
        }
        const param: Prisma.room_servicesCreateInput = {
            ...body,
            rooms: { connect: { id: room_id } },
            services: { connect:  {id: service_id}},
            unit_price: body.unit_price,
            effective_from: new Date(),
            effective_to: null,
        }
        const room_service = await roomServiceService.createRoomService(param)

        return apiSuccessResponse("Thêm dịch vụ vào phòng thành công", room_service, 201);
    } catch (error) {
        if (error instanceof Error && error.message === "INVALID_UNIT_PRICE") {
            return apiErrorResponse("Giá tiền không hợp lệ", 400)
        }

        if (error instanceof Error && error.message === "ROOM_SERVICE_EXISTS") {
            return apiErrorResponse("Thông tin đã bị trùng", 409)
        }

        if (error instanceof Error && error.message === "ROOM_SERVICE_NOT_FOUND") {
            return apiErrorResponse("Không tìm thấy thông tin", 404)
        }

        return serverErrorResponse();
    }
}