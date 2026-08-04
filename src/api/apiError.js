export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    const body = error?.response?.data;

    if (typeof body === 'string' && body.trim()) return body;
    if (typeof body?.message === 'string' && body.message.trim()) return body.message;

    if (body?.errors && typeof body.errors === 'object') {
        const messages = Object.values(body.errors)
            .flatMap((value) => Array.isArray(value) ? value : [value])
            .filter((value) => typeof value === 'string' && value.trim());

        if (messages.length) return messages.join(' ');
    }

    if (typeof body?.title === 'string' && body.title.trim()) return body.title;
    if (typeof error?.message === 'string' && error.message.trim() && !error.response) {
        return error.message;
    }

    return fallback;
};
