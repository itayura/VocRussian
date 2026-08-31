// Shared request deadlines so a stalled connection cannot leave the UI loading forever.
(function () {
  const TIMEOUTS = Object.freeze({
    request: 15000,
    auth: 10000,
    ai: 45000
  });

  function timeoutError(message) {
    const error = new Error(message || "The request took too long. Please check your connection and try again.");
    error.name = "TimeoutError";
    error.code = "REQUEST_TIMEOUT";
    return error;
  }

  function withTimeout(promise, timeoutMs = TIMEOUTS.request, message) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return Promise.resolve(promise);

    let timeoutId;
    const deadline = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => reject(timeoutError(message)), timeoutMs);
    });

    return Promise.race([Promise.resolve(promise), deadline])
      .finally(() => clearTimeout(timeoutId));
  }

  async function fetchWithTimeout(input, init = {}, timeoutMs = TIMEOUTS.request, message) {
    const controller = new AbortController();
    const externalSignal = init.signal;
    let didTimeOut = false;
    let timeoutId;
    let detachExternalAbort = null;

    if (externalSignal) {
      const forwardAbort = () => controller.abort(externalSignal.reason);
      if (externalSignal.aborted) {
        forwardAbort();
      } else {
        externalSignal.addEventListener("abort", forwardAbort, { once: true });
        detachExternalAbort = () => externalSignal.removeEventListener("abort", forwardAbort);
      }
    }

    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        didTimeOut = true;
        controller.abort();
      }, timeoutMs);
    }

    try {
      return await window.fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (didTimeOut) throw timeoutError(message);
      throw error;
    } finally {
      clearTimeout(timeoutId);
      if (detachExternalAbort) detachExternalAbort();
    }
  }

  window.PrivyetikNetwork = Object.freeze({
    TIMEOUTS,
    withTimeout,
    fetch: fetchWithTimeout
  });
})();
