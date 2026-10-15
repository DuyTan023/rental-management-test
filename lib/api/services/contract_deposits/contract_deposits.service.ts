import { Prisma } from "@/generated/prisma/client";
import {
  contractDepositRepository,
  type CreateFullContractDepositParams,
} from "../../repositories/contract_deposits/contract_deposits.repository";
export type deductDepositInput = {
  id: bigint;
  amount: Prisma.Decimal; // số tiền cần khấu trừ
  reason: string; // lý do kháu trừ
  createdBy?: bigint; // người thực hiện khấu trừ (chủ trọ)
};
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
  deductDeposit: async (
    deductDeposit: deductDepositInput
  ) => {
    try {

      const id = deductDeposit.id;
      const amount = deductDeposit.amount;
      const reason = deductDeposit.reason;
      const createdBy = deductDeposit?.createdBy;
      // Lấy khoản cọc + kiểm tra sự tồn tại
      const deposit = await contractDepositRepository.findById(id);
      if (!deposit) throw new Error("CONTRACt_DEPOSIT_NOT_FOUND")
      
      // Kiểm tra số tiền khấu trừ nhập vào phải lớn hơn 0
      if (amount.lte(0)) throw new Error("INVALID_DEDUCT_AMOUNT")
      
      // Ràng buộc phải có lý do khấu trừ
      if (!reason.trim()) throw new Error("DEDUCTION_REASON_REQUIRED")
      
      // KIểm tra được khấu trừ hay không (trạng thái cọc "Đã nhận" hoặc "Khấu trừ 1 phần") mới đc khấu trừ tiếp
      if (deposit.status !== "RECEIVED" && deposit.status !== "PARTIALLY_DEDUCTED") throw new Error("INVALID_DEPOSIT_STATUS")
      
      // Chuẩn hóa các giá trị tiền về Prisma.Decimal
      const initialAmount = new Prisma.Decimal(deposit.initial_amount.toString(),); // Số cọc bann đầu
      const refundedAmount = new Prisma.Decimal(deposit.refunded_amount.toString(),); // Số tiền đã hoàn (không có thì mặc định là 0)
      const deductedAmount = new Prisma.Decimal(deposit.deducted_amount.toString(),); // Số tiền đã khấu trừ tính đến thời điểm hiện tại

      // TIền còn lại = tiền cọc - tiền đã hoàn trả(nếu có) - tiền đã khấu trừ
      const remainingAmount = initialAmount.minus(refundedAmount).minus(deductedAmount);

      // KIểm tra số dư sau khi khấu trừ nếu < 0 báo lỗi 
      if (remainingAmount.lte(0)) throw new Error("NO_DEPOSIT_BALANCE")
      
      // Ràng buộc số tiền cần khấu trừ không đc vượt quá số dư hiện tại 
      if (amount.gt(remainingAmount)) throw new Error("DEDUCT_AMOUNT_EXCEEDS_REMAINING")
      
      // Tính tổng khấu trừ Số tiền đã khấu trừ + khấu trừ mới 
      const newDeductedAmount = deductedAmount.plus(amount);

      // Số dư mới  = tổng cọc - khấu trừ mới - tiền đã hoàn (nếu có)
      const newRemainingAmount = initialAmount.minus(newDeductedAmount).minus(refundedAmount);

      // Xác định trạng thái sau khi khấu trừ (Khấu trừ 1 phần  - khấu trừ toàn bộ - quyết toán)
      let newStatus:
        | "PARTIALLY_DEDUCTED"
        | "FULLY_DEDUCTED"

      if (newRemainingAmount.isZero()) { // Số dư mới sau khấu trừ về 0
        newStatus = "FULLY_DEDUCTED"
      } else { // Số dư tiền cọc vần còn (khấu trừ 1 phần)
        newStatus = "PARTIALLY_DEDUCTED"
      }

      // Cập nhật khoản cọc và tạo lịch sử giao dịch
      return contractDepositRepository.updateContractDeposit({
        id,
        inputContractDeposit: {
          deducted_amount: newDeductedAmount,
          deduction_reason: reason.trim(),
          status: newStatus,
        },
        inputDepositTransaction: {
          type: "DEDUCT",
          amount,
          description: reason.trim(),
          ...(createdBy !== undefined
            ? {
                users: {
                  connect: { id: createdBy },
                },
              }
            : {}),
        }
    })
     } catch (error) {
        if (
          error instanceof Error &&
          [
            "CONTRACT_DEPOSIT_NOT_FOUND",
            "INVALID_DEDUCT_AMOUNT",
            "DEDUCTION_REASON_REQUIRED",
            "INVALID_DEPOSIT_STATUS",
            "NO_DEPOSIT_BALANCE",
            "DEDUCT_AMOUNT_EXCEEDS_REMAINING",
          ].includes(error.message)
        ) {
          throw error;
        }
      throw new Error("SERVER_ERROR");
    }
  },
  // Điều chỉnh cọc
  //adjustDeposit()

  // Tất toán cọc
  settleDeposit: async (
    id: bigint, 
    createdBy?: bigint // người thực hiện quyết toán (chủ trọ)
  ) => {
    try {
      // Lấy khoản cọc  + kiểm tra sự tồn tại
      const deposit = await contractDepositRepository.findById(id);
      if (!deposit) throw new Error("CONTRACT_DEPOSIT_NOT_FOUND")
      
      // KIểm tra có hoàn tiền cọc hay không (chỉ trạng thái đã nhận hoặc khấu trừ 1 phần mới hoàn lại khi quyết toán)
      if (deposit.status !== "RECEIVED" && deposit.status !== "PARTIALLY_DEDUCTED") throw new Error("INVALID_DEPOSIT_STATUS")
      
      
      //Chuẩn hóa các giá trị tiền về Prisma.Decimal
      const initialAmount   = new Prisma.Decimal(deposit.initial_amount.toString(),); // Tông tiền cọc theo hợp đồng đã giao dịch
      const deductedAmount = new Prisma.Decimal(deposit.deducted_amount.toString(),); // Tiền đã khấu trừ nếu có
      
      // Số dư còn lại cần hoàn trả khi quyết toán
      const remainingAmount = initialAmount.minus(deductedAmount);

      // Kiểm tra coi kết kết quả không cho phép số dư âm
      if (remainingAmount.lt(0)) throw new Error("NO_DEPOSIT_BALANCE")
      
      // Cập nhật tiền cần hoàn trả sau quyết toán Tiền hoàn trả  = tổng cọc ban đầu - tổng khấu trừ
      const refundedAmount = remainingAmount
      
      // Cập nhật thông tin cọc đã quyết toán + tiền hoàn trả nếu có , tạo 1 lịch sử giao dịch cọc đã hoàn tiền 
      return await contractDepositRepository.updateContractDeposit({
        id,
        inputContractDeposit: {
          refunded_amount: refundedAmount,
          status: "SETTLED",
          settled_date: new Date(),
        },
        inputDepositTransaction: {
          type: "REFUND",
          amount:refundedAmount,
          ...(createdBy !== undefined
            ? {
                users: {
                  connect: { id: createdBy },
                },
              }
            : {}),
        }
      });
    } catch (error) {
        if (
            error instanceof Error &&
            [
              "CONTRACT_DEPOSIT_NOT_FOUND",
              "INVALID_DEPOSIT_STATUS",
              "NO_DEPOSIT_BALANCE",
            ].includes(error.message)
          ) {
            throw error;
          }
      throw new Error("SERVER_ERROR");
    } 
  },
};