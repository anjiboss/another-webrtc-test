// import { createOffer, socket } from "./main";

// const form = document.getElementById("register") as HTMLFormElement;
// const username = document.getElementById("username") as HTMLInputElement;
// const userContainer = $("#user-container");
// let callBtn = document.getElementsByClassName("call");

// const callEvent = () => {
//   callBtn = document.getElementsByClassName("call");
//   for (let i = 0; i < callBtn.length; i++) {
//     const btn = callBtn[i] as HTMLButtonElement;
//     btn.onclick = () => {
//       if (btn.id) {
//         createOffer(btn.id);
//       }
//     };
//   }
// };

// // socket.on("current-user", ({ user }: { user: { username: string }[] }) => {
// //   user.forEach((u) => {
// //     userContainer.append(`
// // 		<div class="user">
// // 			・	${u.username} <button class="call" id="${u.username}">Call</button>
// // 		</div>
// // 	`);
// //   });
// //   callEvent();
// // });

// form.onsubmit = (e) => {
//   e.preventDefault();
//   socket.emit("register", { username: username.value });
// };

// socket.on("logged-in", ({ username }) => {
//   userContainer.append(`
// 		<div class="user">
// 			・	${username} <button class="call" id="${username}">Call</button>
// 		</div>
// 	`);
//   callEvent();
// });

// $("#clear").on("click", () => {
//   socket.emit("clear");
// });
