// api/app/landlord/rooms/[id]/services/[service_id]/route.ts

import { roomServiceService } from "@/lib/api/services/services/room_service.service";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { NextRequest} from "next/server";

// Lấy giá dịch vụ của phòng theo ngày
export type roomServiceRouteContext = {
  params: Promise<{
    id: string;
    service_id: string;
  }>;
};

export async function GET(req: NextRequest, { params }: roomServiceRouteContext) {
    try {
        const { id, service_id } = await params;
        
        const roomId = parseId(id);
        const serviceId = parseId(service_id);

        if (roomId === null || serviceId === null) {
            return invalidIdResponse();
        }

        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date");

        if (!dateParam) {
            return apiErrorResponse("Vui lòng cung cấp ngày cần tra cứu", 400)
        }

        const date = new Date(dateParam);

        // Kiểm tra ngày hợp lệ
        if (Number.isNaN(date.getTime())) {
            return apiErrorResponse("Dữ liệu không hợp lệ", 400)
        }

        const room_service = await roomServiceService.getRoomServiceByDate(roomId, serviceId, date);

        return apiSuccessResponse("Lấy dịch vụ theo ngày tháng thành công", room_service, 200)
   
    } catch (error) {
        if (error instanceof Error && error.message === "ROOM_SERVICE_NOT_FOUND") {
            return apiErrorResponse("Không tìm thấy dịch vụ phòng", 404);
        }

        if (error instanceof Error && error.message === "INVALID_DATE") {
            return apiErrorResponse("Ngày không hợp lệ", 400)
        }
        return serverErrorResponse();
    }
}


