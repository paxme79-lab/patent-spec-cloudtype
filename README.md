# 특허 명세서 자동 생성기 (Next.js + Cloudtype)

## 1) 필요사항
- OpenAI API Key 발급 (https://platform.openai.com/)
- GitHub 계정

## 2) 로컬 실행
```bash
npm i
cp .env.example .env  # 그리고 OPENAI_API_KEY=... 입력
npm run dev
```
http://localhost:3000 접속

## 3) Cloudtype 배포 요약
1. GitHub에 이 저장소를 올립니다.
2. https://docs.cloudtype.io/guide/quickstart/node 문서대로 Node 템플릿을 선택합니다.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start`
5. 포트: 3000
6. 환경변수: `OPENAI_API_KEY`에 키 값 입력 (https://docs.cloudtype.io/guide/references/env)
7. 배포(Deploy)를 누르면 완료.

## 참고
- Next.js 14 App Router 사용
- API 경로: `/api/generate`
