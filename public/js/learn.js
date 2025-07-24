if (localStorage.getItem("score") === null || localStorage.getItem("score") <= 0) localStorage.setItem("score", 0);
for (let i = parseInt(localStorage.getItem("score")) + 1; i < document.getElementsByClassName("module").length; i++) {
    document.getElementsByClassName("module")[i].classList.add("disabled");
    document.getElementsByClassName("select-lesson")[i].addEventListener('submit', (event) => event.preventDefault());
    document.getElementsByClassName("start-btn")[i].innerHTML = "LOCKED";
}

for (let i = 0; i < document.getElementsByClassName("divider").length; i++) {
    for (let j = 0; j < parseInt(localStorage.getItem("score")) + 1; j++) {
        let name = `u${i}-m${j}`;
        if (localStorage.getItem(name) === null || localStorage.getItem(name) <= 0) localStorage.setItem(name, 0);
        document.getElementById(name).value = localStorage.getItem(name);
        terminator = localStorage.getItem(name);
        if (isNaN(terminator)) {
            document.getElementsByClassName(`m${i}`)[j].getElementsByClassName("start-btn")[0].innerHTML = localStorage.getItem(name) === "test" ? "TEST" : "REVIEW";
            terminator = document.getElementsByClassName('i-' + i + "-" + j).length;
        } else if (terminator != 0) document.getElementsByClassName(`m${i}`)[j].getElementsByClassName("start-btn")[0].innerHTML = "CONTINUE";

        if (localStorage.getItem(name) === "done") document.getElementsByClassName(`m${i}`)[j].classList.add("completed");
        for (var k = 0; k < terminator; k++) document.getElementsByClassName('i-' + i + "-" + j)[k].classList.add("completed");
    }
}

checkScroll();
document.onscroll = () => { checkScroll(); }

function checkScroll() {
    let scrollPos = window.scrollY;
    for (let i = document.getElementsByClassName("divider").length - 1; i >= 0; i--) {
        if (scrollPos - (document.getElementById("header").offsetHeight * 1.5) <= document.getElementById("divider" + i).offsetTop) {
            document.getElementById("unitno").innerHTML = i;
            document.getElementById("unitdesc").innerHTML = document.getElementById("divider" + i).getAttribute("data-description");
        }
    }
}