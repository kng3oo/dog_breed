
let currentRunId = null;
let capturedFile = null;
let mediaStream = null;

const fileInput = document.getElementById("fileInput");
const previewImage = document.getElementById("previewImage");
const uploadForm = document.getElementById("uploadForm");
const predictBtn = document.getElementById("predictBtn");
const statusMessage = document.getElementById("statusMessage");
const resultBody = document.getElementById("resultBody");
const saveResultBtn = document.getElementById("saveResultBtn");
const resultPanel = document.getElementById("resultPanel");
const resultCaptureArea = document.getElementById("resultCaptureArea");

const openCameraBtn = document.getElementById("openCameraBtn");
const captureBtn = document.getElementById("captureBtn");
const cameraWrapper = document.getElementById("cameraWrapper");
const video = document.getElementById("video");
const captureCanvas = document.getElementById("captureCanvas");

const dogNameInput = document.getElementById("dogNameInput");
const dogNameDisplay = document.getElementById("dogNameDisplay");

// 이름 확인 버튼 클릭 시 결과 패널에 반영
const confirmNameBtn = document.getElementById("confirmNameBtn");
confirmNameBtn.addEventListener("click", () => {
    const name = (dogNameInput.value || "").trim();
    if (!name) {
        alert("강아지 이름을 입력해주세요.");
        return;
    }
    dogNameDisplay.textContent = name;
});


// 이름 입력 변화 시, 결과 패널의 이름도 즉시 반영
dogNameInput.addEventListener("input", () => {
    const name = (dogNameInput.value || "").trim();
    dogNameDisplay.textContent = name || "-";
});

const DOG_LABEL_KO = {
    "affenpinscher": "아펜핀셔",
    "afghan_hound": "아프간 하운드",
    "african_hunting_dog": "아프리칸 헌팅 도그",
    "airedale": "에어데일 테리어",
    "american_staffordshire_terrier": "아메리칸 스태퍼드셔 테리어",
    "appenzeller": "아펜첼러",
    "australian_terrier": "오스트레일리언 테리어",
    "basenji": "바센지",
    "basset": "바셋 하운드",
    "beagle": "비글",
    "bedlington_terrier": "베들링턴 테리어",
    "bernese_mountain_dog": "버니즈 마운틴 도그",
    "black-and-tan_coonhound": "블랙 앤 탄 쿤하운드",
    "blenheim_spaniel": "블렌하임 스패니얼",
    "bloodhound": "블러드하운드",
    "bluetick": "블루틱 쿤하운드",
    "border_collie": "보더 콜리",
    "border_terrier": "보더 테리어",
    "borzoi": "보르조이",
    "boston_bull": "보스턴 불(테리어)",
    "bouvier_des_flandres": "부비에 데 플랑드르",
    "boxer": "복서",
    "brabancon_griffon": "브뤼셀 그리펀",
    "briard": "브리아드",
    "brittany_spaniel": "브리타니 스패니얼",
    "bull_mastiff": "불마스티프",
    "cairn": "케언 테리어",
    "cardigan": "카디건 웰시 코기",
    "chesapeake_bay_retriever": "체서피크 베이 리트리버",
    "chihuahua": "치와와",
    "chow": "차우차우",
    "clumber": "클럼버 스패니얼",
    "cocker_spaniel": "코커 스패니얼",
    "collie": "콜리",
    "curly-coated_retriever": "컬리 코티드 리트리버",
    "dandie_dinmont": "댄디 딘몬트 테리어",
    "dhole": "도울(아시아 들개)",
    "dingo": "딩고",
    "doberman": "도베르만",
    "english_foxhound": "잉글리시 폭스하운드",
    "english_setter": "잉글리시 세터",
    "english_springer": "잉글리시 스프링어 스패니얼",
    "entlebucher": "엔틀버쳐 마운틴 도그",
    "eskimo_dog": "에스키모 도그",
    "flat-coated_retriever": "플랫 코티드 리트리버",
    "french_bulldog": "프렌치 불독",
    "german_shepherd": "저먼 셰퍼드",
    "german_short-haired_pointer": "저먼 쇼트헤어 포인터",
    "giant_schnauzer": "자이언트 슈나우저",
    "golden_retriever": "골든 리트리버",
    "gordon_setter": "고든 세터",
    "great_dane": "그레이트 데인",
    "great_pyrenees": "그레이트 피레니즈",
    "greater_swiss_mountain_dog": "그레이터 스위스 마운틴 도그",
    "groenendael": "그루넨달(벨지안 셰퍼드)",
    "ibizan_hound": "이비전 하운드",
    "irish_setter": "아이리시 세터",
    "irish_terrier": "아이리시 테리어",
    "irish_water_spaniel": "아이리시 워터 스패니얼",
    "irish_wolfhound": "아이리시 울프하운드",
    "italian_greyhound": "이탈리안 그레이하운드",
    "japanese_spaniel": "재패니즈 스패니얼",
    "keeshond": "키스혼트",
    "kelpie": "켈피",
    "kerry_blue_terrier": "케리 블루 테리어",
    "komondor": "코몬도르",
    "kuvasz": "쿠바스",
    "labrador_retriever": "래브라도 리트리버",
    "lakeland_terrier": "레이클랜드 테리어",
    "leonberg": "레온베르거",
    "lhasa": "라사 압소",
    "malamute": "알래스칸 말라뮤트",
    "malinois": "말리누아",
    "maltese_dog": "말티즈",
    "mexican_hairless": "멕시칸 헤어리스",
    "miniature_pinscher": "미니어처 핀셔",
    "miniature_poodle": "미니어처 푸들",
    "miniature_schnauzer": "미니어처 슈나우저",
    "newfoundland": "뉴펀들랜드",
    "norfolk_terrier": "노퍽 테리어",
    "norwegian_elkhound": "노르웨이 엘크하운드",
    "norwich_terrier": "노리치 테리어",
    "old_english_sheepdog": "올드 잉글리시 쉽독",
    "otterhound": "오터하운드",
    "papillon": "파피용",
    "pekinese": "페키니즈",
    "pembroke": "펨브로크 웰시 코기",
    "pomeranian": "포메라니안",
    "pug": "퍼그",
    "redbone": "레드본 쿤하운드",
    "rhodesian_ridgeback": "로디지안 리지백",
    "rottweiler": "로트와일러",
    "saint_bernard": "세인트 버나드",
    "saluki": "살루키",
    "samoyed": "사모예드",
    "schipperke": "스키퍼키",
    "scotch_terrier": "스코티시 테리어",
    "scottish_deerhound": "스코티시 디어하운드",
    "sealyham_terrier": "실리엄 테리어",
    "shetland_sheepdog": "셰틀랜드 쉽독",
    "shih-tzu": "시추",
    "siberian_husky": "시베리안 허스키",
    "silky_terrier": "실키 테리어",
    "soft-coated_wheaten_terrier": "소프트 코티드 휘튼 테리어",
    "staffordshire_bullterrier": "스태퍼드셔 불테리어",
    "standard_poodle": "스탠더드 푸들",
    "standard_schnauzer": "스탠더드 슈나우저",
    "sussex_spaniel": "서식스 스패니얼",
    "tibetan_mastiff": "티베탄 마스티프",
    "tibetan_terrier": "티베탄 테리어",
    "toy_poodle": "토이 푸들",
    "toy_terrier": "토이 테리어",
    "vizsla": "비즐라",
    "walker_hound": "워커 하운드",
    "weimaraner": "와이마라너",
    "welsh_springer_spaniel": "웰시 스프링어 스패니얼",
    "west_highland_white_terrier": "웨스트 하이랜드 화이트 테리어",
    "whippet": "휘핏",
    "wire-haired_fox_terrier": "와이어 폭스 테리어",
    "yorkshire_terrier": "요크셔 테리어"
};

function setStatus(message, type = "") {
    statusMessage.textContent = message || "";
    statusMessage.className = "status-message";
    if (type) {
        statusMessage.classList.add(type);
    }
}

function resetResults() {
    resultBody.innerHTML = "";
    setStatus("", "");
    saveResultBtn.disabled = true;
}

function ensureDogNameOrAlert() {
    const name = (dogNameInput.value || "").trim();
    if (!name) {
        alert("강아지 이름을 먼저 입력해주세요.");
        return false;
    }
    dogNameDisplay.textContent = name;
    return true;
}

function updatePreviewFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = "block";
    };
    reader.readAsDataURL(file);
}

fileInput.addEventListener("change", () => {
    if (!ensureDogNameOrAlert()) {
        fileInput.value = "";
        return;
    }
    capturedFile = null;
    const file = fileInput.files[0];
    updatePreviewFromFile(file);
    resetResults();
});

openCameraBtn.addEventListener("click", async () => {
    if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
        cameraWrapper.style.display = "none";
        captureBtn.disabled = true;
        openCameraBtn.textContent = "📷 카메라 열기";
        return;
    }

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = mediaStream;
        cameraWrapper.style.display = "block";
        captureBtn.disabled = false;
        openCameraBtn.textContent = "📴 카메라 끄기";
    } catch (err) {
        console.error(err);
        setStatus("카메라에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.", "error");
    }
});

captureBtn.addEventListener("click", () => {
    if (!ensureDogNameOrAlert()) {
        return;
    }
    if (!mediaStream) return;
    const trackSettings = mediaStream.getVideoTracks()[0].getSettings();
    const width = trackSettings.width || 640;
    const height = trackSettings.height || 480;

    captureCanvas.width = width;
    captureCanvas.height = height;

    const ctx = captureCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    captureCanvas.toBlob((blob) => {
        if (!blob) return;
        capturedFile = new File([blob], "captured.png", { type: "image/png" });
        fileInput.value = "";
        updatePreviewFromFile(capturedFile);
        resetResults();
    }, "image/png");
});

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    resetResults();

    if (!ensureDogNameOrAlert()) {
        return;
    }

    let file = null;
    if (capturedFile) {
        file = capturedFile;
    } else if (fileInput.files && fileInput.files[0]) {
        file = fileInput.files[0];
    }

    if (!file) {
        setStatus("이미지 파일을 선택하거나 카메라로 촬영해주세요.", "warning");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    predictBtn.disabled = true;
    setStatus("예측 중입니다...", "info");

    try {
        const res = await fetch("/predict", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const msg = errorData.detail || "예측 요청 중 오류가 발생했습니다.";
            setStatus(msg, "error");
            predictBtn.disabled = false;
            return;
        }

        const data = await res.json();
        currentRunId = data.run_id || null;
        const top3 = data.top3 || [];
        const needsRetry = !!data.needs_retry;

        resultBody.innerHTML = "";

        top3.forEach((item, idx) => {
            const tr = document.createElement("tr");
            const rankTd = document.createElement("td");
            const labelTd = document.createElement("td");
            const probTd = document.createElement("td");

            const enLabel = item.label || `class_${item.index}`;
            const koLabel = DOG_LABEL_KO[enLabel] || enLabel;

            rankTd.textContent = idx + 1;
            labelTd.textContent = koLabel;
            const percent = item.percent != null ? item.percent : (item.prob || 0) * 100;
            probTd.textContent = Number(percent).toFixed(2);

            tr.appendChild(rankTd);
            tr.appendChild(labelTd);
            tr.appendChild(probTd);
            resultBody.appendChild(tr);
        });

        if (top3.length > 0) {
            if (needsRetry) {
                setStatus("Top1 확률이 60% 미만입니다. 사진을 다시 찍거나 업로드해주세요.", "warning");
                saveResultBtn.disabled = true;
            } else {
                setStatus("예측이 완료되었습니다.", "success");
                saveResultBtn.disabled = false;
            }
        } else {
            setStatus("결과를 가져오지 못했습니다.", "error");
            saveResultBtn.disabled = true;
        }
    } catch (err) {
        console.error(err);
        setStatus("서버와 통신 중 오류가 발생했습니다.", "error");
    } finally {
        predictBtn.disabled = false;
    }
});

saveResultBtn.addEventListener("click", async () => {
    if (!resultCaptureArea || saveResultBtn.disabled) return;

    try {
        const canvas = await html2canvas(resultCaptureArea, {
            backgroundColor: "#ffffff",
        });
        const dataUrl = canvas.toDataURL("image/png");

        const a = document.createElement("a");
        const now = new Date();
        const ts = now.toISOString().replace(/[:.]/g, "-");
        a.href = dataUrl;
        a.download = `dogbreed_result_${ts}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (err) {
        console.error(err);
        setStatus("결과 화면 저장 중 오류가 발생했습니다.", "error");
    }
});