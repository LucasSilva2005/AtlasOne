
$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "Arquivo .env não encontrado!" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Monta a URL depois de carregar as variáveis
$env:DB_URL = "jdbc:postgresql://$($env:DB_HOST):$($env:DB_PORT)/$($env:DB_NAME)?sslmode=require"

# Valida as configurações sem exibir a senha
$required = @("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")

foreach ($variable in $required) {
    if (-not [Environment]::GetEnvironmentVariable($variable, "Process")) {
        Write-Host "Variável $variable não encontrada!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Variáveis carregadas!" -ForegroundColor Green
Write-Host "URL JDBC configurada: $($env:DB_URL.StartsWith('jdbc:'))" -ForegroundColor Green
Write-Host "Usuário PostgreSQL configurado: [$env:DB_USER]" -ForegroundColor Green
Write-Host "Iniciando AtlasOne..." -ForegroundColor Cyan

& "$PSScriptRoot\mvnw.cmd" spring-boot:run
