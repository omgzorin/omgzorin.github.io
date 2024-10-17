class App {
    constructor() {
        this.isNavOpen = false; // Track if the nav is open or closed
        this.navElement = document.querySelector(".nav");
        this.copyright = new Date().getFullYear();
    }

    // Toggle the navigation (open/close)
    toggleNav() {
        console.log("Navigation toggled");
        this.isNavOpen = !this.isNavOpen;
        this.navElement.style.width = this.isNavOpen ? "100%" : "0%";
    }

    printCopyright() {
        const footer = document.querySelector(".footer");

        footer.innerHTML = `&copy; Pruthviraj -${this.copyright}`
    }

}

// Initialize the app
const app = new App();
app.printCopyright();