if (localStorage.getItem("score") === null || localStorage.getItem("score") <= 0) localStorage.setItem("score", 0);
document.getElementById("scoreno").innerText = localStorage.getItem("score");

for (let i = 0; i < parseInt(localStorage.getItem("score")); i++) {
    document.getElementsByClassName("module")[i].classList.add("completed");
    document.getElementsByClassName("start-btn")[i].innerText = "REVIEW";
    document.getElementsByName("lesson")[i].value = "review";
}

let module_no = parseInt(localStorage.getItem("score"));
let module_id = document.getElementsByClassName("module")[module_no].getAttribute("data-id");
if (localStorage.getItem(module_id) === null) localStorage.setItem(module_id, 0);
document.getElementsByName("lesson")[module_no].value = localStorage.getItem(module_id);

let terminator = parseInt(localStorage.getItem(module_id));
if (isNaN(terminator)) {
    document.getElementsByClassName("start-btn")[module_no].innerText = "TEST";
    terminator = document.getElementsByClassName("module")[module_no].getElementsByClassName("indicator").length;
} else if (terminator != 0) document.getElementsByClassName("start-btn")[module_no].innerText = "CONTINUE";

for (var k = 0; k < terminator; k++) document.getElementsByClassName("module")[module_no].getElementsByClassName("indicator")[k].classList.add("completed");

for (let i = parseInt(localStorage.getItem("score")) + 1; i < document.getElementsByClassName("module").length; i++) {
    document.getElementsByClassName("select-lesson")[i].addEventListener('submit', (event) => event.preventDefault());
    document.getElementsByClassName("module")[i].classList.add("disabled");
    document.getElementsByClassName("start-btn")[i].innerHTML = "LOCKED";
}