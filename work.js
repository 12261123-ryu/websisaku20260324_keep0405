

async function loadWorkDetail() {
  const params = new URLSearchParams(window.location.search);
  const targetName = params.get('p');

  if (!targetName) return;

  try {
    const [worksRes, projectRes] = await Promise.all([
      fetch('work.json'),
      fetch('project.json')
    ]);

    const works = await worksRes.json();
    const projectData = await projectRes.json();
    const knownMaterials = projectData.filter_keywords.map(item => item.id);

    const work = works.find(item => item.en_name && item.en_name.trim() === targetName.trim());

    if (work) {
      renderWorkPage(work, knownMaterials);
      // 作品表示が終わった後、全作品データを使ってレコメンドを描画
      renderRecommendations(work, works, knownMaterials);
    }
  } catch (error) {
    console.error("エラー:", error);
  }
}



function renderWorkPage(work, knownMaterials = []) {
  // --- 1. 画像・基本テキストの流し込み ---
  // GAS側でパスが完成しているため、そのまま src に流し込む
  document.getElementById('main-visual').innerHTML = `<img src="${work.main_image}" style="width:100%; height:auto;" decoding="async">`;
  document.getElementById('work-title').innerText = work.title;
  document.getElementById('work-designer').innerText = work.name;
  document.getElementById('work-concept').innerText = work.concept;

  // --- 2. 所属（プロジェクト）の判定 ---
  // シンプルに project 列が "M" なら大学院、それ以外はプロジェクト
  const projectElem = document.getElementById('work-project');
  if (work.project === "M") {
      const masterDetail = work.Master_project ? `（${work.Master_project}）` : "";
      projectElem.innerText = `大学院${masterDetail}`;
  } else {
      projectElem.innerText = `${work.project}プロジェクト`;
  }
  
  // --- 3. 素材表記のカスタマイズ ---
  const matElem = document.getElementById('work-materials');
  if (matElem && work.materials && Array.isArray(work.materials)) {
    const knowns = []; // 絞り込みにある主要素材
    const others = []; // その他

    work.materials.forEach(m => {
      const trimmedM = m.trim();
      if (!trimmedM) return;
      if (knownMaterials.includes(trimmedM)) {
        knowns.push(trimmedM);
      } else {
        others.push(trimmedM);
      }
    });

    let displayParts = [];
    if (knowns.length > 0) displayParts.push(knowns.join('、'));
    if (others.length > 0) displayParts.push(`その他（${others.join('、')}）`);
    matElem.innerText = displayParts.join('、');


    // ---  Contact（連絡先）の追加 ---
    const contactArea = document.getElementById('work-contact-area'); //連絡先がない場合項目ごと消すなら必要
    const contactElem = document.getElementById('work-contact');

    // データがあるかチェック (スプシで空欄なら項目ごと表示しない)
    if (work.contact && work.contact.type && work.contact.id) {
    const type = work.contact.type;
    let id = work.contact.id.toString().trim();
    let linkUrl = "";
    let displayText = "";

    if (type === "instagram") {
      const cleanId = id.replace('@', '');
      linkUrl = `https://www.instagram.com/${cleanId}/`;
      displayText = `@${cleanId}`;
    } else if (type === "email") {
      // @が含まれていなければ @gmail.com を足す
      const fullEmail = id.includes('@') ? id : `${id}@gmail.com`;
      linkUrl = `mailto:${fullEmail}`;
      displayText = fullEmail;
    }

    if (linkUrl && contactArea) {
      contactArea.style.display = 'flex'; // データがある時だけ表示（レイアウトに合わせてblock等に変更可）
      contactElem.innerHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${displayText}</a>`;
    }
  } else {
    // contact_typeが空欄なら項目自体を隠す
    if (contactArea) contactArea.style.display = 'none';
  }

  }

  // --- 4. 動画とサブ画像の表示制御 ---
  const subContentContainer = document.getElementById('sub-images');
  if (subContentContainer) {
    subContentContainer.innerHTML = ''; 

    const renderVideos = () => {
      if (work.video_list && work.video_list.length > 0) {
        work.video_list.forEach(url => {
          const match = url.match(/(?:v=|shorts\/|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
          const videoId = match ? match[1] : null;
          if (videoId) {
            const videoTag = `
              <div class="content-item video-item">
                <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
              </div>`;
            subContentContainer.insertAdjacentHTML('beforeend', videoTag);
          }
        });
      }
    };

    const renderImages = () => {
      if (work.image_list && work.image_list.length > 0) {
        work.image_list.forEach(path => {
          if (path !== work.main_image) {
            const imgTag = `
              <div class="content-item sub-image-item">
                <img src="${path}" loading="lazy" decoding="async">
              </div>`;
            subContentContainer.insertAdjacentHTML('beforeend', imgTag);
          }
        });
      }
    };

    // video_to_lastフラグで並び順を入れ替え
    if (work.video_to_last) {
      renderImages();
      renderVideos();
    } else {
      renderVideos();
      renderImages();
    }
  }
}





//レコメンド機能
// selectedNamesで重複を管理
function renderRecommendations(currentWork, allWorks, knownMaterials) {
  const container = document.getElementById('recommend-list');
  if (!container) return;

  const selectedNames = new Set([currentWork.en_name]);
  const recommended = [];

  // --- 1. sort_numberによる前後 (ラベルなし) ---
  const currentSortNum = parseInt(currentWork.sort_number);
  const totalCount = allWorks.length;
  const prevNum = currentSortNum === 1 ? totalCount : currentSortNum - 1;
  const nextNum = currentSortNum === totalCount ? 1 : currentSortNum + 1;

  [prevNum, nextNum].forEach(num => {
    const found = allWorks.find(w => parseInt(w.sort_number) === num);
    if (found) {
      found.recLabel = ""; // 前後は空文字
      recommended.push(found);
      selectedNames.add(found.en_name);
    }
  });

  // --- 2. 同じゼミ(project)から1名 ---
  const sameProjectCandidates = allWorks.filter(w => 
    !selectedNames.has(w.en_name) && w.project === currentWork.project
  );
  if (sameProjectCandidates.length > 0) {
    const picked = sameProjectCandidates[Math.floor(Math.random() * sameProjectCandidates.length)];
    // ゼミ名のラベル設定
    picked.recLabel = picked.project === "M" ? "（大学院）" : `（${picked.project}プロジェクト）`;
    recommended.push(picked);
    selectedNames.add(picked.en_name);
  }

  // --- 3. 素材(materials)から1名 ---
  if (currentWork.materials && currentWork.materials.length > 0) {
    const myMat = currentWork.materials[Math.floor(Math.random() * currentWork.materials.length)].trim();
    const isKnown = knownMaterials.includes(myMat);

    const sameMatCandidates = allWorks.filter(w => {
      if (selectedNames.has(w.en_name)) return false;
      return w.materials.some(m => {
        const targetMat = m.trim();
        return isKnown ? targetMat === myMat : !knownMaterials.includes(targetMat);
      });
    });

    if (sameMatCandidates.length > 0) {
      const picked = sameMatCandidates[Math.floor(Math.random() * sameMatCandidates.length)];
      // 素材ラベルの設定（主要素材ならその名前、その他なら「その他」）
      const matLabelName = isKnown ? myMat : "その他";
      picked.recLabel = `（素材：${matLabelName}）`;
      recommended.push(picked);
      selectedNames.add(picked.en_name);
    }
  }

  // --- 4. 補充 (ラベルなし) ---
  while (recommended.length < 4) {
    const backup = allWorks.filter(w => !selectedNames.has(w.en_name));
    if (backup.length === 0) break;
    const picked = backup[Math.floor(Math.random() * backup.length)];
    picked.recLabel = ""; 
    recommended.push(picked);
    selectedNames.add(picked.en_name);
  }

  // --- HTMLの描画 ---
  // renderRecommendations 関数内の描画ループ部分
  recommended.forEach(work => {
    // ラベルがある場合のみ表示するHTMLを作成
    const labelHtml = work.recLabel ? `<div class="rec-reason">${work.recLabel}</div>` : "";

    const html = `
      <div class="work-item">
        <a href="work.html?p=${work.en_name}" class="work-item-link">
          <div class="work-thumbnail">
            <img src="${work.main_image}" alt="${work.title}" loading="lazy" decoding="async">
          </div>
          <div class="work-info">
            <span class="work-title">${work.title}</span>
            <span class="work-designer">${work.name}</span>
          </div>
          ${labelHtml} </a>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
  });
}






window.onload = loadWorkDetail;