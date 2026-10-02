import { useCallback, useState } from 'react';

export const EMPTY_TREE = { id: 1, items: [] };

function cloneNode(node) {
    return {
        ...node,
        items: Array.isArray(node.items) ? node.items.map(cloneNode) : [],
    };
}

export function insertNode(tree, commentId, item) {
    const safeTree = tree && typeof tree === 'object' && Array.isArray(tree.items) ? tree : EMPTY_TREE;
    const safeItem = item && typeof item === 'object' ? { ...item, items: Array.isArray(item.items) ? item.items : [] } : null;

    if (!safeItem) {
        return safeTree;
    }

    if (!commentId || commentId === 1) {
        return {
            ...safeTree,
            items: [safeItem, ...(safeTree.items || [])],
        };
    }

    const insertIntoBranch = (items) =>
        items.map((node) => {
            if (node.id === commentId) {
                return {
                    ...cloneNode(node),
                    items: [...(Array.isArray(node.items) ? node.items : []), safeItem],
                };
            }

            if (Array.isArray(node.items) && node.items.length > 0) {
                return {
                    ...cloneNode(node),
                    items: insertIntoBranch(node.items),
                };
            }

            return cloneNode(node);
        });

    return {
        ...safeTree,
        items: insertIntoBranch(safeTree.items || []),
    };
}

export function editNode(tree, commentId, newText) {
    const safeTree = tree && typeof tree === 'object' && Array.isArray(tree.items) ? tree : EMPTY_TREE;
    const trimmedText = typeof newText === 'string' ? newText.trim() : '';

    const editInBranch = (items) =>
        items.map((node) => {
            if (node.id === commentId) {
                return {
                    ...cloneNode(node),
                    text: trimmedText || node.text,
                    isEdited: true,
                };
            }

            if (Array.isArray(node.items) && node.items.length > 0) {
                return {
                    ...cloneNode(node),
                    items: editInBranch(node.items),
                };
            }

            return cloneNode(node);
        });

    return {
        ...safeTree,
        items: editInBranch(safeTree.items || []),
    };
}

export function deleteNode(tree, commentId) {
    const safeTree = tree && typeof tree === 'object' && Array.isArray(tree.items) ? tree : EMPTY_TREE;

    const filterBranch = (items) =>
        items
            .filter((node) => node.id !== commentId)
            .map((node) => ({
                ...cloneNode(node),
                items: Array.isArray(node.items) ? filterBranch(node.items) : [],
            }));

    return {
        ...safeTree,
        items: filterBranch(safeTree.items || []),
    };
}

export function useNode(initialTree = EMPTY_TREE) {
    const [tree, setTree] = useState(initialTree);

    const insert = useCallback((commentId, item) => {
        setTree((currentTree) => insertNode(currentTree, commentId, item));
    }, []);

    const edit = useCallback((commentId, newText) => {
        setTree((currentTree) => editNode(currentTree, commentId, newText));
    }, []);

    const remove = useCallback((commentId) => {
        setTree((currentTree) => deleteNode(currentTree, commentId));
    }, []);

    return { tree, setTree, insert, edit, remove };
}
