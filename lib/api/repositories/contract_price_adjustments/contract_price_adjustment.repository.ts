import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Decimal } from "@prisma/client/runtime/client";
import { contract_price_adjustments } from "./../../../../generated/prisma/client";
type FindManyResultPriceAdjustment = {
  contract_price_adjustments: contract_price_adjustments[];
  total: number;
};
// Lịch sử thay đổi tiền phòng theo hợp đồng (lưu giá phòng đểáp dụng cho hóa đơn)
export const contractPriceAdjustmentRepository = {
  // Tạo mới điều chỉnh tiền phòng
  createPriceAdjustment: async (
    input: Prisma.contract_price_adjustmentsCreateInput,
  ): Promise<contract_price_adjustments> => {
    return prisma.contract_price_adjustments.create({
      data: input,
    });
  },

  // Lấy danh sách điều chỉnh có phân trang
  findMany: async (
    contract_id: bigint,
    page = 1,
    limit = 10,
  ): Promise<FindManyResultPriceAdjustment> => {
    const skip = (page - 1) * limit;

    const [contract_price_adjustments, total] = await prisma.$transaction([
      prisma.contract_price_adjustments.findMany({
        where: { contract_id: contract_id },
        skip,
        take: limit,
        orderBy: {
          effective_date: "desc",
        },
      }),
      prisma.contract_price_adjustments.count({
        where: { contract_id: contract_id },
      }),
    ]);
    return { contract_price_adjustments, total };
  },

  // Lấy giá phòng đang áp dụng cho hợp đồng tại 1 thời điểm

  findRentPrice: async (
    contract_id: bigint,
    effectiveDate: Date,
  ): Promise<Decimal | null> => {
    const rent_price = await prisma.contract_price_adjustments.findFirst({
      where: {
        contract_id: contract_id,
        effective_date: {
          lte: effectiveDate,
        },
      },
      select: {
        new_rent_price: true,
      },
      orderBy: {
        effective_date: "desc",
      },
    });
    return rent_price?.new_rent_price ?? null;
  },
};