import { contract_price_adjustments, Prisma } from "@/generated/prisma/client";
import { PaginationResult } from "@/lib/types/api.type";
import { contractPriceAdjustmentRepository } from "../../repositories/contract_price_adjustments/contract_price_adjustment.repository";
import { Decimal } from "@prisma/client/runtime/client";
import { prisma } from "@/lib/prisma";

type GetPriceAjustmentsParams = {
  contract_id: bigint;
  page?: number;
  limit?: number;
};

export const priceAjustmentService = {
    // Lấy danh sách lịch sử điều chỉnh giá phòng theo hợp đồng
    getPriceAjustment: async ({
        contract_id,
        page = 1,
        limit = 10,
    }: GetPriceAjustmentsParams): Promise<PaginationResult<contract_price_adjustments>> => {
        try {
            const { contract_price_adjustments, total } = await contractPriceAdjustmentRepository.findMany(contract_id, page, limit);
            return {
                data: contract_price_adjustments,
                total: total,
                page: page,
                limit: limit,
                totalPage: Math.ceil(total/limit),
            }
        } catch (error) {
            throw new Error("SERVER_ERROR");
        }
    },

    // Tạo mới phiên điều chỉnh giá phòng theo hợp đồng
    createPriceAjustment: async (input: Prisma.contract_price_adjustmentsCreateInput): Promise<contract_price_adjustments> => {
        try {
            return await contractPriceAdjustmentRepository.createPriceAdjustment(input);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                // lỗi trung lặp
                if (error.code === "P2002") {
                    throw new Error("ROOM_EXISTS");
                } else if (error.code === "P2003") {
                    throw new Error("RENTAL_CONTRACT_NOT_FOUND");
                }
            }

            throw new Error("SERVER_ERROR");
        } 
    },

    //Lấy giá phòng đang áp dụng cho hợp đồng tại 1 thời điểm
    getRentPrice: async (contract_id: bigint, effectiveDate: Date,): Promise<Decimal> => {
        try {
            // Gọi hàm repository lấy giá hiện tại mới nhất theo thời gian
            const adjustedPrice =
                await contractPriceAdjustmentRepository.findRentPrice(
                    contract_id,
                    effectiveDate,
                );

            // nếu có kết quả trả về ngay
            if (adjustedPrice !== null) {
                return adjustedPrice;
            }

            // Nếu chưa có điều chỉnh giá thì lấy mặc định của hợp đồng
            const contract = await prisma.rental_contracts.findUnique({
                where: { id: contract_id },
                select: { rent_price: true },
            });

            if (!contract) {
                throw new Error("RENTAL_CONTRACT_NOT_FOUND");
            }

            return contract.rent_price;
        } catch (error) {
            if (error instanceof Error &&
                error.message === "RENTAL_CONTRACT_NOT_FOUND") {
            throw error;
    }
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                // lỗi
                if (error.code === "P2003") {
                    throw new Error("FOREIGN_KEY_CONSTRAINT");
                }
            }

            throw new Error("SERVER_ERROR");
        }
    }
}