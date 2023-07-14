// HTML Elements
const appContainer = document.querySelector(".container");

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

// Rendering
const renderComments = async function () {
  await loadData();
  comments.forEach((comment) => generateCommentMarkup(comment));
};
renderComments();

// Markup
const generateCommentMarkup = function (comment) {
  const markup = `
  <section class="post" author="${comment.user.username}" data-post-id=${
    comment.id
  }>
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

    <section class="replies-container">
    ${comment.replies
      .map((reply) => {
        return `
        <section class="post reply-post" data-post-id="${reply.id}">
          <div class="score-container">
            <button class="btn btn-plus">
              <img src="img/icon-plus.svg" alt="Plus icon" />
            </button>
            <p class="score">${reply.score}</p>
            <button class="btn btn-minus">
              <img src="img/icon-minus.svg" alt="Minus icon" />
            </button>
          </div>

          <div class="post-main">
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

  appContainer.insertAdjacentHTML("afterbegin", markup);
};

// Scores
const setScore = async function () {
  await loadData();

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
setScore();
