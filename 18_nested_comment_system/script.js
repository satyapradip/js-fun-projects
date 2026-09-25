/**
 * 💬 Machine Coding Interview: Nested Recursive Comments System
 * 
 * Key Concepts Demonstrated:
 * 1. N-Ary Tree Data Structures (Recursive Node Schema with replies: [])
 * 2. Recursive DOM Rendering Engine
 * 3. Immutable Tree Traversal (Depth-First Search DFS for updates & deletions)
 * 4. Collapsible Thread Hierarchies with Subtree Size Counting
 * 5. Dynamic Inline Reply & In-Place Editing UI State
 * 6. Thread Sorting (Upvotes vs Chronological) & LocalStorage Persistence
 */

(() => {
  'use strict';

  // --- 1. INITIAL SEED THREAD DATA ---
  const SEED_COMMENTS = [
    {
      id: 'c-1',
      author: '@sophie_bits',
      text: 'Direct DOM manipulation is still essential for high-performance canvas animations, audio visualizers, and virtualized lists where framework overhead costs milliseconds.',
      timestamp: Date.now() - 1000 * 60 * 95, // 95 mins ago
      votes: 42,
      userVote: 0,
      isCollapsed: false,
      replies: [
        {
          id: 'c-1-1',
          author: '@ryan_florence',
          text: 'Totally agree. The virtual DOM was never faster than direct DOM manipulation; its real superpower was developer ergonomic sanity through declarative UI.',
          timestamp: Date.now() - 1000 * 60 * 60,
          votes: 19,
          userVote: 0,
          isCollapsed: false,
          replies: [
            {
              id: 'c-1-1-1',
              author: '@rich_harris',
              text: 'Which is why modern compilers (like Svelte or Solid) compile templates directly down to surgical vanilla DOM calls without any virtual DOM diffing at runtime!',
              timestamp: Date.now() - 1000 * 60 * 25,
              votes: 31,
              userVote: 0,
              isCollapsed: false,
              replies: []
            }
          ]
        },
        {
          id: 'c-1-2',
          author: '@ken_wheeler',
          text: 'Plus, web components and micro-frontends thrive on vanilla DOM boundary encapsulation.',
          timestamp: Date.now() - 1000 * 60 * 40,
          votes: 8,
          userVote: 0,
          isCollapsed: false,
          replies: []
        }
      ]
    },
    {
      id: 'c-2',
      author: '@addy_osmani',
      text: 'Remember: the fastest DOM operation is the one you never execute. Batching reads and writes via requestAnimationFrame remains the gold standard to prevent layout thrashing.',
      timestamp: Date.now() - 1000 * 60 * 130,
      votes: 28,
      userVote: 0,
      isCollapsed: false,
      replies: []
    }
  ];

  // --- 2. STATE SCHEMA ---
  const state = {
    comments: JSON.parse(localStorage.getItem('nested_comments')) || SEED_COMMENTS,
    sortBy: 'upvotes', // 'upvotes' | 'newest' | 'oldest'
    activeReplyId: null,
    activeEditId: null
  };

  function persist() {
    localStorage.setItem('nested_comments', JSON.stringify(state.comments));
  }

  // --- 3. DOM ELEMENTS ---
  const commentsStream = document.querySelector('#commentsStream');
  const totalCommentsCount = document.querySelector('#totalCommentsCount');
  const sortOrder = document.querySelector('#sortOrder');
  const newCommentForm = document.querySelector('#newCommentForm');
  const authorInput = document.querySelector('#authorInput');
  const commentTextInput = document.querySelector('#commentTextInput');
  const charCount = document.querySelector('#charCount');

  // --- 4. RECURSIVE TREE HELPERS (DFS ALGORITHMS) ---

  // Count all nodes in tree
  function countNodes(nodes) {
    let count = 0;
    nodes.forEach(node => {
      count += 1 + countNodes(node.replies || []);
    });
    return count;
  }

  // Add reply deep in tree
  function insertReplyDFS(nodes, parentId, newComment) {
    for (let node of nodes) {
      if (node.id === parentId) {
        node.replies.unshift(newComment);
        return true;
      }
      if (node.replies && node.replies.length > 0) {
        const found = insertReplyDFS(node.replies, parentId, newComment);
        if (found) return true;
      }
    }
    return false;
  }

  // Toggle Collapse
  function toggleCollapseDFS(nodes, targetId) {
    for (let node of nodes) {
      if (node.id === targetId) {
        node.isCollapsed = !node.isCollapsed;
        return true;
      }
      if (node.replies && node.replies.length > 0) {
        const found = toggleCollapseDFS(node.replies, targetId);
        if (found) return true;
      }
    }
    return false;
  }

  // Update Vote
  function updateVoteDFS(nodes, targetId, direction) {
    for (let node of nodes) {
      if (node.id === targetId) {
        // userVote can be -1, 0, or 1
        if (node.userVote === direction) {
          // Revert vote
          node.votes -= direction;
          node.userVote = 0;
        } else {
          // Update vote difference
          node.votes += (direction - node.userVote);
          node.userVote = direction;
        }
        return true;
      }
      if (node.replies && node.replies.length > 0) {
        const found = updateVoteDFS(node.replies, targetId, direction);
        if (found) return true;
      }
    }
    return false;
  }

  // Edit comment text
  function editCommentDFS(nodes, targetId, newText) {
    for (let node of nodes) {
      if (node.id === targetId) {
        node.text = newText;
        return true;
      }
      if (node.replies && node.replies.length > 0) {
        const found = editCommentDFS(node.replies, targetId, newText);
        if (found) return true;
      }
    }
    return false;
  }

  // Delete comment node
  function deleteCommentDFS(nodes, targetId) {
    const index = nodes.findIndex(n => n.id === targetId);
    if (index !== -1) {
      nodes.splice(index, 1);
      return true;
    }
    for (let node of nodes) {
      if (node.replies && node.replies.length > 0) {
        const deleted = deleteCommentDFS(node.replies, targetId);
        if (deleted) return true;
      }
    }
    return false;
  }

  // Sort nodes
  function sortComments(nodes, criteria) {
    const sorted = [...nodes].sort((a, b) => {
      if (criteria === 'upvotes') return b.votes - a.votes;
      if (criteria === 'newest') return b.timestamp - a.timestamp;
      if (criteria === 'oldest') return a.timestamp - b.timestamp;
      return 0;
    });

    sorted.forEach(node => {
      if (node.replies && node.replies.length > 0) {
        node.replies = sortComments(node.replies, criteria);
      }
    });

    return sorted;
  }

  // --- 5. HUMANIZED RELATIVE TIME ---
  function timeAgo(msTimestamp) {
    const diffSecs = Math.floor((Date.now() - msTimestamp) / 1000);
    if (diffSecs < 60) return 'just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // --- 6. RECURSIVE DOM RENDERING ENGINE ---
  function renderTree() {
    state.comments = sortComments(state.comments, state.sortBy);
    totalCommentsCount.textContent = countNodes(state.comments);

    commentsStream.innerHTML = '';

    if (state.comments.length === 0) {
      commentsStream.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No comments yet. Start the conversation!</div>';
      return;
    }

    state.comments.forEach(comment => {
      const nodeEl = createCommentNodeElement(comment);
      commentsStream.appendChild(nodeEl);
    });
  }

  function createCommentNodeElement(comment) {
    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = 'comment-node';
    nodeWrapper.id = comment.id;

    const childCount = countNodes(comment.replies || []);
    const initial = comment.author.replace('@', '')[0]?.toUpperCase() || 'U';

    // Collapsed View
    if (comment.isCollapsed) {
      nodeWrapper.innerHTML = `
        <div class="comment-card">
          <div class="comment-header">
            <div class="comment-author-wrap">
              <span class="avatar-circle">${initial}</span>
              <span class="comment-author">${escapeHTML(comment.author)}</span>
              <span class="comment-timestamp">• ${timeAgo(comment.timestamp)}</span>
            </div>
            <button type="button" class="collapsed-indicator btn-expand-thread" data-id="${comment.id}">
              ➕ Expand (${childCount + 1} comments hidden)
            </button>
          </div>
        </div>
      `;
      return nodeWrapper;
    }

    // Expanded View
    const isEditing = state.activeEditId === comment.id;
    const isReplying = state.activeReplyId === comment.id;

    const card = document.createElement('div');
    card.className = 'comment-card';

    card.innerHTML = `
      <div class="comment-header">
        <div class="comment-author-wrap">
          <span class="avatar-circle">${initial}</span>
          <span class="comment-author">${escapeHTML(comment.author)}</span>
          <span class="comment-timestamp">• ${timeAgo(comment.timestamp)}</span>
        </div>
        <button type="button" class="btn-action-text btn-collapse-thread" data-id="${comment.id}" title="Collapse thread branch">
          [-] Collapse
        </button>
      </div>

      ${isEditing ? `
        <div class="inline-reply-box">
          <textarea class="edit-textarea" rows="3">${escapeHTML(comment.text)}</textarea>
          <div class="inline-actions">
            <button type="button" class="btn btn-secondary btn-cancel-edit">Cancel</button>
            <button type="button" class="btn btn-primary btn-save-edit" data-id="${comment.id}">Save</button>
          </div>
        </div>
      ` : `
        <p class="comment-body">${escapeHTML(comment.text)}</p>
      `}

      <div class="comment-actions">
        <div class="vote-group">
          <button type="button" class="btn-vote btn-upvote ${comment.userVote === 1 ? 'has-upvoted' : ''}" data-id="${comment.id}" aria-label="Upvote">▲</button>
          <span class="vote-score">${comment.votes}</span>
          <button type="button" class="btn-vote btn-downvote ${comment.userVote === -1 ? 'has-downvoted' : ''}" data-id="${comment.id}" aria-label="Downvote">▼</button>
        </div>

        <button type="button" class="btn-action-text btn-reply-toggle" data-id="${comment.id}">
          💬 Reply
        </button>
        <button type="button" class="btn-action-text btn-edit-toggle" data-id="${comment.id}">
          ✏️ Edit
        </button>
        <button type="button" class="btn-action-text btn-delete" data-id="${comment.id}">
          🗑️ Delete
        </button>
      </div>

      ${isReplying ? `
        <div class="inline-reply-box">
          <input type="text" class="reply-author-input" placeholder="Your @username" value="@frontend_ninja">
          <textarea class="reply-textarea" rows="2" placeholder="Write your reply..."></textarea>
          <div class="inline-actions">
            <button type="button" class="btn btn-secondary btn-cancel-reply">Cancel</button>
            <button type="button" class="btn btn-primary btn-submit-reply" data-id="${comment.id}">Post Reply</button>
          </div>
        </div>
      ` : ''}
    `;

    nodeWrapper.appendChild(card);

    // Recursively render child replies branch
    if (comment.replies && comment.replies.length > 0) {
      const branchContainer = document.createElement('div');
      branchContainer.className = 'replies-branch';

      comment.replies.forEach(reply => {
        branchContainer.appendChild(createCommentNodeElement(reply));
      });

      nodeWrapper.appendChild(branchContainer);
    }

    return nodeWrapper;
  }

  // --- 7. EVENT DELEGATION LISTENER ---
  commentsStream.addEventListener('click', (e) => {
    // 1. Upvote
    if (e.target.closest('.btn-upvote')) {
      const id = e.target.closest('.btn-upvote').dataset.id;
      updateVoteDFS(state.comments, id, 1);
      persist();
      renderTree();
      return;
    }

    // 2. Downvote
    if (e.target.closest('.btn-downvote')) {
      const id = e.target.closest('.btn-downvote').dataset.id;
      updateVoteDFS(state.comments, id, -1);
      persist();
      renderTree();
      return;
    }

    // 3. Collapse thread
    if (e.target.closest('.btn-collapse-thread')) {
      const id = e.target.closest('.btn-collapse-thread').dataset.id;
      toggleCollapseDFS(state.comments, id);
      persist();
      renderTree();
      return;
    }

    // 4. Expand thread
    if (e.target.closest('.btn-expand-thread')) {
      const id = e.target.closest('.btn-expand-thread').dataset.id;
      toggleCollapseDFS(state.comments, id);
      persist();
      renderTree();
      return;
    }

    // 5. Reply toggle
    if (e.target.closest('.btn-reply-toggle')) {
      const id = e.target.closest('.btn-reply-toggle').dataset.id;
      state.activeReplyId = state.activeReplyId === id ? null : id;
      state.activeEditId = null;
      renderTree();
      return;
    }

    // 6. Cancel reply
    if (e.target.closest('.btn-cancel-reply')) {
      state.activeReplyId = null;
      renderTree();
      return;
    }

    // 7. Submit inline reply
    if (e.target.closest('.btn-submit-reply')) {
      const id = e.target.closest('.btn-submit-reply').dataset.id;
      const box = e.target.closest('.inline-reply-box');
      const author = box.querySelector('.reply-author-input').value.trim() || '@anonymous';
      const text = box.querySelector('.reply-textarea').value.trim();

      if (!text) return;

      const newReply = {
        id: `c-${Date.now()}`,
        author: author.startsWith('@') ? author : `@${author}`,
        text,
        timestamp: Date.now(),
        votes: 1,
        userVote: 1,
        isCollapsed: false,
        replies: []
      };

      insertReplyDFS(state.comments, id, newReply);
      state.activeReplyId = null;
      persist();
      renderTree();
      return;
    }

    // 8. Edit toggle
    if (e.target.closest('.btn-edit-toggle')) {
      const id = e.target.closest('.btn-edit-toggle').dataset.id;
      state.activeEditId = state.activeEditId === id ? null : id;
      state.activeReplyId = null;
      renderTree();
      return;
    }

    // 9. Cancel edit
    if (e.target.closest('.btn-cancel-edit')) {
      state.activeEditId = null;
      renderTree();
      return;
    }

    // 10. Save edit
    if (e.target.closest('.btn-save-edit')) {
      const id = e.target.closest('.btn-save-edit').dataset.id;
      const box = e.target.closest('.inline-reply-box');
      const text = box.querySelector('.edit-textarea').value.trim();
      if (!text) return;

      editCommentDFS(state.comments, id, text);
      state.activeEditId = null;
      persist();
      renderTree();
      return;
    }

    // 11. Delete
    if (e.target.closest('.btn-delete')) {
      const id = e.target.closest('.btn-delete').dataset.id;
      const confirmed = window.confirm('Delete this comment and its replies?');
      if (!confirmed) return;

      deleteCommentDFS(state.comments, id);
      persist();
      renderTree();
      return;
    }
  });

  // --- 8. TOP-LEVEL COMMENT SUBMISSION ---
  newCommentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const author = authorInput.value.trim() || '@anonymous';
    const text = commentTextInput.value.trim();
    if (!text) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: author.startsWith('@') ? author : `@${author}`,
      text,
      timestamp: Date.now(),
      votes: 1,
      userVote: 1,
      isCollapsed: false,
      replies: []
    };

    state.comments.unshift(newComment);
    commentTextInput.value = '';
    charCount.textContent = '0 / 500';
    persist();
    renderTree();
  });

  commentTextInput.addEventListener('input', (e) => {
    charCount.textContent = `${e.target.value.length} / 500`;
  });

  sortOrder.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderTree();
  });

  // Initial render
  renderTree();
})();
