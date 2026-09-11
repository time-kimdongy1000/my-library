# Pages Remain — Codex 인수인계

이 문서는 다른 컴퓨터나 새 Codex 작업에서 `README.md`와 함께 읽고 바로 작업을 이어가기 위한 기준 문서다. 대화 기록보다 현재 저장소의 코드와 이 문서를 우선한다.

## 1. 프로젝트 개요

- 프로젝트명: Pages Remain / My Library
- 목적: 사용자가 읽은 책과 자신의 생각을 한국어 원문 및 일본어·영어 번역으로 공개하는 개인 서가
- 운영 주소: <https://pagesremain.com>
- Git 원격 저장소: <https://github.com/time-kimdongy1000/my-library.git>
- 기본 브랜치: `main`
- 이 문서는 두 번째 책 《너의 췌장을 먹고 싶어》를 추가한 시점까지 갱신됨
- 배포: GitHub `main` 푸시와 연결된 Cloudflare Pages 자동 배포
- 기술: React 19, Vite 8, React Router, React Markdown, Supabase JavaScript Client
- 지원 언어: 한국어(`ko`), 일본어(`ja`), 영어(`en`)

현재 등록된 책은 스미노 요루의 《밤의 괴물》과 《너의 췌장을 먹고 싶어》 두 권이다. 책 수는 사용자의 독서와 독후감 작성 속도에 맞춰 천천히 늘린다. 기능 수를 늘리기 위해 독서를 서두르지 않는다.

## 2. 제품 방향과 확정된 결정

- 이 사이트의 중심은 책 정보나 일반적인 서평 데이터베이스가 아니라 사용자의 생각이다.
- 한국어 독후감을 원문으로 삼는다. 일본어와 영어는 원문의 주장과 감정을 유지하면서 각 언어권 독자에게 자연스럽게 번역한다.
- 한국어 글꼴은 기존 분위기를 유지하고, 일본어와 영어에는 각 문자에 자연스러운 글꼴을 적용한다.
- 메인 화면은 책 표지 목록이 아니라 실제 서점처럼 책등이 꽂힌 서가로 표현한다.
- 책등을 누르면 책이 서가에서 나와 표지와 줄거리를 보여주고, 표지를 다시 누르면 독후감 상세 화면으로 이동한다.
- 책등은 날씬한 비율이며 가운데의 평평한 크림색 영역에 제목과 작가를 세로축으로 배치한다. 위아래 색은 표지의 대표색과 이어지며 얇은 명암으로 곡면을 표현한다.
- 화면에 태그를 나열하는 UI는 사용하지 않는다. 책이 늘어났을 때 검색용 내부 메타데이터로 활용하는 것은 가능하다.
- 상세 화면의 `서가로` 버튼은 목차에 붙이지 않고 독립된 UI로 둔다.
- 모바일에서는 목차·서가·공유 도구가 고정 사이드바 대신 하단 흐름에 배치되는 현재 반응형 동작을 허용한다.
- 방문자 수와 조회 수는 정확한 개인 수가 아니라 브라우저 식별자를 이용한 근사치다.

## 3. 현재 구현된 기능

### 메인 서가

- 한국어·일본어·영어 버튼
- 책등 형태의 서가와 책 꺼내기 애니메이션
- 선택한 책의 기울어진 표지, 현지화된 제목·작가·줄거리
- 표지를 다시 눌러 `/book/:id`로 이동
- 누적 고유 브라우저 방문자 수 표시

### 독후감 상세

- 책 ID에 맞는 Markdown 독후감 로드
- 한국어 원문 및 일본어·영어 번역 전환
- Markdown `##`, `###` 제목에서 목차 자동 생성
- 스크롤 기반 읽기 진행률 표시
- 작성일과 예상 읽기 시간 표시
- 작게·기본·크게 글자 크기 조절 및 `localStorage` 저장
- 책별 누적 조회 수 표시
- 독립된 `서가로` 버튼
- Web Share API 공유, 링크 복사, X 공식 로고 공유
- 모바일·태블릿 반응형 레이아웃

### 공유 미리보기와 콘텐츠 검증

- 책마다 1200×630 Open Graph 이미지 생성
- 빌드 시 `/book/책_ID/index.html` 생성
- 책별 제목·설명·이미지·canonical·X 카드 메타데이터 생성
- 책 데이터, 표지, 공유 이미지, 세 언어 독후감과 번역 누락 검사
- 운영 도메인을 `https://pagesremain.com`으로 고정

### 방문 통계

- Supabase RPC만 브라우저에 공개하고 원본 테이블의 직접 접근은 차단
- `App` 마운트 시 방문을 기록하므로 메인과 상세 주소 어느 쪽으로 처음 들어와도 `site_visits`에 반영
- 상세 화면 진입 시 `book_views` 기록
- 브라우저별 UUID를 `localStorage`의 `pages-remain-visitor-id`에 저장
- 같은 브라우저의 사이트 방문은 한국 날짜 기준 하루 한 건
- 같은 브라우저의 같은 책 조회도 한국 날짜 기준 하루 한 건
- 메인 방문자 수는 전체 기간의 고유 `visitor_id` 수
- 책 조회 수는 날짜별로 기록된 누적 행 수이므로 같은 브라우저도 다음 날 다시 읽으면 한 건 증가
- 시크릿 창, 다른 브라우저·기기, 저장소 삭제 후 방문은 새로운 브라우저로 집계될 수 있음

## 4. 주요 파일 구조

```text
my-library/
├─ public/
│  ├─ covers/                         책 표지
│  ├─ og/                             책별 공유 카드
│  ├─ favicon.svg
│  ├─ icons.svg
│  └─ lucide-LICENSE.txt
├─ scripts/
│  ├─ generate-social-previews.ps1    공유 이미지 생성
│  ├─ validate-content.mjs            책 콘텐츠 정합성 검사
│  └─ generate-book-pages.mjs         책별 공유 HTML 생성
├─ src/
│  ├─ data/
│  │  ├─ books.json                   모든 책과 번역 메타데이터
│  │  ├─ book.js                      books.json 내보내기
│  │  └─ reviews/                     원문·번역 Markdown
│  ├─ lib/
│  │  ├─ analytics.js                 방문·조회 RPC 호출
│  │  └─ supabase.js                  지연 로딩 Supabase 클라이언트
│  ├─ pages/
│  │  ├─ Library.jsx                  메인 서가
│  │  └─ BookDetail.jsx               독후감 상세
│  ├─ App.jsx                         라우팅, 언어, 문서 제목, 전체 방문 기록
│  ├─ LanguageSelector.jsx
│  ├─ Library.css
│  ├─ BookDetail.css
│  └─ index.css
├─ supabase/
│  └─ schema.sql                      방문 통계 테이블·RPC·권한
├─ .env.example
├─ README.md                          운영 및 새 책 추가 절차
└─ package.json
```

## 5. 로컬 실행과 검증

Windows CMD에서 프로젝트 루트를 연 뒤 실행한다.

```cmd
npm install
npm run dev
```

주요 검증 명령은 다음과 같다.

```cmd
npm run validate:content
npm run generate:previews
npm run lint
npm run build
npm run preview
```

`npm run build`는 콘텐츠 검사, Vite 빌드, 책별 정적 공유 HTML 생성을 순서대로 수행한다. 변경을 배포하기 전 최소한 `npm run lint`와 `npm run build`를 통과시킨다.

PowerShell에서 이 컴퓨터의 `npm` 실행 파일을 찾지 못하면 다음처럼 Node.js 경로를 현재 세션의 PATH 앞에 붙이고 `npm.cmd`를 사용한다.

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
npm.cmd run dev
```

## 6. 새 책과 독후감 추가

상세 절차와 JSON 예시는 `README.md`를 따른다. 핵심 순서는 다음과 같다.

1. 영문 소문자·숫자·밑줄로 고유 책 ID를 정한다.
2. 표지를 `public/covers`에 저장한다.
3. `src/data/books.json`에 책, 책등 색, 공유 정보와 세 언어 메타데이터를 추가한다.
4. `src/data/reviews/Master.md`를 참고해 다음 세 파일을 만든다.

```text
src/data/reviews/책_ID.md
src/data/reviews/책_ID.ja.md
src/data/reviews/책_ID.en.md
```

5. `npm run generate:previews`로 공유 이미지를 만든다.
6. `npm run lint`와 `npm run build`를 실행한다.

한국어 파일이 원문이다. 번역 중 의미가 불명확하면 임의로 새로운 주장을 더하지 말고 사용자에게 원문의 의도를 확인한다.

## 7. Supabase 구성

Supabase 조직은 `Pages Remain`, 프로젝트는 `pages-remain`, 리전은 Northeast Asia (Tokyo)다. 프로젝트 URL, publishable key, 데이터베이스 비밀번호 등의 실제 값은 이 문서와 Git에 기록하지 않는다.

로컬 `.env`와 Cloudflare Pages Production 환경에는 다음 이름만 사용한다.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

- publishable key는 브라우저에서 사용 가능한 공개 키다.
- `service_role`, Secret key, 데이터베이스 비밀번호는 프론트엔드와 Git에 절대 넣지 않는다.
- `.env`와 `.env.*`는 Git에서 제외하고 `.env.example`만 추적한다.
- 환경 변수가 없거나 Supabase 호출이 실패해도 사이트 본문은 동작하고 통계만 표시되지 않는다.
- Cloudflare 환경 변수 변경 후에는 새 배포가 필요하다.

`supabase/schema.sql`은 다음을 생성한다.

- `site_visits`: `visitor_id`, 한국 날짜 `visited_on`, 생성 시각
- `book_views`: `book_id`, `visitor_id`, 한국 날짜 `viewed_on`, 생성 시각
- `record_site_visit(uuid)`
- `record_book_view(text, uuid)`
- `get_book_view_count(text)`
- `get_site_visitor_count()`

테이블에는 RLS가 활성화되어 있고 `anon`, `authenticated`의 직접 테이블 권한은 회수되어 있다. 위 네 개의 `security definer` RPC 실행만 허용한다. 날짜 중복 기준은 `Asia/Seoul`이며 `created_at`은 `timestamptz`이므로 Supabase Table Editor에서 UTC로 보일 수 있다.

기존 Supabase 프로젝트에는 스키마가 이미 적용되어 있다. 새 프로젝트를 만들거나 스키마가 변경된 경우에만 SQL Editor에서 파일 전체를 다시 검토하여 실행한다.

## 8. 배포

1. 변경 사항을 검증한다.
2. `main`에 커밋한다.
3. `origin/main`에 푸시한다.
4. 연결된 Cloudflare Pages가 자동으로 빌드·배포한다.
5. <https://pagesremain.com>과 변경된 상세 주소를 확인한다.

책별 공유 미리보기는 배포 후 아래 주소로 확인한다.

```text
https://pagesremain.com/book/책_ID
https://pagesremain.com/og/공유이미지.png
```

카카오톡이 이전 이미지를 유지하면 카카오 개발자 도구에서 상세 주소의 Open Graph 캐시를 초기화한다.

## 9. 남은 2.0 작업: 독후감별 댓글

댓글은 아직 구현되지 않았다. 작업 시작 전에 현재 코드와 `supabase/schema.sql`을 다시 읽고, 기존 RPC 전용 보안 구조를 유지한다.

합의된 기본 방향은 다음과 같다.

- 각 독후감의 하단에 해당 책 전용 댓글 목록과 작성 폼 제공
- 로그인 없는 익명 댓글
- 입력값: 닉네임, 댓글 내용, 삭제용 비밀번호
- 작성일 표시
- 작성자가 비밀번호로 자신의 댓글 삭제
- 비밀번호 원문은 저장하지 않고 서버 측에서 안전하게 해시·검증
- 관리자 삭제 수단 마련
- 닉네임·본문 길이 제한과 간단한 연속 작성 제한
- 한국어·일본어·영어 UI 문구
- 모바일 레이아웃 및 접근성 상태 메시지
- 사용자 입력은 Markdown이나 HTML로 직접 렌더링하지 않고 일반 텍스트로 취급

구현 시 권장 경계:

- 브라우저에 댓글 테이블 쓰기·삭제 권한이나 관리자 비밀키를 공개하지 않는다.
- 작성·삭제는 검증용 Supabase RPC 또는 적절한 서버 측 경계를 사용한다.
- 삭제 비밀번호의 해시 방식과 관리자 삭제 방법을 먼저 설계한 뒤 SQL을 확정한다.
- 댓글 조회에 필요한 컬럼만 반환하며 비밀번호 해시는 어떤 조회 API에도 포함하지 않는다.
- 데이터베이스 마이그레이션 SQL을 `supabase` 아래 별도 파일 또는 기존 스키마에 재현 가능하게 보존한다.
- 실제 배포 전 작성, 잘못된 비밀번호 삭제 거부, 정상 삭제, 길이 제한, 모바일 UI를 검증한다.

댓글까지 완료하면 2.0의 핵심 범위가 끝난다.

## 10. 3.0 후보

독후감이 여러 권 쌓인 뒤 진행한다. 현재는 콘텐츠 축적이 우선이다.

1. 제목·작가·본문 검색과 최근 작성순·읽은 날짜순 정렬
2. 독후감 아래 `이 생각과 이어지는 책`과 사용자가 직접 쓴 연결 이유
3. 브라우저에 읽던 위치를 저장하고 이어 읽기
4. 연도별 선반
5. sitemap, `hreflang`, 책·독후감 구조화 데이터, RSS
6. 책이 10권 이상 쌓인 뒤 책과 생각의 관계를 보여주는 독서 지도

화면에 태그 목록을 추가하는 안은 채택하지 않았다. 검색이 필요해지면 태그를 내부 메타데이터로만 사용할 수 있다.

## 11. 새 Codex가 시작할 때

1. `README.md`와 이 파일을 읽는다.
2. `git status`, 현재 브랜치, 최근 커밋을 확인한다.
3. `.env`의 존재 여부만 확인하고 값을 출력하지 않는다.
4. 작업 전 관련 컴포넌트와 `supabase/schema.sql`을 읽는다.
5. 기존 다국어·반응형·보안 구조를 유지한다.
6. 변경 후 `npm run lint`, `npm run build`, `git diff --check`를 실행한다.
7. 사용자가 배포를 요청하면 검증된 변경만 커밋하고 `origin/main`에 푸시한다.

다음 작업을 시작하는 권장 프롬프트:

```text
README.md와 CODEX_HANDOFF.md를 먼저 읽어줘.
이 프로젝트는 이전 Codex에서 작업하던 개인 서가 프로젝트야.
현재 상태를 코드와 대조해 확인한 뒤, 남은 2.0 작업인 독후감별 댓글 기능을 이어서 진행하자.
기존 디자인, 한국어·일본어·영어 구조와 Supabase RPC 보안 경계를 유지해줘.
```
