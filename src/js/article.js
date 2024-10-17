class ArticleManager {
    constructor() {
        const currentDate = new Date();
        this.articles = [];
        this.articlesToShow = 10; // Default: how many articles to show initially

        // Get current year and month
        this.currentYear = currentDate.getFullYear();
        this.currentMonth = currentDate.getMonth(); // (0-based)

        // Bind the search function to this instance with debounce (500ms)
        this.debouncedSearch = this.debounce(this.searchArticles.bind(this), 500);
    }

    // Load articles dynamically from index.js
    async loadArticles() {
        const articleIndexPath = `/article/${this.currentYear}/${this.getMonthName(this.currentMonth)}/index.js`;

        try {
            await this.loadScriptDynamically(articleIndexPath);

            // Assuming index.js defines a global variable `articles`
            if (window.articles && window.articles.length > 0) {
                this.articles = window.articles;
                this.displayArticles(this.articles.reverse()); // Show articles in reverse order
            } else {
                console.error("No articles found in index.js");
            }
        } catch (error) {
            console.error("Error loading articles:", error);
        }
    }

    // Load the script dynamically
    loadScriptDynamically(scriptSrc) {
        return new Promise((resolve, reject) => {
            const scriptElement = document.createElement('script');
            scriptElement.src = scriptSrc;
            scriptElement.async = true;

            scriptElement.onload = () => {
                scriptElement.remove(); // Successfully loaded, remove script to free memory
                resolve();
            };

            scriptElement.onerror = (error) => {
                scriptElement.remove(); // Ensure script is removed on error
                reject(error);
            };

            // Append the script to the DOM
            document.body.appendChild(scriptElement);
        });
    }

    // Display list of articles
    displayArticles(articles) {
        const articlesContainer = document.getElementById('articlesContainer');
        articlesContainer.innerHTML = ''; // Clear previous content

        if (!articlesContainer) {
            console.error("No articles container found in the DOM!");
            return;
        }

        // Display each article as a card
        articles.forEach((article, index) => {
            const articleDiv = document.createElement('div');
            articleDiv.className = 'article';
            articleDiv.innerHTML = `
                <h2>${article.title}</h2>
                <p>${article.description}</p>
                <p><strong>Author:</strong> ${article.author}</p>
                <button class="read-more" data-index="${index}">Read More</button>
            `;
            articlesContainer.appendChild(articleDiv);
        });

        // Add event listeners to "Read More" buttons
        document.querySelectorAll('.read-more').forEach((button, filteredIndex) => {
            button.addEventListener('click', () => {
                const fullContentPath = articles[filteredIndex].fullContentPath;
                this.loadFullArticle(fullContentPath);
            });
        });

        // Enable/disable navigation buttons based on current month and year
        this.updateNavigationButtons();
    }

    // Load the full article (HTML file) when "Read More" is clicked
    loadFullArticle(fullContentPath) {
        fetch(fullContentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch article");
                }
                return response.text();
            })
            .then(htmlContent => {
                const fullArticleContainer = document.getElementById('fullArticleContainer');
                if (!fullArticleContainer) {
                    console.error("No full article container found in the DOM!");
                    return;
                }

                // Display the full article content
                fullArticleContainer.innerHTML = `
                    <div>
                        <button id="closeArticle">Back</button>
                    </div>
                    ${htmlContent}
                `;

                fullArticleContainer.style.display = 'block'; // Show full article container
                document.getElementById('articlesContainer').style.display = 'none'; // Hide article list

                // Add event listener to "Close" button
                document.getElementById('closeArticle').addEventListener('click', () => {
                    this.closeFullArticle();
                });
            })
            .catch(error => {
                console.error("Error loading full article:", error);
            });
    }

    // Close the full article and return to the article list
    closeFullArticle() {
        document.getElementById('fullArticleContainer').style.display = 'none'; // Hide full article
        document.getElementById('articlesContainer').style.display = 'block'; // Show articles list again

        // Clear the search query when closing the full article
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = ''; // Clear search input
            this.debouncedSearch(''); // Trigger the search function with empty query
        }
    }

    // Get month name by number
    getMonthName(monthIndex) {
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        return months[monthIndex];
    }

    // Move to the next month and load corresponding articles
    nextMonth() {
        if (this.currentMonth < 11) {
            this.currentMonth++;
        } else {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.loadArticles();
    }

    // Move to the previous month and load corresponding articles
    previousMonth() {
        if (this.currentMonth > 0) {
            this.currentMonth--;
        } else {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.loadArticles();
    }

    // Update "Next" and "Previous" buttons based on current month/year
    updateNavigationButtons() {
        const nextButton = document.getElementById('nextButton');
        const prevButton = document.getElementById('prevButton');

        // Check for future years beyond 2024
        const currentDate = new Date();
        const maxMonth = 11; // December

        // Disable next button at the end of the current year
        nextButton.disabled = (this.currentYear >= currentDate.getFullYear() && this.currentMonth === maxMonth);

        // Disable previous button at the beginning of the first year of articles
        prevButton.disabled = (this.currentYear <= 2024 && this.currentMonth === 0);
    }

    // Custom fuzzy matching function (no external libraries)
    fuzzyMatch(query, text) {
        query = query.toLowerCase().trim();
        text = text.toLowerCase();

        let score = 0;
        let matches = 0;

        // Split query into individual words and compare each one
        const queryWords = query.split(' ');
        queryWords.forEach(word => {
            if (text.includes(word)) {
                matches++;
                score += word.length;  // Score based on length of matched word
            }
        });

        // Return true if any matches were found
        return matches > 0;
    }

    // Improved search function
    searchArticles(query) {
        // Define a threshold for "long" keywords (e.g., 10 characters)
        const MAX_KEYWORD_LENGTH = 10;

        // Process search query into individual keywords (split by spaces)
        const queryWords = query.toLowerCase().split(' ').filter(word => word.length <= MAX_KEYWORD_LENGTH);

        // Filter articles based on matching keywords
        const matchedArticles = this.articles.filter(article =>
            queryWords.some(word =>
                article.title.toLowerCase().includes(word) ||
                article.description.toLowerCase().includes(word) ||
                article.author.toLowerCase().includes(word)
            )
        );

        // Display the filtered articles
        this.displayArticles(matchedArticles);
    }

    // Debounce function to delay search
    debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }
}

// Initialize the ArticleManager and load articles
window.onload = () => {
    const articleManager = new ArticleManager();
    articleManager.loadArticles();

    // Attach event listeners to the search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            articleManager.debouncedSearch(event.target.value);
        });
    }
    localStorage.clear();  // Clears all localStorage items
    sessionStorage.clear(); // Clears all sessionStorage items


};

export default ArticleManager;
