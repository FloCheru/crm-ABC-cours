import { apiClient } from './apiClient';

// Type pour éviter l'import circulaire
type LogoutFunction = () => void;

class RateLimitedApiClient {
  private requestCache = new Map<string, Promise<any>>();
  private requestTimestamps = new Map<string, number>();
  private minRequestInterval = 100; // 100ms minimum between same requests
  private retryDelay = 1000; // 1 second initial retry delay
  private maxRetries = 3;
  private logoutCallback: LogoutFunction | null = null;

  // Méthode pour enregistrer le callback de logout
  setLogoutCallback(callback: LogoutFunction) {
    this.logoutCallback = callback;
  }

  private generateRequestKey(url: string, method: string, data?: any): string {
    return `${method}:${url}:${JSON.stringify(data || {})}`;
  }

  private shouldThrottle(requestKey: string): boolean {
    const lastRequest = this.requestTimestamps.get(requestKey);
    if (!lastRequest) return false;
    
    return (Date.now() - lastRequest) < this.minRequestInterval;
  }

  private async waitForExistingRequest<T>(requestKey: string): Promise<T | null> {
    const existingPromise = this.requestCache.get(requestKey);
    if (existingPromise) {
      try {
        return await existingPromise;
      } catch (error) {
        // If cached request failed, we'll make a new one
        this.requestCache.delete(requestKey);
        return null;
      }
    }
    return null;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWith429Handling<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      // Check if it's a 401/403 authentication error
      if (error?.message?.includes('401') || error?.message?.includes('403') || 
          error?.status === 401 || error?.status === 403) {
        console.warn('Token expiré ou invalide détecté dans rateLimitedApiClient');
        
        // Appeler le callback de logout s'il est défini
        if (this.logoutCallback) {
          this.logoutCallback();
        }
        
        throw error; // Propager l'erreur après déconnexion
      }
      
      // Check if it's a 429 rate limit error
      if (error?.message?.includes('429') || error?.status === 429) {
        if (attempt <= this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.warn(`Rate limited (429). Retrying in ${delay}ms... (attempt ${attempt}/${this.maxRetries})`);
          await this.sleep(delay);
          return this.retryWith429Handling(requestFn, attempt + 1);
        } else {
          console.error(`Rate limited (429). Max retries (${this.maxRetries}) exceeded.`);
          throw new Error(`Rate limit exceeded. Please try again later.`);
        }
      }
      throw error;
    }
  }

  async get<T>(url: string): Promise<T> {
    const requestKey = this.generateRequestKey(url, 'GET');
    
    // Check if we should throttle this request
    if (this.shouldThrottle(requestKey)) {
      const cachedResult = await this.waitForExistingRequest<T>(requestKey);
      if (cachedResult !== null) {
        return cachedResult;
      }
    }

    // Create the request promise
    const requestPromise = this.retryWith429Handling(() => apiClient.get<T>(url));
    
    // Cache the promise
    this.requestCache.set(requestKey, requestPromise);
    this.requestTimestamps.set(requestKey, Date.now());

    try {
      const result = await requestPromise;
      // Keep the cache for a short time to handle duplicate requests
      setTimeout(() => {
        this.requestCache.delete(requestKey);
      }, this.minRequestInterval);
      
      return result;
    } catch (error) {
      this.requestCache.delete(requestKey);
      throw error;
    }
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.retryWith429Handling(() => apiClient.post<T>(url, data));
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.retryWith429Handling(() => apiClient.put<T>(url, data));
  }

  async delete<T>(url: string): Promise<T> {
    return this.retryWith429Handling(() => apiClient.delete<T>(url));
  }
}

export const rateLimitedApiClient = new RateLimitedApiClient();