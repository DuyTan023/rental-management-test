import { prisma } from "@/lib/prisma";
import { deposit_transactions } from "./../../../../generated/prisma/browser";

type FindManyResultDepositTransaction = {
  deposit_transactions: deposit_transactions[];
  total: number;
};

export const depositTransactionRepository = {
  // lấy danh sách lịch sử giao dịch tiền cọc theo hợp đồng có phân trang
  findMany: async (
    contract_deposit_id: bigint,
    page = 1,
    limit = 10,
  ): Promise<FindManyResultDepositTransaction> => {
    const skip = (page - 1) * limit;

    const [deposit_transactions, total] = await prisma.$transaction([
      prisma.deposit_transactions.findMany({
        where: { contract_deposit_id: contract_deposit_id },
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),

      prisma.deposit_transactions.count({
        where: { contract_deposit_id: contract_deposit_id },
      }),
    ]);

    return { deposit_transactions, total };
  },
  // lấy chi tiết giao dịch tiền cọc theo id

  findById: async (id: bigint): Promise<deposit_transactions | null> => {
    return prisma.deposit_transactions.findUnique({
      where: { id },
    });
  },
};