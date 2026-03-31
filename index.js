

// --- データの保持用 ---
let allWorks = []; 
let knownMaterials = []; 
let activeTagId = null;   /* 選択中のタグIDを保存する */




//all表示でのシャッフル用
function shuffleArray(array) {
  const clone = [...array]; 
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}



// 1. 絞り込みタグの生成
fetch('project.json')
  .then(response => response.json())
  .then(data => {
    const keywords = data["filter_keywords"];
    // 素材IDのリストを作成
    knownMaterials = keywords.map(item => item.id);

    const projectSection = document.getElementById('project-tags');
    const materialSection = document.getElementById('material-tags');

    keywords.forEach(item => {
      const span = document.createElement('span');
      //「その他」の時も dataset.id をセットし表示を整える
      span.dataset.id = String(item.id);
      span.innerHTML = `#${item.display}&nbsp;&nbsp;`;
      span.style.cursor = "pointer";
      
      // --- JSONの "type" を見て振り分け先を決める ---
      if (item.type === 'project') {
        projectSection.appendChild(span);
      } else {
        // 素材(materials)や、typeが未定義のものはすべて2行目へ
        materialSection.appendChild(span);
      }

      // クリックイベント　sessionStorageを保存、URL書き換え、履歴を積ませない
      span.addEventListener('click', () => {
        const clickedId = String(item.id);
        if (activeTagId === clickedId) {
          activeTagId = null;
          document.querySelectorAll('.filter-tags span').forEach(s => s.classList.remove('active'));
          sessionStorage.removeItem('lastFilter');
          history.replaceState(null, '', 'index.html'); // URLをリセット
          renderWorks("all");
        } else {
          activeTagId = clickedId;
          document.querySelectorAll('.filter-tags span').forEach(s => s.classList.remove('active'));
          span.classList.add('active');
          sessionStorage.setItem('lastFilter', clickedId);
          history.replaceState(null, '', `index.html?filter=${clickedId}`); // URLを書き換え
        
          //つぶつぶカラー変更用：クリックしたプロジェクトカラーへ
          if (window.updateTubuColors) {
            window.updateTubuColors(clickedId);
          }
        
          if (item.id === "その他") {
          renderWorks("others", "その他", "", ""); 
        } else {
          renderWorks(item.id, item.display, item.description || "", item.professor || "");
          }
        }
      });
    });

    //タグが作り終わった直後にURLチェックを実行
    checkUrlParams();
  });


// 2. 描画・絞り込み実行関数
function renderWorks(searchKey, displayName = "", description = "", professor = "") {
  const workList = document.getElementById('work-list');
  const titleElem = document.querySelector('.web-title .title');
  const profElem = document.querySelector('.professor-name');
  const descElem = document.querySelector('.web-title .titletext');

  if (!workList) return; // エラー防止
  workList.innerHTML = ""; 

  // --- A. テキストの更新 ---
  if (searchKey === "all") {
    titleElem.innerHTML = "統合デザイン学科卒業・修了制作展<br>web図録";
    if (profElem) profElem.innerText = ""; 
    descElem.innerText = "本サイトでは、2026年度多摩美術大学統合デザイン学科卒業・修了制作展で展示された作品・研究の写真・映像・コンセプトをいつでもご覧いただけます。";
  } 
  else if (searchKey === "others") {
    titleElem.innerText = "その他の素材を使用した作品です。";
    if (profElem) profElem.innerText = "";
    descElem.innerText = ""; 
  }
  else if (!displayName.includes("プロジェクト") && displayName !== "大学院") {
  titleElem.innerText = `${displayName}を使用した作品です。`;
  if (profElem) profElem.innerText = "";
  descElem.innerText = ""; 
} 
else {
  // 大学院の場合はそのまま、それ以外は「プロジェクト」を付ける
  if (displayName === "大学院") {
    titleElem.innerText = displayName; 
  } else {
    // Aプロジェクト、Bプロジェクトなどの表示
    titleElem.innerText = `${searchKey}プロジェクト`; 
  }
  
  if (profElem) profElem.innerText = professor; 
  descElem.innerText = description;
}



  // --- B. 作品の抽出（allWorksの中身があるかチェック） ---
  if (allWorks.length === 0) {
    console.warn("作品データがまだ読み込まれていません。");
    return;
  }

  let displayWorks = [];


    if (searchKey === "all") {
    // ALLの時はシャッフルしたコピーを作成
    displayWorks = shuffleArray(allWorks);
  } 
  else {
    // 絞り込み時は抽出してソート
    displayWorks = allWorks.filter(work => {
      if (searchKey === "others" || searchKey === "その他") {
        return work.materials && work.materials.some(m => !knownMaterials.includes(m.trim()));
      }
      return (String(work.project) === String(searchKey)) || (work.materials && work.materials.includes(searchKey));
    });

    displayWorks.sort((a, b) => {
      const nameA = a.hiragana_name || a.title || "";
      const nameB = b.hiragana_name || b.title || "";
      return nameA.localeCompare(nameB, 'ja');
    });
  }

    // --- 実際に描画する（displayWorksをループさせる） ---
  displayWorks.forEach(work => {
    const thumbPath = `${work.main_image}`;
    const workHTML = `
      <a href="work.html?p=${work.en_name}" class="work-item-link">
        <article class="work-item">
          <div class="work-thumbnail">
            <img src="${thumbPath}" alt="${work.title}" loading="lazy" decoding="async">
          </div>
          <div class="work-info">
            <span class="work-title">${work.title}</span>
            <span class="work-designer">${work.name}</span>
          </div>
        </article>
      </a>
    `;
    workList.insertAdjacentHTML('beforeend', workHTML);
  });
  
  // 表示件数チェック
  if (searchKey !== 'all' && searchKey !== 'others') {
    const displayedCount = workList.querySelectorAll('.work-item-link').length;
    if (displayedCount === 0) {
      titleElem.innerText = `${displayName}を使用した作品はありません。`;
    }
  }
}
  

// 3. データの初期読み込み。work.json読み込み失敗時のメッセージあり
async function loadWorks() {
  try {
    const response = await fetch('work.json'); 
    allWorks = await response.json();

    // 読み込み完了後にrenderWorks("all")を呼べば、自動的に中でシャッフルされる
    renderWorks("all");
    setTimeout(restoreScroll, 2000);
  } catch (error) {
    console.error('work.json の読み込みに失敗しました:', error);
    const workList = document.getElementById('work-list');
    if (workList) {
      workList.innerHTML = '<p style="padding: 20px; color: #888;">作品データの読み込みに失敗しました。</p>';
    }
  }
}

loadWorks();




// --- 4. URLパラメータによる自動絞り込み ---
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const filterId = params.get('filter');

  if (filterId) {
    // データの読み込み完了を待つ
    const timer = setInterval(() => {
      if (allWorks.length > 0 && knownMaterials.length > 0) {
        clearInterval(timer);

        fetch('project.json').then(res => res.json()).then(data => {
          const keywords = data.filter_keywords;
          let targetItem;

          if (filterId === "others") {
            targetItem = keywords.find(k => k.id === "その他");
          } else {
            // ID（A, B, 紙など）で検索
            targetItem = keywords.find(k => String(k.id) === String(filterId));
          }

          if (targetItem) {
            //ステート（現在のアクティブID）をURLから来たIDに更新
            activeTagId = String(targetItem.id); 

            // 絞り込み実行
            renderWorks(targetItem.id, targetItem.display, targetItem.description || "", targetItem.professor || "");
            

            //つぶつぶカラー変更用：URLで指定されたプロジェクトカラーに更新
            if (window.updateTubuColors) {
              window.updateTubuColors(targetItem.id);
            }

            //タグの見た目を更新（埋め込んだdataset.idで正確に照合）
            document.querySelectorAll('.filter-tags span').forEach(span => {
              if (span.dataset.id === activeTagId) {
                span.classList.add('active');
              } else {
                span.classList.remove('active');
              }
            });

          }
        });
      }
    }, 100);
  }
}




//このウェブはbodyではなくmain-windowの中でスクロールしているので、window.scrollYではなくmainWindow.scrollTopを使用
// スクロール位置の保存（100msごとに1回）
const mainWindow = document.querySelector('.main-window');
if (mainWindow) {
  let timer = null;
  mainWindow.addEventListener('scroll', () => {
    if (timer) return;
    timer = setTimeout(() => {
      sessionStorage.setItem('scrollY', mainWindow.scrollTop);
      timer = null;
    }, 100);
  });
}

// スクロール位置の復元
//これはcommonjsのpgeshowでリロードする処理と復元とで干渉する。astroにしたらあちらは消すので、まあ大丈夫か？
function restoreScroll() {
  const mainWindow = document.querySelector('.main-window');
  const savedY = sessionStorage.getItem('scrollY');
  if (!mainWindow || !savedY) return;
  
  const targetY = parseInt(savedY);
  sessionStorage.removeItem('scrollY');

  // 反映されるまでリトライ
  let attempts = 0;
  const tryScroll = () => {
    mainWindow.scrollTop = targetY;
    if (mainWindow.scrollTop < targetY - 10 && attempts < 10) {
      attempts++;
      setTimeout(tryScroll, 100);
    }
  };
  tryScroll();
}
window.addEventListener('load', restoreScroll);
window.addEventListener('pageshow', (e) => {
  if (e.persisted) restoreScroll();
});




