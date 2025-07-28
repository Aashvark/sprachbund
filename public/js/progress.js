if (localStorage.getItem("score") === null || localStorage.getItem("score") <= 0) localStorage.setItem("score", 0);

// completed lessons
for (let i = 0; i < parseInt(localStorage.getItem("score")); i++) {
    document.getElementsByClassName("module")[i].classList.add("completed");
    document.getElementById(document.getElementsByClassName("module")[i].getAttribute("data-id")).value = "review";
    document.getElementsByClassName("start-btn")[i].innerText = "REVIEW";
}

// current lesson
let module_no = parseInt(localStorage.getItem("score"));
let module_id = document.getElementsByClassName("module")[module_no].getAttribute("data-id");
if (localStorage.getItem(module_id) === null) localStorage.setItem(module_id, 0);
document.getElementById(module_id).value = localStorage.getItem(module_id);

let terminator = parseInt(localStorage.getItem(module_id));
if (terminator != 0) document.getElementsByClassName("start-btn")[module_no].innerText = "CONTINUE";

for (var k = 0; k < terminator; k++) document.getElementsByClassName("module")[module_no].getElementsByClassName("indicator")[k].classList.add("completed");

// locked lessons
for (let i = parseInt(localStorage.getItem("score")) + 1; i < document.getElementsByClassName("module").length; i++) {
    document.getElementsByClassName("module")[i].classList.add("disabled");
    document.getElementsByClassName("select-lesson")[i].addEventListener('submit', (event) => event.preventDefault());
    document.getElementsByClassName("start-btn")[i].innerHTML = "LOCKED";
}

// for (let i = 0; document.getElementsByClassName("module").length; i++) {
//     let name = document.getElementsByClassName("module")[i].getAttribute("data-id");

//     if (localStorage.getItem(name) === null) localStorage.setItem(name, 0);
//     document.getElementById(name).value = localStorage.getItem(name);
// }


// for (let i = 0; i < document.getElementsByClassName("divider").length; i++) {
//     for (let j = 0; j < document.getElementsByClassName("module").length; j++) {
//         let name = `u${i}-m${j}`;

//         if (localStorage.getItem(name) === null) localStorage.setItem(name, 0);
//         document.getElementById(name).value = localStorage.getItem(name);

//         if (isNaN(terminator)) {
//             document.getElementsByClassName(`m${i}`)[j].getElementsByClassName("start-btn")[0].innerText = localStorage.getItem(name) === "test" ? "TEST" : "REVIEW";
//             terminator = document.getElementsByClassName(`i-${i}-${j}`).length;
//         } else if (terminator != 0) document.getElementsByClassName(`m${i}`)[j].getElementsByClassName("start-btn")[0].innerText = "CONTINUE";
//         else terminator = parseInt(localStorage.getItem(name));

//         if (localStorage.getItem(name) === "review") document.getElementsByClassName(`m${i}`)[j].classList.add("completed");
//         for (var k = 0; k < terminator; k++) document.getElementsByClassName(`i-${i}-${j}`)[k].classList.add("completed");
//     }
// }