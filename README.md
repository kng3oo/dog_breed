
# Dog Breed Classification Web App

FastAPI + ResNet18 견종 분류 데모.

- 120 dog breeds, Top-3 prediction
- Top-1 < 60% 이면 재촬영/재업로드 안내
- 이미지 & 메타데이터는 `runs/<timestamp_id>/` 에 저장
- 결과 화면은 브라우저에서 PNG로 저장 가능 (html2canvas)
- 강아지 이름 입력 필수, 예측 결과 카드에 함께 표시

## 구조

- app.py
- requirements.txt
- class_indices.json
- models/
  - 250910resnet18_dogs_weights.pth (사용자 모델 파일)
- static/
- templates/
- runs/

## 로컬 실행

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

브라우저에서 `http://127.0.0.1:8000` 접속.

## AWS EC2 실행 (CloudFormation 템플릿 사용 시)

- `dogbreed_stack.yaml` 참조 (VPC + ALB + EC2 + FastAPI 자동 셋업 예시)
