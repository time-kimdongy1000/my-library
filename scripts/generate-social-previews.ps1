$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$booksPath = Join-Path $projectRoot 'src\data\books.json'
$books = Get-Content -LiteralPath $booksPath -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($book in $books) {
    $coverRelativePath = $book.cover.TrimStart('/').Replace('/', '\')
    $imageRelativePath = $book.social.image.TrimStart('/').Replace('/', '\')
    $coverPath = Join-Path (Join-Path $projectRoot 'public') $coverRelativePath
    $outputPath = Join-Path (Join-Path $projectRoot 'public') $imageRelativePath
    $outputDirectory = Split-Path -Parent $outputPath

    if (!(Test-Path -LiteralPath $coverPath)) {
        throw "Cover image not found: $coverPath"
    }

    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

    $bitmap = New-Object System.Drawing.Bitmap(1200, 630)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $backgroundRect = New-Object System.Drawing.Rectangle(0, 0, 1200, 630)
    $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $backgroundRect,
        [System.Drawing.Color]::FromArgb(255, 24, 62, 82),
        [System.Drawing.Color]::FromArgb(255, 7, 22, 34),
        20
    )
    $graphics.FillRectangle($backgroundBrush, $backgroundRect)

    $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 153, 218, 239))
    $paperBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 239, 225))
    $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 119, 184, 213))
    $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 184, 203, 209))
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(105, 0, 0, 0))
    $graphics.FillEllipse($glowBrush, 825, -205, 540, 540)

    $cover = [System.Drawing.Image]::FromFile($coverPath)
    $coverHeight = 500
    $coverWidth = [int]($cover.Width * $coverHeight / $cover.Height)
    $coverX = 92
    $coverY = 65
    $graphics.FillRectangle($shadowBrush, $coverX + 18, $coverY + 20, $coverWidth, $coverHeight)
    $graphics.DrawImage($cover, $coverX, $coverY, $coverWidth, $coverHeight)

    $labelFont = New-Object System.Drawing.Font('Georgia', 18, [System.Drawing.FontStyle]::Bold)
    $titleFont = New-Object System.Drawing.Font('Malgun Gothic', 50, [System.Drawing.FontStyle]::Bold)
    $authorFont = New-Object System.Drawing.Font('Malgun Gothic', 22, [System.Drawing.FontStyle]::Regular)
    $recordFont = New-Object System.Drawing.Font('Malgun Gothic', 25, [System.Drawing.FontStyle]::Bold)
    $questionFont = New-Object System.Drawing.Font('Malgun Gothic', 24, [System.Drawing.FontStyle]::Regular)
    $siteFont = New-Object System.Drawing.Font('Georgia', 16, [System.Drawing.FontStyle]::Regular)

    $graphics.DrawString('MY LIBRARY', $labelFont, $accentBrush, 510, 112)
    $graphics.DrawString($book.translations.ko.title, $titleFont, $paperBrush, 505, 163)
    $graphics.DrawString($book.translations.ko.author, $authorFont, $mutedBrush, 512, 250)
    $graphics.FillRectangle($accentBrush, 512, 310, 92, 4)
    $graphics.DrawString($book.social.label, $recordFont, $paperBrush, 510, 342)
    $question = "$($book.social.question[0])`n$($book.social.question[1])"
    $graphics.DrawString($question, $questionFont, $mutedBrush, 510, 408)
    $graphics.DrawString('A PERSONAL READING SHELF', $siteFont, $accentBrush, 510, 548)

    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $siteFont.Dispose()
    $questionFont.Dispose()
    $recordFont.Dispose()
    $authorFont.Dispose()
    $titleFont.Dispose()
    $labelFont.Dispose()
    $cover.Dispose()
    $shadowBrush.Dispose()
    $mutedBrush.Dispose()
    $accentBrush.Dispose()
    $paperBrush.Dispose()
    $glowBrush.Dispose()
    $backgroundBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()

    Write-Output "Generated $imageRelativePath"
}
