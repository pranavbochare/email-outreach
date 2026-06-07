import axios from "axios";
import { config } from "../../config/index.js";
import { log } from "./logger.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function withRetry(fn, retries = 3, label = "request") {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      const isLast = attempt === retries;

      if (status === 429) {
        log.warn(`Rate limited exceeded`);
        throw err;
      } else if (isLast) {
        throw err;
      } else {
        const delay = attempt * 1000;
        log.warn(`${label} failed (${status ?? err.code}). Retrying in ${delay / 1000}s…`);
        await sleep(delay);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
}

export function buildClient(baseURL, headers = {}) {
  return axios.create({
    baseURL,
    timeout: 15_000,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export const politeDelay = () => sleep(config.pipeline.rateLimitDelay);
