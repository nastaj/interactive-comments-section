// HTML Elements
const appContainer = document.querySelector(".container");
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

  // Sort comments by score
  comments.sort((a, b) => a.score - b.score);
};

loadData().then(function () {
  // Markup
  const generateCommentMarkup = function (comment, position = "afterbegin") {
    const markup = `
  ${
    comment.user === currentUser
      ? `
      <section class="post post-own" author="${comment.user.username}" data-post-id=${comment.id}>
    <section class="parent-post">
      <div class="score-container">
        <p class="score">${comment.score}</p>
      </div>

      <div class="post-main">
      <header class="post-header">
      <div class="user-info">
        <img
          class="avatar"
          src="${currentUser.image.webp}"
          alt="User avatar"
        />
        <p class="author">${currentUser.username}</p>
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
          reply.user.username === currentUser.username
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
            reply.user.username === currentUser.username
              ? `
          <header class="post-header">
          <div class="user-info">
            <img
              class="avatar"
              src="${currentUser.image.webp}"
              alt="User avatar"
            />
            <p class="author">${currentUser.username}</p>
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

    appContainer.insertAdjacentHTML(position, markup);
  };

  const generateReplyMarkup = function () {
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
  };

  // Rendering
  const renderComments = function () {
    comments.forEach((comment) => generateCommentMarkup(comment));
  };
  renderComments();

  // Scores
  const handleScore = function () {
    const scoreContainer = document.querySelectorAll(".score-container");
    scoreContainer.forEach((score) =>
      score.addEventListener("click", (e) => {
        // Refactor this mess later
        const currentComment = comments.find(
          (comment) =>
            comment.id === +e.currentTarget.closest(".post").dataset.postId
        );
        const scoreEl = e.currentTarget.querySelector(".score");
        const btnPlus = e.target.closest(".btn-plus");
        const btnMinus = e.target.closest(".btn-minus");

        if (!currentComment) {
          let [currentReply] = comments.map((comment) => {
            return comment.replies.find(
              (reply) =>
                reply.id === +e.currentTarget.closest(".post").dataset.postId
            );
          });

          if (btnPlus) {
            currentReply.score++;
          }
          if (btnMinus) {
            currentReply.score--;
          }
          scoreEl.textContent = currentReply.score;
          return;
        }

        if (btnPlus) {
          currentComment.score++;
        }
        if (btnMinus) {
          currentComment.score--;
        }
        scoreEl.textContent = currentComment.score;
      })
    );
  };
  handleScore();

  newCommentForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newComment = {
      id: Math.trunc(Math.random() * 100),
      content: newCommentInput.value,
      createdAt: "Now",
      replies: [],
      score: 0,
      user: currentUser,
    };

    newCommentInput.value = "";
    comments.push(newComment);

    generateCommentMarkup(newComment);
  });

  const handleReplies = function () {
    const replyBtn = document.querySelectorAll(".btn-reply");
    replyBtn.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const parentElement = e.target.closest(".post");
        const replyingToId = parentElement.dataset.postId;

        parentElement.insertAdjacentHTML("afterend", generateReplyMarkup());

        const replyForm = document.querySelector(".reply-form");
        const replyInput = replyForm.querySelector(".comment-input");
        const receiverOP = comments.find(
          (comment) => comment.id === +replyingToId
        );
        const [receiverReplier] = comments.map((comment) => {
          return comment.replies.find((reply) => reply.id === +replyingToId);
        });

        const originalPoster = comments.find(
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
            user: currentUser,
          };

          receiverOP
            ? receiverOP.replies.push(newReply)
            : originalPoster.replies.push(newReply);

          appContainer.innerHTML = "";
          comments.forEach((comment) => generateCommentMarkup(comment));

          // Rebuild handlers
          handleScore();
          handleReplies();
        });
      })
    );
  };
  handleReplies();
});
