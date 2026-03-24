const sideBar = document.getElementById('side-bar');
const menuIconContainer = document.getElementById('menu-icon-toggle'); // アイコンの親
const menuIcon = menuIconContainer.querySelector('span');

sideBar.addEventListener('click', (e) => {
  const isOpen = sideBar.classList.contains('is-open');

  if (!isOpen) {
    // 【閉じてる時】バーのどこを押しても開く
    sideBar.classList.add('is-open');
    menuIcon.textContent = '×';
  } else {
    // 【開いてる時】バツ印（アイコンエリア）を押した時だけ閉じる
    // .closest() を使うと、アイコンの文字(span)を押しても、その親のdivを押しても反応します
    if (e.target.closest('#menu-icon-toggle')) {
      sideBar.classList.remove('is-open');
      menuIcon.textContent = '≡';
    }
  }
});