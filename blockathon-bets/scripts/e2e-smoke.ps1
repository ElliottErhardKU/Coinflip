param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = 'Stop'

Write-Host "[1/6] Upsert users"
Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/users" -ContentType 'application/json' -Body '{"id":"elliott","displayName":"Elliott","xrplAddress":"rEAHmrpg5Cco5UiRZKcqLx7xw1fL8Bj3Uw"}' | Out-Null
Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/users" -ContentType 'application/json' -Body '{"id":"friend1","displayName":"Friend One","xrplAddress":"rEAHmrpg5Cco5UiRZKcqLx7xw1fL8Bj3Uw"}' | Out-Null

Write-Host "[2/6] Fetch game"
$games = Invoke-RestMethod -Uri "$BaseUrl/api/nba/games"
if (-not $games.games -or $games.games.Count -eq 0) { throw 'No games returned' }
$gameId = $games.games[0].id

Write-Host "[3/6] Create + join group"
$group = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/groups" -ContentType 'application/json' -Body '{"name":"Smoke Group","createdBy":"elliott"}'
Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/groups/join" -ContentType 'application/json' -Body (@{ groupId = $group.group.id; userId = 'friend1' } | ConvertTo-Json) | Out-Null

Write-Host "[4/6] Create offer"
$offerBody = @{
  gameId = $gameId
  createdBy = 'elliott'
  offeredToGroupId = $group.group.id
  side = 'home'
  stakeAmount = '1'
  stakeToken = 'LUSD'
  oddsAmerican = -110
  expiresAt = (Get-Date).AddHours(2).ToString('o')
} | ConvertTo-Json
$offer = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/bets/offers" -ContentType 'application/json' -Body $offerBody

Write-Host "[5/6] Accept offer"
$accepted = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/bets/offers/accept" -ContentType 'application/json' -Body (@{ offerId = $offer.offer.id; acceptedBy = 'friend1' } | ConvertTo-Json)
if ($accepted.offer.status -ne 'matched') { throw "Offer failed to match" }

Write-Host "[6/6] Settle manually"
$settled = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/bets/settle" -ContentType 'application/json' -Body (@{ offerId = $offer.offer.id; winnerUserId = 'elliott'; winnerAddress = 'rEAHmrpg5Cco5UiRZKcqLx7xw1fL8Bj3Uw' } | ConvertTo-Json)
if ($settled.offer.status -ne 'settled') { throw "Offer failed to settle" }

Write-Host "SMOKE PASS"
Write-Host ("offerId=" + $offer.offer.id)
Write-Host ("payoutTxHash=" + $settled.settlement.payoutTxHash)
Write-Host ("settlementReceiptCid=" + $settled.settlement.settlementReceiptCid)
