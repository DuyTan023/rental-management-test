// // Thêm dịch vụ vào phòng
// // Lấy dịch vụ và giá của phòng hỗ trợ lọc theo ngày áp dụng
// // Cập nhật giá riêng của phòng
// // Ngừng áp đụng dịch vụ cho phòng

import { Prisma, room_services } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
type Tx = Prisma.TransactionClient;
export const roomServiceRepository = {
  // Thêm 1 dịch vụ vào phòng
  createRoomService: async (
    input: Prisma.room_servicesCreateInput,
  ): Promise<room_services> => {
    return prisma.room_services.create({
      data: input,
    });
  },

  // Lấy dịch vụ và giá dịch vụ của phòng theo ngày áp dụng dùng trong hóa đơn trễ (trường hợp đặc biệt hoặc tìm kiếm)

  findByRoomId: async (
    room_id: bigint,
    service_id: bigint,
    date: Date,
  ): Promise<room_services | null> => {
    return prisma.room_services.findFirst({
      where: {
        room_id,
        service_id,
        effective_from: {
          lte: date, // ngày bắt đầu áp dụng phải nhoe hơn hoặc bằng ngày kiểm tra
        },
        OR: [
          { effective_to: null }, // Chưa xác định đc ngày kết thúc áp dụng -> đang được áp dụng
          { effective_to: { gte: date } }, // Ngày kết thúc >= ngày kiểm tra
        ],
      },
      orderBy: {
        effective_from: "desc",
      },
    });
  },

  findById: async (id: bigint): Promise<room_services | null> => {
    return prisma.room_services.findUnique({
      where: { id },
    });
  },

  // Tìm giá đang được áp dụng cho dịch vụ của phòng
  findCurrentRoomService: async (
    room_id: bigint,
    service_id: bigint,
    tx: Tx = prisma,
  ): Promise<room_services | null> => {
    return tx.room_services.findFirst({
      where: {
        room_id,
        service_id,
        effective_to: null,
      },
      orderBy: {
        effective_from: "desc",
      },
    });
  },

  // Đóng thời gian áp dụng giá cũ (khi cập nhật giá mới thì thêm 1 cái lịch sử mới -> phải đóng tg áp dụng lại giá hiện tại )
  updateEffectiveTo: async (
    id: bigint,
    effective_to: Date,
    tx: Tx = prisma,
  ): Promise<room_services> => {
    return tx.room_services.update({
      where: { id },
      data: {
        effective_to: effective_to,
      },
    });
  },

  //Tạo bảng ghi giá mới áp dụng khi tăng hoặc giảm tiền dịch vụ của phòng mỗi khi điều chỉnh sẽ tạo 1 bảng ghi đông thời cũng đóng vai trò lịch sử điều chỉnh giá của phòng
  createNewRoomServicePrice: async (
    room_id: bigint,
    service_id: bigint,
    unit_price: number,
    effective_from: Date,
    tx: Tx = prisma,
  ): Promise<room_services> => {
    return tx.room_services.create({
      data: {
        room_id,
        service_id,
        unit_price,
        effective_from,
        effective_to: null,
      },
    });
  },

  // Ngừng áp dụng dịch vụ cho phòng bằng cách cập nhật ngày kết thúc
  stopRoomService: async (
    id: bigint,
    effective_to: Date,
  ): Promise<room_services> => {
    return prisma.room_services.update({
      where: { id },
      data: { effective_to },
    });
  },
};
