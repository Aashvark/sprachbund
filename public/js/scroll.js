checkScroll();
document.onscroll = () => checkScroll();

function checkScroll() {
    let scrollPos = window.scrollY;
    for (let i = 0; i < document.getElementsByClassName("divider").length; i++) {
        if (scrollPos + (document.getElementById("header").offsetHeight) >= document.getElementById("divider" + i).offsetTop) {
            document.getElementById("unitno").innerHTML = i;
            document.getElementById("unitdesc").innerHTML = document.getElementById("divider" + i).getAttribute("data-description");
        }
    }
}