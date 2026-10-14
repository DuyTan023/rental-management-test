import type { deposit_transactions, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { contract_deposits } from "./../../../../generated/prisma/client";

export type CreateFullContractDepositParams = {
  // loại bỏ status sẽ gán trạng thái trực tiếp
  inputContractDeposit: Omit<
    Prisma.contract_depositsCreateInput,
    "status" | "received_date"
  >;

  // loại bỏ contract_deposits vì sẽ lấy ở trên và type sẽ nhập trực tiếp
  inputDepositTransactions: Omit<
    Prisma.deposit_transactionsCreateInput,
    "contract_deposits" | "type"
  >;
};

export type UpdateFullContractDepositParams = {
  id: bigint;
  inputContractDeposit: Prisma.contract_depositsUpdateInput;
  inputDepositTransaction: Omit<
    Prisma.deposit_transactionsCreateInput,
    "contract_deposits"
  >;
};
export const contractDepositRepository = {
  createContractDeposit: async (
    params: CreateFullContractDepositParams,
  ): Promise<{
    contract_deposit: contract_deposits;
    deposit_transaction: deposit_transactions;
  }> => {
    const result = await prisma.$transaction(async (tx) => {
      const contract_deposit = await tx.contract_deposits.create({
        data: {
          ...params.inputContractDeposit,
          status: "RECEIVED", // trạng thái đã thu
          received_date: new Date(), // ngày hiện tại
        },
      });

      const deposit_transaction = await tx.deposit_transactions.create({
        data: {
          ...params.inputDepositTransactions,
          contract_deposits: {
            // lấy contract_deposit ở trên
            connect: { id: contract_deposit.id },
          },
          type: "COLLECT", // loại giao dịch thu tiền
        },
      });

      return { contract_deposit, deposit_transaction };
    });
    return result;
  },

  findDepositByContractId: async (
    contract_id: bigint,
  ): Promise<contract_deposits | null> => {
    return await prisma.contract_deposits.findFirst({
      where: { contract_id },
      include: {
        rental_contracts: true,
        //deposit_transactions: true,
      },
    });
  },

  findById: async (id: bigint): Promise<contract_deposits | null> => {
    return prisma.contract_deposits.findUnique({
      where: { id },
    });
  },
  updateContractDeposit: async (
    params: UpdateFullContractDepositParams,
  ): Promise<{
    contract_deposit: contract_deposits;
    deposit_transaction: deposit_transactions;
  }> => {
    const result = await prisma.$transaction(async (tx) => {
      const contract_deposit = await tx.contract_deposits.update({
        where: { id: params.id },
        data: params.inputContractDeposit,
      });
      const deposit_transaction = await tx.deposit_transactions.create({
        data: {
          ...params.inputDepositTransaction,
          contract_deposits: {
            connect: { id: contract_deposit.id },
          },
        },
      });

      return { contract_deposit, deposit_transaction };
    });
    return result;
  },
};