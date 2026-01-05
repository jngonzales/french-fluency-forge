# Assessment QA Fixtures

This directory contains test fixtures for the QA harness.

## Structure

- `fluency/` - Word timestamp arrays for fluency scoring tests
- `pronunciation/` - Azure Speech API response fixtures
- `confidence/` - Transcript + expected scores (low/mid/high)
- `syntax/` - Transcript + expected scores (low/mid/high)
- `conversation/` - Transcript + expected scores (low/mid/high)
- `comprehension/` - Transcript + expected scores (low/mid/high)

## Fixture Format

Each fixture is a JSON file containing:
- `name`: Descriptive name
- `input`: Input data (transcript, word timestamps, etc.)
- `expected`: Expected output (scores, metrics, etc.)
- `tolerance`: Acceptable variance for determinism tests

## Usage

The QA harness (`scripts/qa_assessment.ts`) loads these fixtures and runs:
- 20× determinism tests (same input → same output)
- Regression tests (output matches expected within tolerance)

