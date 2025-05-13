#!/bin/bash


# Read from .env file
API_KEY=$(grep API_KEY .env | cut -d '=' -f2)


# Configuration
API_URL="http://localhost:3001"
NAMESPACE="test_namespace"

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== KV Service Test Script ===${NC}"

# Helper function for making API calls
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ -z "$data" ]; then
    curl -s -X "$method" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: $API_KEY" \
      "$API_URL$endpoint"
  else
    curl -s -X "$method" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: $API_KEY" \
      -d "$data" \
      "$API_URL$endpoint"
  fi
}

# Test health endpoint
echo -e "\n${BLUE}Testing health endpoint...${NC}"
response=$(api_call "GET" "/health")
if [[ $response == *"healthy"* ]]; then
  echo -e "${GREEN}Health check passed!${NC}"
else
  echo -e "${RED}Health check failed: $response${NC}"
  exit 1
fi

# Test setting a value
echo -e "\n${BLUE}Testing setting a value...${NC}"
response=$(api_call "POST" "/kv/$NAMESPACE/testkey" '{"value": "test value"}')
if [[ $response == *"test value"* ]]; then
  echo -e "${GREEN}Set value passed!${NC}"
else
  echo -e "${RED}Set value failed: $response${NC}"
  exit 1
fi

# Test getting a value
echo -e "\n${BLUE}Testing getting a value...${NC}"
response=$(api_call "GET" "/kv/$NAMESPACE/testkey")
if [[ $response == *"test value"* ]]; then
  echo -e "${GREEN}Get value passed!${NC}"
else
  echo -e "${RED}Get value failed: $response${NC}"
  exit 1
fi

# Test setting a value with TTL
echo -e "\n${BLUE}Testing setting a value with TTL...${NC}"
response=$(api_call "POST" "/kv/$NAMESPACE/ttlkey" '{"value": "expires soon", "ttl": 5000}')
if [[ $response == *"expires soon"* ]] && [[ $response == *"expires_at"* ]]; then
  echo -e "${GREEN}Set value with TTL passed!${NC}"
else
  echo -e "${RED}Set value with TTL failed: $response${NC}"
  exit 1
fi

# Test listing keys
echo -e "\n${BLUE}Testing listing keys in a namespace...${NC}"
response=$(api_call "GET" "/kv/$NAMESPACE")
if [[ $response == *"testkey"* ]]; then
  echo -e "${GREEN}List keys passed!${NC}"
else
  echo -e "${RED}List keys failed: $response${NC}"
  exit 1
fi

# Test prefix filtering
echo -e "\n${BLUE}Testing prefix filtering...${NC}"
# Add a few more keys with specific prefixes
api_call "POST" "/kv/$NAMESPACE/prefixA_key1" '{"value": "A1"}'
api_call "POST" "/kv/$NAMESPACE/prefixA_key2" '{"value": "A2"}'
api_call "POST" "/kv/$NAMESPACE/prefixB_key1" '{"value": "B1"}'

# Test filtering with prefix
response=$(api_call "GET" "/kv/$NAMESPACE?prefix=prefixA_")
if [[ $response == *"prefixA_key1"* ]] && [[ $response == *"prefixA_key2"* ]] && [[ $response != *"prefixB_key1"* ]]; then
  echo -e "${GREEN}Prefix filtering passed!${NC}"
else
  echo -e "${RED}Prefix filtering failed: $response${NC}"
  exit 1
fi

# Test listing namespaces
echo -e "\n${BLUE}Testing listing all namespaces...${NC}"
response=$(api_call "GET" "/kv")
if [[ $response == *"$NAMESPACE"* ]]; then
  echo -e "${GREEN}List namespaces passed!${NC}"
else
  echo -e "${RED}List namespaces failed: $response${NC}"
  exit 1
fi

# Test deleting a key
echo -e "\n${BLUE}Testing deleting a key...${NC}"
response=$(api_call "DELETE" "/kv/$NAMESPACE/testkey")
if [[ $response == *"deleted successfully"* ]]; then
  echo -e "${GREEN}Delete key passed!${NC}"
else
  echo -e "${RED}Delete key failed: $response${NC}"
  exit 1
fi

# Verify the key is deleted
echo -e "\n${BLUE}Verifying key deletion...${NC}"
response=$(api_call "GET" "/kv/$NAMESPACE/testkey")
if [[ $response == *"Key not found"* ]]; then
  echo -e "${GREEN}Key deletion verification passed!${NC}"
else
  echo -e "${RED}Key deletion verification failed: $response${NC}"
  exit 1
fi

# Test TTL expiration
echo -e "\n${BLUE}Testing TTL expiration...${NC}"
echo "Waiting for TTL key to expire (5 seconds)..."
sleep 6
response=$(api_call "GET" "/kv/$NAMESPACE/ttlkey")
if [[ $response == *"Key not found"* ]]; then
  echo -e "${GREEN}TTL expiration test passed!${NC}"
else
  echo -e "${RED}TTL expiration test failed: $response${NC}"
  exit 1
fi

# Clean up - delete all test keys
echo -e "\n${BLUE}Cleaning up test data...${NC}"
api_call "DELETE" "/kv/$NAMESPACE/prefixA_key1" > /dev/null
api_call "DELETE" "/kv/$NAMESPACE/prefixA_key2" > /dev/null
api_call "DELETE" "/kv/$NAMESPACE/prefixB_key1" > /dev/null
echo -e "${GREEN}Cleanup completed${NC}"

echo -e "\n${GREEN}All tests passed!${NC}" 