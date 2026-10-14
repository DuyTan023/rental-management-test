import { Prisma } from "@/generated/prisma/client";
import {
  contractDepositRepository,
  type CreateFullContractDepositParams,
} from "../../repositories/contract_deposits/contract_deposits.repository";

export const contractDepositService = {
  createContractDeposit: async (params: CreateFullContractDepositParams) => {
    try {
      return await contractDepositRepository.createContractDeposit(params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // lỗi trung lặp
        if (error.code === "P2002") {
          throw new Error("CONTRACT_DEPOSIT_EXISTS");
        }
      }

      throw new Error("SERVER_ERROR");
    }
  },

  getById: async (contract_id: bigint) => {
    try {
      const contract_deposit =
        await contractDepositRepository.findDepositByContractId(contract_id);
      if (!contract_deposit) throw new Error("CONTRACT_DEPOSIT_NOT_FOUND");
      return contract_deposit;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "CONTRACT_DEPOSIT_NOT_FOUND"
      ) {
        throw error;
      }
      throw new Error("SERVER_ERROR");
    }
  },

  // Cập nhật thu tiền cọc
  collectDeposit: async (
    id: bigint,
    amount: Prisma.Decimal,
    description: string,
    createdBy?: bigint,
  ) => {
    try {
      // 1. Kiểm tra khoản tiền cọc
      const deposit = await contractDepositRepository.findById(id);

      if (!deposit) {
        throw new Error("CONTRACT_DEPOSIT_NOT_FOUND");
      }

      // 2. Kiểm tra số tiền
      if (amount.lte(0)) {
        throw new Error("INVALID_COLLECT_AMOUNT");
      }

      // 3. Chỉ cho phép thu khi chưa nhận tiền cọc
      if (deposit.status !== "NOT_RECEIVED") {
        throw new Error("DEPOSIT_ALREADY_RECEIVED");
      }

      // 4. Cập nhật tiền cọc và ghi lịch sử thu tiền
      return await contractDepositRepository.updateContractDeposit({
        id,
        inputContractDeposit: {
          initial_amount: {
            increment: amount,
          },
          status: "RECEIVED",
          received_date: new Date(),
        },
        inputDepositTransaction: {
          type: "COLLECT",
          amount,
          description,
          ...(createdBy !== undefined
            ? {
                users: {
                  connect: { id: createdBy },
                },
              }
            : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "CONTRACT_DEPOSIT_NOT_FOUND",
          "INVALID_COLLECT_AMOUNT",
          "DEPOSIT_ALREADY_RECEIVED",
        ].includes(error.message)
      ) {
        throw error;
      }

      throw new Error("SERVER_ERROR");
    }
  },

  // Khấu trừ cọc
  // deductDeposit(),

  // Hoàn cọc
  // refundDeposit(),

  // Điều chỉnh cọc
  //adjustDeposit()

  // Tất toán cọc
  //settleDeposit(),
};