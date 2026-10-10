const viteEnv = import.meta.env || {};
const nodeEnv = globalThis.process?.env ?? {};

function readEnv(name) {
    return viteEnv[name] ?? nodeEnv[name] ?? '';
}

const conf = {
    appwriteUrl: String(readEnv('VITE_APPWRITE_URL')),
    appwriteProjectId: String(readEnv('VITE_APPWRITE_PROJECT_ID')),
    appwriteDatabaseId: String(readEnv('VITE_APPWRITE_DATABASE_ID')),
    appwriteTableId: String(readEnv('VITE_APPWRITE_TABLE_ID')),
    appwriteBucketId: String(readEnv('VITE_APPWRITE_BUCKET_ID')),
    adminEmails: String(readEnv('VITE_ADMIN_EMAILS'))
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
};

export default conf;