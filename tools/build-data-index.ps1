$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DataRoot = Join-Path $ProjectRoot "productdata"
$ImageExts = @(".jpg", ".jpeg", ".png", ".webp", ".avif")
$CatalogExts = @(".pdf", ".xlsx", ".xls", ".csv", ".jpg", ".jpeg", ".png", ".webp")
$Accents = @("#4be683", "#6196ff", "#ffe36d", "#ff8a66", "#84e6ef", "#c6a7ff")

function Read-JsonOrDefault {
  param(
    [string]$Path,
    $Default
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $Default
  }
  return Get-Content -Raw -LiteralPath $Path -Encoding UTF8 | ConvertFrom-Json
}

function Write-JsonFile {
  param(
    [string]$Path,
    $Data
  )

  $json = $Data | ConvertTo-Json -Depth 20
  # UTF-8 without BOM — browsers reject JSON that starts with EF BB BF
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($Path, $json, $utf8NoBom)
}

function To-SitePath {
  param([string]$Path)
  $full = (Resolve-Path -LiteralPath $Path).Path
  $root = $ProjectRoot.Path
  return $full.Substring($root.Length + 1).Replace("\", "/")
}

function Title-FromSlug {
  param([string]$Slug)
  $text = $Slug -replace "[-_]+", " "
  return (Get-Culture).TextInfo.ToTitleCase($text)
}

function Get-ImageFiles {
  param([string]$Folder)
  if (-not (Test-Path -LiteralPath $Folder)) {
    return @()
  }
  return @(Get-ChildItem -LiteralPath $Folder -File | Where-Object { $ImageExts -contains $_.Extension.ToLowerInvariant() } | Sort-Object Name)
}

function Find-Cover {
  param([string]$Folder)
  foreach ($ext in $ImageExts) {
    $candidate = Join-Path $Folder "cover$ext"
    if (Test-Path -LiteralPath $candidate) {
      return (Get-Item -LiteralPath $candidate)
    }
  }
  return @(Get-ImageFiles -Folder $Folder)[0]
}

function Normalize-Tags {
  param($Tags, [string]$Group)
  if ($null -eq $Tags) {
    return @($Group)
  }
  if ($Tags -is [array]) {
    return @($Tags)
  }
  return @([string]$Tags)
}

function Scan-Product {
  param(
    [string]$Group,
    [System.IO.DirectoryInfo]$Folder,
    [int]$Index
  )

  $cover = Find-Cover -Folder $Folder.FullName
  if ($null -eq $cover) {
    return $null
  }

  $infoPath = Join-Path $Folder.FullName "info.json"
  $info = Read-JsonOrDefault -Path $infoPath -Default ([pscustomobject]@{})
  $images = @(Get-ImageFiles -Folder $Folder.FullName)
  $gallery = @($images | Where-Object { $_.FullName -ne $cover.FullName } | ForEach-Object { To-SitePath -Path $_.FullName })
  $productId = if ($info.id) { [string]$info.id } else { $Folder.Name }
  $sort = if ($info.sort) { [int]$info.sort } else { $Index * 10 }
  $accent = if ($info.accent) { [string]$info.accent } else { $Accents[$Index % $Accents.Count] }

  $colors = @()
  if ($null -ne $info.colors) {
    foreach ($color in @($info.colors)) {
      $colors += [ordered]@{
        id = if ($color.id) { [string]$color.id } else { "" }
        name = if ($color.name) { [string]$color.name } else { "Color" }
        image = if ($color.image) { [string]$color.image } else { "" }
      }
    }
  }

  return [ordered]@{
    id = $productId
    group = $Group
    isNew = ($Group -eq "new")
    title = if ($info.title) { [string]$info.title } else { Title-FromSlug -Slug $Folder.Name }
    subtitle = if ($info.subtitle) { [string]$info.subtitle } else { "Product" }
    description = if ($info.description) { [string]$info.description } else { "Product details pending." }
    size = if ($info.size) { [string]$info.size } else { "" }
    fabric = if ($info.fabric) { [string]$info.fabric } else { "" }
    patent = [bool]$info.patent
    colors = $colors
    tags = @(Normalize-Tags -Tags $info.tags -Group $Group)
    accent = $accent
    tilt = if ($info.tilt) { [string]$info.tilt } else { "0deg" }
    linkText = if ($info.linkText) { [string]$info.linkText } else { "Inquiry" }
    sort = $sort
    featured = [bool]$info.featured
    cover = To-SitePath -Path $cover.FullName
    gallery = $gallery
  }
}

function Scan-Products {
  $products = New-Object System.Collections.Generic.List[object]

  foreach ($group in @("new", "standard")) {
    $groupFolder = Join-Path (Join-Path $DataRoot "products") $group
    if (-not (Test-Path -LiteralPath $groupFolder)) {
      continue
    }
    $folders = @(Get-ChildItem -LiteralPath $groupFolder -Directory | Sort-Object Name)
    foreach ($folder in $folders) {
      $product = Scan-Product -Group $group -Folder $folder -Index ($products.Count + 1)
      if ($null -ne $product) {
        $products.Add($product)
      }
    }
  }

  $sortedProducts = @($products | Sort-Object { $_["sort"] }, { $_["title"] })
  $filters = @($sortedProducts | ForEach-Object { $_.tags } | Sort-Object -Unique)

  return [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    newProducts = @($sortedProducts | Where-Object { $_.isNew })
    allProducts = $sortedProducts
    filters = $filters
  }
}

function Scan-Catalogs {
  $catalogs = New-Object System.Collections.Generic.List[object]
  $catalogFolder = Join-Path $DataRoot "catalogs"

  if (Test-Path -LiteralPath $catalogFolder) {
    $files = @(Get-ChildItem -LiteralPath $catalogFolder -File | Where-Object { $CatalogExts -contains $_.Extension.ToLowerInvariant() } | Sort-Object Name)
    foreach ($file in $files) {
      $sidecar = Read-JsonOrDefault -Path (Join-Path $file.DirectoryName ($file.BaseName + ".json")) -Default ([pscustomobject]@{})
      $catalogs.Add([ordered]@{
        id = if ($sidecar.id) { [string]$sidecar.id } else { $file.BaseName }
        title = if ($sidecar.title) { [string]$sidecar.title } else { Title-FromSlug -Slug $file.BaseName }
        type = if ($sidecar.type) { [string]$sidecar.type } else { "catalog" }
        description = if ($sidecar.description) { [string]$sidecar.description } else { "" }
        buttonText = if ($sidecar.buttonText) { [string]$sidecar.buttonText } else { "Open file" }
        sort = if ($sidecar.sort) { [int]$sidecar.sort } else { 100 }
        file = To-SitePath -Path $file.FullName
      })
    }
  }

  return [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    catalogs = @($catalogs | Sort-Object { $_["sort"] }, { $_["title"] })
  }
}

if (-not (Test-Path -LiteralPath $DataRoot)) {
  throw "productdata folder not found: $DataRoot"
}

Write-JsonFile -Path (Join-Path $DataRoot "products-index.json") -Data (Scan-Products)
Write-JsonFile -Path (Join-Path $DataRoot "catalogs-index.json") -Data (Scan-Catalogs)

Write-Host "Generated productdata/products-index.json and productdata/catalogs-index.json"
