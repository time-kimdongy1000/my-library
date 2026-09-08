const languages = [
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
]

export default function LanguageSelector({ language, onLanguageChange }) {
  return (
    <div className="library-toolbar">
      <div className="language-selector" role="group" aria-label="언어 선택">
        {languages.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            className="language-button"
            lang={code}
            aria-pressed={language === code}
            onClick={() => onLanguageChange(code)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
