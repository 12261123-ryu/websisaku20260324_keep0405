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

// サイドバー全体ではなく、ラベル部分だけをクリック対象にする
fixedLabels.addEventListener('click', (e) => {
  //クリックされたのが「トップへのリンク」だったら、ここで処理を終了する
  if (e.target.closest('.link-to-Top')) return;
  // closestで中のspan,divのどちらを触っても反応させる

  const isOpen = sideBar.classList.contains('is-open');

  if (!isOpen) {
    // 閉じてる時はラベルのどこを押しても開く
    sideBar.classList.add('is-open');
    menuIcon.textContent = '×';
  } else {
    // 開いてる時（is-openがある時）は、アイコン部分のクリックのみ反応
    if (e.target.closest('#menu-icon-toggle')) {
      sideBar.classList.remove('is-open');
      menuIcon.textContent = '≡';
    }
  }
});