
import { config } from "../config";
import { redisClient } from "./redis";

const BKASH_ID_TOKEN_KEY = "university:payment:bkash:idToken";

const BKASH_REFRESH_TOKEN_KEY = "university:payment:bkash:refreshToken";

export const getBkashIdToken = async (): Promise<string> => {
  try {
    let bkashIdToken = await redisClient.get(BKASH_ID_TOKEN_KEY);

    const bkashIdTokenTTL = await redisClient.ttl(BKASH_ID_TOKEN_KEY);

    const bkashRefreshToken = await redisClient.get(BKASH_REFRESH_TOKEN_KEY);

    const bkashRefreshTokenTTL = await redisClient.ttl(BKASH_REFRESH_TOKEN_KEY);

    // ==========================================
    // 1. Refresh existing ID token
    // ==========================================

    if (
      (bkashIdTokenTTL <= 600 || !bkashIdToken) &&
      bkashRefreshToken &&
      bkashRefreshTokenTTL > 600
    ) {
      const response = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            ACCEPT: "application/json",

            username: config.bkash_username,
            password: config.bkash_password,
          },

          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefreshToken,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to refresh bKash ID token");
      }

      const result = await response.json();

      await redisClient.set(BKASH_ID_TOKEN_KEY, result.id_token, {
        expiration: {
          type: "EX",
          value: 3600,
        },
      });

      return result.id_token;
    }

    // ==========================================
    // 2. Existing ID token is still valid
    // ==========================================

    if (bkashIdToken && bkashIdTokenTTL > 600) {
      return bkashIdToken;
    }

    // ==========================================
    // 3. Generate new token
    // ==========================================

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          ACCEPT: "application/json",

          username: config.bkash_username,
          password: config.bkash_password,
        },

        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to get bKash ID token");
    }

    const result = await response.json();

    await redisClient.set(BKASH_ID_TOKEN_KEY, result.id_token, {
      expiration: {
        type: "EX",
        value: 3600,
      },
    });

    await redisClient.set(BKASH_REFRESH_TOKEN_KEY, result.refresh_token, {
      expiration: {
        type: "EX",
        value: 28 * 24 * 3600,
      },
    });

    return result.id_token;
  } catch (error) {
    throw new Error(
      `Error in getBkashIdToken: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
};
