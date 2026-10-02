import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { EMPTY_TREE, useNode } from '../hooks/useNode';

const CLIENT_ID_KEY = 'inkspace_client_id';
const ROOT_COMMENT_ID = 1;

function getStoredTree(storageKey) {
    if (typeof window === 'undefined') {
        return EMPTY_TREE;
    }

    try {
        const rawValue = localStorage.getItem(storageKey);
        if (!rawValue) {
            return EMPTY_TREE;
        }

        const parsed = JSON.parse(rawValue);
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
            return EMPTY_TREE;
        }

        return parsed;
    } catch (error) {
        console.warn('CommentSystem :: Failed to read comments from localStorage', error);
        return EMPTY_TREE;
    }
}

function getOrCreateClientId() {
    if (typeof window === 'undefined') {
        return 'guest-local';
    }

    const savedId = localStorage.getItem(CLIENT_ID_KEY);
    if (savedId) {
        return savedId;
    }

    const newId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CLIENT_ID_KEY, newId);
    return newId;
}

function getInitials(name = 'Guest') {
    const words = String(name).trim().split(/\s+/).filter(Boolean);
    const initials = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
    return initials.join('') || 'G';
}

function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Just now';

    const now = Date.now();
    const diffMs = now - new Date(timestamp).getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60000));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}

function normalizeAdminList(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.flatMap((entry) => normalizeAdminList(entry));
    }

    return String(value)
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
}

function isAdminUser(userData) {
    const configuredAdmins = normalizeAdminList(import.meta.env.VITE_ADMIN_EMAILS);
    const candidateEmails = [
        userData?.email,
        userData?.userData?.email,
    ].filter(Boolean);

    const roleValues = [
        userData?.role,
        userData?.userData?.role,
        userData?.label,
        userData?.userData?.label,
        userData?.roles,
        userData?.userData?.roles,
        userData?.labels,
        userData?.userData?.labels,
    ];

    const roleText = roleValues
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return (
        configuredAdmins.some((email) => candidateEmails.some((candidate) => candidate.toLowerCase() === email)) ||
        roleText.includes('admin')
    );
}

const avatarColors = [
    'bg-sky-500',
    'bg-violet-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-fuchsia-500',
];

function getAvatarClasses(name) {
    const digest = String(name || 'Guest')
        .split('')
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return avatarColors[digest % avatarColors.length];
}

function CommentSystem({ postId, postAuthorId }) {
    const userData = useSelector((state) => state.auth.userData);
    const clientId = useMemo(() => getOrCreateClientId(), []);
    const currentUserId = userData?.$id || userData?.userData?.$id || userData?.id || null;
    const currentUserName =
        userData?.name ||
        userData?.userData?.name ||
        `Guest ${clientId.slice(-4)}`;
    const isAdmin = useMemo(() => isAdminUser(userData), [userData]);
    const storageKey = `comments_${postId || 'default-post'}`;
    const { tree, insert, edit, remove } = useNode(getStoredTree(storageKey));

    const [mainDraft, setMainDraft] = useState('');
    const [replyDrafts, setReplyDrafts] = useState({});
    const [replyTargetId, setReplyTargetId] = useState(null);
    const [editTargetId, setEditTargetId] = useState(null);
    const [editDraft, setEditDraft] = useState('');
    const [expandedReplies, setExpandedReplies] = useState({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(tree));
        }
    }, [storageKey, tree]);

    const submitComment = (targetCommentId = ROOT_COMMENT_ID, textOverride = null) => {
        const value = (textOverride ?? '').trim();
        if (!value) return;

        const comment = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: value,
            userName: currentUserName,
            userId: currentUserId,
            clientAuthorId: clientId,
            isAdmin,
            createdAt: new Date().toISOString(),
            isEdited: false,
            items: [],
        };

        insert(targetCommentId, comment);

        if (targetCommentId === ROOT_COMMENT_ID) {
            setMainDraft('');
        } else {
            setReplyDrafts((previous) => ({ ...previous, [targetCommentId]: '' }));
            setReplyTargetId(null);
            setExpandedReplies((previous) => ({ ...previous, [targetCommentId]: true }));
        }
    };

    const beginEditing = (comment) => {
        setEditTargetId(comment.id);
        setEditDraft(comment.text || '');
    };

    const saveEdit = (commentId) => {
        const nextText = editDraft.trim();
        if (!nextText) return;

        edit(commentId, nextText);
        setEditTargetId(null);
        setEditDraft('');
    };

    const canManageComment = (comment) => {
        if (!comment) return false;
        const authoredByCurrentUser =
            comment.userId === currentUserId ||
            (comment.clientAuthorId && comment.clientAuthorId === clientId);
        return authoredByCurrentUser || comment.isAdmin || isAdmin;
    };

    const renderComment = (comment, depth = 0) => {
        const replyCount = Array.isArray(comment.items) ? comment.items.length : 0;
        const replyAreaOpen = expandedReplies[comment.id] ?? true;
        const isEditable = canManageComment(comment);
        const isCurrentUserComment =
            comment.userId === currentUserId ||
            (comment.clientAuthorId && comment.clientAuthorId === clientId);
        const isPostAuthorComment =
            comment.userId === postAuthorId ||
            (comment.clientAuthorId && comment.clientAuthorId === postAuthorId);

        return (
            <div
                key={comment.id}
                className={`rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm transition-all dark:border-[#7A1CAC]/30 dark:bg-[#240632]/80 ${depth > 0 ? 'ml-4 border-l-2 border-l-sky-200 dark:border-l-[#7A1CAC]' : ''}`}
            >
                <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm ${getAvatarClasses(comment.userName || currentUserName)}`}>
                        {getInitials(comment.userName || 'Guest')}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {comment.userName || 'Guest'}
                            </span>
                            {isPostAuthorComment && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                                    Author
                                </span>
                            )}
                            {isCurrentUserComment && (
                                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300">
                                    You
                                </span>
                            )}
                            {comment.isAdmin && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                                    Admin
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#EBD3F8]/70">
                            <span>{formatRelativeTime(comment.createdAt)}</span>
                            {comment.isEdited && <span>• Edited</span>}
                        </div>

                        {editTargetId === comment.id ? (
                            <div className="mt-3 space-y-3">
                                <textarea
                                    value={editDraft}
                                    onChange={(event) => setEditDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            saveEdit(comment.id);
                                        }
                                    }}
                                    rows={3}
                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-sky-400 dark:border-[#7A1CAC]/40 dark:bg-[#190325] dark:text-slate-100"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => saveEdit(comment.id)}
                                        className="rounded-xl bg-[#1D4ED8] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1E40AF] dark:bg-[#AD49E1] dark:hover:bg-[#8B35C5]"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditTargetId(null);
                                            setEditDraft('');
                                        }}
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#7A1CAC]/40 dark:bg-[#240632] dark:text-[#EBD3F8] dark:hover:bg-[#360a4a]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-200">
                                {comment.text}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setReplyTargetId((previous) => (previous === comment.id ? null : comment.id));
                            setReplyDrafts((previous) => ({
                                ...previous,
                                [comment.id]: previous[comment.id] ?? '',
                            }));
                        }}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 dark:border-[#7A1CAC]/40 dark:bg-[#240632] dark:text-[#EBD3F8] dark:hover:border-[#AD49E1] dark:hover:bg-[#2E073F]"
                    >
                        Reply
                    </button>

                    {isEditable && (
                        <>
                            <button
                                type="button"
                                onClick={() => beginEditing(comment)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-slate-50 dark:border-[#7A1CAC]/40 dark:bg-[#2E073F] dark:text-[#EBD3F8] dark:hover:bg-[#360a4a]"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(comment.id)}
                                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                            >
                                Delete
                            </button>
                        </>
                    )}

                    {replyCount > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                                setExpandedReplies((previous) => ({
                                    ...previous,
                                    [comment.id]: !(previous[comment.id] ?? true),
                                }))
                            }
                            className="ml-auto text-[11px] font-semibold text-sky-700 transition hover:text-sky-800 dark:text-[#EBD3F8] dark:hover:text-white"
                        >
                            {replyAreaOpen ? 'Hide replies' : `View replies (${replyCount})`}
                        </button>
                    )}
                </div>

                {replyTargetId === comment.id && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-[#7A1CAC]/30 dark:bg-[#190325]">
                        <textarea
                            value={replyDrafts[comment.id] ?? ''}
                            onChange={(event) =>
                                setReplyDrafts((previous) => ({
                                    ...previous,
                                    [comment.id]: event.target.value,
                                }))
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    const nextReply = (replyDrafts[comment.id] ?? '').trim();
                                    if (nextReply) {
                                        submitComment(comment.id, nextReply);
                                    }
                                }
                            }}
                            rows={3}
                            placeholder="Write a reply..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 dark:border-[#7A1CAC]/40 dark:bg-[#240632] dark:text-slate-100"
                        />

                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const nextReply = (replyDrafts[comment.id] ?? '').trim();
                                    if (!nextReply) return;
                                    submitComment(comment.id, nextReply);
                                }}
                                className="rounded-xl bg-[#1D4ED8] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1E40AF] dark:bg-[#AD49E1] dark:hover:bg-[#8B35C5]"
                            >
                                Reply
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setReplyTargetId(null);
                                    setReplyDrafts((previous) => ({ ...previous, [comment.id]: '' }));
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#7A1CAC]/40 dark:bg-[#240632] dark:text-[#EBD3F8] dark:hover:bg-[#360a4a]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {replyCount > 0 && replyAreaOpen && (
                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-[#7A1CAC]/20">
                        {comment.items.map((child) => renderComment(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <section className="mt-10 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-[#7A1CAC]/40 dark:bg-[#2E073F]/80 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#EBD3F8]/65">
                        Conversations
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Comments</h2>
                </div>
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700 dark:bg-[#240632] dark:text-[#EBD3F8]">
                    {Array.isArray(tree.items) ? tree.items.length : 0} top-level
                </span>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#7A1CAC]/35 dark:bg-[#240632]">
                <textarea
                    value={mainDraft}
                    onChange={(event) => setMainDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            submitComment(ROOT_COMMENT_ID, mainDraft);
                        }
                    }}
                    rows={3}
                    placeholder="Share your thoughts..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 dark:border-[#7A1CAC]/40 dark:bg-[#190325] dark:text-slate-100"
                />
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={() => submitComment(ROOT_COMMENT_ID, mainDraft)}
                        className="rounded-xl bg-[#1D4ED8] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1E40AF] dark:bg-[#AD49E1] dark:hover:bg-[#8B35C5]"
                    >
                        Post comment
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {Array.isArray(tree.items) && tree.items.length > 0 ? (
                    tree.items.map((comment) => renderComment(comment))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-[#7A1CAC]/30 dark:bg-[#240632] dark:text-[#EBD3F8]/70">
                        No comments yet. Start the conversation.
                    </div>
                )}
            </div>
        </section>
    );
}

export default CommentSystem;
