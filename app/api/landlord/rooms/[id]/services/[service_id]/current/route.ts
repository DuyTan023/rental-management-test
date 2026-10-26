// api/app/landlord/rooms/[id]/services/[service_id]/current/route.ts
// Lấy giá dịch vụ đang áp dụng của phòng

import { NextRequest } from "next/server";
import { roomServiceRouteContext } from "../route";
import { parseId } from "@/lib/utils/function";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { roomServiceService } from "@/lib/api/services/services/room_service.service";

export async function GET(req: NextRequest, {params}: roomServiceRouteContext) {
    try {
        const { id, service_id } = await params;
        const roomId = parseId(id);
        const serviceId = parseId(service_id);

        if (roomId === null || serviceId === null) {
            return apiErrorResponse("Dữ liệu phòng hoặc dịch vụ không hợp lệ!", 400)
        }

        const room_service = await roomServiceService.getCurrentRoomService(roomId, serviceId);

        return apiSuccessResponse("Lấy giá dịch vụ hiện tại được áp dụng thành công", room_service, 200);
    } catch (error) {
        if (error instanceof Error && error.message === "ROOM_SERVICE_NOT_FOUND") {
            return apiErrorResponse("Không tìm thấy dịch vụ phòng", 404);
        }
        return serverErrorResponse();
    }
}