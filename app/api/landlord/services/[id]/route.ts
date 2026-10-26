// api/app/landlord/service/[id]/route.ts

import { Prisma } from "@/generated/prisma/client";
import { serviceService } from "@/lib/api/services/services/service.service";
import type { ApiResponse, routeContext } from "@/lib/types/api.type";
import { serverErrorResponse } from "@/lib/utils/api-error";
import { invalidIdResponse, parseId } from "@/lib/utils/function";
import { serializeBigInt } from "@/lib/utils/serialize";
import { NextResponse, type NextRequest } from "next/server";

// Lấy dịch vụ theo id
// Cập nhật thông tin dịch vụ
// Bật tắt dịch vụ

// Lấy dịch vụ theo id
export async function GET(req: NextRequest, { params }: routeContext) {
  try {
    const { id } = await params;
    const serviceId = parseId(id);

    if (serviceId === null) {
      return invalidIdResponse();
    }

    const service = await serviceService.getServiceById(serviceId);

    return NextResponse.json<ApiResponse<typeof service>>(
      {
        success: true,
        message: "Lấy dịch vụ thành công",
        data: serializeBigInt(service),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SERVICE_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy dịch vụ",
          data: null,
        },
        { status: 404 },
      );
    }

    return serverErrorResponse();
  }
}

// Cập nhật thông tin dịch vụ
export async function PUT(req: NextRequest, {params}: routeContext) {
  try {
    // Lấy id dịch vụ
    const { id } = await params;
    const service_id = parseId(id)

    if (service_id === null) {
      return invalidIdResponse();
    }

    const body: Prisma.servicesUpdateInput = await req.json();

    const service = await serviceService.updateService(service_id, body);

    return NextResponse.json<ApiResponse<typeof service>>(
      {
        success: true,
        message: "Cập nhật dịch vụ thành công",
        data: serializeBigInt(service),
      }, 
      {status: 200}
    )
  } catch (error) {
    if (error instanceof Error && error.message === "SERVICE_EXISTS") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Service đã có thông tin trùng!",
          data: null,
        },
        {status: 409},
      )
    }

    if(error instanceof Error && error.message === "SERVICE_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy dịch vụ cần cập nhật!",
          data: null,
        },
        {status: 404},
      )
    }

    return serverErrorResponse();
  }
}

// Bật tắt dịch vụ
export async function PATCH(req: NextRequest, {params}: routeContext) {
  try {
    // Lấy id dịch vụ
    const { id } = await params;
    const service_id = parseId(id)

    if (service_id === null) {
      return invalidIdResponse();
    }

    const body: boolean = await req.json();

    const service = await serviceService.isActiveService(service_id, body);

    return NextResponse.json<ApiResponse<typeof service>>(
      {
        success: true,
        message: "Cập nhật dịch vụ thành công!",
        data: serializeBigInt(service),
      },
      {status: 200},
    ) 
  } catch (error) {
      if(error instanceof Error && error.message === "SERVICE_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          message: "Không tìm thấy dịch vụ cần cập nhật!",
          data: null,
        },
        {status: 404},
      )
    }

    return serverErrorResponse();
  }
}

