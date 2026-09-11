# Pages Remain — My Library

책을 책등 형태의 서가에서 꺼내 보고, 한국어·일본어·영어로 독후감을 읽을 수 있는 개인 서가입니다.

- 운영 주소: <https://pagesremain.com>
- 개발 환경: React, Vite
- 지원 언어: 한국어, 일본어, 영어

## 처음 실행하기

Node.js와 npm이 설치되어 있어야 합니다. 프로젝트의 최상위 폴더(`my-library`)에서 Windows 명령 프롬프트(CMD)를 열고 아래 명령을 차례로 실행합니다.

```cmd
npm install
npm run dev
```

터미널에 표시되는 로컬 주소를 브라우저에서 엽니다. 기본 주소는 다음과 같습니다.

```text
http://localhost:5173
```

의존성이 이미 설치되어 있다면 이후에는 아래 명령만 사용하면 됩니다.

```cmd
npm run dev
```

개발 서버를 종료하려면 CMD 창에서 `Ctrl+C`를 누릅니다.

## 주요 명령어

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 로컬 개발 서버 실행 |
| `npm run generate:previews` | 모든 책의 공유 미리보기 PNG 생성 |
| `npm run validate:content` | 책 정보, 표지, 번역과 독후감 파일 검사 |
| `npm run build` | 콘텐츠 검사, 배포 빌드와 책별 공유 HTML 생성 |
| `npm run lint` | 코드 검사 |
| `npm run preview` | 완성된 배포 빌드를 로컬에서 확인 |

## 프로젝트 구조

```text
my-library/
├─ public/
│  ├─ covers/                 책 표지
│  └─ og/                     공유 미리보기 이미지
├─ scripts/
│  ├─ generate-social-previews.ps1
│  ├─ validate-content.mjs
│  └─ generate-book-pages.mjs
├─ src/
│  ├─ data/
│  │  ├─ books.json           모든 책의 정보와 번역
│  │  └─ reviews/             언어별 독후감
│  └─ pages/                  서가와 책 상세 화면
└─ package.json
```

## 새 책과 독후감 추가하기

### 1. 책 ID 정하기

책 ID에는 영문 소문자, 숫자와 밑줄만 사용합니다. 이 ID는 상세 주소와 독후감 파일 이름에 공통으로 사용됩니다.

```text
example_book
```

### 2. 표지 저장하기

표지 이미지를 `public/covers`에 저장합니다.

```text
public/covers/example-book.png
```

### 3. 책 데이터 등록하기

`src/data/books.json` 배열에 새 책 객체를 추가합니다. 기존 책 객체를 복사한 뒤 각 값을 바꾸는 방식이 가장 간단합니다.

```json
{
  "id": "example_book",
  "title": "한국어 제목",
  "author": "한국어 작가명",
  "cover": "/covers/example-book.png",
  "reviewedAt": "2026-09-08",
  "spineColor": "#34566a",
  "social": {
    "image": "/og/example-book.png",
    "label": "나의 독서 기록",
    "description": "공유할 때 표시할 독후감 소개 문장.",
    "question": [
      "공유 카드에 들어갈 첫 줄",
      "공유 카드에 들어갈 둘째 줄"
    ]
  },
  "translations": {
    "ko": {
      "title": "한국어 제목",
      "author": "한국어 작가명",
      "synopsis": "한국어 줄거리"
    },
    "ja": {
      "title": "日本語タイトル",
      "author": "日本語の著者名",
      "synopsis": "日本語のあらすじ"
    },
    "en": {
      "title": "English Title",
      "author": "English Author",
      "synopsis": "English synopsis"
    }
  }
}
```

각 필드의 역할은 다음과 같습니다.

| 필드 | 내용 |
| --- | --- |
| `id` | 책을 구분하는 고유 ID |
| `cover` | `public`을 기준으로 한 표지 경로 |
| `reviewedAt` | 독후감 작성일, `YYYY-MM-DD` 형식 |
| `spineColor` | 서가에서 보이는 책등의 기본 색상 |
| `social.image` | 자동 생성할 공유 이미지 경로 |
| `social.description` | 카카오톡과 X 미리보기의 소개 문장 |
| `social.question` | 공유 이미지에 표시할 두 줄 문구 |
| `translations` | 한국어·일본어·영어 책 정보와 줄거리 |

### 4. 언어별 독후감 저장하기

같은 책 ID로 세 파일을 만듭니다.

```text
src/data/reviews/example_book.md
src/data/reviews/example_book.ja.md
src/data/reviews/example_book.en.md
```

한국어 파일이 원문입니다. `src/data/reviews/Master.md`를 복사해 기본 양식으로 사용할 수 있습니다.

### 5. 공유 이미지 만들기

CMD에서 다음 명령을 실행합니다.

```cmd
npm run generate:previews
```

`books.json`에 등록된 모든 책의 1200×630 공유 이미지가 `public/og`에 생성됩니다. 이미지에는 한국어 원문 기준의 제목, 작가, 독서 기록 문구와 표지가 사용됩니다.

### 6. 최종 검사하기

```cmd
npm run build
npm run lint
```

빌드는 다음 항목을 자동으로 검사합니다.

- 필수 책 데이터
- 표지와 공유 이미지
- 한국어·일본어·영어 책 정보
- 세 언어의 독후감 파일
- 중복되거나 잘못된 책 ID

검사가 끝나면 책마다 `dist/book/책_ID/index.html`이 생성됩니다. 이 HTML에 책별 Open Graph와 X 카드 정보가 들어가므로, 여러 독후감을 공유해도 각 책에 맞는 제목과 이미지가 표시됩니다.

완성된 빌드를 직접 확인하려면 다음 명령을 사용합니다.

```cmd
npm run preview
```

## 공유 미리보기 확인하기

배포 후 아래 두 주소가 외부에서 열리는지 확인합니다.

```text
https://pagesremain.com/book/책_ID
https://pagesremain.com/og/공유이미지.png
```

카카오톡에 이전 이미지가 계속 보이면 카카오 개발자 도구에서 해당 상세 주소의 Open Graph 캐시를 초기화합니다.

## Supabase 방문 통계 설정

프로젝트 루트의 `.env.example`을 복사해 `.env`를 만들고 다음 두 공개 값을 입력합니다.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`service_role`, Secret key와 데이터베이스 비밀번호는 브라우저 코드에 넣지 않습니다. `.env`는 Git에서 제외됩니다.

Supabase Dashboard의 SQL Editor에서 `supabase/schema.sql` 전체를 실행하면 방문자와 책별 조회 테이블, 집계 함수와 접근 권한이 생성됩니다. 일별 중복 집계는 `Asia/Seoul` 날짜를 기준으로 합니다.

Cloudflare Pages로 배포할 때는 Workers & Pages의 해당 프로젝트에서 **Settings → Environment variables**로 이동해 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_PUBLISHABLE_KEY`를 Production 환경에도 등록합니다. 환경 변수를 저장한 뒤 새 배포를 실행해야 운영 사이트에 적용됩니다.

## Supabase 댓글 설정

댓글 기능을 처음 연결하거나 댓글 방어 규칙을 갱신할 때 Supabase Dashboard의 SQL Editor에서 `supabase/comments.sql` 전체를 실행합니다. 이 파일은 댓글 테이블과 조회·작성·삭제 RPC, 비밀번호 해시, 요청 제한과 접근 권한을 구성합니다.

SQL 실행이 성공하면 저장하지 않을 새 SQL Editor 쿼리를 열고 다음 명령으로 관리자 마스터 비밀번호를 설정합니다.

```sql
select private.set_comment_admin_password('본인만 아는 관리자 비밀번호');
```

관리자 비밀번호는 UTF-8 기준 12~72바이트로 설정합니다. 실제 비밀번호를 저장소, `.env`, 공유 SQL 스니펫 또는 브라우저 코드에 기록하지 않습니다. 비밀번호를 변경할 때도 같은 명령을 새 비밀번호로 다시 실행하면 됩니다.

댓글의 삭제 입력란에는 다음 두 비밀번호 중 하나를 사용할 수 있습니다.

- 댓글 작성자가 등록할 때 지정한 삭제 비밀번호
- Supabase에서 설정한 관리자 마스터 비밀번호

삭제가 승인되면 행을 즉시 제거하지 않고 `is_hidden`을 `true`로 바꿉니다. 숨긴 댓글은 사이트의 댓글 조회 결과에서 제외되며, 필요하면 Supabase Table Editor에서 기록을 확인하거나 복구할 수 있습니다.

댓글 테이블의 직접 접근 권한은 차단되어 있습니다. 브라우저에는 `get_comments`, `create_comment`, `delete_comment` RPC 실행 권한만 있으며 비밀번호 해시는 어떤 응답에도 포함되지 않습니다.

서버에서는 댓글 생성을 같은 방문자 기준 30초에 한 번, 24시간에 10개로 제한합니다. 전체 사이트 기준으로는 1분에 30개, 24시간에 500개까지 허용하며 같은 독후감에 동일한 내용을 10분 안에 반복 등록할 수 없습니다. 삭제 비밀번호 실패는 같은 방문자 기준 10분에 5회, 같은 댓글 기준 10분에 20회까지 허용합니다. 방문자 식별자는 브라우저에서 생성되므로 이 제한은 기본 방어선이며, 실제 자동화 공격이 발생하면 Cloudflare Turnstile과 Supabase Edge Function의 서버 검증을 추가합니다.

### 현재 운영 상태

댓글 기능과 요청 제한 SQL은 2026년 9월 11일 Supabase 운영 프로젝트와 <https://pagesremain.com>에 적용되었습니다. 운영 환경에서 짧거나 지나치게 긴 본문, 같은 방문자의 연속 작성, 방문자 ID를 바꾼 동일 내용 등록, HTML/XSS 문자열, 잘못된 삭제 비밀번호 반복을 통제된 요청으로 검사했습니다. 모든 제한이 예상대로 작동했고 테스트 전후 공개 댓글 수가 같음을 확인했습니다. 서비스 장애를 유발할 수 있는 전체 한도 소진이나 대량 부하 시험은 수행하지 않습니다.
