#!/bin/bash

echo "🧪 Testing mcp-jest CLI functionality"
echo ""

# Test 1: Help output shows new options
echo "Test 1: Checking help output for new options..."
node src/cli.js --help | grep -q "transport" && echo "✅ --transport option documented" || echo "❌ --transport option missing"
node src/cli.js --help | grep -q "url" && echo "✅ --url option documented" || echo "❌ --url option missing"
node src/cli.js --help | grep -q "streamable-http" && echo "✅ HTTP transport example shown" || echo "❌ HTTP transport example missing"

# Test 2: Transport validation
echo -e "\nTest 2: Testing transport validation..."

# Should fail - HTTP transport without URL
echo -n "HTTP transport without URL: "
node src/cli.js --transport streamable-http --tools test 2>&1 | grep -q "URL is required" && echo "✅ Correctly requires URL" || echo "❌ Should require URL"

# Should fail - invalid transport type
echo -n "Invalid transport type: "
node src/cli.js --transport invalid --url http://test 2>&1 | grep -q "Invalid transport type" && echo "✅ Correctly rejects invalid transport" || echo "❌ Should reject invalid transport"

# Should fail - stdio without command
echo -n "Stdio without command: "
node src/cli.js --transport stdio --tools test 2>&1 | grep -q "Server command is required" && echo "✅ Correctly requires command" || echo "❌ Should require command"

# Test 3: Config file with transport
echo -e "\nTest 3: Testing config file with transport..."
cat > test-transport-config.json << EOF
{
  "server": {
    "transport": "streamable-http",
    "url": "http://localhost:3000"
  },
  "tests": {
    "tools": ["test"]
  }
}
EOF

echo -n "Config with HTTP transport: "
node src/cli.js --config test-transport-config.json 2>&1 | grep -q "streamable-http" && echo "✅ Transport loaded from config" || echo "❌ Transport not loaded"

# Cleanup
rm -f test-transport-config.json

echo -e "\n✅ CLI tests completed!"