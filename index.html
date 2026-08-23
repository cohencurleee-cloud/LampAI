<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#07080a">
<title>LampAI</title>

<style>
*{box-sizing:border-box}

html,body{
  margin:0;
  width:100%;
  height:100%;
  overflow:hidden;
  background:#07080a;
  color:#f5f5f5;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif;
}

button,input,textarea{font:inherit}

button{cursor:pointer}

.app{
  width:100%;
  height:100dvh;
  display:flex;
  flex-direction:column;
  background:
    radial-gradient(circle at 50% -20%,rgba(255,255,255,.09),transparent 35%),
    #07080a;
}

header{
  height:62px;
  flex-shrink:0;
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
  border-bottom:1px solid rgba(255,255,255,.07);
  backdrop-filter:blur(20px);
  background:rgba(7,8,10,.75);
}

.logo{
  font-size:18px;
  font-weight:700;
  letter-spacing:-.4px;
}

.logo-dot{
  display:inline-block;
  width:8px;
  height:8px;
  margin-right:7px;
  border-radius:50%;
  background:#fff;
  box-shadow:0 0 14px rgba(255,255,255,.8);
}

.header-button{
  position:absolute;
  width:38px;
  height:38px;
  border:0;
  border-radius:50%;
  background:rgba(255,255,255,.07);
  color:#ddd;
  display:grid;
  place-items:center;
  font-size:18px;
}

.header-button:active{
  transform:scale(.92);
}

#newChat{
  left:14px;
}

#settingsButton{
  right:14px;
}

#chat{
  flex:1;
  overflow-y:auto;
  overscroll-behavior:contain;
  padding:24px 16px 150px;
  scroll-behavior:smooth;
}

#chat::-webkit-scrollbar{
  display:none;
}

.welcome{
  min-height:70%;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding:20px;
}

.lamp{
  width:74px;
  height:74px;
  border-radius:24px;
  display:grid;
  place-items:center;
  font-size:36px;
  margin-bottom:22px;
  background:linear-gradient(145deg,#ffffff,#9da3aa);
  color:#08090a;
  box-shadow:
    0 0 35px rgba(255,255,255,.13),
    inset 0 1px 1px rgba(255,255,255,.8);
}

.welcome h1{
  margin:0;
  font-size:31px;
  letter-spacing:-1.3px;
}

.welcome p{
  margin:9px 0 0;
  color:#777d86;
  font-size:15px;
}

.suggestions{
  width:100%;
  max-width:520px;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:9px;
  margin-top:30px;
}

.suggestion{
  text-align:left;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.045);
  color:#ddd;
  border-radius:16px;
  padding:14px;
  transition:.18s;
}

.suggestion:active{
  transform:scale(.97);
  background:rgba(255,255,255,.09);
}

.message{
  width:min(760px,100%);
  margin:0 auto 18px;
  display:flex;
  animation:appear .22s ease;
}

@keyframes appear{
  from{opacity:0;transform:translateY(7px)}
  to{opacity:1;transform:none}
}

.message.user{
  justify-content:flex-end;
}

.bubble{
  max-width:86%;
  padding:12px 15px;
  border-radius:20px;
  line-height:1.5;
  font-size:15px;
  white-space:pre-wrap;
}

.user .bubble{
  background:#f1f1f1;
  color:#090909;
  border-bottom-right-radius:6px;
}

.ai .bubble{
  color:#e8e8e8;
  background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.07);
  border-bottom-left-radius:6px;
}

.thinking{
  color:#777d86!important;
}

.bottom{
  position:fixed;
  left:0;
  right:0;
  bottom:0;
  z-index:10;
  padding:8px 12px calc(8px + env(safe-area-inset-bottom));
  background:linear-gradient(transparent,#07080a 28%);
}

.composer{
  width:min(760px,100%);
  margin:auto;
  min-height:56px;
  display:flex;
  align-items:center;
  gap:7px;
  padding:7px 8px 7px 14px;
  border:1px solid rgba(255,255,255,.1);
  border-radius:22px;
  background:rgba(20,21,24,.94);
  backdrop-filter:blur(25px);
  box-shadow:0 12px 40px rgba(0,0,0,.4);
}

#input{
  min-width:0;
  flex:1;
  border:0;
  outline:0;
  background:transparent;
  color:white;
  font-size:16px;
}

#input::placeholder{
  color:#656a72;
}

.icon{
  width:38px;
  height:38px;
  flex-shrink:0;
  border:0;
  border-radius:50%;
  background:transparent;
  color:#9298a1;
  font-size:20px;
}

.send{
  width:40px;
  height:40px;
  flex-shrink:0;
  border:0;
  border-radius:50%;
  background:#fff;
  color:#000;
  font-size:17px;
  font-weight:800;
}

.send:disabled{
  opacity:.35;
}

.disclaimer{
  text-align:center;
  color:#4d5259;
  font-size:10px;
  margin-top:6px;
}

/* SETTINGS */

.overlay{
  position:fixed;
  inset:0;
  z-index:50;
  display:none;
  align-items:flex-end;
  justify-content:center;
  background:rgba(0,0,0,.65);
  backdrop-filter:blur(7px);
}

.overlay.open{
  display:flex;
}

.settings{
  width:100%;
  max-width:600px;
  max-height:88dvh;
  overflow:auto;
  background:#111317;
  border:1px solid rgba(255,255,255,.09);
  border-bottom:0;
  border-radius:28px 28px 0 0;
  padding:18px 18px calc(24px + env(safe-area-inset-bottom));
  animation:sheet .25s ease;
}

@keyframes sheet{
  from{transform:translateY(100%)}
  to{transform:none}
}

.handle{
  width:38px;
  height:4px;
  border-radius:10px;
  background:#41454b;
  margin:0 auto 20px;
}

.settings h2{
  margin:0;
  font-size:22px;
}

.settings p{
  color:#777d86;
  font-size:14px;
  line-height:1.45;
}

textarea{
  width:100%;
  min-height:145px;
  resize:none;
  padding:14px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.09);
  outline:0;
  background:#090a0c;
  color:#fff;
  font-size:15px;
  line-height:1.45;
}

textarea:focus{
  border-color:rgba(255,255,255,.25);
}

.actions{
  display:flex;
  gap:8px;
  margin-top:12px;
}

.actions button{
  flex:1;
  height:48px;
  border-radius:14px;
  border:0;
}

.cancel{
  background:#22252a;
  color:#ddd;
}

.save{
  background:#fff;
  color:#000;
  font-weight:700;
}

/* PHONE */

@media(max-width:600px){
  header{
    height:58px;
  }

  .welcome{
    min-height:65%;
  }

  .lamp{
    width:66px;
    height:66px;
    border-radius:21px;
    font-size:31px;
  }

  .welcome h1{
    font-size:28px;
  }

  .suggestions{
    grid-template-columns:1fr;
    max-width:390px;
  }

  .suggestion{
    padding:13px;
  }

  .bubble{
    max-width:90%;
  }

  #chat{
    padding-left:12px;
    padding-right:12px;
  }
}
</style>
</head>

<body>

<div class="app">

<header>
  <button class="header-button" id="newChat">+</button>

  <div class="logo">
    <span class="logo-dot"></span>
    LampAI
  </div>

  <button class="header-button" id="settingsButton">⚙</button>
</header>

<div id="chat">

  <div class="welcome">

    <div class="lamp">L</div>

    <h1>What can I help with?</h1>

    <p>Ask me anything.</p>

    <div class="suggestions">

      <button class="suggestion" data-text="Give me some good ideas for a project">
        Give me ideas
      </button>

      <button class="suggestion" data-text="Explain something complicated in simple words">
        Explain something
      </button>

      <button class="suggestion" data-text="Help me solve a problem">
        Help me solve something
      </button>

      <button class="suggestion" data-text="Write something creative for me">
        Create something
      </button>

    </div>

  </div>

</div>

<div class="bottom">

  <form class="composer" id="form">

    <button type="button" class="icon" id="attach">+</button>

    <input
      id="input"
      type="text"
      placeholder="Message LampAI..."
      autocomplete="off"
      enterkeyhint="send"
    >

    <button type="button" class="icon">🎙</button>

    <button class="send" id="send" type="submit">↑</button>

  </form>

  <div class="disclaimer">
    LampAI can make mistakes. Check important information.
  </div>

</div>

</div>


<!-- SETTINGS -->

<div class="overlay" id="overlay">

  <div class="settings">

    <div class="handle"></div>

    <h2>Customize LampAI</h2>

    <p>
      Tell LampAI how you want it to talk and behave.
      Keep it simple. You can change this whenever you want.
    </p>

    <textarea
      id="instructions"
      placeholder="Example: Talk naturally, keep answers short, be funny and sarcastic. Don't use emojis unless I use them."
    ></textarea>

    <div class="actions">

      <button class="cancel" id="cancel">Cancel</button>

      <button class="save" id="save">Save</button>

    </div>

  </div>

</div>


<script>

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const form = document.getElementById("form");
const send = document.getElementById("send");
const overlay = document.getElementById("overlay");
const instructions = document.getElementById("instructions");

instructions.value =
  localStorage.getItem("lampai_instructions") || "";


document.getElementById("settingsButton").onclick = () => {
  overlay.classList.add("open");
};

document.getElementById("cancel").onclick = () => {
  overlay.classList.remove("open");
};

document.getElementById("save").onclick = () => {

  localStorage.setItem(
    "lampai_instructions",
    instructions.value.trim()
  );

  overlay.classList.remove("open");
};


overlay.addEventListener("click", e => {

  if(e.target === overlay){
    overlay.classList.remove("open");
  }

});


document.getElementById("newChat").onclick = () => {

  chat.innerHTML = `
    <div class="welcome">

      <div class="lamp">L</div>

      <h1>What can I help with?</h1>

      <p>Ask me anything.</p>

      <div class="suggestions">

        <button class="suggestion" data-text="Give me some good ideas for a project">
          Give me ideas
        </button>

        <button class="suggestion" data-text="Explain something complicated in simple words">
          Explain something
        </button>

        <button class="suggestion" data-text="Help me solve a problem">
          Help me solve something
        </button>

        <button class="suggestion" data-text="Write something creative for me">
          Create something
        </button>

      </div>

    </div>
  `;

  activateSuggestions();

};


function activateSuggestions(){

  document.querySelectorAll(".suggestion").forEach(button => {

    button.onclick = () => {

      input.value = button.dataset.text;

      input.focus();

    };

  });

}


activateSuggestions();


function addMessage(text,type){

  const wrapper = document.createElement("div");

  wrapper.className = "message " + type;

  const bubble = document.createElement("div");

  bubble.className = "bubble";

  bubble.textContent = text;

  wrapper.appendChild(bubble);

  chat.appendChild(wrapper);

  chat.scrollTop = chat.scrollHeight;

  return wrapper;

}


form.addEventListener("submit", async e => {

  e.preventDefault();

  const text = input.value.trim();

  if(!text) return;


  const welcome = document.querySelector(".welcome");

  if(welcome) welcome.remove();


  addMessage(text,"user");

  input.value = "";

  input.disabled = true;

  send.disabled = true;


  const thinking = addMessage(
    "Thinking...",
    "ai"
  );

  thinking.querySelector(".bubble").classList.add("thinking");


  try{

    const response = await fetch("/api/chat",{

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({

        message:text,

        instructions:
          localStorage.getItem("lampai_instructions") || ""

      })

    });


    const data = await response.json();

    thinking.remove();


    if(!response.ok){

      addMessage(
        data.error || "Something went wrong.",
        "ai"
      );

      return;

    }


    addMessage(
      data.reply || "I didn't get a response.",
      "ai"
    );


  }catch(error){

    thinking.remove();

    addMessage(
      "I couldn't connect right now.",
      "ai"
    );

  }finally{

    input.disabled = false;

    send.disabled = false;

    input.focus();

  }

});

</script>

</body>
</html>
