import { Prisma, services } from "@/generated/prisma/client";
import { serviceRepository } from "../../repositories/services/service.repository";

export const serviceService = {
    // Lấy danh sách dịch vụ
    getService: async (): Promise<services[]> => {
        try {
            return await serviceRepository.findMany();
        } catch (error) {
            throw new Error("SERVIER_ERROR")
        }
    },

    // Lấy dịch vụ theo id
    getServiceById: async (id: bigint): Promise<services | null> => {
        try {
            const service = await serviceRepository.findById(id);

            if (!service) throw new Error("SERVICE_NOT_FOUND");

            return service;
        } catch (error) {
            if (error instanceof Error && error.message === "SERVICE_NOT_FOUND") {
                throw error;
            }
            throw new Error("SERVICE_ERROR");
        }
    },

    // Tạo mới 1 dịch vụ 
    createService: async (input: Prisma.servicesCreateInput): Promise<services> => {
        try {
            return await serviceRepository.createService(input);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2002") {
                    throw new Error("SERVICE_EXISTS");
                }
            }
            throw new Error("SERVICE_ERROR");
        }
    },

    // Cập nhật thông tin dịch vụ và giá mặc định
    updateService: async (id: bigint, input: Prisma.servicesUpdateInput): Promise<services> => {
        try {
            return await serviceRepository.updateService(id, input);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2002") {
                    throw new Error("SERVICE_EXISTS");
                }
                if (error.code === "P2025") {
                    throw new Error("SERVICE_NOT_FOUND");
                }
            }
            throw new Error("SERVICE_ERROR");
        }
    },

    // Bật tắt dịch vụ 
    isActiveService: async (id: bigint, is_active: boolean): Promise<services> => {
        try {
            return await serviceRepository.isActive(id, is_active);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2005") {
                    throw new Error("SERVICE_NOT_FOUND");
                }
            }
            throw new Error("SERVICE_ERROR");
        }
    }
}