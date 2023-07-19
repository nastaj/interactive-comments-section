// HTML Elements
const appContainer = document.querySelector(".container");
const postsContainer = document.querySelector(".posts-container");
const newCommentForm = document.querySelector(".comment-form");
const newCommentInput = document.querySelector(".comment-input");
const newCommentBtn = document.querySelector(".btn-submit");

// Data
let currentUser = {};
let comments = [];

const loadData = async function () {
  const response = await fetch("js/data.json");
  const data = await response.json();

  currentUser = data.currentUser;
  comments = data.comments;
};

// App
const main = async function () {
  await loadData();

  class App {
    #currentUser = currentUser;
    #comments = comments;
    #target;
    #parentElement;

    constructor() {
      this._sortByScore();
      this._renderComments();
      this._addHandlers();
      newCommentForm.addEventListener(
        "submit",
        this._handleNewComment.bind(this)
      );
    }

    _sortByScore() {
      this.#comments.sort((a, b) => a.score - b.score);
    }

    _renderComments() {
      this.#comments.forEach((comment) => this._generateCommentMarkup(comment));
    }

    _addHandlers() {
      const scoreContainer = document.querySelectorAll(".score-container");
      const deleteBtn = document.querySelectorAll(".btn-delete");
      const replyBtn = document.querySelectorAll(".btn-reply");
      const editBtn = document.querySelectorAll(".btn-edit");

      scoreContainer.forEach((score) =>
        score.addEventListener("click", this._handleScore.bind(this))
      );
      deleteBtn.forEach((btn) =>
        btn.addEventListener("click", this._handleDelete.bind(this))
      );
      replyBtn.forEach((btn) =>
        btn.addEventListener("click", this._handleReply.bind(this))
      );
      editBtn.forEach((btn) =>
        btn.addEventListener("click", this._handleEdit.bind(this))
      );
    }

    _handleScore(e) {
      this.#target = e.target;
      this.#parentElement = e.currentTarget;

      const currentComment = this.#comments.find(
        (comment) =>
          comment.id === +this.#parentElement.closest(".post").dataset.postId
      );
      const scoreEl = this.#parentElement.querySelector(".score");
      const btnPlus = this.#target.closest(".btn-plus");
      const btnMinus = this.#target.closest(".btn-minus");

      if (!currentComment) {
        let [currentReply] = this.#comments.map((comment) => {
          return comment.replies.find(
            (reply) =>
              reply.id === +this.#parentElement.closest(".post").dataset.postId
          );
        });

        if (btnPlus) {
          currentReply.score += 1;
        }
        if (btnMinus) {
          currentReply.score -= 1;
        }
        scoreEl.textContent = currentReply.score;
        return;
      }

      if (btnPlus) {
        currentComment.score += 1;
      }
      if (btnMinus) {
        currentComment.score -= 1;
      }
      scoreEl.textContent = currentComment.score;
    }

    _handleNewComment(e) {
      e.preventDefault();

      const newComment = {
        id: Math.trunc(Math.random() * 100),
        content: newCommentInput.value,
        createdAt: "Now",
        replies: [],
        score: 0,
        user: this.#currentUser,
      };

      newCommentInput.value = "";
      this.#comments.push(newComment);

      this._generateCommentMarkup(newComment);
      this._addHandlers();
    }

    _handleDelete(e) {
      this.#parentElement = e.target.closest(".post");

      const [post] = this.#comments.map((comment) => {
        return comment.replies.find(
          (reply) => +this.#parentElement.dataset.postId === reply.id
        );
      });
      const [postIndex] = this.#comments.map((comment) => {
        return comment.replies.findIndex(
          (reply) => +this.#parentElement.dataset.postId === reply.id
        );
      });

      this.#comments.forEach((comment) => {
        comment.replies.includes(post)
          ? comment.replies.splice(postIndex, 1)
          : "";
      });

      this.#parentElement.remove();
    }

    _handleReply(e) {
      const btn = document.querySelectorAll(".btn-reply");
      btn.forEach((btn) => (btn.disabled = true));

      this.#parentElement = e.target.closest(".post");
      const replyingToId = this.#parentElement.dataset.postId;

      this.#parentElement.insertAdjacentHTML(
        "afterend",
        this._generateReplyMarkup()
      );

      const replyForm = document.querySelector(".reply-form");
      const replyInput = replyForm.querySelector(".comment-input");
      const receiverOP = this.#comments.find(
        (comment) => comment.id === +replyingToId
      );
      const [receiverReplier] = this.#comments.map((comment) => {
        return comment.replies.find((reply) => reply.id === +replyingToId);
      });

      const originalPoster = this.#comments.find(
        (comment) => comment.id === receiverReplier?.originalPosterId
      );

      replyForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const newReply = {
          id: Math.trunc(Math.random() * 100),
          content: replyInput.value,
          createdAt: "Now",
          replyingTo: receiverOP
            ? receiverOP.user.username
            : receiverReplier.user.username,
          score: 0,
          user: this.#currentUser,
        };

        receiverOP
          ? receiverOP.replies.push(newReply)
          : originalPoster.replies.push(newReply);

        postsContainer.innerHTML = "";
        this.#comments.forEach((comment) =>
          this._generateCommentMarkup(comment)
        );

        // Rebuild handlers
        this._addHandlers();
      });
    }

    _handleEdit(e) {
      this.#parentElement = e.target.closest(".post");
      const editBtn = e.currentTarget;
      const applyBtn = this.#parentElement.querySelector(".btn-apply");
      const commentEl = this.#parentElement.querySelector(".comment");
      const commentId = +this.#parentElement.dataset.postId;

      const comment = this.#comments.find(
        (comment) => comment.id === commentId
      ) || [
        ...this.#comments.map((comment) =>
          comment.replies.find((reply) => reply.id === commentId)
        ),
      ];
      const commentIndex = this.#comments.findIndex(
        (comment) => comment.id === commentId
      );
      const [replyIndex] = this.#comments.map((comm) => {
        return comm.replies.findIndex((reply) => reply.id == commentId);
      });

      commentEl.setAttribute("contenteditable", true);

      editBtn.classList.add("hidden");
      applyBtn.classList.remove("hidden");

      applyBtn.addEventListener(
        "click",
        () => {
          commentEl.setAttribute("contenteditable", false);

          editBtn.classList.remove("hidden");
          applyBtn.classList.add("hidden");

          const newContent = commentEl.textContent
            .trim()
            .split("\n              ")
            .slice(1)
            .join("");

          console.log(this.#comments.includes(comment));

          if (this.#comments.includes(comment)) {
            this.#comments[commentIndex].content = commentEl.textContent;
          }

          if (!this.#comments.includes(comment)) {
            this.#comments.forEach(
              (comm) =>
                comm.replies.includes(comment[0]) &&
                (comm.replies[replyIndex].content = newContent)
            );
          }
          console.log(this.#comments);
          console.log(newContent);
        },
        {
          once: true,
        }
      );
    }

    _generateCommentMarkup(comment, position = "afterbegin") {
      const markup = `
  ${
    comment.user === currentUser
      ? `
      <section class="post post-own" author="${
        comment.user.username
      }" data-post-id=${comment.id}>
    <section class="parent-post">
      <div class="score-container">
        <p class="score">${comment.score}</p>
      </div>

      <div class="post-main">
      <header class="post-header">
      <div class="user-info">
        <img
          class="avatar"
          src="${this.#currentUser.image.webp}"
          alt="User avatar"
        />
        <p class="author">${this.#currentUser.username}</p>
        <p class="author-own">you</p>
        <p class="date">${comment.createdAt}</p>
      </div>
      <div class="btn-container">
        <button class="btn-delete">
          <img src="img/icon-delete.svg" alt="Reply icon" />
          Delete
        </button>
        <button class="btn-edit">
          <img src="img/icon-edit.svg" alt="Reply icon" />
          Edit
        </button>
        <button class="btn-apply hidden">
          <img src="img/icon-edit.svg" alt="Reply icon" />
          Apply
        </button>
      </div>
    </header>

        <div class="comment-container">
          <p class="comment">
            ${comment.content}
          </p>
        </div>
      </div>
    </section>
  `
      : `
      <section class="post" author="${comment.user.username}" data-post-id=${comment.id}>
      <section class="parent-post">
        <div class="score-container">
          <button class="btn btn-plus">
            <img src="img/icon-plus.svg" alt="Plus icon" />
          </button>
          <p class="score">${comment.score}</p>
          <button class="btn btn-minus">
            <img src="img/icon-minus.svg" alt="Minus icon" />
          </button>
        </div>

        <div class="post-main">
          <header class="post-header">
            <div class="user-info">
              <img
                class="avatar"
                src="${comment.user.image.webp}"
                alt="User avatar"
              />
              <p class="author">${comment.user.username}</p>
              <p class="date">${comment.createdAt}</p>
            </div>

            <button class="btn-reply">
              <img src="img/icon-reply.svg" alt="Reply icon" />
              Reply
            </button>
          </header>

          <div class="comment-container">
            <p class="comment">
              ${comment.content}
            </p>
          </div>
        </div>
      </section>
  `
  }

    <section class="replies-container">
    ${comment.replies
      .map((reply) => {
        return `
        <section class="post reply-post" data-post-id="${reply.id}">
        ${
          reply.user.username === this.#currentUser.username
            ? `
        <div class="score-container">
          <p class="score">${reply.score}</p>
        </div>
          `
            : `
        <div class="score-container">
          <button class="btn btn-plus">
            <img src="img/icon-plus.svg" alt="Plus icon" />
          </button>
          <p class="score">${reply.score}</p>
          <button class="btn btn-minus">
            <img src="img/icon-minus.svg" alt="Minus icon" />
          </button>
        </div>
          `
        }
          <div class="post-main">
          ${
            reply.user.username === this.#currentUser.username
              ? `
          <header class="post-header">
          <div class="user-info">
            <img
              class="avatar"
              src="${this.#currentUser.image.webp}"
              alt="User avatar"
            />
            <p class="author">${this.#currentUser.username}</p>
            <p class="author-own">you</p>
            <p class="date">${reply.createdAt}</p>
          </div>
          <div class="btn-container">
            <button class="btn-delete">
              <img src="img/icon-delete.svg" alt="Reply icon" />
              Delete
            </button>
            <button class="btn-edit">
              <img src="img/icon-edit.svg" alt="Reply icon" />
              Edit
            </button>
            <button class="btn-apply hidden">
              <img src="img/icon-edit.svg" alt="Reply icon" />
              Apply
            </button>
          </div>
        </header>
          `
              : `
          <header class="post-header">
          <div class="user-info">
            <img
              class="avatar"
              src="${reply.user.image.webp}"
              alt="User avatar"
            />
           <p class="author">${reply.user.username}</p>
           <p class="date">${reply.createdAt}</p>
          </div>

          <button class="btn-reply">
            <img src="img/icon-reply.svg" alt="Reply icon" />
              Reply
          </button>
        </header>
          `
          }
          <div class="comment-container">
            <p class="comment">
              <span class="replying-to">@${reply.replyingTo}</span>
              ${reply.content}
            </p>
          </div>
          </div>
        </section>
            `;
      })
      .join("")}
    </section>
  `;
      postsContainer.insertAdjacentHTML(position, markup);
    }

    _generateReplyMarkup() {
      return `
  <section class="add-comment">
      <section class="parent-post">
        <img
          class="avatar"
          src="img/avatars/image-juliusomo.webp"
          alt="User avatar"
        />
        <form class="comment-form reply-form" action="#">
          <input
            class="comment-input"
            type="text"
            placeholder="Add a comment..."
          />
          <button class="btn-submit" type="submit">Reply</button>
        </form>
      </section>
  </section>
  `;
    }
  }

  const app = new App();
};
main();
