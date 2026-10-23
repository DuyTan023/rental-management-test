//api/app/landlord/service/route.ts

import { Prisma, services } from "@/generated/prisma/client";
import { serviceService } from "@/lib/api/services/services/service.service";
import { ApiResponse } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { NextRequest, NextResponse } from "next/server";

//Lấy danh sách dịch vụ
export async function GET(req: NextRequest) {
    try {
        const services = await serviceService.getService();
        return NextResponse.json<ApiResponse<services[]>>(
            {
                success: true,
                message: "Lấy danh sách dịch vụ thành công!",
                data: services,
            },
            {
                status: 200
            },
        )
    } catch (error) {
        return serverErrorResponse();
    }
}

// Tạo mới 1 dịch vụ
export async function POST(req: NextRequest) {
    try {
        const body: Prisma.servicesCreateInput = await req.json();
        const service = await serviceService.createService(body);

        return NextResponse.json<ApiResponse<typeof service>>(
            {
                success: true,
                message: "Thêm mới 1 dịch vụ thành công",
                data: service,
            },
            {status: 201}
        )
    } catch (error) {
        if (error instanceof Error && error.message === "SERVICE_EXISTS") {
            return NextResponse.json<ApiResponse<null>>(
                {
                    success: false,
                    message: "Dịch vụ đã tồn tại",
                    data: null,
                },
                { status: 409 },
            );
        }

        return serverErrorResponse();
    }
}

