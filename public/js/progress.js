if (localStorage.getItem("score") === null || localStorage.getItem("score") <= 0) localStorage.setItem("score", 0);
for (let i = parseInt(localStorage.getItem("score")) + 1; i < document.getElementsByClassName("module").length; i++) {
    document.getElementsByClassName("module")[i].classList.add("disabled");
    document.getElementsByClassName("select-lesson")[i].addEventListener('submit', (event) => event.preventDefault());
    document.getElementsByClassName("start-btn")[i].innerHTML = "LOCKED";
}

let terminator;

for (let i = 0; i < document.getElementsByClassName("divider").length; i++) {
    for (let j = 0; j < document.getElementsByClassName("module").length; j++) {
        let name = `u${i}-m${j}`;
        console.log(name);

        if (localStorage.getItem(name) === null) localStorage.setItem(name, 0);
        document.getElementById(name).value = localStorage.getItem(name);

        if (isNaN(terminator)) {
            document.getElementsByClassName(`m${i}`)[j].getElementsByClassName("start-btn")[0].innerHTML = localStorage.getItem(name) === "test" ? "TEST" : "REVIEW";
            terminator = document.getElementsByClassName('i-' + i + "-" + j).length;
        } else if (terminator != 0) document.getElementsByClassName(`m${i}`)[j].getElementsByClassName("start-btn")[0].innerHTML = "CONTINUE";
        else terminator = parseInt(localStorage.getItem(name));

        if (localStorage.getItem(name) === "review") document.getElementsByClassName(`m${i}`)[j].classList.add("completed");
        for (var k = 0; k < terminator; k++) document.getElementsByClassName('i-' + i + "-" + j)[k].classList.add("completed");
        terminator = 0;
    }
}