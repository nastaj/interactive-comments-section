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
    #currentUser;
    #comments;
    #target;
    #parentElement;
    #date = new Date();
    #now = `${this.#date.getDate()}/${this.#date.getMonth()}/${this.#date.getFullYear()} ${this.#date.getHours()}:${String(
      this.#date.getMinutes()
    ).padStart(2, 0)}`;
    #popup;

    constructor() {
      this._setInit();
      this._getLocalStorage();
      this._setLocalStorage();

      newCommentForm.addEventListener(
        "submit",
        this._handleNewComment.bind(this)
      );
    }

    _setInit() {
      this.#currentUser = currentUser;
      this.#comments = comments;
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
        btn.addEventListener("click", this._toggleConfirmation.bind(this))
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
        const currentReplyArr = this.#comments.map((comment) => {
          return comment.replies.find(
            (reply) =>
              reply.id === +this.#parentElement.closest(".post").dataset.postId
          );
        });

        const currentReply = currentReplyArr.find(
          (reply) => reply !== undefined
        );

        if (btnPlus) {
          currentReply.score += 1;
        }
        if (btnMinus) {
          currentReply.score -= 1;
        }

        scoreEl.textContent = currentReply.score;
        this._setLocalStorage();
        return;
      }

      if (currentComment) {
        if (btnPlus) {
          currentComment.score += 1;
        }
        if (btnMinus) {
          currentComment.score -= 1;
        }

        scoreEl.textContent = currentComment.score;
        this._setLocalStorage();
      }
    }

    _handleNewComment(e) {
      e.preventDefault();

      if (newCommentInput.value.trim() === "") {
        this._togglePopup("error", "❌ Comment cannot be empty!");
        return;
      }

      const newComment = {
        id: Math.trunc(Math.random() * 100),
        content: newCommentInput.value,
        createdAt: this.#now,
        replies: [],
        score: 0,
        user: this.#currentUser,
      };

      newCommentInput.value = "";
      this.#comments.push(newComment);

      this._togglePopup("success", "✅ Post successfully sent!");

      this._generateCommentMarkup(newComment);
      this._addHandlers();
      this._setLocalStorage();
    }

    _toggleConfirmation(e) {
      appContainer.classList.add("overlay");

      const markup = `
      <div class="confirmation-box">
        <p>Are you sure you want to delete this post?</p>
        <p>This action is irreversible!</p>
        <button class="btn-delete-confirm">Delete</button>
        <button class="btn-cancel">Cancel</button>
      </div>
      `;
      appContainer.insertAdjacentHTML("beforebegin", markup);

      const confirmationBox = document.querySelector(".confirmation-box");
      const btnConfirm = document.querySelector(".btn-delete-confirm");
      const btnCancel = document.querySelector(".btn-cancel");

      btnConfirm.addEventListener("click", () => {
        this._handleDelete(e);
        appContainer.classList.remove("overlay");
        confirmationBox.remove();
      });

      btnCancel.addEventListener("click", () => {
        appContainer.classList.remove("overlay");
        confirmationBox.remove();
      });
    }

    _handleDelete(e) {
      this.#parentElement = e.target.closest(".post");

      const post = this.#comments.find(
        (comment) => +this.#parentElement.dataset.postId === comment.id
      );
      const postRepliesArr = this.#comments.map((comment) => {
        return comment.replies.find(
          (reply) => +this.#parentElement.dataset.postId === reply.id
        );
      });
      const postIndex = this.#comments.findIndex(
        (comment) => +this.#parentElement.dataset.postId === comment.id
      );
      const postRepliesIndexArr = this.#comments.map((comment) => {
        return comment.replies.findIndex(
          (reply) => +this.#parentElement.dataset.postId === reply.id
        );
      });

      const postReply = postRepliesArr.find((post) => post !== undefined);
      const postReplyIndex = postRepliesIndexArr.find((index) => index !== -1);

      if (post) {
        this.#comments.forEach((comment) => {
          comment === post ? this.#comments.splice(postIndex, 1) : "";
        });
      }

      if (postReply) {
        this.#comments.forEach((comment) => {
          comment.replies.includes(postReply)
            ? comment.replies.splice(postReplyIndex, 1)
            : "";
        });
      }

      this._togglePopup("success", "✅ Comment deleted!");
      this._setLocalStorage();
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

        if (replyInput.value.trim() === "") {
          this._togglePopup("error", "❌ Comment cannot be empty!");
          return;
        }

        const newReply = {
          id: Math.trunc(Math.random() * 100),
          content: replyInput.value,
          createdAt: this.#now,
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

        this._togglePopup("success", "✅ Post successfully sent!");

        // Rebuild handlers
        this._addHandlers();
        this._setLocalStorage();
      });
    }

    _handleEdit(e) {
      this.#parentElement = e.target.closest(".post");
      const editBtn = e.currentTarget;
      const applyBtn = this.#parentElement.querySelector(".btn-apply");
      const content = this.#parentElement.querySelector(".content");
      const commentId = +this.#parentElement.dataset.postId;
      const replyingTo = this.#parentElement.querySelector(".replying-to");

      const post = this.#comments.find((comment) => comment.id === commentId);
      const postRepliesArr = this.#comments.map((comment) =>
        comment.replies.find((reply) => reply.id === commentId)
      );

      const postIndex = this.#comments.findIndex(
        (comment) => comment.id === commentId
      );
      const postReplyIndexesArr = this.#comments.map((comm) => {
        return comm.replies.findIndex((reply) => reply.id == commentId);
      });

      const postReply = postRepliesArr.find((comment) => comment !== undefined);
      const postReplyIndex = postReplyIndexesArr.find((index) => index !== -1);

      content.setAttribute("contenteditable", true);
      replyingTo?.setAttribute("contenteditable", false);

      editBtn.classList.add("hidden");
      applyBtn.classList.remove("hidden");

      applyBtn.addEventListener(
        "click",
        () => {
          content.setAttribute("contenteditable", false);

          editBtn.classList.remove("hidden");
          applyBtn.classList.add("hidden");

          const newContent = content.textContent.trim();

          console.log(this.#comments.includes(post));

          if (this.#comments.includes(post)) {
            this.#comments[postIndex].content = content.textContent;
          }

          if (!this.#comments.includes(post)) {
            this.#comments.forEach(
              (comm) =>
                comm.replies.includes(postReply) &&
                (comm.replies[postReplyIndex].content = newContent)
            );
          }
          console.log(this.#comments);
          console.log(newContent);
          this._togglePopup("success", "✅ Comment edited!");
          this._setLocalStorage();
        },
        {
          once: true,
        }
      );
    }

    _generateCommentMarkup(comment, position = "afterbegin") {
      const markup = `
  ${
    JSON.stringify(comment.user) === JSON.stringify(this.#currentUser)
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
            <span class="content"> ${comment.content}</span>
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
            <span class="content">${comment.content}</span>
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
              <span class="content"> ${reply.content}</span>
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

    _togglePopup(state = "error", msg) {
      const markup = `
      <div class="popup ${
        state === "success" ? "success" : "error"
      }-popup new-popup">
        <p>${msg}</p>
      </div>
      `;
      appContainer.insertAdjacentHTML("beforebegin", markup);

      const popup = document.querySelector(".popup");
      this._hidePopup(popup);
    }

    async _hidePopup(popup) {
      await this._pause(3);
      popup.classList.add("hide-popup");
      await this._pause(0.2);
      popup.style.visibility = "hidden";
      popup.remove();
    }

    _pause(seconds) {
      return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }

    _setLocalStorage() {
      localStorage.setItem("comments", JSON.stringify(this.#comments));
    }

    _getLocalStorage() {
      const dataComments = JSON.parse(localStorage.getItem("comments"));

      if (!dataComments) return;

      this.#comments = dataComments;

      this._sortByScore();
      this._renderComments();
      this._addHandlers();
    }
  }

  const app = new App();
};
main();
