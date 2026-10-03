import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { EMPTY_TREE, useNode } from '../hooks/useNode';
import { isAdminUser } from '../utils/authHelper';

const CLIENT_ID_KEY = 'inkspace_client_id';
const ROOT_COMMENT_ID = 1;

function createCommentId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
            id: createCommentId(),
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

    const renderComment = (comment, depth = 0) => {
        const replyCount = Array.isArray(comment.items) ? comment.items.length : 0;
        const replyAreaOpen = expandedReplies[comment.id] ?? true;
        const isCommentAuthor =
            (Boolean(currentUserId) && comment.userId === currentUserId) ||
            (Boolean(comment.clientAuthorId) && comment.clientAuthorId === clientId);
        const canManageComment = isCommentAuthor || isAdmin;
        const isPostAuthorComment = Boolean(postAuthorId) && comment.userId === postAuthorId;

        return (
            <div
                key={comment.id}
                className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all dark:border-[#7A1CAC]/35 dark:bg-[#240632] ${depth > 0 ? 'ml-4 border-l-2 border-l-blue-300 dark:border-l-[#AD49E1]' : ''}`}
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
                                <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-800 dark:text-amber-300">
                                    Author
                                </span>
                            )}
                            {isCommentAuthor && (
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700 dark:border-[#AD49E1]/40 dark:bg-[#AD49E1]/10 dark:text-[#D79AFA]">
                                    You
                                </span>
                            )}
                            {comment.isAdmin && (
                                <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-800 dark:text-amber-300">
                                    Admin
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#B99BC6]">
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
                                    className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 dark:border-[#53116B] dark:bg-[#190325] dark:text-[#F5E9FC] dark:placeholder:text-[#8B6A99] dark:focus:border-[#AD49E1]"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => saveEdit(comment.id)}
                                        className="rounded-xl bg-[#1D4ED8] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3B82F6] dark:bg-[#7A1CAC] dark:hover:bg-[#932AD0]"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditTargetId(null);
                                            setEditDraft('');
                                        }}
                                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-[#53116B] dark:bg-[#240632] dark:text-[#EBD3F8] dark:hover:bg-[#360A4A]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-[#EBD3F8]">
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
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 dark:border-[#53116B] dark:bg-[#190325] dark:text-[#D8BDE4] dark:hover:border-[#AD49E1] dark:hover:bg-[#360A4A]"
                    >
                        Reply
                    </button>

                    {canManageComment && (
                        <>
                            <button
                                type="button"
                                onClick={() => beginEditing(comment)}
                                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 dark:border-[#53116B] dark:bg-[#2E073F] dark:text-[#D8BDE4] dark:hover:border-[#AD49E1] dark:hover:bg-[#360A4A]"
                            >
                                {isAdmin && !isCommentAuthor ? 'Edit (Admin)' : 'Edit'}
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(comment.id)}
                                className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-700 transition hover:border-rose-400/50 hover:bg-rose-500/20 dark:text-rose-200"
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
                            className="ml-auto text-[11px] font-semibold text-blue-700 transition hover:text-blue-900 dark:text-[#D79AFA] dark:hover:text-white"
                        >
                            {replyAreaOpen ? 'Hide replies' : `View replies (${replyCount})`}
                        </button>
                    )}
                </div>

                {replyTargetId === comment.id && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-100 p-3 dark:border-[#53116B] dark:bg-[#190325]">
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
                            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-[#53116B] dark:bg-[#240632] dark:text-[#F5E9FC] dark:placeholder:text-[#8B6A99] dark:focus:border-[#AD49E1]"
                        />

                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const nextReply = (replyDrafts[comment.id] ?? '').trim();
                                    if (!nextReply) return;
                                    submitComment(comment.id, nextReply);
                                }}
                                className="rounded-xl bg-[#1D4ED8] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3B82F6] dark:bg-[#7A1CAC] dark:hover:bg-[#932AD0]"
                            >
                                Reply
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setReplyTargetId(null);
                                    setReplyDrafts((previous) => ({ ...previous, [comment.id]: '' }));
                                }}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-[#53116B] dark:bg-[#240632] dark:text-[#EBD3F8] dark:hover:bg-[#360A4A]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {replyCount > 0 && replyAreaOpen && (
                    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-[#53116B]">
                        {comment.items.map((child) => renderComment(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <section className="mt-10 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8 dark:border-[#7A1CAC]/50 dark:bg-[#2E073F] dark:shadow-[0_20px_60px_rgba(25,3,37,0.25)]">
            <div className="mb-7 flex items-center gap-3 border-b border-slate-200 pb-5 dark:border-[#53116B]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1D4ED8] dark:bg-[#190325] dark:text-[#AD49E1]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h8m-8 4h5m-8 5 2.5-2H17a3 3 0 003-3V7a3 3 0 00-3-3H7a3 3 0 00-3 3v9a3 3 0 003 3z" />
                    </svg>
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">Comments &amp; Discussion</h2>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-[#53116B] dark:text-[#EBD3F8]">
                            {Array.isArray(tree.items) ? tree.items.length : 0}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-[#B99BC6]">Share your insights and join the nested discussion</p>
                </div>
            </div>

            <div className="mb-7 rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:p-6 dark:border-[#7A1CAC]/45 dark:bg-[#240632]/80">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-black text-white">
                        {getInitials(currentUserName)}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-[#B99BC6]">Posting as</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{currentUserName}</span>
                    {isAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                            <span aria-hidden="true">♛</span> Admin
                        </span>
                    )}
                    <span className="ml-auto hidden text-xs text-slate-500 sm:block dark:text-[#9E7BAA]">Supports Markdown &amp; infinite replies</span>
                </div>
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
                    placeholder="What are your thoughts on this story? Leave a comment... (Press Enter to post, Shift+Enter for new line)"
                    className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-[#53116B] dark:bg-[#190325] dark:text-[#F5E9FC] dark:placeholder:text-[#80618D] dark:focus:border-[#AD49E1] dark:focus:ring-[#AD49E1]/15"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-[#9E7BAA]">
                        <kbd className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-600 dark:border-[#7A1CAC]/50 dark:bg-[#53116B]/60 dark:text-[#D8BDE4]">Enter ↵</kbd>
                        <span className="mx-2">to post,</span>
                        <kbd className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-600 dark:border-[#7A1CAC]/50 dark:bg-[#53116B]/60 dark:text-[#D8BDE4]">Shift + Enter</kbd>
                        <span className="ml-2">for new line</span>
                    </p>
                    <button
                        type="button"
                        onClick={() => submitComment(ROOT_COMMENT_ID, mainDraft)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#1D4ED8] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-blue-500/60 dark:bg-[#7A1CAC] dark:hover:bg-[#932AD0] dark:focus:ring-[#AD49E1]/60"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M10.3 3.86 2.82 17a2 2 0 001.74 3h14.88a2 2 0 001.74-3L13.7 3.86a2 2 0 00-3.4 0z" />
                        </svg>
                        Post Comment
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {Array.isArray(tree.items) && tree.items.length > 0 ? (
                    tree.items.map((comment) => renderComment(comment))
                ) : (
                    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-[#53116B] dark:bg-[#240632]/55">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#1D4ED8] dark:bg-[#53116B]/60 dark:text-[#AD49E1]">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6m-9 8 3.5-3H17a3 3 0 003-3V6a3 3 0 00-3-3H7a3 3 0 00-3 3v9a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">No comments yet</h3>
                        <p className="mt-2 max-w-sm text-sm leading-5 text-slate-500 dark:text-[#B99BC6]">
                            Be the first to share your thoughts and start an insightful conversation!
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default CommentSystem;
