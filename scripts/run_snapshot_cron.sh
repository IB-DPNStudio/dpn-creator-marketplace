#!/bin/bash

# Navigate to the project root directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR/.."

# Execute the snapshot script
echo "Running weekly snapshot at $(date)..."
npx tsx scripts/snapshot_ranks.ts
echo "Snapshot complete."
