import ArticleManager from "./article.js";

// /src/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const articleManager = new ArticleManager();
    articleManager.loadArticles();
});
