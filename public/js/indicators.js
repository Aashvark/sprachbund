async function update() {
    for (let i = 0; i < document.getElementsByClassName("module"); i++) {
        let module_id = document.getElementsByClassName("module")[i].getAttribute("data-id");
        let length = await (await fetch(`/${module_id}`)).json().length;
        console.log(module_id);
        console.log(length);

        for (let i = 0; i < length; i++) document.getElementsByClassName("completion")[i].innerHTML += `<div class="indicator" style="width: calc(${88 / length}% - 8px); margin: 0 1%;"></div>`;
        document.getElementsByClassName("completion")[i].innerHTML += "<i class=\"fa-solid fa-star\"></i>";
    }
}

update();

// {{#if (eq lessons.length 1) includeZero=true}}
// <div class="indicator" style="width: calc(89.5% - 8px);"></div>
// {{else}}
// {{#each lessons}}<div class="indicator" style="width: calc(88% / {{../lessons.length}} - 8px); margin: 0 1%;"></div>{{/each}}
// {{/if}}
// <i class="fa-solid fa-star"></i>