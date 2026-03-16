BASE_URL="https://abc123.execute-api.eu-north-1.amazonaws.com"

curl -s "$BASE_URL/health"
curl -s "$BASE_URL/api/companies"
curl -s "$BASE_URL/api/companies/comp_demo/cards"
curl -s "$BASE_URL/api/companies/comp_demo/cards/card_demo/summary"
curl -s "$BASE_URL/api/cards/card_demo/transactions?limit=20"
curl -s -X POST "$BASE_URL/api/cards/card_demo/activate"