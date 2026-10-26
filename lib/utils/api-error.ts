import { NextResponse } from "next/server";
import type { ApiResponse } from "../types/api.type";
import { serializeBigInt } from "./serialize";

// hàm trả về khi lỗi derver
export function serverErrorResponse() {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      message: "Lỗi server!",
      data: null,
    },
    {
      status: 500,
    },
  );
}

export function badRequestResponse(message: string = "Dữ liệu không hợp lệ") {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      message,
      data: null,
    },
    { status: 400 },
  );
}


export function apiErrorResponse(message: string, status: number) {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      message: message,
      data: null,
    },
    {status: status},
  )
}

export function apiSuccessResponse<T>(message: string, data: T, status: number) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      message: message,
      data: serializeBigInt(data),
    },
    {status: status},
  )
}