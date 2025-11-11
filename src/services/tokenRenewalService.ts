import { api, storeEncryptedToken, clearEncryptedToken } from "../lib/axios";
import { showErrorToast } from "../lib/toast";

interface TokenRenewalResponse {
  success: boolean;
  data?: {
    token: string;
    token_expira_em: string;
  };
  message?: string;
}

class TokenRenewalService {
  private renewalTimer: NodeJS.Timeout | null = null;
  private isRenewing = false;
  private onTokenExpired: (() => void) | null = null;

  private readonly RENEW_BEFORE_MINUTES = 30;
  private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000;

  start(tokenExpiresAt: string, onExpired: () => void) {
    this.onTokenExpired = onExpired;
    this.scheduleNextRenewal(tokenExpiresAt);
  }

  stop() {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
      this.renewalTimer = null;
    }
    this.onTokenExpired = null;
    this.isRenewing = false;
  }

  private scheduleNextRenewal(tokenExpiresAt: string) {
    try {
      const expirationDate = new Date(tokenExpiresAt);
      const now = new Date();

      const renewAt = new Date(
        expirationDate.getTime() - this.RENEW_BEFORE_MINUTES * 60 * 1000
      );
      const msUntilRenewal = renewAt.getTime() - now.getTime();

      if (msUntilRenewal <= 0) {
        this.renewToken();
        return;
      }

      if (msUntilRenewal < this.CHECK_INTERVAL_MS) {
        this.renewalTimer = setTimeout(() => this.renewToken(), msUntilRenewal);
      } else {
        this.renewalTimer = setTimeout(
          () => this.checkAndRenew(tokenExpiresAt),
          this.CHECK_INTERVAL_MS
        );
      }
    } catch (error) {
      //
    }
  }

  private checkAndRenew(tokenExpiresAt: string) {
    const expirationDate = new Date(tokenExpiresAt);
    const now = new Date();
    const renewAt = new Date(
      expirationDate.getTime() - this.RENEW_BEFORE_MINUTES * 60 * 1000
    );

    if (now >= renewAt) {
      this.renewToken();
    } else {
      this.scheduleNextRenewal(tokenExpiresAt);
    }
  }

  private async renewToken() {
    if (this.isRenewing) {
      return;
    }

    this.isRenewing = true;

    try {
      const { data: response } = await api.post<TokenRenewalResponse>(
        "/auth/renovar-token"
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "Falha ao renovar token");
      }

      const { token: newToken, token_expira_em } = response.data;

      await storeEncryptedToken(newToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      this.scheduleNextRenewal(token_expira_em);
    } catch (error) {
      await this.handleRenewalError();
    } finally {
      this.isRenewing = false;
    }
  }

  private async handleRenewalError() {
    try {
      await clearEncryptedToken();
      delete api.defaults.headers.common["Authorization"];

      showErrorToast("Sessão expirada. Por favor, faça login novamente.");

      if (this.onTokenExpired) {
        this.onTokenExpired();
      }
    } catch (error) {
      //
    }
  }

  async forceRenewal(): Promise<boolean> {
    try {
      await this.renewToken();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const tokenRenewalService = new TokenRenewalService();
