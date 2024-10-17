class ArticleManager {
    constructor() {
        const currentDate = new Date();
        this.articles = [];
        this.articlesToShow = 10; // How many articles to show by default

        // Get current year and month from the system's date
        this.currentYear = currentDate.getFullYear();  // Current year
        this.currentMonth = currentDate.getMonth();   // Current month (0-based, so January is 0)
    }

    // Load articles dynamically from the `index.js` file
    async loadArticles() {
        const articleIndexPath = `/article/${this.currentYear}/${this.getMonthName(this.currentMonth)}/index.js`; // Path to index.js

        try {
            // Dynamically load the index.js file
            await this.loadScriptDynamically(articleIndexPath);

            // Assuming index.js defines a global variable `articles`
            if (window.articles && window.articles.length > 0) {
                this.articles = window.articles;
                this.displayArticles();
                this.applyCurrentThemeToNewContent(); // Apply current theme after loading articles
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
                scriptElement.remove(); // Successfully loaded, remove the script to free memory
                resolve();
            };

            scriptElement.onerror = (error) => {
                scriptElement.remove(); // Ensure script is removed even on error
                reject(error);
            };

            // Append the script to the DOM
            document.body.appendChild(scriptElement);
        });
    }

    // Display the list of articles
    displayArticles() {
        const articlesContainer = document.getElementById('articlesContainer');
        articlesContainer.innerHTML = ''; // Clear previous content

        if (!articlesContainer) {
            console.error("No articles container found in the DOM!");
            return;
        }

        // Show each article as a card with title, description, author, and "Read More" button
        this.articles.forEach((article, index) => {
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

        // Add event listeners to the "Read More" buttons
        document.querySelectorAll('.read-more').forEach((button) => {
            button.addEventListener('click', (event) => {
                const articleIndex = event.target.getAttribute('data-index');
                const fullContentPath = this.articles[articleIndex].fullContentPath;
                this.loadFullArticle(fullContentPath);
            });
        });

        // Enable/Disable the buttons based on current month and year
        this.updateNavigationButtons();
    }

    // Apply current theme to newly loaded content
    applyCurrentThemeToNewContent() {
        const currentTheme = document.body.getAttribute('data-theme'); // Check current theme (light or dark)
        if (currentTheme) {
            applyTheme(currentTheme); // Reapply the theme to the newly loaded content
        }
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

                fullArticleContainer.style.display = 'block'; // Show the full article container
                document.getElementById('articlesContainer').style.display = 'none'; // Hide article list

                // Add event listener to the close button
                document.getElementById('closeArticle').addEventListener('click', () => {
                    this.closeFullArticle();
                });

                // Reapply theme to the loaded full article content
                this.applyCurrentThemeToNewContent();
            })
            .catch(error => {
                console.error("Error loading full article:", error);
            });
    }

    // Close the full article and return to the article list
    closeFullArticle() {
        document.getElementById('fullArticleContainer').style.display = 'none'; // Hide full article
        document.getElementById('articlesContainer').style.display = 'block'; // Show articles list again
    }

    // Get month name by number
    getMonthName(monthIndex) {
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        return months[monthIndex];
    }

    // Move to the next month and load the corresponding articles
    nextMonth() {
        if (this.currentMonth < 11) {
            this.currentMonth++;
        } else {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.loadArticles();
    }

    // Move to the previous month and load the corresponding articles
    previousMonth() {
        if (this.currentMonth > 0) {
            this.currentMonth--;
        } else {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.loadArticles();
    }

    // Update the "Next" and "Previous" buttons based on current month and year
    updateNavigationButtons() {
        const nextButton = document.getElementById('nextButton');
        const prevButton = document.getElementById('prevButton');

        if (this.currentMonth === 11 && this.currentYear === 2024) {
            nextButton.disabled = true; // Disable next button on the last month of the year
        } else {
            nextButton.disabled = false;
        }

        if (this.currentMonth === 0 && this.currentYear === 2024) {
            prevButton.disabled = true; // Disable prev button on the first month of the year
        } else {
            prevButton.disabled = false;
        }
    }
}

// Initialize the ArticleManager and load articles
window.onload = () => {
    const articleManager = new ArticleManager();
    articleManager.loadArticles();

    // Attach event listeners to buttons
    document.getElementById('nextButton').addEventListener('click', () => articleManager.nextMonth());
    document.getElementById('prevButton').addEventListener('click', () => articleManager.previousMonth());
};

export default ArticleManager;
