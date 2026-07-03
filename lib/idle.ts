type IdleHandle = number;

type IdleCallback = () => void | Promise<void>;

const hasRequestIdleCallback =
    typeof window !== 'undefined' &&
    typeof window.requestIdleCallback === 'function' &&
    typeof window.cancelIdleCallback === 'function';

export const scheduleWhenIdle = (callback: IdleCallback, timeout = 1000) => {
    if (hasRequestIdleCallback) {
        const handle = window.requestIdleCallback(() => {
            void callback();
        }, { timeout });

        return () => window.cancelIdleCallback(handle);
    }

    const handle: IdleHandle = window.setTimeout(() => {
        void callback();
    }, Math.min(timeout, 250));

    return () => window.clearTimeout(handle);
};
