//// Tạp dịch vụ
// Lấy danh sách dịch vụ
// Xem chi tiết dịch vụ
// Cập nhật thông tin dịch vụ và giá mặc định
// Ngừng cung cấp hoặc kích hoạt bật // tắt

import type { Prisma, services } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const serviceRepository = {
  //Tạo mới 1 dịch vụ
  createService: async (
    input: Prisma.servicesCreateInput,
  ): Promise<services> => {
    return prisma.services.create({
      data: input,
    });
  },

  // Lấy danh sách các dịch vụ
  findMany: async (): Promise<services[]> => {
    return prisma.services.findMany({
      orderBy: { id: "asc" },
    });
  },

  // Lấy dịch vụ theo id
  findById: async (id: bigint): Promise<services | null> => {
    return prisma.services.findUnique({
      where: { id },
    });
  },

  // Cập nhật thông tin dịch vụ và giá mặc định
  updateService: async (
    id: bigint,
    input: Prisma.servicesUpdateInput,
  ): Promise<services> => {
    return prisma.services.update({
      where: { id },
      data: input,
    });
  },

  // Ngừng cug cấp hoặc kích hoạt
  isActive: async (id: bigint, is_active: boolean): Promise<services> => {
    return prisma.services.update({
      where: { id },
      data: {
        is_active: is_active,
      },
    });
  },
};