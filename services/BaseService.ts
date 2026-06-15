// Lớp service cơ sở — port từ web (src/types/base/BaseService.ts).
import http from '@/lib/http';
import type { ApiResult, ApiResultGeneric } from '@/types';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export default class BaseService {
    async getList<T>(url: string, id?: string | number, params?: QueryParams): Promise<T[]> {
        const finalUrl = id !== undefined ? `${url}/${id}` : url;
        const res = await http.get<ApiResultGeneric<T[]>>(finalUrl, params);
        return res.data ?? [];
    }

    async getSingle<T>(url: string, id?: string | number, params?: QueryParams): Promise<T | null> {
        const finalUrl = id !== undefined ? `${url}/${id}` : url;
        const res = await http.get<ApiResultGeneric<T>>(finalUrl, params);
        return res.data ?? null;
    }

    async create<T, TData = any>(url: string, data: TData): Promise<boolean> {
        const res = await http.post<ApiResultGeneric<T>>(url, data);
        return res.data != null || res.code === 200 || res.code === 201;
    }

    async createAndGetData<T, TData = any>(url: string, data: TData): Promise<T | null> {
        const res = await http.post<ApiResultGeneric<T>>(url, data);
        return res.data ?? null;
    }

    async update<T, TData = any>(url: string, data: TData): Promise<boolean> {
        const res = await http.put<ApiResultGeneric<T>>(url, data);
        return res.data != null;
    }

    async updateAndGetData<T, TData = any>(url: string, data: TData): Promise<T | null> {
        const res = await http.put<ApiResultGeneric<T>>(url, data);
        return res.data ?? null;
    }

    async delete(url: string, id: Array<string> | Array<number>): Promise<boolean> {
        const res = await http.delete<ApiResult>(`${url}/${id.join(',')}`);
        return res.code === 200;
    }

    async deleteWithBody<T>(url: string, data: T): Promise<boolean> {
        const res = await http.deleteWithBody<ApiResult>(url, data);
        return res.success ?? (res.code === 200 || res.code === 204);
    }
}
