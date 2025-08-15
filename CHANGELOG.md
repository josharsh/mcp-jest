# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.13] - 2025-01-15

### Added
- **HTTP Transport Support**: Added support for testing MCP servers over HTTP
  - StreamableHTTP transport for modern HTTP-based MCP servers
  - SSE (Server-Sent Events) transport for real-time connections
  - New CLI flags: `--transport` and `--url` for HTTP configuration
  - Config file support for transport settings
- **Enhanced Compatibility**: Better support for servers with partial MCP implementation
  - Graceful handling of "Method not found" errors
  - Support for servers that only implement some capabilities (e.g., fastMCP)
  - Each capability type (tools, resources, prompts) queried independently

### Changed
- Transport configuration is now explicit with `transport` field (defaults to `stdio` for backward compatibility)
- Error handling in capability discovery is more robust and selective
- CLI help documentation updated with HTTP transport examples

### Fixed
- Fixed compatibility issues with fastMCP and similar servers that don't implement all MCP methods
- Fixed error propagation to ensure non-"Method not found" errors are still reported

## [1.0.10] - 2025-01-10

### Added
- Test filtering with `--filter` flag to run only matching tests
- Test exclusion with `--skip` flag to skip specific tests
- Funding field in package.json for GitHub sponsorship
- Support for wildcard patterns in filter/skip options
- Enhanced help documentation with filtering examples

### Changed
- Tests can now be selectively run based on name patterns
- Skipped tests are properly reported in test results

## [1.0.8] - 2025-01-01

### Added
- Enhanced snapshot testing capabilities
- Better error messages and debugging output
- Performance improvements for large test suites

### Fixed
- Memory leaks in long-running test suites
- Snapshot comparison edge cases

## [1.0.7] - 2024-12-15

### Added
- Support for testing MCP prompts
- Improved CLI output formatting
- Better TypeScript types

### Changed
- Updated dependencies to latest versions
- Improved test runner performance

## [1.0.6] - 2024-12-01

### Added
- Snapshot testing with configurable exclusions
- Resource pattern matching
- Timeout configuration options

### Fixed
- Process cleanup on test failure
- Windows compatibility issues

## [1.0.5] - 2024-11-15

### Added
- Support for testing multiple tools in parallel
- Environment variable configuration
- Better error handling and reporting

### Changed
- Refactored test runner for better performance
- Updated documentation with more examples

## [1.0.4] - 2024-11-01

### Fixed
- Connection timeout issues
- Memory usage optimization

## [1.0.3] - 2024-10-15

### Added
- Resource testing capabilities
- Improved test result formatting

### Fixed
- Edge cases in expectation evaluation

## [1.0.2] - 2024-10-01

### Added
- Support for complex test expectations
- Better validation of server responses

### Fixed
- CLI argument parsing issues

## [1.0.1] - 2024-09-15

### Fixed
- Initial release bug fixes
- Documentation improvements

## [1.0.0] - 2024-09-01

### Added
- Initial release of MCP-Jest
- Basic tool testing functionality
- CLI interface
- Simple test configuration format
- Connection and capability testing

[Unreleased]: https://github.com/josharsh/mcp-jest/compare/v1.0.13...HEAD
[1.0.13]: https://github.com/josharsh/mcp-jest/compare/v1.0.10...v1.0.13
[1.0.10]: https://github.com/josharsh/mcp-jest/compare/v1.0.8...v1.0.10
[1.0.8]: https://github.com/josharsh/mcp-jest/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/josharsh/mcp-jest/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/josharsh/mcp-jest/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/josharsh/mcp-jest/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/josharsh/mcp-jest/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/josharsh/mcp-jest/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/josharsh/mcp-jest/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/josharsh/mcp-jest/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/josharsh/mcp-jest/releases/tag/v1.0.0