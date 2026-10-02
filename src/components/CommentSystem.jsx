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
                className={`rounded-2xl border border-[#7A1CAC]/35 bg-[#240632] p-4 shadow-sm transition-all ${depth > 0 ? 'ml-4 border-l-2 border-l-[#AD49E1]' : ''}`}
            >
                <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm ${getAvatarClasses(comment.userName || currentUserName)}`}>
                        {getInitials(comment.userName || 'Guest')}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">
                                {comment.userName || 'Guest'}
                            </span>
                            {isPostAuthorComment && (
                                <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-300">
                                    Author
                                </span>
                            )}
                            {isCurrentUserComment && (
                                <span className="rounded-full border border-[#AD49E1]/40 bg-[#AD49E1]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#D79AFA]">
                                    You
                                </span>
                            )}
                            {comment.isAdmin && (
                                <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-300">
                                    Admin
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-[11px] text-[#B99BC6]">
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
                                    className="w-full resize-none rounded-2xl border border-[#53116B] bg-[#190325] px-3 py-2 text-sm text-[#F5E9FC] outline-none ring-0 transition placeholder:text-[#8B6A99] focus:border-[#AD49E1]"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => saveEdit(comment.id)}
                                        className="rounded-xl bg-[#7A1CAC] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#932AD0]"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditTargetId(null);
                                            setEditDraft('');
                                        }}
                                        className="rounded-xl border border-[#53116B] bg-[#240632] px-3 py-1.5 text-xs font-bold text-[#EBD3F8] transition hover:bg-[#360A4A]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#EBD3F8]">
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
                        className="rounded-full border border-[#53116B] bg-[#190325] px-3 py-1 text-[11px] font-semibold text-[#D8BDE4] transition hover:border-[#AD49E1] hover:bg-[#360A4A]"
                    >
                        Reply
                    </button>

                    {isEditable && (
                        <>
                            <button
                                type="button"
                                onClick={() => beginEditing(comment)}
                                className="rounded-full border border-[#53116B] bg-[#2E073F] px-3 py-1 text-[11px] font-semibold text-[#D8BDE4] transition hover:border-[#AD49E1] hover:bg-[#360A4A]"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(comment.id)}
                                className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-200 transition hover:border-rose-400/50 hover:bg-rose-500/20"
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
                            className="ml-auto text-[11px] font-semibold text-[#D79AFA] transition hover:text-white"
                        >
                            {replyAreaOpen ? 'Hide replies' : `View replies (${replyCount})`}
                        </button>
                    )}
                </div>

                {replyTargetId === comment.id && (
                    <div className="mt-3 rounded-2xl border border-[#53116B] bg-[#190325] p-3">
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
                            className="w-full resize-none rounded-xl border border-[#53116B] bg-[#240632] px-3 py-2 text-sm text-[#F5E9FC] outline-none transition placeholder:text-[#8B6A99] focus:border-[#AD49E1]"
                        />

                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const nextReply = (replyDrafts[comment.id] ?? '').trim();
                                    if (!nextReply) return;
                                    submitComment(comment.id, nextReply);
                                }}
                                className="rounded-xl bg-[#7A1CAC] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#932AD0]"
                            >
                                Reply
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setReplyTargetId(null);
                                    setReplyDrafts((previous) => ({ ...previous, [comment.id]: '' }));
                                }}
                                className="rounded-xl border border-[#53116B] bg-[#240632] px-3 py-1.5 text-xs font-bold text-[#EBD3F8] transition hover:bg-[#360A4A]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {replyCount > 0 && replyAreaOpen && (
                    <div className="mt-4 space-y-3 border-t border-[#53116B] pt-4">
                        {comment.items.map((child) => renderComment(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <section className="mt-10 rounded-[28px] border border-[#7A1CAC]/50 bg-[#2E073F] p-5 shadow-[0_20px_60px_rgba(25,3,37,0.25)] sm:p-8">
            <div className="mb-7 flex items-center gap-3 border-b border-[#53116B] pb-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#190325] text-[#AD49E1]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h8m-8 4h5m-8 5 2.5-2H17a3 3 0 003-3V7a3 3 0 00-3-3H7a3 3 0 00-3 3v9a3 3 0 003 3z" />
                    </svg>
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">Comments &amp; Discussion</h2>
                        <span className="rounded-full bg-[#53116B] px-2.5 py-0.5 text-xs font-bold text-[#EBD3F8]">
                            {Array.isArray(tree.items) ? tree.items.length : 0}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#B99BC6] sm:text-sm">Share your insights and join the nested discussion</p>
                </div>
            </div>

            <div className="mb-7 rounded-[20px] border border-[#7A1CAC]/45 bg-[#240632]/80 p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-black text-white">
                        {getInitials(currentUserName)}
                    </div>
                    <span className="text-sm text-[#B99BC6]">Posting as</span>
                    <span className="text-sm font-bold text-white">{currentUserName}</span>
                    {isAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-300">
                            <span aria-hidden="true">♛</span> Admin
                        </span>
                    )}
                    <span className="ml-auto hidden text-xs text-[#9E7BAA] sm:block">Supports Markdown &amp; infinite replies</span>
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
                    className="w-full resize-y rounded-2xl border border-[#53116B] bg-[#190325] px-4 py-3 text-sm text-[#F5E9FC] outline-none transition placeholder:text-[#80618D] focus:border-[#AD49E1] focus:ring-2 focus:ring-[#AD49E1]/15"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[#9E7BAA]">
                        <kbd className="rounded border border-[#7A1CAC]/50 bg-[#53116B]/60 px-2 py-1 font-semibold text-[#D8BDE4]">Enter ↵</kbd>
                        <span className="mx-2">to post,</span>
                        <kbd className="rounded border border-[#7A1CAC]/50 bg-[#53116B]/60 px-2 py-1 font-semibold text-[#D8BDE4]">Shift + Enter</kbd>
                        <span className="ml-2">for new line</span>
                    </p>
                    <button
                        type="button"
                        onClick={() => submitComment(ROOT_COMMENT_ID, mainDraft)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#7A1CAC] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#932AD0] focus:outline-none focus:ring-2 focus:ring-[#AD49E1]/60"
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
                    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#53116B] bg-[#240632]/55 px-5 py-10 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#53116B]/60 text-[#AD49E1]">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6m-9 8 3.5-3H17a3 3 0 003-3V6a3 3 0 00-3-3H7a3 3 0 00-3 3v9a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-white">No comments yet</h3>
                        <p className="mt-2 max-w-sm text-sm leading-5 text-[#B99BC6]">
                            Be the first to share your thoughts and start an insightful conversation!
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default CommentSystem;
