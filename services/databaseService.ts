
import { SavedPhoto, AppConfig } from "../types";
import { getConfig, LEGACY_GOOGLE_SCRIPT_URL } from "./configService";

const getScriptUrl = (overrideUrl?: string) => {
    if (overrideUrl && overrideUrl.trim() !== '') return overrideUrl.trim();
    const config = getConfig();
    return (config.googleScriptUrl || '').trim();
};

const callAppsScript = async (action: string, payload: any = {}, overrideUrl?: string, timeoutMs: number = 12000): Promise<any> => {
    const url = getScriptUrl(overrideUrl);
    if (!url) {
        console.error(`Apps Script Error: Missing URL for [${action}]`);
        return { success: false, error: "Missing URL" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const body = JSON.stringify({
            action,
            ...payload,
            _t: Date.now()
        });

        const response = await fetch(url, {
            method: 'POST',
            body: body,
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            signal: controller.signal
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Apps Script Network Error [${action}]:`, error);
        return { success: false, error: String(error) };
    } finally {
        clearTimeout(timeout);
    }
};

// Uploading a large photo to Drive takes ~17-40s (aborting mid-way would leave an orphan
// file and lose the issued ID), and getPhoto returns several MB of base64 to slow phones.
const PHOTO_TRANSFER_TIMEOUT_MS = 90000;

/**
 * Saves a photo and returns its final ID, or null on failure.
 * Without `photo.id` Apps Script issues a new ID (IP + ddmmyy + NNN) so the daily
 * sequence is shared by every device. With `photo.id` that photo is overwritten
 * (re-finishing the same edit session, or fixed IDs like the phone session IDP_...).
 */
export const savePhotoToCloud = async (
    photo: Omit<SavedPhoto, 'id'> & { id?: string },
    overrideUrl?: string
): Promise<string | null> => {
    const result = await callAppsScript('savePhoto', {
        id: photo.id,
        autoId: !photo.id,
        dataUrl: photo.dataUrl,
        settings: photo.settings,
        timestamp: photo.timestamp || Date.now()
    }, overrideUrl, PHOTO_TRANSFER_TIMEOUT_MS);
    const savedId = result && result.success ? (result.id || photo.id) : null;
    return savedId ? String(savedId) : null;
};

export const getPhotoById = async (id: string, overrideUrl?: string, skipRetry: boolean = false): Promise<SavedPhoto | null> => {
    // Tăng cường số lần thử và độ trễ để đợi Apps Script xử lý xong (Cold Start)
    const maxRetries = skipRetry ? 1 : 5;
    const fetchPhoto = async (url?: string): Promise<SavedPhoto | null> => {
        // getPhoto returns the full image as base64 (several MB): allow the long timeout.
        const result = await callAppsScript('getPhoto', { id }, url, PHOTO_TRANSFER_TIMEOUT_MS);
        return (result && result.success && result.photo) ? result.photo as SavedPhoto : null;
    };

    for (let i = 0; i < maxRetries; i++) {
        const photo = await fetchPhoto(overrideUrl);
        if (photo) return photo;

        // Photos saved before the move to the current script live in the old deployment:
        // look there once, right after the first miss, instead of after all retries.
        if (i === 0 && !skipRetry && getScriptUrl(overrideUrl) !== LEGACY_GOOGLE_SCRIPT_URL) {
            const legacy = await fetchPhoto(LEGACY_GOOGLE_SCRIPT_URL);
            if (legacy) return { ...legacy, id: legacy.id || id };
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
