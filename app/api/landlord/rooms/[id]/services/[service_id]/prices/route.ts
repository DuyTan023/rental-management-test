// api/app/landlord/rooms/[id]/services/[service_id]/prices/route.ts
// Thay đổi giá của dịch vụ phòng (điều chỉnh tăng giá)

import { NextRequest } from "next/server";
import { roomServiceRouteContext } from "../route";
import { parseId } from "@/lib/utils/function";
import { apiErrorResponse, apiSuccessResponse, serverErrorResponse } from "@/lib/utils/api-error";
import { roomServiceService } from "@/lib/api/services/services/room_service.service";

export async function POST(req: NextRequest, { params }: roomServiceRouteContext) {
    try {
        const { id, service_id } = await params;
        const roomId = parseId(id);
        const serviceId = parseId(service_id);

        if (roomId === null || serviceId === null) {
            return apiErrorResponse("Dữ liệu phòng hoặc dịch vụ không hợp lệ!", 400)
        }

        const body = await req.json();
        if (body.unit_price === undefined || body.effective_from === undefined) {
            return apiErrorResponse("Vui lòng nhập giá mới và ngày bắt đầu áp dụng!", 400);
        }

        const unit_price = Number(body.unit_price);
        if (!Number.isFinite(unit_price) || unit_price < 0) {
            return apiErrorResponse("Giá dịch vụ không hợp lệ!", 400);
        }
        const effective_from = new Date(body.effective_from);
        if (Number.isNaN(effective_from.getTime())) {
            return apiErrorResponse("Ngày bắt đầu áp dụng không hợp lệ!", 400);
        }

        const room_service = await roomServiceService.changeRoomServicePrice(roomId, serviceId, unit_price, effective_from);

        return apiSuccessResponse("Điều chỉnh giá dịch vụ của phòng thành công", room_service, 200);
    } catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case "INVALID_UNIT_PRICE":
                    return apiErrorResponse(
                        "Giá dịch vụ không hợp lệ!",
                        400
                    );

                case "INVALID_DATE":
                    return apiErrorResponse(
                        "Ngày bắt đầu áp dụng không hợp lệ!",
                        400
                    );

                case "INVALID_EFFECTIVE_DATE":
                    return apiErrorResponse(
                        "Ngày bắt đầu áp dụng giá mới phải sau ngày bắt đầu của giá hiện tại!",
                        400
                    );

                case "ROOM_SERVICE_NOT_FOUND":
                    return apiErrorResponse(
                        "Không tìm thấy dịch vụ đang áp dụng cho phòng!",
                        404
                    );

                case "ROOM_OR_SERVICE_NOT_FOUND":
                    return apiErrorResponse(
                        "Không tìm thấy phòng hoặc dịch vụ liên quan!",
                        404
                    );

                case "ROOM_SERVICE_EXISTS":
                    return apiErrorResponse(
                        "Bản ghi giá dịch vụ đã tồn tại!",
                        409
                    );

                case "SERVER_ERROR":
                    return serverErrorResponse();
            }
        }
        return serverErrorResponse();
    }
}