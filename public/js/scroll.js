checkScroll();
document.onscroll = () => checkScroll();

function checkScroll() {
    for (let i = 0; i < document.getElementsByClassName("divider").length; i++) {
        if (window.scrollY + document.getElementById("header").offsetHeight + 40 >= document.getElementById("divider" + i).offsetTop) {
            document.getElementById("unitno").innerHTML = i;
            document.getElementById("unitdesc").innerHTML = document.getElementById("divider" + i).getAttribute("data-description");
        }
    }
}