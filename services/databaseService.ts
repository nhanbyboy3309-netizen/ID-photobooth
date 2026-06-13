
import { SavedPhoto, AppConfig } from "../types";
import { getConfig } from "./configService";

const getScriptUrl = (overrideUrl?: string) => {
    if (overrideUrl && overrideUrl.trim() !== '') return overrideUrl.trim();
    const config = getConfig();
    return (config.googleScriptUrl || '').trim();
};

const callAppsScript = async (action: string, payload: any = {}, overrideUrl?: string): Promise<any> => {
    const url = getScriptUrl(overrideUrl);
    if (!url) {
        console.error(`Apps Script Error: Missing URL for [${action}]`);
        return { success: false, error: "Missing URL" };
    }

    try {
        const body = JSON.stringify({ 
            action, 
            ...payload, 
            _t: Date.now() 
        });

        const response = await fetch(url, {
            method: 'POST',
            body: body,
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Apps Script Network Error [${action}]:`, error);
        return { success: false, error: String(error) };
    }
};

export const savePhotoToCloud = async (photo: SavedPhoto, overrideUrl?: string): Promise<string | null> => {
    // Quan trọng: Gửi kèm ID (sessionId) để Apps Script lưu chính xác vào cột ID
    const result = await callAppsScript('savePhoto', {
        id: photo.id,
        dataUrl: photo.dataUrl,
        settings: photo.settings,
        timestamp: photo.timestamp || Date.now()
    }, overrideUrl);
    return (result && result.success) ? (result.id || photo.id) : null;
};

export const getPhotoById = async (id: string, overrideUrl?: string, skipRetry: boolean = false): Promise<SavedPhoto | null> => {
    // Tăng cường số lần thử và độ trễ để đợi Apps Script xử lý xong (Cold Start)
    const maxRetries = skipRetry ? 1 : 5;
    
    for (let i = 0; i < maxRetries; i++) {
        const result = await callAppsScript('getPhoto', { id }, overrideUrl);
        if (result && result.success && result.photo) {
            return result.photo as SavedPhoto;
        }
        
        if (i < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }
    return null;
};

export const saveAppConfigToCloud = async (config: AppConfig): Promise<boolean> => {
    const result = await callAppsScript('saveConfig', { config });
    return !!(result && result.success);
};

export const getAppConfigFromCloud = async (): Promise<AppConfig | null> => {
    const result = await callAppsScript('getConfig');
    return (result && result.success) ? result.config : null;
};

export const getPhotosFromCloud = async (): Promise<SavedPhoto[]> => {
    const result = await callAppsScript('listPhotos');
    if (result && result.success && Array.isArray(result.photos)) {
        return result.photos;
    }
    return [];
};

export const deletePhotoFromCloud = async (id: string, adminPassword?: string): Promise<boolean> => {
    const result = await callAppsScript('deletePhoto', { id, password: adminPassword });
    return !!(result && result.success);
};
