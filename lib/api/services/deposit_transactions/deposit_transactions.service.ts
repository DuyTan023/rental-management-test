import { deposit_transactions } from "@/generated/prisma/client";
import { PaginationResult } from "@/lib/types/api.type";
import { depositTransactionRepository } from "../../repositories/deposit_transactions/deposit_transactions.repository";

type GetDepositTransactionParams = {
    contract_deposit_id: bigint,
    page?: number;
    limit?: number;
};

export const depositTransactionService = {
    getDepositTransaction: async ({
        contract_deposit_id,
        page = 1,
        limit = 10,
    }: GetDepositTransactionParams): Promise<PaginationResult<deposit_transactions>> => {
        try {
            const { deposit_transactions, total } = await depositTransactionRepository.findMany(
                contract_deposit_id,
                page,
                limit,
            );
            return {
                data: deposit_transactions,
                total: total,
                page: page,
                limit: limit,
                totalPage: Math.ceil(total / limit),
            }
        } catch (error) {
            throw new Error("SERVER_ERROR");
        }
    },

    getById: async (id: bigint): Promise<deposit_transactions> => {
        try {
            const deposit_transaction = await depositTransactionRepository.findById(id);
            
            if (!deposit_transaction) throw new Error("DEPOSIT_TRANSACTION_NOT_FOUND");

            return deposit_transaction;
        } catch (error) {
            if (error instanceof Error && error.message === "DEPOSIT_TRANSACTION_NOT_FOUND") {
                throw error;
            }   
            throw new Error("SERVER_ERROR")
        }
    },
}