

// --- データの保持用 ---
let allWorks = []; 
let knownMaterials = []; 
let activeTagId = null;   /* 洗濯中のタグIDを保存する */

// 1. 絞り込みタグの生成
fetch('project.json')
  .then(response => response.json())
  .then(data => {
    const keywords = data["filter_keywords"];
    // 素材IDのリストを作成
    knownMaterials = keywords.map(item => item.id);

    const filterSection = document.querySelector('.filter-tags');
    keywords.forEach(item => {
      const span = document.createElement('span');
      span.innerHTML = `#${item.display}&nbsp;&nbsp;`;
      span.style.cursor = "pointer";
      
      // index.js の該当箇所を以下に差し替え
      span.addEventListener('click', () => {
      // クリックされたIDを文字列に変換
      const clickedId = String(item.id);

      if (activeTagId === clickedId) {
      // 【解除ルート】同じIDならリセット
      activeTagId = null;
      document.querySelectorAll('.filter-tags span').forEach(s => s.classList.remove('active'));
      renderWorks("all");
      } else {
      // 【絞り込みルート】違うIDなら新しく保存
      activeTagId = clickedId;
    
      document.querySelectorAll('.filter-tags span').forEach(s => s.classList.remove('active'));
      span.classList.add('active');
    
      if (item.display === "その他") {
        renderWorks("others", "その他", "", ""); 
      } else {
        renderWorks(item.id, item.display, item.description || "", item.professor || "");
      }
    }
  });
      filterSection.appendChild(span);
    });
  });

// 2. 描画・絞り込み実行関数
function renderWorks(searchKey, displayName = "", description = "", professor = "") {
  const workList = document.getElementById('work-list');
  const titleElem = document.querySelector('.web-title .title');
  const profElem = document.querySelector('.professor-name'); // HTMLにこのクラスがあるか確認
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

  allWorks.forEach(work => {
    let isMatch = false;
    if (searchKey === "all") {
      isMatch = true;
    } else if (searchKey === "others") {
      isMatch = work.materials && work.materials.some(m => !knownMaterials.includes(m));
    } else {
      // 型を文字列に揃えて比較
      isMatch = (String(work.project) === String(searchKey)) || 
                (work.materials && work.materials.includes(searchKey));
    }
    
    if (isMatch) {
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
    }
  });
}

// 3. データの初期読み込み
async function loadWorks() {
  try {
    const response = await fetch('work.json'); 
    allWorks = await response.json(); // グローバル変数に保存
    renderWorks("all"); // 初回描画
  } catch (error) {
    console.error('work.json の読み込みに失敗しました:', error);
  }
}

loadWorks();