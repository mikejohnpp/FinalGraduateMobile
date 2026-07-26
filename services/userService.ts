// userService — port từ web (src/services/userService.ts).
import { API } from '@/lib/constants';
import http from '@/lib/http';
import BaseService from '@/services/BaseService';
import type { ApiResultGeneric, TokenResult, UserProfileDTO, IProfileUpdate } from '@/types';

export class UserService extends BaseService {
    async login(
        email: string,
        password: string,
    ): Promise<ApiResultGeneric<TokenResult> | undefined> {
        try {
            const res = await http.post<ApiResultGeneric<TokenResult>>(
                `/${API.LOGIN}`,
                { email, password },
                { withCredentials: true },
            );
            return res;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async logout(): Promise<ApiResultGeneric<undefined> | undefined> {
        try {
            return await http.post<ApiResultGeneric<undefined>>(`/${API.LOGOUT}`);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async register(
        userName: string,
        email: string,
        password: string,
        confirmPassword: string,
    ): Promise<ApiResultGeneric<undefined> | undefined> {
        try {
            return await http.post<ApiResultGeneric<undefined>>(API.REGISTER, {
                userName,
                email,
                password,
                confirmPassword,
            });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async activate(code: string): Promise<ApiResultGeneric<undefined> | undefined> {
        try {
            return await http.get<ApiResultGeneric<undefined>>(`${API.ACTIVE}`, { code });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /** POST /auth/forgot-password — gửi OTP đặt lại mật khẩu về email */
    async forgotPassword(email: string): Promise<ApiResultGeneric<undefined> | undefined> {
        try {
            return await http.post<ApiResultGeneric<undefined>>(`/${API.FORGOT_PASSWORD}`, {
                email,
            });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /** POST /auth/verify-otp — xác nhận mã OTP */
    async verifyOtp(
        email: string,
        otp: string,
    ): Promise<ApiResultGeneric<undefined> | undefined> {
        try {
            return await http.post<ApiResultGeneric<undefined>>(`/${API.VERIFY_OTP}`, {
                email,
                otp,
            });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /** POST /auth/reset-password — đặt lại mật khẩu bằng OTP */
    async resetPassword(
        email: string,
        otp: string,
        newPassword: string,
        confirmPassword: string,
    ): Promise<ApiResultGeneric<undefined> | undefined> {
        try {
            return await http.post<ApiResultGeneric<undefined>>(`/${API.RESET_PASSWORD}`, {
                email,
                otp,
                newPassword,
                confirmPassword,
            });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async getProfile(userId: number): Promise<ApiResultGeneric<UserProfileDTO> | undefined> {
        try {
            return await http.get<ApiResultGeneric<UserProfileDTO>>(`/users/${userId}/profile`);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async updateProfile(
        userId: number,
        data: IProfileUpdate,
    ): Promise<ApiResultGeneric<UserProfileDTO> | undefined> {
        try {
            return await http.put<ApiResultGeneric<UserProfileDTO>>(
                `/${API.PROFILE.UPDATE}?userId=${userId}`,
                data,
            );
        } catch (e) {
            return Promise.reject(e);
        }
    }

    // Ghi chú: ảnh đại diện / ảnh bìa được upload trực tiếp lên storage (lib/mediaStorage)
    // rồi lưu URL qua updateProfile — giống web. Endpoint multipart cũ
    // (POST /users/profile/avatar|cover) không còn dùng ở mobile.
}



export default new UserService();
