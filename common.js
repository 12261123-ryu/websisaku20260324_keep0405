const sideBar = document.getElementById('side-bar');
const fixedLabels = document.querySelector('.fixed-labels');
const menuIconContainer = document.getElementById('menu-icon-toggle');
const menuIcon = menuIconContainer.querySelector('span');
const topLink = document.querySelector('.link-to-Top');



// トップへのリンクが存在する場合のみイベント設定
if (topLink) {
  topLink.addEventListener('click', (e) => {
    e.stopPropagation(); 
  });
}




//スマホビューでは開く時、web図録とアイコンのみ反応しているが、横幅600px以上の時は卒展26の部分以外のバー部分に開く判定を持たせてみた
//閉じる時は、どのサイズでも、卒展26以外の、元々サイドバーだった部分を触れば閉じる

fixedLabels.addEventListener('click', (e) => {
  // 1. 一番下の「卒展26」エリア（.bar-low）を触った時は開閉処理をスルー
  if (e.target.closest('.bar-low')) return;

  const isOpen = sideBar.classList.contains('is-open');
  const isDesktop = window.innerWidth >= 600;

  if (!isOpen) {
    // 閉じてる時：メニューを開く判定
    if (isDesktop) {
      // 600px以上：.bar-low以外ならバーのどこを押しても開く
      sideBar.classList.add('is-open');
      menuIcon.textContent = '×';
    } else {
      // スマホ：アイコンか 真ん中の文字(.bar-mid) を直接押した時だけ開く
      if (e.target.closest('#menu-icon-toggle') || e.target.closest('.bar-mid')) {
        sideBar.classList.add('is-open');
        menuIcon.textContent = '×';
      }
    }
  } else {
    // 【開いてる時：メニューを閉じる判定】
    // スマホもデスクトップも共通：.bar-low以外のバーの部分ならどこでも閉じる
    sideBar.classList.remove('is-open');
    menuIcon.textContent = '≡';
  }
});







// サイドバー全体ではなく、ラベル部分だけをクリック対象にする
//fixedLabels.addEventListener('click', (e) => {
  //クリックされたのが「トップへのリンク」だったら、ここで処理を終了する
  //if (e.target.closest('.link-to-Top')) return;
  // closestで中のspan,divのどちらを触っても反応させる

  //const isOpen = sideBar.classList.contains('is-open');

  //if (!isOpen) {
    // 閉じてる時はラベルのどこを押しても開く
    //sideBar.classList.add('is-open');
    //menuIcon.textContent = '×';
  //} else {
    // 開いてる時（is-openがある時）は、アイコンまたはweb図録の文字へのクリックのみ反応
    //if (e.target.closest('#menu-icon-toggle') || e.target.closest('.bar-mid')) {
      //sideBar.classList.remove('is-open');
      //menuIcon.textContent = '≡';
    //}
  //}
//});

