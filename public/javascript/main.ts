let json
// Variables to handle quiz
let quizUp = false;
let freshTok = 0;
let oldTok = 0;
let countRes = 0;
let questionIt = 0;
let answer = [];
let stats = [];
let today = new Date();
let startTime = 60*today.getMinutes() + today.getSeconds();
const startInstruction = "\nInstrucition:\n\n\
Click 'Start' to begin quiz.\n\
Click 'Next'/'Prev' to see next/prev question.\n\
After you answer all questions, click 'Stop' to finish test.\n\
Bad answers cause time penalty.\n\
Your result: total time + penalties."
const endInstruction = "\nInstrucition:\n\n\
Now you can save your result and stats."

// quiz related elems
const quiz = document.querySelector("quiz") as HTMLElement;
const question = document.querySelector("question") as HTMLElement;
const summary = document.querySelector("summary") as HTMLElement;
const form = document.querySelector("form") as HTMLFormElement;
const input = document.querySelector("input[type='text']") as HTMLInputElement;
const start = document.getElementById("start") as HTMLButtonElement;
const intro = document.querySelector("intro") as HTMLElement;

// buts related elems
const prev = document.getElementById("prev") as HTMLButtonElement;
const fin = document.getElementById("stop") as HTMLButtonElement;
const next = document.getElementById("next") as HTMLButtonElement;

// up related elems
const clock = document.querySelector("clock") as HTMLElement;
const canc = document.getElementById("canc") as HTMLButtonElement;

// starts a program
function hello() {
    form.style.display = "none";
    question.style.display = "none";
    fin.style.display = "none";
    next.style.display = "none";
    prev.style.display = "none";
    summary.style.display = "none";
    canc.style.display = "none";
    intro.innerText = startInstruction;
}
// add time to stats
function saveTime() {
    // tslint:disable-next-line: radix
    freshTok = parseInt(clock.innerText);
    if (stats[questionIt] === undefined)
        stats[questionIt] = 0;
    stats[questionIt] += freshTok - oldTok;
    oldTok = freshTok;
}
// changes question
function go() {
    input.value = (answer[questionIt] === undefined) ? "" : answer[questionIt];
    prev.disabled = (questionIt === 0);
    next.disabled = (questionIt === json.question.length - 1);
    question.innerText =
        "Question " + (questionIt + 1) + "/" + json.question.length + ":\n"
            + json.question[questionIt] + "\nPenalty: "
            + json.penalty[questionIt] + "sec";
}
// counter
function time() {
    let i = 0;
    // tslint:disable-next-line: no-shadowed-variable
    function next(): number {
        i++;
        return i;
    }
    return { next };
}
const tic = time();
// init quiz
function init() {
    fin.disabled = true;
    start.style.display = "none";
    form.style.display = "block";
    question.style.display = "block";
    fin.style.display = "block";
    next.style.display = "block";
    prev.style.display = "block";
    canc.style.display = "block";
    intro.innerText = json.intro;
    clock.innerText = "" + 0;
    quizUp = true;
    setInterval(() => {
        if (quizUp)
            clock.innerText = "" + tic.next();
    }, 1000);
    go();
}
// handle pre/next button click event
function changeQ(i) {
    saveTime();
    questionIt += i;
    go();
}
// updates answer
function update() {
    if (answer[questionIt] === undefined)
        countRes++;
    else {
        if(input.value === "")
            countRes--;
    }
    if (countRes === json.question.length)
        fin.disabled = false;
    else
        fin.disabled = true;
    answer[questionIt] = (input.value === "") ? undefined : input.value;
}
// stop quiz
function finish() {
    saveTime();
    quizUp = false;
    const url = "/quiz"+json.id
    let fullTime = 0
    stats.forEach((x) => {
        fullTime += x
    })
    for(let i=0; i<stats.length; i++) {
        stats[i] = 100*stats[i]/fullTime+'%'
    }
    $.ajax({
        type : "post",
        url,
        contentType : "application/json",
        data : JSON.stringify({
            answer,
            stats,
            startTime
        }),
        success : (res) => {
            form.style.display = "none";
            question.style.display = "none";
            fin.style.display = "none";
            next.style.display = "none";
            prev.style.display = "none";
            summary.style.display = "block";
            intro.innerText = endInstruction;
            let str = ""
            for(let i=0; i < res.stats.length; i++) {
                str += (i+1)+". ";
                if(res.penalty[i] === "") {
                    str += "good "+res.stats[i]+""
                } else {
                    str += "bad "+res.stats[i]+"+"+res.penalty[i]
                }
                str += "\n"
            }
            str += "\nResult: "+res.result;
            summary.innerText = str;
        }
    })
}

start.onclick = init;
next.onclick = () => {
    changeQ(1);
};
prev.onclick = () => {
    changeQ(-1);
};
fin.onclick = finish;
input.oninput = update;
canc.onclick = () => {
    location.href = "/";
};

hello();
