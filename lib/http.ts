// Axios client cho mobile — port từ web (src/lib/http.ts).
// Khác biệt chính: token đọc/ghi qua AsyncStorage (async) thay cho localStorage.
import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';
import { API, AUTH_TOKEN_NAME, SERVER_API, USER_ID_KEY } from '@/lib/constants';
import { storage } from '@/lib/storage';
import type { ApiResultGeneric, TokenResult } from '@/types';

type CallbackQueue = Array<(token: string | null) => void>;

// Hàm tuỳ biến để xử lý khi phiên hết hạn (gắn từ tầng app, vd: điều hướng về Login).
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(handler: (() => void) | null) {
    onUnauthorized = handler;
}

class Http {
    private instance: AxiosInstance;
    private subscribers: CallbackQueue = [];
    private isRefreshingToken = false;
    private baseUrl: string;

    constructor(baseURL: string) {
        this.baseUrl = baseURL;
        this.instance = axios.create({
            baseURL,
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
        });

        this.instance.interceptors.request.use(this.handleBeforeRequest.bind(this));
        this.instance.interceptors.response.use(
            (res) => res,
            this.handleRequestError.bind(this),
        );
    }

    private async handleBeforeRequest(request: InternalAxiosRequestConfig) {
        const token = await storage.get(AUTH_TOKEN_NAME);
        if (token) {
            request.headers.Authorization = `Bearer ${token}`;
        } else {
            delete request.headers.Authorization;
        }
        return request;
    }

    private async handleRequestError(error: any) {
        // Lỗi mạng — không có response
        if (error.code === 'ERR_NETWORK' || !error.response) {
            return Promise.reject(error);
        }

        const { config, response } = error;
        const status = response.status;
        const originalRequest = config;

        if (status === 401) {
            if (this.isRefreshingToken) {
                return new Promise((resolve, reject) => {
                    this.subscribers.push((token) => {
                        if (token) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(this.instance(originalRequest));
                        } else {
                            reject(error);
                        }
                    });
                });
            }

            try {
                this.isRefreshingToken = true;
                const res = await axios.post<ApiResultGeneric<TokenResult>>(
                    `${this.baseUrl}/${API.REFRESH}`,
                    {},
                    { withCredentials: true },
                );

                const data = res.data;
                if (data.data != null) {
                    const token = data.data.token;
                    await storage.set(AUTH_TOKEN_NAME, token);
                    this.instance.defaults.headers.common.Authorization = `Bearer ${token}`;

                    this.subscribers.forEach((cb) => cb(token));
                    this.subscribers = [];

                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return this.instance(originalRequest);
                }
            } catch (err) {
                this.subscribers.forEach((cb) => cb(null));
                this.subscribers = [];
                await storage.multiRemove([AUTH_TOKEN_NAME, USER_ID_KEY]);
                onUnauthorized?.();
            } finally {
                this.isRefreshingToken = false;
            }
        }

        if (status === 403) {
            // Just reject, do not logout user for a resource forbidden error
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const res = await this.instance.post<T>(url, data, config);
        return res.data;
    }

    async get<T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
        const res = await this.instance.get<T>(url, { ...config, params });
        return res.data;
    }

    async put<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
        const res = await this.instance.put<T>(url, data, config);
        return res.data;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const res = await this.instance.delete<T>(url, config);
        return res.data;
    }

    async deleteWithBody<T>(url: string, data: any): Promise<T> {
        const res = await this.instance.delete<T>(url, { data });
        return res.data;
    }

    async postWithFile<T>(url: string, data: any): Promise<T> {
        const res = await this.instance.post<T>(url, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    }
}

const http = new Http(SERVER_API);
export default http;
