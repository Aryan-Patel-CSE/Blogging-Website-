import config from '../conf/config.js';

function getUserCandidates(userData) {
    return [userData, userData?.userData].filter(
        (candidate) => candidate && typeof candidate === 'object',
    );
}

export function isAdminUser(userData) {
    const candidates = getUserCandidates(userData);
    const adminEmails = config.adminEmails;

    return candidates.some((user) => {
        const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
        const labels = Array.isArray(user.labels)
            ? user.labels
            : typeof user.labels === 'string'
              ? user.labels.split(',')
              : [];
        const hasAdminLabel = labels.some(
            (label) => typeof label === 'string' && label.trim().toLowerCase() === 'admin',
        );
        const hasAdminPreference =
            typeof user.prefs?.role === 'string' &&
            user.prefs.role.trim().toLowerCase() === 'admin';

        return (
            (email !== '' && adminEmails.includes(email)) ||
            hasAdminLabel ||
            hasAdminPreference ||
            user.isAdmin === true
        );
    });
}
